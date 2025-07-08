import React, { useState } from "react";
import { TableColumn, TableFilter as TableFilterType } from "../hooks/useTableData";
import { X } from 'lucide-react';

const OPERATORS = [
  { value: "=", label: "=" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: "like", label: "like" },
  { value: "ilike", label: "ilike" },
  { value: "in", label: "in" },
  { value: "is", label: "is (null, not null, true, false)" },
];

type Props = {
  columns: TableColumn[];
  filters: TableFilterType[];
  setFilters: (filters: TableFilterType[]) => void;
  onApply: () => void;
  onClear: () => void;
};

const TableFilter: React.FC<Props> = ({ columns, filters, setFilters, onApply, onClear }) => {
  const [newFilter, setNewFilter] = useState<TableFilterType>({ column: "", operator: "=", value: "" });

  const addFilter = () => {
    if (newFilter.column && newFilter.operator) {
      // El primer filtro no tiene operador lógico, los siguientes sí
      setFilters([
        ...filters,
        {
          ...newFilter,
          logicalOperator: filters.length === 0 ? undefined : 'AND',
        },
      ]);
      setNewFilter({ column: '', operator: '=', value: '' });
    }
  };

  const removeFilter = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const toggleLogicalOperator = (idx: number) => {
    setFilters(filters.map((f, i) =>
      i === idx ? { ...f, logicalOperator: f.logicalOperator === 'AND' ? 'OR' : 'AND' } : f
    ));
  };

  return (
    <div className="table-filter">
      <div className="table-filter-list">
        {filters.length === 0 && <div className="table-filter-empty">No filters applied to this view</div>}
        {filters.map((filter, idx) => (
          <div className="filter-chip table-filter-row" key={idx}>
            {idx > 0 && (
              <button
                className={`table-filter-toggle ${filter.logicalOperator?.toLowerCase()}`}
                onClick={() => toggleLogicalOperator(idx)}
                title={`Toggle to ${filter.logicalOperator === 'AND' ? 'OR' : 'AND'}`}
              >
                {filter.logicalOperator || 'AND'}
              </button>
            )}
            <span className="filter-text">{columns.find(c => c.key === filter.column)?.label || filter.column} {filter.operator} {filter.value}</span>
            <button onClick={() => removeFilter(idx)} className="filter-remove">
              <X className="action-icon" />
            </button>
          </div>
        ))}
      </div>
      <div className="table-filter-controls">
        <select
          value={newFilter.column}
          onChange={e => setNewFilter(f => ({ ...f, column: e.target.value }))}
        >
          <option value="">Select column...</option>
          {columns.map(col => (
            <option key={col.key} value={col.key}>{col.label}</option>
          ))}
        </select>
        <select
          value={newFilter.operator}
          onChange={e => setNewFilter(f => ({ ...f, operator: e.target.value }))}
        >
          {OPERATORS.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Enter a value"
          value={newFilter.value}
          onChange={e => setNewFilter(f => ({ ...f, value: e.target.value }))}
        />
        <button onClick={addFilter} className="table-filter-add">+ Add filter</button>
      </div>
      <div className="table-filter-actions">
        <button onClick={onClear} className="table-filter-clear">Clear all filters</button>
        <button onClick={onApply} className="table-filter-apply">Apply filter</button>
      </div>
    </div>
  );
};

export default TableFilter; 