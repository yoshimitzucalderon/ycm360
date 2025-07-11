import React, { useState } from "react";
import { TableColumn, TableSort as TableSortType } from "../hooks/useTableData";
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';
import SortIcon from '@mui/icons-material/Sort';

type Props = {
  columns: TableColumn[];
  visibleColumns: string[];
  sort: TableSortType | null;
  setSort: (sort: TableSortType | null) => void;
  onApply: () => void;
  onClear: () => void;
  setSelectMenuOpen?: (open: boolean) => void;
};

const MinimalButton = styled(Button)({
  color: '#22c55e',
  fontWeight: 500,
  fontSize: 14,
  textTransform: 'none',
  borderRadius: 6,
  border: '1.5px solid #22c55e',
  background: '#fff',
  padding: '2px 12px',
  '&:hover': {
    background: '#bbf7d0',
    color: '#166534',
    borderColor: '#22c55e',
  },
});

const MinimalPopover = styled(Popover)({
  '& .MuiPaper-root': {
    minWidth: 260,
    borderRadius: 10,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    border: '1.5px solid #e5e7eb',
    padding: 16,
    maxWidth: 340,
    maxHeight: 320,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    scrollbarWidth: 'thin',
    scrollbarColor: '#d1d5db #f8fafc',
  },
  '& .MuiPaper-root::-webkit-scrollbar': {
    width: '6px',
    background: '#f8fafc',
  },
  '& .MuiPaper-root::-webkit-scrollbar-thumb': {
    background: '#d1d5db',
    borderRadius: '4px',
  },
  '& .MuiPaper-root::-webkit-scrollbar-thumb:hover': {
    background: '#b6bbc4',
  },
});

const TableSort: React.FC<Props> = ({ columns, visibleColumns, sort, setSort, onApply, onClear, setSelectMenuOpen }) => {
  const [localSort, setLocalSort] = useState<TableSortType>(sort || { column: "", direction: "asc" });

  const handleApply = () => {
    if (localSort.column) setSort(localSort);
    onApply();
  };
  const handleClear = () => {
    onClear();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 220 }}>
      <Select
        value={localSort.column}
        onChange={e => setLocalSort(s => ({ ...s, column: e.target.value as string }))}
        displayEmpty
        size="small"
        sx={{ mb: 1, background: '#fff', borderRadius: 2, fontSize: 15, minWidth: 180 }}
        MenuProps={{
          PaperProps: {
            style: {
              zIndex: 9999
            }
          },
          container: () => document.body
        }}
        onOpen={() => setSelectMenuOpen && setSelectMenuOpen(true)}
        onClose={() => setSelectMenuOpen && setSelectMenuOpen(false)}
      >
        <MenuItem value="">Pick a column to sort by</MenuItem>
        {columns.filter(col => visibleColumns.includes(col.key)).map(col => (
          <MenuItem key={col.key} value={col.key}>{col.label}</MenuItem>
        ))}
      </Select>
      <RadioGroup
        row
        value={localSort.direction}
        onChange={e => setLocalSort(s => ({ ...s, direction: e.target.value as 'asc' | 'desc' }))}
        sx={{ gap: 2, alignItems: 'center' }}
      >
        <FormControlLabel value="asc" control={<Radio size="small" />} label="Ascending" />
        <FormControlLabel value="desc" control={<Radio size="small" />} label="Descending" />
      </RadioGroup>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <MinimalButton onClick={handleApply} disabled={!localSort.column}>
          Apply sorting
        </MinimalButton>
        <Button
          onClick={handleClear}
          sx={{ color: '#888', fontWeight: 500, fontSize: 14, textTransform: 'none', border: '1.5px solid #e5e7eb', borderRadius: 6, background: '#fff' }}
        >
          Clear all sorts
        </Button>
      </div>
    </div>
  );
};

export default TableSort; 