import React, { useState } from "react";
import { TableColumn, TableSort } from "../hooks/useTableData";

type Props = {
  columns: TableColumn[];
  sort: TableSort | null;
  setSort: (sort: TableSort | null) => void;
  onApply: () => void;
  onClear: () => void;
};

const TableSort: React.FC<Props> = ({ columns, sort, setSort, onApply, onClear }) => {
  const [localSort, setLocalSort] = useState<TableSort>(sort || { column: "", direction: "asc" });

  const handleApply = () => {
    if (localSort.column) setSort(localSort);
    onApply();
  };

  return (
    <div className="table-sort">
      <div className="table-sort-controls">
        <select
          value={localSort.column}
          onChange={e => setLocalSort(s => ({ ...s, column: e.target.value }))}
        >
          <option value="">Pick a column to sort by</option>
          {columns.map(col => (
            <option key={col.key} value={col.key}>{col.label}</option>
          ))}
        </select>
        <label>
          <input
            type="radio"
            name="sortDirection"
            value="asc"
            checked={localSort.direction === "asc"}
            onChange={() => setLocalSort(s => ({ ...s, direction: "asc" }))}
          /> Ascending
        </label>
        <label>
          <input
            type="radio"
            name="sortDirection"
            value="desc"
            checked={localSort.direction === "desc"}
            onChange={() => setLocalSort(s => ({ ...s, direction: "desc" }))}
          /> Descending
        </label>
        <button onClick={handleApply} className="table-sort-apply">Apply sorting</button>
        <button onClick={onClear} className="table-sort-clear">Clear all sorts</button>
      </div>
    </div>
  );
};

export default TableSort; 