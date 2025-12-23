import { Entity } from "../types/entity";
import { logger } from "./loggerService";

export const loadEntities = async (): Promise<Entity[]> => {
  let url =
    "EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName&$filter=IsCustomizable/Value eq true";

  const allRecords = await loadAllData(url);

  return allRecords.map((record: any) => ({
    logicalname: record.LogicalName,
    displayname:
      record.DisplayName?.UserLocalizedLabel?.Label || record.LogicalName,
    entitysetname: record.EntitySetName,
  }));
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
