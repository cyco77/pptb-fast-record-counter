import { makeStyles, Spinner, tokens } from "@fluentui/react-components";
import type { DataGridProps, JSXElement } from "@fluentui/react-components";
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
  table: {
    width: "100%",
    minWidth: "max-content",
    borderCollapse: "collapse",
  },
  headerCell: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: "8px 12px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  cell: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: "8px 12px",
    verticalAlign: "middle",
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

  return (
    <div className={styles.scrollWrapper}>
      <div className={styles.gridContainer}>
        <div className={styles.gridBody}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.headerCell}>Display Name</th>
                <th className={styles.headerCell}>Logical Name</th>
                <th className={styles.headerCell}>View</th>
                <th className={styles.headerCell}>Record Count</th>
              </tr>
            </thead>
            <tbody>
              {props.items.map((item) => {
                const allValue = "All";
                const selectedView = item.views?.find(
                  (view) => view.savedqueryid === item.selectedViewId,
                );
                const selectedValue = selectedView?.savedqueryid || allValue;

                return (
                  <tr key={item.logicalname}>
                    <td className={styles.cell} title={item.displayname}>
                      {item.displayname}
                    </td>
                    <td className={styles.cell} title={item.logicalname}>
                      {item.logicalname}
                    </td>
                    <td className={styles.cell}>
                      <select
                        value={selectedValue}
                        onChange={(event) =>
                          props.onViewChange(
                            item.logicalname,
                            event.target.value === allValue
                              ? undefined
                              : event.target.value,
                          )
                        }
                        className={styles.viewDropdown}
                      >
                        <option value={allValue}>All</option>
                        {item.views?.map((view) => (
                          <option
                            key={view.savedqueryid}
                            value={view.savedqueryid}
                          >
                            {view.name || view.savedqueryid}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.cell}>
                      {item.isLoading ? (
                        <Spinner size="tiny" />
                      ) : item.recordCount !== undefined ? (
                        item.recordCount.toLocaleString()
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
