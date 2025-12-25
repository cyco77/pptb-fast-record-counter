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
  Dropdown,
  Option,
  Spinner,
} from "@fluentui/react-components";
import type {
  DataGridProps,
  JSXElement,
  OptionOnSelectData,
  SelectionEvents,
} from "@fluentui/react-components";
import { Entity } from "../types/entity";
import React from "react";

const useStyles = makeStyles({
  scrollWrapper: {
    height: "100%",
    overflow: "auto",
    position: "relative",
  },
  gridContainer: {
    minWidth: "max-content",
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
  },
});

export interface IEntitiesDataGridProps {
  items: Entity[];
  onViewChange: (entityLogicalName: string, viewId: string | undefined) => void;
}

export const EntitiesDataGrid = (props: IEntitiesDataGridProps): JSXElement => {
  const styles = useStyles();
  const [sortState, setSortState] = React.useState<
    Parameters<NonNullable<DataGridProps["onSortChange"]>>[1]
  >({
    sortColumn: "displayname",
    sortDirection: "ascending",
  });

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
          (v) => v.savedqueryid === item.selectedViewId
        );
        const displayValue = selectedView ? selectedView.name : ALL_VALUE;

        const handleViewChange = (
          _event: SelectionEvents,
          data: OptionOnSelectData
        ) => {
          const viewId =
            data.optionValue === ALL_VALUE ? undefined : data.optionValue;
          props.onViewChange(item.logicalname, viewId);
        };

        return (
          <Dropdown
            value={displayValue}
            selectedOptions={[item.selectedViewId || ALL_VALUE]}
            onOptionSelect={handleViewChange}
            className={styles.viewDropdown}
            size="medium"
          >
            <Option key="all" value={ALL_VALUE}>
              All
            </Option>
            {item.views?.map((view) => (
              <Option key={view.savedqueryid} value={view.savedqueryid}>
                {view.name}
              </Option>
            ))}
          </Dropdown>
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

  const sortedItems = React.useMemo(() => {
    const sorted = [...props.items].sort((a, b) => {
      const column = columns.find(
        (col) => col.columnId === sortState.sortColumn
      );
      if (!column || !column.compare) {
        return 0;
      }
      const compareResult = column.compare(a, b);
      return sortState.sortDirection === "ascending"
        ? compareResult
        : -compareResult;
    });
    return sorted;
  }, [props.items, sortState]);

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
        items={sortedItems}
        columns={columns}
        sortable
        sortState={sortState}
        onSortChange={(_e, nextSortState) => setSortState(nextSortState)}
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
        <DataGridBody<Entity>>
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
