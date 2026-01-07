import { Entity } from "../types/entity";
import { Solution } from "../types/solution";
import { View } from "../types/view";
import { logger } from "./loggerService";

export const loadSolutions = async (): Promise<Solution[]> => {
  const url =
    "solutions?$select=solutionid,friendlyname,uniquename&$filter=isvisible eq true&$orderby=friendlyname asc";

  const allRecords = await loadAllData(url);

  return allRecords.map((record: any) => ({
    solutionid: record.solutionid,
    friendlyname: record.friendlyname,
    uniquename: record.uniquename,
  }));
};

export const loadEntities = async (solutionId?: string): Promise<Entity[]> => {
  let url =
    "EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,DataProviderId&$filter=IsCustomizable/Value eq true";

  const allRecords = await loadAllData(url);

  let entities = allRecords
    .filter((record: any) => !record.DataProviderId) // Exclude virtual entities
    .map((record: any) => ({
      logicalname: record.LogicalName,
      displayname:
        record.DisplayName?.UserLocalizedLabel?.Label || record.LogicalName,
      entitysetname: record.EntitySetName,
    }));

  // If a solution is selected, filter entities by solution components
  if (solutionId) {
    const solutionEntities = await getEntitiesInSolution(solutionId);
    entities = entities.filter((entity) =>
      solutionEntities.includes(entity.logicalname)
    );
  }

  return entities;
};

const getEntitiesInSolution = async (solutionId: string): Promise<string[]> => {
  const url = `solutioncomponents?$select=objectid&$filter=_solutionid_value eq ${solutionId} and componenttype eq 1`;

  const components = await loadAllData(url);

  // Get entity metadata IDs from solution components
  const entityMetadataIds = components.map((comp: any) => comp.objectid);

  if (entityMetadataIds.length === 0) {
    return [];
  }

  // Query EntityDefinitions to get logical names for these metadata IDs
  const entityDefsUrl = `EntityDefinitions?$select=LogicalName,MetadataId&$filter=IsCustomizable/Value eq true`;
  const entityDefs = await loadAllData(entityDefsUrl);

  const logicalNames = entityDefs
    .filter((def: any) => entityMetadataIds.includes(def.MetadataId))
    .map((def: any) => def.LogicalName);

  return logicalNames;
};

export const loadAllViews = async (): Promise<Map<string, View[]>> => {
  try {
    const url = `savedqueries?$select=savedqueryid,name,returnedtypecode,fetchxml&$filter=querytype eq 0&$orderby=returnedtypecode,name asc`;
    const allRecords = await loadAllData(url);

    // Group views by entity logical name
    const viewsByEntity = new Map<string, View[]>();

    allRecords.forEach((record: any) => {
      const view: View = {
        savedqueryid: record.savedqueryid,
        name: record.name,
        returnedtypecode: record.returnedtypecode,
        fetchxml: record.fetchxml,
      };

      const entityName = record.returnedtypecode;
      if (!viewsByEntity.has(entityName)) {
        viewsByEntity.set(entityName, []);
      }
      viewsByEntity.get(entityName)!.push(view);
    });

    logger.info(
      `Loaded ${allRecords.length} views for ${viewsByEntity.size} entities`
    );
    return viewsByEntity;
  } catch (error) {
    logger.error(`Error loading all views: ${(error as Error).message}`);
    return new Map();
  }
};

export const loadViewsForEntity = async (
  entityLogicalName: string
): Promise<View[]> => {
  try {
    const url = `savedqueries?$select=savedqueryid,name,returnedtypecode,fetchxml&$filter=returnedtypecode eq '${entityLogicalName}' and querytype eq 0&$orderby=name asc`;
    const allRecords = await loadAllData(url);

    return allRecords.map((record: any) => ({
      savedqueryid: record.savedqueryid,
      name: record.name,
      returnedtypecode: record.returnedtypecode,
      fetchxml: record.fetchxml,
    }));
  } catch (error) {
    logger.error(
      `Error loading views for ${entityLogicalName}: ${
        (error as Error).message
      }`
    );
    return [];
  }
};

export const countRecords = async (
  entitySetName: string,
  entityLogicalName: string,
  fetchXml?: string
): Promise<number> => {
  try {
    if (!entityLogicalName) {
      logger.info(`No entity logical name provided`);
      return 0;
    }

    if (fetchXml) {
      // Simple paging approach for view-based counting
      logger.info(
        `Counting records for ${entityLogicalName} using view FetchXML with simple pagination`
      );

      let totalCount = 0;
      let hasMorePages = true;
      let pageNumber = 1;

      while (hasMorePages) {
        // Modify FetchXML to include page number and count
        let pagedFetchXml = fetchXml;

        // Remove any existing page, count, and paging-cookie attributes
        pagedFetchXml = pagedFetchXml.replace(/\spage=['"]?\d+['"]?/gi, "");
        pagedFetchXml = pagedFetchXml.replace(/\scount=['"]?\d+['"]?/gi, "");
        pagedFetchXml = pagedFetchXml.replace(
          /\spaging-cookie=['"][^'"]*['"]/gi,
          ""
        );

        // Add page and count attributes
        pagedFetchXml = pagedFetchXml.replace(
          /<fetch/i,
          `<fetch page="${pageNumber}" count="5000"`
        );

        logger.info(`Fetching page ${pageNumber} for ${entityLogicalName}...`);

        const queryUrl = `${entitySetName}?fetchXml=${encodeURIComponent(
          pagedFetchXml
        )}`;
        const response = await window.dataverseAPI.queryData(queryUrl);
        const pageCount = response.value?.length || 0;
        totalCount += pageCount;

        logger.info(
          `Page ${pageNumber} returned ${pageCount} records (total: ${totalCount})`
        );

        // Continue if we got a full page
        hasMorePages = pageCount === 5000;
        pageNumber++;

        // Safety limit to prevent infinite loops
        if (pageNumber > 1000) {
          logger.error(
            `Stopping pagination at 1000 pages for ${entityLogicalName}`
          );
          break;
        }
      }

      logger.info(`Final count result for ${entityLogicalName}: ${totalCount}`);
      return totalCount;
    } else {
      // Single entity count using RetrieveTotalRecordCount
      const counts = await countRecordsBatch([entityLogicalName]);
      return counts[entityLogicalName] || 0;
    }
  } catch (error) {
    logger.error(
      `Error counting records for ${entityLogicalName}: ${
        (error as Error).message
      }`
    );
    return 0;
  }
};

/**
 * Count records for multiple entities in a single batch request
 * @param entityLogicalNames Array of entity logical names to count
 * @returns Map of entity logical name to count
 */
export const countRecordsBatch = async (
  entityLogicalNames: string[]
): Promise<Record<string, number>> => {
  if (!entityLogicalNames || entityLogicalNames.length === 0) {
    return {};
  }

  logger.info(
    `Counting records for ${entityLogicalNames.length} entities using RetrieveTotalRecordCount batch`
  );

  // Build the function call URL with parameters
  const entityNamesJson = JSON.stringify(entityLogicalNames);
  const functionUrl = `RetrieveTotalRecordCount(EntityNames=@p)?@p=${encodeURIComponent(
    entityNamesJson
  )}`;
  const response = await window.dataverseAPI.queryData(functionUrl);

  // Response contains EntityRecordCountCollection with separate Keys and Values arrays
  const entityRecordCounts = (response as any).EntityRecordCountCollection;

  const results: Record<string, number> = {};

  if (
    entityRecordCounts &&
    entityRecordCounts.Keys &&
    entityRecordCounts.Values
  ) {
    // Map Keys to Values
    for (let i = 0; i < entityRecordCounts.Keys.length; i++) {
      const entityName = entityRecordCounts.Keys[i];
      const count = entityRecordCounts.Values[i] || 0;
      results[entityName] = count;
      logger.info(`Count result for ${entityName}: ${count}`);
    }
  }

  return results;
};

const loadAllData = async (fullUrl: string) => {
  const allRecords = [];

  while (fullUrl) {
    logger.info(`Fetching data from URL: ${fullUrl}`);

    let relativePath = fullUrl;

    if (fullUrl.startsWith("http")) {
      const url = new URL(fullUrl);
      const apiRegex = /^\/api\/data\/v\d+\.\d+\//;
      relativePath = url.pathname.replace(apiRegex, "") + url.search;
    }

    logger.info(`Cleaned URL: ${relativePath}`);

    const response = await window.dataverseAPI.queryData(relativePath);

    // Add the current page of results
    allRecords.push(...response.value);

    // Check for paging link
    fullUrl = (response as any)["@odata.nextLink"] || null;
  }

  return allRecords;
};
