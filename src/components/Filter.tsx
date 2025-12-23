import type {
  JSXElement,
  OptionOnSelectData,
  SelectionEvents,
} from "@fluentui/react-components";
import {
  makeStyles,
  useId,
  SearchBox,
  SearchBoxChangeEvent,
  Button,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import { PlayRegular } from "@fluentui/react-icons";
import { Solution } from "../types/solution";

export interface IFilterProps {
  solutions: Solution[];
  selectedSolutionId: string | undefined;
  onSolutionFilterChanged: (solutionId: string | undefined) => void;
  onTextFilterChanged: (searchText: string) => void;
  onCountRecords: () => void;
  isCountingRecords: boolean;
}

export const Filter = (props: IFilterProps): JSXElement => {
  const solutionDropdownId = useId("solution-dropdown");
  const searchInputId = useId("search-input");

  const ALL_SOLUTIONS_VALUE = "All";

  const getSelectedDisplayValue = () => {
    if (!props.selectedSolutionId) {
      return ALL_SOLUTIONS_VALUE;
    }
    const selectedSolution = props.solutions.find(
      (s) => s.solutionid === props.selectedSolutionId
    );
    return selectedSolution
      ? selectedSolution.friendlyname
      : ALL_SOLUTIONS_VALUE;
  };

  const onSolutionSelect = (
    _event: SelectionEvents,
    data: OptionOnSelectData
  ) => {
    const selectedValue = data.optionValue;
    props.onSolutionFilterChanged(
      selectedValue === ALL_SOLUTIONS_VALUE ? undefined : selectedValue
    );
  };

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
    dropdown: {
      minWidth: "250px",
    },
    searchInput: {
      minWidth: "300px",
    },
  });

  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <label htmlFor={solutionDropdownId}>Solution</label>
        <Dropdown
          id={solutionDropdownId}
          placeholder="All"
          value={getSelectedDisplayValue()}
          selectedOptions={[props.selectedSolutionId || "All"]}
          onOptionSelect={onSolutionSelect}
          className={styles.dropdown}
        >
          <Option key="all" value="All">
            All
          </Option>
          {props.solutions.map((solution) => (
            <Option key={solution.solutionid} value={solution.solutionid}>
              {solution.friendlyname}
            </Option>
          ))}
        </Dropdown>
      </div>
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
