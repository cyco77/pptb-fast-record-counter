import React, { useState, useCallback, useEffect } from "react";
import {
  loadEntities,
  loadSolutions,
  loadAllViews,
  countRecords,
  countRecordsBatch,
} from "../services/dataverseService";
import { Entity } from "../types/entity";
import { Solution } from "../types/solution";
import { Filter } from "./Filter";
import { EntitiesDataGrid } from "./EntitiesDataGrid";
import { makeStyles, Spinner } from "@fluentui/react-components";
import { logger } from "../services/loggerService";

interface IOverviewProps {
  connection: ToolBoxAPI.DataverseConnection | null;
}

export const Overview: React.FC<IOverviewProps> = ({ connection }) => {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedSolutionId, setSelectedSolutionId] = useState<
    string | undefined
  >(undefined);
  const [textFilter, setTextFilter] = useState<string>("");
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState(false);
  const [isCountingRecords, setIsCountingRecords] = useState(false);
  const [viewsByEntity, setViewsByEntity] = useState<Map<string, any[]>>(
    new Map()
  );

  const useStyles = makeStyles({
    overviewRoot: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      overflow: "hidden",
    },
    filterSection: {
      flexShrink: 0,
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
    },
    dataGridSection: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      minHeight: 0,
    },
    eventLogSection: {
      flexShrink: 0,
      height: "200px",
      overflow: "hidden",
    },
  });

  const styles = useStyles();

  useEffect(() => {
    const initialize = async () => {
      if (!connection) {
        return;
      }
      await querySolutions();
      // Load all views in background (non-blocking)
      loadAllViews()
        .then((views) => {
          setViewsByEntity(views);
          logger.info(`Loaded views for ${views.size} entities in background`);
        })
        .catch((error) => {
          logger.error(
            `Error loading views in background: ${(error as Error).message}`
          );
        });
    };

    initialize();
  }, [connection]);

  useEffect(() => {
    // Reload entities when solution filter changes
    if (connection) {
      queryEntities();
    }
  }, [selectedSolutionId]);

  const showNotification = useCallback(
    async (
      title: string,
      body: string,
      type: "success" | "info" | "warning" | "error"
    ) => {
      try {
        await window.toolboxAPI.utils.showNotification({
          title,
          body,
          type,
          duration: 3000,
        });
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    },
    []
  );

  const querySolutions = useCallback(async () => {
    try {
      setIsLoadingSolutions(true);
      const loadedSolutions = await loadSolutions();
      setSolutions(loadedSolutions);
      logger.info(`Fetched ${loadedSolutions.length} solutions`);
    } catch (error) {
      logger.error(`Error querying solutions: ${(error as Error).message}`);
      await showNotification(
        "Error",
        `Failed to load solutions: ${(error as Error).message}`,
        "error"
      );
    } finally {
      setIsLoadingSolutions(false);
    }
  }, [showNotification]);

  const queryEntities = useCallback(async () => {
    try {
      setIsLoadingEntities(true);
      const loadedEntities = await loadEntities(selectedSolutionId);
      console.log("Loaded Entities:", loadedEntities);
      console.log("Views By Entity:", viewsByEntity);

      // Assign views to each entity from cached views
      const entitiesWithViews = loadedEntities.map((entity) => {
        const views = viewsByEntity.get(entity.logicalname) || [];
        return { ...entity, views };
      });

      setEntities(entitiesWithViews);
      logger.info(`Fetched ${entitiesWithViews.length} entities with views`);
      const solutionMsg = selectedSolutionId ? " for selected solution" : "";
      await showNotification(
        "Entities Loaded",
        `Successfully loaded ${entitiesWithViews.length} entities${solutionMsg}`,
        "success"
      );
    } catch (error) {
      logger.error(`Error querying entities: ${(error as Error).message}`);
      await showNotification(
        "Error",
        `Failed to load entities: ${(error as Error).message}`,
        "error"
      );
    } finally {
      setIsLoadingEntities(false);
    }
  }, [selectedSolutionId, showNotification]);

  const filteredEntities = React.useMemo(() => {
    if (!textFilter) {
      return entities;
    }
    const searchTerm = textFilter.toLowerCase();
    return entities.filter((entity) => {
      return (
        entity.displayname?.toLowerCase().includes(searchTerm) ||
        entity.logicalname?.toLowerCase().includes(searchTerm)
      );
    });
  }, [entities, textFilter]);

  const handleCountRecords = useCallback(async () => {
    try {
      setIsCountingRecords(true);
      logger.info("Starting record count for all entities...");

      // Filter entities based on current text filter
      const entitiesToCount = filteredEntities;

      // Set all entities to loading state
      setEntities((prev) =>
        prev.map((entity) => {
          if (
            entitiesToCount.find((e) => e.logicalname === entity.logicalname)
          ) {
            return { ...entity, isLoading: true, recordCount: undefined };
          }
          return entity;
        })
      );

      // Separate entities with views from those without
      const entitiesWithViews = entitiesToCount.filter((entity) => {
        const selectedView = entity.views?.find(
          (v) => v.savedqueryid === entity.selectedViewId
        );
        return selectedView?.fetchxml;
      });

      const entitiesWithoutViews = entitiesToCount.filter((entity) => {
        const selectedView = entity.views?.find(
          (v) => v.savedqueryid === entity.selectedViewId
        );
        return !selectedView?.fetchxml;
      });

      // Batch count entities without views using RetrieveTotalRecordCount
      if (entitiesWithoutViews.length > 0) {
        logger.info(
          `Batch counting ${entitiesWithoutViews.length} entities without views`
        );
        try {
          const entityNames = entitiesWithoutViews.map((e) => e.logicalname);
          const counts = await countRecordsBatch(entityNames);

          // Update all entities at once with their counts
          setEntities((prev) =>
            prev.map((e) => {
              if (counts.hasOwnProperty(e.logicalname)) {
                return {
                  ...e,
                  recordCount: counts[e.logicalname],
                  isLoading: false,
                };
              }
              return e;
            })
          );

          logger.info(
            `Batch count completed for ${entitiesWithoutViews.length} entities`
          );
        } catch (error) {
          logger.error(`Error in batch counting: ${(error as Error).message}`);
          // Mark failed entities
          setEntities((prev) =>
            prev.map((e) => {
              if (
                entitiesWithoutViews.find(
                  (ev) => ev.logicalname === e.logicalname
                )
              ) {
                return { ...e, recordCount: 0, isLoading: false };
              }
              return e;
            })
          );
          await showNotification(
            "Error",
            `Failed to count records: ${(error as Error).message}`,
            "error"
          );
          return;
        }
      }

      // Count entities with views individually using FetchXML
      for (const entity of entitiesWithViews) {
        try {
          // Get FetchXML if a view is selected
          const selectedView = entity.views?.find(
            (v) => v.savedqueryid === entity.selectedViewId
          );
          const fetchXml = selectedView?.fetchxml;

          const count = await countRecords(
            entity.entitysetname,
            entity.logicalname,
            fetchXml
          );
          setEntities((prev) =>
            prev.map((e) =>
              e.logicalname === entity.logicalname
                ? { ...e, recordCount: count, isLoading: false }
                : e
            )
          );
          const viewMsg = selectedView ? ` (view: ${selectedView.name})` : "";
          logger.info(
            `Counted ${count} records for ${entity.logicalname}${viewMsg}`
          );
          await showNotification(
            "Record Count Complete",
            `Successfully counted records for ${entitiesToCount.length} entities`,
            "success"
          );
          logger.info("Record count completed");
        } catch (error) {
          logger.error(
            `Error counting records for ${entity.logicalname}: ${
              (error as Error).message
            }`
          );
          setEntities((prev) =>
            prev.map((e) =>
              e.logicalname === entity.logicalname
                ? { ...e, recordCount: 0, isLoading: false }
                : e
            )
          );
          logger.error(`Error counting records: ${(error as Error).message}`);
          await showNotification(
            "Error",
            `Failed to count records: ${(error as Error).message}`,
            "error"
          );
        }
      }
    } finally {
      setIsCountingRecords(false);
    }
  }, [filteredEntities, showNotification]);

  const handleViewChange = useCallback(
    (entityLogicalName: string, viewId: string | undefined) => {
      logger.info(
        `View changed for ${entityLogicalName} to: ${viewId || "All"}`
      );
      setEntities((prev) =>
        prev.map((entity) =>
          entity.logicalname === entityLogicalName
            ? { ...entity, selectedViewId: viewId, recordCount: undefined }
            : entity
        )
      );
    },
    []
  );

  return (
    <div className={styles.overviewRoot}>
      {isLoadingEntities || isLoadingSolutions ? (
        <div className={styles.loadingContainer}>
          <Spinner
            label={
              isLoadingSolutions
                ? "Loading solutions..."
                : "Loading entities..."
            }
          />
        </div>
      ) : (
        <>
          <div className={styles.filterSection}>
            <Filter
              solutions={solutions}
              selectedSolutionId={selectedSolutionId}
              textFilter={textFilter}
              onSolutionFilterChanged={(solutionId: string | undefined) => {
                logger.info(
                  `Solution filter changed to: ${solutionId || "All"}`
                );
                setSelectedSolutionId(solutionId);
              }}
              onTextFilterChanged={(searchText: string) => {
                setTextFilter(searchText);
              }}
              onCountRecords={handleCountRecords}
              isCountingRecords={isCountingRecords}
            />
          </div>

          {entities.length > 0 && (
            <div className={styles.dataGridSection}>
              <EntitiesDataGrid
                items={filteredEntities}
                onViewChange={handleViewChange}
              />
            </div>
          )}

          {/* <div className={styles.eventLogSection}>
            <EventLog />
          </div> */}
        </>
      )}
    </div>
  );
};
