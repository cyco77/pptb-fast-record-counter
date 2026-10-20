import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Dropdown,
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Option,
  Spinner,
  createTableColumn,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import type {
  DataGridProps,
  JSXElement,
  OptionOnSelectData,
  SelectionEvents,
  TableColumnDefinition,
} from "@fluentui/react-components";
import { Entity } from "../types/entity";
import { logger } from "../services/loggerService";
import { useEffect, useRef, useState } from "react";
import { ChevronDownRegular, CheckmarkRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  scrollWrapper: {
    height: "auto",
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
    width: "100%",
    minWidth: 0,
  },
  gridContainer: {
    height: "auto",
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  gridBody: {
    overflow: "visible",
    flex: "none",
  },
  stickyHeader: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  cellStyles: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  cellStylesRight: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
    textAlign: "right",
  },
  viewDropdown: {
    width: "100%",
    minWidth: 0,
    minHeight: "32px",
    padding: "0 8px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: "inherit",
    fontSize: "inherit",
  },
  viewMenuButton: {
    width: "100%",
    minWidth: 0,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  viewMenuButtonLabel: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

export interface IEntitiesDataGridProps {
  items: Entity[];
  onViewChange: (entityLogicalName: string, viewId: string | undefined) => void;
  sortState: Parameters<NonNullable<DataGridProps["onSortChange"]>>[1];
  onSortChange: NonNullable<DataGridProps["onSortChange"]>;
}

export const EntitiesDataGrid = (props: IEntitiesDataGridProps): JSXElement => {
  const styles = useStyles();
  const [openViewEntity, setOpenViewEntity] = useState<string | undefined>();
  const [containerWidth, setContainerWidth] = useState(0);
  const [columnRatios, setColumnRatios] = useState({
    displayname: 300 / 1200,
    logicalname: 300 / 1200,
    views: 450 / 1200,
    recordCount: 150 / 1200,
  });
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollWrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  logger.info(
    `Rendering entity grid: ${props.items.length} rows (${props.items.filter((item) => !item.logicalname || !item.displayname).length} malformed)`,
  );

  const columns: TableColumnDefinition<Entity>[] = [
    createTableColumn<Entity>({
      columnId: "displayname",
      compare: (a, b) => a.displayname.localeCompare(b.displayname),
      renderHeaderCell: () => "Display Name",
      renderCell: (item) => (
        <span title={item.displayname} className={styles.cellStyles}>
          {item.displayname}
        </span>
      ),
    }),
    createTableColumn<Entity>({
      columnId: "logicalname",
      compare: (a, b) => a.logicalname.localeCompare(b.logicalname),
      renderHeaderCell: () => "Logical Name",
      renderCell: (item) => (
        <span title={item.logicalname} className={styles.cellStyles}>
          {item.logicalname}
        </span>
      ),
    }),
    createTableColumn<Entity>({
      columnId: "views",
      compare: () => 0,
      renderHeaderCell: () => "View",
      renderCell: (item) => {
        const allValue = "All";
        const selectedView = item.views?.find(
          (view) => view.savedqueryid === item.selectedViewId,
        );
        const handleViewChange = (
          _event: SelectionEvents,
          data: OptionOnSelectData,
        ) => {
          props.onViewChange(
            item.logicalname,
            data.optionValue === allValue ? undefined : data.optionValue,
          );
        };

        if (useCompactViewMenu) {
          const selectedViewName = selectedView?.name || allValue;
          return (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  appearance="subtle"
                  size="small"
                  className={styles.viewMenuButton}
                  icon={useIconOnlyViewMenu ? <ChevronDownRegular /> : undefined}
                  aria-label={`Select view: ${selectedViewName}`}
                  title={selectedViewName}
                >
                  {!useIconOnlyViewMenu && (
                    <span className={styles.viewMenuButtonLabel}>
                      {selectedViewName}
                    </span>
                  )}
                  {!useIconOnlyViewMenu && <ChevronDownRegular />}
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    icon={!item.selectedViewId ? <CheckmarkRegular /> : undefined}
                    onClick={() => props.onViewChange(item.logicalname, undefined)}
                  >
                    {allValue}
                  </MenuItem>
                  {item.views?.map((view) => (
                    <MenuItem
                      key={view.savedqueryid}
                      icon={item.selectedViewId === view.savedqueryid ? <CheckmarkRegular /> : undefined}
                      onClick={() => props.onViewChange(item.logicalname, view.savedqueryid)}
                    >
                      {view.name || view.savedqueryid}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          );
        }

        return (
          <Dropdown
            value={selectedView?.name || allValue}
            selectedOptions={[item.selectedViewId || allValue]}
            onOpenChange={(_event, data) => {
              setOpenViewEntity(data.open ? item.logicalname : undefined);
            }}
            onOptionSelect={handleViewChange}
            className={styles.viewDropdown}
            size="medium"
          >
            <Option value={allValue}>All</Option>
            {openViewEntity === item.logicalname &&
              item.views?.map((view) => (
                <Option key={view.savedqueryid} value={view.savedqueryid}>
                  {view.name || view.savedqueryid}
                </Option>
              ))}
          </Dropdown>
        );
      },
    }),
    createTableColumn<Entity>({
      columnId: "recordCount",
      compare: (a, b) => (a.recordCount ?? -1) - (b.recordCount ?? -1),
      renderHeaderCell: () => <div style={{ textAlign: "right" }}>Record Count</div>,
      renderCell: (item) =>
        item.isLoading ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Spinner size="tiny" />
            <span>Progressing...</span>
          </div>
        ) : (
          <div style={{ textAlign: "right" }}>
            {item.recordCount !== undefined ? item.recordCount.toLocaleString() : "-"}
          </div>
        ),
    }),
  ];

  const columnSizingOptions = Object.fromEntries(
    Object.entries(columnRatios).map(([columnId, ratio]) => [
      columnId,
      {
        minWidth: columnId === "recordCount" ? 80 : 48,
        defaultWidth: Math.max(
          columnId === "recordCount" ? 80 : 48,
          containerWidth * ratio,
        ),
        idealWidth: Math.max(
          columnId === "recordCount" ? 80 : 48,
          containerWidth * ratio,
        ),
      },
    ]),
  );
  const viewColumnWidth = containerWidth * columnRatios.views;
  const useCompactViewMenu = viewColumnWidth < 180;
  const useIconOnlyViewMenu = viewColumnWidth < 76;

  const handleColumnResize: NonNullable<DataGridProps["onColumnResize"]> = (
    _event,
    { columnId, width },
  ) => {
    if (!containerWidth) return;

    setColumnRatios((current) => {
      const currentRatio = current[columnId as keyof typeof current];
      if (currentRatio === undefined) return current;

      const nextRatio = Math.min(0.95, Math.max(0.05, width / containerWidth));
      const remainingRatio = 1 - currentRatio;
      const nextRemainingRatio = 1 - nextRatio;

      return Object.fromEntries(
        Object.entries(current).map(([id, ratio]) => [
          id,
          id === columnId
            ? nextRatio
            : remainingRatio > 0
              ? (ratio / remainingRatio) * nextRemainingRatio
              : nextRemainingRatio / (Object.keys(current).length - 1),
        ]),
      ) as typeof current;
    });
  };

  return (
    <div className={styles.scrollWrapper} ref={scrollWrapperRef}>
      <DataGrid
        items={props.items}
        columns={columns}
        sortable
        sortState={props.sortState}
        onSortChange={props.onSortChange}
        getRowId={(item) => item.logicalname}
        className={styles.gridContainer}
        resizableColumns
        columnSizingOptions={columnSizingOptions}
        resizableColumnsOptions={{ autoFitColumns: false }}
        onColumnResize={handleColumnResize}
      >
        <DataGridHeader className={styles.stickyHeader}>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<Entity> className={styles.gridBody}>
          {({ item, rowId }) => (
            <DataGridRow<Entity> key={rowId}>
              {({ renderCell }) => (
                <DataGridCell>{renderCell(item)}</DataGridCell>
              )}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
};
