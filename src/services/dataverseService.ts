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
    "EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName&$filter=IsCustomizable/Value eq true";

  const allRecords = await loadAllData(url);

  let entities = allRecords.map((record: any) => ({
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
    if (!entitySetName) {
      logger.info(`No EntitySetName provided for ${entityLogicalName}`);
      return 0;
    }

    let url: string;
    let response: any;

    if (fetchXml) {
      // Count using FetchXML from view
      logger.info(
        `Counting records for ${entityLogicalName} using view FetchXML`
      );

      // Use returntotalrecordcount to get the count without fetching all records
      let countFetchXml = fetchXml;

      // Ensure the fetch tag has returntotalrecordcount and limit to 1 record
      if (countFetchXml.includes("returntotalrecordcount=")) {
        countFetchXml = countFetchXml.replace(
          /returntotalrecordcount=['"]?(true|false)['"]?/i,
          'returntotalrecordcount="true"'
        );
      } else {
        countFetchXml = countFetchXml.replace(
          /<fetch([^>]*)>/i,
          '<fetch$1 returntotalrecordcount="true">'
        );
      }

      // Add or update count to 1 to minimize data transfer
      if (countFetchXml.includes("count=")) {
        countFetchXml = countFetchXml.replace(
          /count=['"]?\d+['"]?/i,
          'count="1"'
        );
      } else {
        countFetchXml = countFetchXml.replace(
          /<fetch([^>]*)>/i,
          '<fetch$1 count="1">'
        );
      }

      logger.info(`Modified FetchXML for count`);
      url = `${entitySetName}?fetchXml=${encodeURIComponent(countFetchXml)}`;
      response = await window.dataverseAPI.queryData(url);

      // The total count is in the @Microsoft.Dynamics.CRM.totalrecordcount annotation
      const count =
        (response as any)["@Microsoft.Dynamics.CRM.totalrecordcount"] ||
        (response as any)["@odata.count"] ||
        response.value?.length ||
        0;
      logger.info(`Count result for ${entityLogicalName}: ${count}`);
      return count;
    } else {
      // Query all entity records with count
      url = `${entitySetName}?$top=1&$count=true`;
      logger.info(`Counting records for ${entityLogicalName} using ${url}`);
      response = await window.dataverseAPI.queryData(url);
      const count = (response as any)["@odata.count"] || 0;
      logger.info(`Count result for ${entityLogicalName}: ${count}`);
      return count;
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
