import { Entity } from "../types/entity";
import { Solution } from "../types/solution";
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

export const countRecords = async (
  entitySetName: string,
  entityLogicalName: string
): Promise<number> => {
  try {
    if (!entitySetName) {
      logger.info(`No EntitySetName provided for ${entityLogicalName}`);
      return 0;
    }

    // Query the actual entity records with count
    const url = `${entitySetName}?$top=1&$count=true`;
    logger.info(`Counting records for ${entityLogicalName} using ${url}`);
    const response = await window.dataverseAPI.queryData(url);
    const count = (response as any)["@odata.count"] || 0;
    logger.info(`Count result for ${entityLogicalName}: ${count}`);
    return count;
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
