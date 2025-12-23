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
} from "@fluentui/react-components";
import type { DataGridProps, JSXElement } from "@fluentui/react-components";
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
});

export interface IEntitiesDataGridProps {
  items: Entity[];
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
      columnId: "recordCount",
      compare: (a, b) => {
        const aCount = a.recordCount ?? -1;
        const bCount = b.recordCount ?? -1;
        return aCount - bCount;
      },
      renderHeaderCell: () => {
        return "Record Count";
      },
      renderCell: (item: Entity) => {
        if (item.isLoading) {
          return <span>Loading...</span>;
        }
        return (
          <span className={styles.cellStyles}>
            {item.recordCount !== undefined
              ? item.recordCount.toLocaleString()
              : "-"}
          </span>
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
