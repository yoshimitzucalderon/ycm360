import React, { useState } from "react";
import { TableColumn, TableSortRule } from "../hooks/useTableData";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, X as XIcon, ArrowUp, ArrowDown } from 'lucide-react';

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

type Props = {
  columns: TableColumn[];
  visibleColumns: string[];
  sortRules: TableSortRule[];
  setSortRules: (rules: TableSortRule[]) => void;
  onApply: () => void;
  onClear: () => void;
};

const TableSort: React.FC<Props> = ({ columns, visibleColumns, sortRules, setSortRules, onApply, onClear }) => {
  const [newColumn, setNewColumn] = useState("");
  const [newDirection, setNewDirection] = useState<'asc' | 'desc'>('asc');

  const availableColumns = columns.filter(
    col => visibleColumns.includes(col.key) && !sortRules.some(rule => rule.column === col.key)
  );

  const handleAddRule = () => {
    if (newColumn) {
      setSortRules([...sortRules, { column: newColumn, direction: newDirection }]);
      setNewColumn("");
      setNewDirection('asc');
    }
  };

  const handleRemoveRule = (idx: number) => {
    setSortRules(sortRules.filter((_, i) => i !== idx));
  };

  const handleDirectionChange = (idx: number, dir: 'asc' | 'desc') => {
    setSortRules(sortRules.map((rule, i) => i === idx ? { ...rule, direction: dir } : rule));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newRules = Array.from(sortRules);
    const [removed] = newRules.splice(result.source.index, 1);
    newRules.splice(result.destination.index, 0, removed);
    setSortRules(newRules);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 260 }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sort-rules-droppable">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {sortRules.map((rule, idx) => {
                const col = columns.find(c => c.key === rule.column);
                return (
                  <Draggable key={rule.column} draggableId={rule.column} index={idx}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 8,
                          background: '#f8fafc',
                          borderRadius: 6,
                          padding: '6px 10px',
                          border: '1.5px solid #e5e7eb',
                          ...dragProvided.draggableProps.style
                        }}
                      >
                        <span {...dragProvided.dragHandleProps} style={{ cursor: 'grab', color: '#888' }}>
                          <GripVertical size={16} />
                        </span>
                        <span style={{ fontWeight: 500, minWidth: 80 }}>{col?.label || rule.column}</span>
                        <Button
                          onClick={() => handleDirectionChange(idx, rule.direction === 'asc' ? 'desc' : 'asc')}
                          sx={{
                            minWidth: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: rule.direction === 'asc' ? '#e0fce0' : '#fee2e2',
                            color: rule.direction === 'asc' ? '#16a34a' : '#dc2626',
                            boxShadow: 'none',
                            border: '1.5px solid #e5e7eb',
                            '&:hover': {
                              background: rule.direction === 'asc' ? '#bbf7d0' : '#fecaca',
                            },
                            ml: 1,
                          }}
                          title={rule.direction === 'asc' ? 'Ascendente' : 'Descendente'}
                        >
                          {rule.direction === 'asc' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                        </Button>
                        <Button
                          onClick={() => handleRemoveRule(idx)}
                          sx={{ minWidth: 28, padding: 0, color: '#888', ml: 1 }}
                        >
                          <XIcon size={18} />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Select
          value={newColumn}
          onChange={e => setNewColumn(e.target.value as string)}
          displayEmpty
          size="small"
          sx={{ background: '#fff', borderRadius: 2, fontSize: 15, minWidth: 120 }}
        >
          <MenuItem value="">Agregar columna…</MenuItem>
          {availableColumns.map(col => (
            <MenuItem key={col.key} value={col.key}>{col.label}</MenuItem>
          ))}
        </Select>
        <RadioGroup
          row
          value={newDirection}
          onChange={e => setNewDirection(e.target.value as 'asc' | 'desc')}
          sx={{ gap: 1, alignItems: 'center' }}
        >
          <FormControlLabel value="asc" control={<Radio size="small" />} label="Asc" />
          <FormControlLabel value="desc" control={<Radio size="small" />} label="Desc" />
        </RadioGroup>
        <MinimalButton onClick={handleAddRule} disabled={!newColumn} sx={{ minWidth: 36, px: 2 }}>
          Añadir
        </MinimalButton>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
        <MinimalButton onClick={onApply} disabled={sortRules.length === 0}>
          Aplicar orden
        </MinimalButton>
        <Button
          onClick={onClear}
          sx={{ color: '#888', fontWeight: 500, fontSize: 14, textTransform: 'none', border: '1.5px solid #e5e7eb', borderRadius: 6, background: '#fff' }}
        >
          Limpiar
        </Button>
      </div>
    </div>
  );
};

export default TableSort; 