import type { JSXElement } from "@fluentui/react-components";
import {
  makeStyles,
  useId,
  SearchBox,
  SearchBoxChangeEvent,
  Button,
} from "@fluentui/react-components";
import { PlayRegular } from "@fluentui/react-icons";

export interface IFilterProps {
  onTextFilterChanged: (searchText: string) => void;
  onCountRecords: () => void;
  isCountingRecords: boolean;
}

export const Filter = (props: IFilterProps): JSXElement => {
  const searchInputId = useId("search-input");

  const onTextFilterChange = (
    _event: SearchBoxChangeEvent,
    data: { value: string }
  ) => {
    props.onTextFilterChanged(data.value);
  };

  const useStyles = makeStyles({
    root: {
      display: "flex",
      gap: "12px",
      alignItems: "flex-end",
    },
    field: {
      display: "grid",
      justifyItems: "start",
      gap: "2px",
    },
    searchInput: {
      minWidth: "300px",
    },
  });

  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <label htmlFor={searchInputId}>Filter Entities</label>
        <SearchBox
          id={searchInputId}
          placeholder="Search by display name or logical name..."
          onChange={onTextFilterChange}
          className={styles.searchInput}
        />
      </div>
      <Button
        appearance="primary"
        icon={<PlayRegular />}
        onClick={props.onCountRecords}
        disabled={props.isCountingRecords}
      >
        {props.isCountingRecords ? "Counting..." : "Count Records"}
      </Button>
    </div>
  );
};
