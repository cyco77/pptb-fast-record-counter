import {
  DataGridBody,
  DataGridRow,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  makeStyles,
  tokens,
  Spinner,
} from "@fluentui/react-components";
import type {
  DataGridProps,
  JSXElement,
} from "@fluentui/react-components";
import { Entity } from "../types/entity";

const useStyles = makeStyles({
  scrollWrapper: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  gridContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  gridBody: {
    overflowY: "auto",
    flex: 1,
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
    minHeight: "32px",
    padding: "0 8px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: "inherit",
    fontSize: "inherit",
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

  const columns: TableColumnDefinition<Entity>[] = [
    createTableColumn<Entity>({
      columnId: "displayname",
      compare: (a, b) => {
        return a.displayname.localeCompare(b.displayname);
      },
      renderHeaderCell: () => {
        return "Display Name";
      },
      renderCell: (item: Entity) => {
        return (
          <span title={item.displayname} className={styles.cellStyles}>
            {item.displayname}
          </span>
        );
      },
    }),

    createTableColumn<Entity>({
      columnId: "logicalname",
      compare: (a, b) => {
        return a.logicalname.localeCompare(b.logicalname);
      },
      renderHeaderCell: () => {
        return "Logical Name";
      },
      renderCell: (item: Entity) => {
        return (
          <span title={item.logicalname} className={styles.cellStyles}>
            {item.logicalname}
          </span>
        );
      },
    }),

    createTableColumn<Entity>({
      columnId: "views",
      compare: () => 0, // Not sortable
      renderHeaderCell: () => {
        return "View";
      },
      renderCell: (item: Entity) => {
        const ALL_VALUE = "All";
        const selectedView = item.views?.find(
          (v) => v.savedqueryid === item.selectedViewId,
        );
        const selectedValue = selectedView?.savedqueryid || ALL_VALUE;

        return (
          <select
            value={selectedValue}
            onChange={(event) =>
              props.onViewChange(
                item.logicalname,
                event.target.value === ALL_VALUE
                  ? undefined
                  : event.target.value,
              )
            }
            className={styles.viewDropdown}
          >
            <option value={ALL_VALUE}>All</option>
            {item.views?.map((view) => (
              <option key={view.savedqueryid} value={view.savedqueryid}>
                {view.name || view.savedqueryid}
              </option>
            ))}
          </select>
        );
      },
    }),

    createTableColumn<Entity>({
      columnId: "recordCount",
      compare: (a, b) => {
        const aCount = a.recordCount ?? -1;
        const bCount = b.recordCount ?? -1;
        return aCount - bCount;
      },
      renderHeaderCell: () => {
        return <div style={{ textAlign: "right" }}>Record Count</div>;
      },
      renderCell: (item: Entity) => {
        if (item.isLoading) {
          return (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Spinner size="tiny" />
              <span>Progressing...</span>
            </div>
          );
        }
        return (
          <div style={{ textAlign: "right" }}>
            {item.recordCount !== undefined
              ? item.recordCount.toLocaleString()
              : "-"}
          </div>
        );
      },
    }),
  ];

  const columnSizingOptions = {
    displayname: {
      minWidth: 300,
      defaultWidth: 300,
    },
    logicalname: {
      minWidth: 300,
      defaultWidth: 300,
    },
    views: {
      minWidth: 450,
      defaultWidth: 450,
    },
  };

  return (
    <div className={styles.scrollWrapper}>
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
