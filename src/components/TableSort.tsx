import React, { useState } from "react";
import { TableColumn, TableSortRule } from "../hooks/useTableData";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, X as XIcon, ArrowUp, ArrowDown, SortAsc, RotateCcw } from 'lucide-react';

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
  onRequestClose?: () => void;
};

const TableSort: React.FC<Props> = ({ columns, visibleColumns, sortRules, setSortRules, onApply, onClear, onRequestClose }) => {
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

  const handleDirectionChange = (idx: number) => {
    setSortRules(sortRules.map((rule, i) => i === idx ? { ...rule, direction: rule.direction === 'asc' ? 'desc' : 'asc' } : rule));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newRules = Array.from(sortRules);
    const [removed] = newRules.splice(result.source.index, 1);
    newRules.splice(result.destination.index, 0, removed);
    setSortRules(newRules);
  };

  return (
    <div style={{ minWidth: 380, maxWidth: 1000, padding: 0, borderRadius: 10 }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', padding: '8px 16px 6px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SortAsc size={18} style={{ color: '#22c55e' }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>
            {sortRules.length > 0 ? `Ordenado por ${sortRules.length} criterio${sortRules.length > 1 ? 's' : ''}` : 'Sin orden'}
          </span>
        </div>
        {onRequestClose && (
          <Button onClick={onRequestClose} sx={{ minWidth: 28, color: '#888', p: 0, ml: 1 }}>
            <XIcon size={18} />
          </Button>
        )}
      </div>
      {/* Lista de reglas */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sort-rules-droppable">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} style={{ padding: '4px 0 0 0' }}>
              {sortRules.map((rule, idx) => {
                const col = columns.find(c => c.key === rule.column);
                return (
                  <Draggable key={rule.column} draggableId={rule.column} index={idx}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className="sort-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '28px 80px 1fr 48px 90px 32px',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4,
                          background: '#f8fafc',
                          borderRadius: 6,
                          padding: '4px 8px',
                          border: '1.5px solid #e5e7eb',
                          position: 'relative',
                          ...dragProvided.draggableProps.style
                        }}
                      >
                        <span {...dragProvided.dragHandleProps} style={{ cursor: 'grab', color: '#888' }}>
                          <GripVertical size={16} />
                        </span>
                        <span style={{ fontSize: 13, color: '#888', minWidth: 60 }}>
                          {idx === 0 ? 'ordenar por' : 'luego por'}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: 14, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {col?.label || rule.column}
                        </span>
                        <Switch
                          checked={rule.direction === 'asc'}
                          onChange={() => handleDirectionChange(idx)}
                          size="small"
                          color="success"
                          sx={{ ml: 1 }}
                          inputProps={{ 'aria-label': 'ascendente/descendente' }}
                        />
                        <span style={{ fontSize: 12, color: '#888' }}>
                          {rule.direction === 'asc' ? 'ascendente' : 'descendente'}
                        </span>
                        <Button
                          onClick={() => handleRemoveRule(idx)}
                          className="sort-x"
                          sx={{
                            minWidth: 24,
                            width: 24,
                            height: 24,
                            padding: 0,
                            background: 'transparent',
                            borderRadius: '50%',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: 16,
                            lineHeight: 1,
                            zIndex: 1,
                            boxShadow: 'none',
                            marginLeft: 'auto',
                            transition: 'color 0.15s',
                          }}
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
      {/* Selector para agregar regla y botones de acción en una sola fila */}
      <div style={{ borderTop: '1.5px solid #f1f5f9', marginTop: 10, paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Select
          value={newColumn}
          onChange={e => {
            const col = e.target.value as string;
            setNewColumn(col);
            if (col) {
              setSortRules([...sortRules, { column: col, direction: newDirection }]);
              setNewColumn("");
              setNewDirection('asc');
            }
          }}
          displayEmpty
          size="small"
          sx={{ background: '#fff', borderRadius: 2, fontSize: 13, minWidth: 120, flex: 1, height: 32 }}
        >
          <MenuItem value="">Selecciona otra columna para ordenar</MenuItem>
          {availableColumns.map(col => (
            <MenuItem key={col.key} value={col.key}>{col.label}</MenuItem>
          ))}
        </Select>
        <Button
          onClick={onClear}
          sx={{
            color: '#888',
            fontWeight: 500,
            fontSize: 13,
            textTransform: 'none',
            background: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            transition: 'color 0.15s',
            minWidth: 70,
            height: 32,
            border: 'none',
            '&:hover': {
              background: 'none',
              color: '#ef4444',
            },
          }}
        >
          <RotateCcw size={18} style={{ marginRight: 4, transition: 'color 0.15s' }} />
          Resetear
        </Button>
      </div>
    </div>
  );
};

export default TableSort; 