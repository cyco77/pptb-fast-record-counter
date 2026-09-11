import {
  countRecordsBatch,
  loadEntities,
  loadSolutions,
  resolveSolution,
} from "../services/dataverseService";
import { isEntityBlacklisted } from "../utils/entityBlacklist";

type HeadlessInput = {
  solutionId?: unknown;
  solutionName?: unknown;
  solutionUniqueName?: unknown;
  publisher?: unknown;
  entityNames?: unknown;
};

type HeadlessLogger = {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
};

type HeadlessContext = {
  toolId: string;
  toolName: string;
  invocationMode: "one-way" | "two-way";
  updateProgress(percent: number, message: string): void;
  logger: HeadlessLogger;
};

export async function invokeHeadless(
  input: HeadlessInput,
  context: HeadlessContext,
) {
  const solutionSelector = {
    solutionId:
      typeof input?.solutionId === "string" && input.solutionId.trim()
        ? input.solutionId.trim()
        : undefined,
    solutionName:
      typeof input?.solutionName === "string" && input.solutionName.trim()
        ? input.solutionName.trim()
        : undefined,
    solutionUniqueName:
      typeof input?.solutionUniqueName === "string" &&
      input.solutionUniqueName.trim()
        ? input.solutionUniqueName.trim()
        : undefined,
    publisher:
      typeof input?.publisher === "string" && input.publisher.trim()
        ? input.publisher.trim()
        : undefined,
  };
  const requestedEntityNames = Array.isArray(input?.entityNames)
    ? input.entityNames.filter(
        (entityName): entityName is string =>
          typeof entityName === "string" && entityName.trim() !== "",
      )
    : undefined;

  if (!globalThis.dataverseAPI) {
    throw new Error("Dataverse API is not available for this headless run.");
  }

  context.logger.info(`Starting headless run for ${context.toolName}`);
  context.updateProgress(10, "loading entities");

  const hasSolutionSelector = Object.values(solutionSelector).some(Boolean);
  let solutionId: string | undefined;
  let resolvedSolution: {
    applied: boolean;
    solutionId: string | null;
    solutionName: string | null;
    uniqueName: string | null;
    publisher: string | null;
    version: string | null;
  } = {
    applied: false,
    solutionId: null,
    solutionName: null,
    uniqueName: null,
    publisher: null,
    version: null,
  };

  if (hasSolutionSelector) {
    context.logger.info("Resolving the requested solution");
    const resolution = resolveSolution(
      await loadSolutions(),
      solutionSelector,
    );
    if (resolution.status !== "resolved") {
      return {
        status: "solution-selection-required",
        filterApplied: false,
        requestedSolution: {
          solutionId: solutionSelector.solutionId ?? null,
          solutionName: solutionSelector.solutionName ?? null,
          solutionUniqueName: solutionSelector.solutionUniqueName ?? null,
          publisher: solutionSelector.publisher ?? null,
        },
        message:
          "The solution could not be resolved. Please select a solution and retry.",
        solutions: resolution.solutions.map((solution) => ({
          solutionId: solution.solutionid,
          solutionName: solution.friendlyname,
          uniqueName: solution.uniquename,
          publisher: solution.publisherName ?? solution.publisherUniqueName,
          version: solution.version,
        })),
        suggestions: resolution.suggestions.map(({ solution, score }) => ({
          solutionId: solution.solutionid,
          solutionName: solution.friendlyname,
          uniqueName: solution.uniquename,
          publisher: solution.publisherName ?? solution.publisherUniqueName,
          version: solution.version,
          matchScore: Number(score.toFixed(3)),
        })),
      };
    }

    solutionId = resolution.solution.solutionid;
    resolvedSolution = {
      applied: true,
      solutionId: resolution.solution.solutionid,
      solutionName: resolution.solution.friendlyname,
      uniqueName: resolution.solution.uniquename,
      publisher:
        resolution.solution.publisherName ??
        resolution.solution.publisherUniqueName ??
        null,
      version: resolution.solution.version,
    };
    context.logger.info(`Resolved solution: ${resolvedSolution.solutionName}`);
  }

  let entities = await loadEntities(solutionId);
  entities = entities.filter((entity) => !isEntityBlacklisted(entity.logicalname));

  if (requestedEntityNames?.length) {
    const requestedNames = new Set(
      requestedEntityNames.map((entityName) => entityName.trim().toLowerCase()),
    );
    entities = entities.filter((entity) =>
      requestedNames.has(entity.logicalname.toLowerCase()),
    );
  }

  context.updateProgress(40, `counting ${entities.length} entities`);
  const counts = await countRecordsBatch(
    entities.map((entity) => entity.logicalname),
  );
  const resultEntities = entities.map((entity) => ({
    logicalName: entity.logicalname,
    displayName: entity.displayname,
    entitySetName: entity.entitysetname,
    recordCount: counts[entity.logicalname] ?? 0,
  }));
  const recordCounts = resultEntities.map((entity) => ({
    logicalName: entity.logicalName,
    displayName: entity.displayName,
    recordCount: entity.recordCount,
  }));

  const result = {
    status: "success" as const,
    filterApplied: hasSolutionSelector,
    requestedSolution: {
      solutionId: solutionSelector.solutionId ?? null,
      solutionName: solutionSelector.solutionName ?? null,
      solutionUniqueName: solutionSelector.solutionUniqueName ?? null,
      publisher: solutionSelector.publisher ?? null,
    },
    solution: resolvedSolution,
    entities: resultEntities,
    recordCounts,
    totalEntities: resultEntities.length,
    totalRecords: resultEntities.reduce(
      (total, entity) => total + entity.recordCount,
      0,
    ),
  };

  context.updateProgress(100, "done");
  context.logger.info(
    `Headless run complete: ${result.totalEntities} entities counted`,
  );

  return result;
}

export default { invokeHeadless };
