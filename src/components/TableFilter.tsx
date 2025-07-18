import React, { useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { TableColumn, TableFilter as TableFilterType } from "../hooks/useTableData";
import { X, Trash2, Filter } from 'lucide-react';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import { styled } from '@mui/material/styles';

const OPERATORS = [
  { value: "=", label: "=", description: "equals" },
  { value: "<>", label: "<>", description: "not equal" },
  { value: ">", label: ">", description: "greater than" },
  { value: "<", label: "<", description: "less than" },
  { value: ">=", label: ">=", description: "greater or equal" },
  { value: "<=", label: "<=", description: "less or equal" },
  { value: "like", label: "~*", description: "like operator" },
  { value: "ilike", label: "~~*", description: "ilike operator" },
  { value: "in", label: "in", description: "one of a list of values" },
  { value: "is", label: "is", description: "checking for (null,not null,true,false)" },
];

const LOGICALS = [
  { value: "AND", label: "AND" },
  { value: "OR", label: "OR" },
];

type Props = {
  columns: TableColumn[];
  visibleColumns: string[];
  filters: TableFilterType[];
  setFilters: (filters: TableFilterType[]) => void;
  filterLogic: 'AND' | 'OR'; // <-- agregado
  setFilterLogic: (logic: 'AND' | 'OR') => void; // <-- agregado
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
};

// Estilo minimalista para el Select de MUI
const MinimalSelect = styled(Select)(({ theme }) => ({
  minWidth: 80,
  background: '#f8fafc',
  borderRadius: 6,
  fontSize: 13,
  '& .MuiSelect-select': {
    padding: '4px 10px',
  },
  '& fieldset': {
    border: '1.5px solid #e5e7eb',
  },
  '&.Mui-focused fieldset': {
    borderColor: '#22c55e',
    boxShadow: '0 0 0 1.5px #bbf7d0',
  },
  '&:hover fieldset': {
    borderColor: '#22c55e',
  },
}));

const MinimalMenuItem = styled(MenuItem)({
  fontSize: 13,
  padding: '4px 10px',
});

// Estilo para el menú desplegable de MUI Select
const menuProps = {
  PaperProps: {
    style: {
      maxHeight: 240,
      minWidth: 200,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      borderRadius: 8,
      padding: 0,
      zIndex: 3000, // Asegura que esté por encima del popover
    },
  },
  MenuListProps: {
    sx: {
      '::-webkit-scrollbar': {
        width: '6px',
        background: '#f8fafc',
      },
      '::-webkit-scrollbar-thumb': {
        background: '#d1d5db',
        borderRadius: '4px',
      },
      '::-webkit-scrollbar-thumb:hover': {
        background: '#b6bbc4',
      },
      scrollbarWidth: 'thin',
      scrollbarColor: '#d1d5db #f8fafc',
    },
  },
};

const TableFilterPopover: React.FC<Props> = ({
  columns,
  visibleColumns,
  filters,
  setFilters,
  filterLogic,        // <-- agregado
  setFilterLogic,     // <-- agregado
  anchorRef,
  onClose
}) => {
  const [newFilter, setNewFilter] = useState<TableFilterType>({ column: "", operator: "=", value: "" });
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [initialized, setInitialized] = useState(false);

  // Elimina el useEffect de limpieza automática de filtros

  // Al abrir el popover, si no hay filtros, agrega uno vacío solo una vez
  useEffect(() => {
    if (filters.length === 0) {
      setFilters([
        {
          column: '',
          operator: '=',
          value: '',
          logicalOperator: undefined,
        },
      ]);
    }
    // Solo en el primer render
    // eslint-disable-next-line
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        (!anchorRef.current || !anchorRef.current.contains(event.target as Node))
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorRef]);

  // Posicionamiento inteligente para no salirse del viewport
  useEffect(() => {
    if (!anchorRef.current || !popoverRef.current) return;
    const anchorRect = anchorRef.current.getBoundingClientRect();
    const popover = popoverRef.current;
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let top = anchorRect.bottom + window.scrollY + 8;
    let left = anchorRect.left + window.scrollX;
    let maxWidth = 420;
    let maxHeight = 400;
    // Si se sale por la derecha
    if (left + popoverRect.width > viewportWidth - 12) {
      left = Math.max(viewportWidth - popoverRect.width - 12, 12);
    }
    // Si se sale por abajo
    if (top + popoverRect.height > viewportHeight + window.scrollY - 12) {
      // Mostrar hacia arriba si hay más espacio arriba
      if (anchorRect.top > popoverRect.height + 24) {
        top = anchorRect.top + window.scrollY - popoverRect.height - 8;
      } else {
        // Limitar altura y hacer scroll interno
        maxHeight = viewportHeight - anchorRect.bottom - 32;
      }
    }
    setPopoverStyle({
      position: 'absolute',
      top,
      left,
      background: '#fff',
      border: '1.5px solid #e5e7eb',
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      zIndex: 200,
      padding: 16,
      minWidth: 380,
      maxWidth: 1000,
      maxHeight,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    });
  }, [anchorRef, filters.length]);

  // Cambia la lógica para que el botón '+ Añadir filtro' siempre esté visible y permita agregar múltiples filtros vacíos
  const addFilter = () => {
    setFilters([
      ...filters,
      {
        column: '',
        operator: '=',
        value: '',
        logicalOperator: filters.length === 0 ? undefined : 'AND',
      },
    ]);
  };

  const removeFilter = (idx: number) => {
    // Elimina el filtro seleccionado, permitiendo que el array quede vacío
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const setLogicalOperator = (idx: number, op: string) => {
    setFilters(filters.map((f, i) =>
      i === idx ? { ...f, logicalOperator: op as 'AND' | 'OR' } : f
    ));
  };

  // Función para obtener el placeholder según el operador
  const getPlaceholder = (operator: string) => {
    switch (operator) {
      case 'like':
      case 'ilike':
        return 'Ej: Juan% o %ana%';
      case 'in':
        return 'valor1, valor2, valor3';
      case 'is':
        return 'null, not null, true, false';
      case '>':
      case '<':
      case '>=':
      case '<=':
        return 'Número o texto';
      default:
        return 'Valor';
    }
  };

  // MenuProps con container dinámico
  const getMenuProps = () => ({
    ...menuProps,
    container: popoverRef.current || undefined,
  });

  // Generar resumen de filtros aplicados
  const getFilterSummary = () => {
    const activos = filters.filter(f => f.column && f.operator && f.value);
    if (activos.length === 0) return 'Filtros';
    return 'Filtrando por: ' + activos.map((f, i) => {
      const op = OPERATORS.find(o => o.value === f.operator);
      const col = columns.find(c => c.key === f.column)?.label || f.column;
      const val = f.value ? `"${f.value}"` : '';
      const logic = i > 0 && f.logicalOperator ? `${f.logicalOperator} ` : '';
      return `${logic}${col} ${op ? op.label : f.operator} ${val}`.trim();
    }).join(', ');
  };

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="ycm-filter-popover"
      style={{
        ...popoverStyle,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 12,
        position: 'absolute',
        paddingBottom: 48, // espacio para el botón fijo
        zIndex: 2000,
      }}
    >
      {/* Encabezado con resumen y línea divisoria */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', padding: '8px 16px 6px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={18} style={{ color: '#22c55e' }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: '#222' }}>
            {(() => {
              const activos = filters.filter(f => f.column && f.operator && f.value);
              if (filters.length === 1 && !activos.length) return 'Sin filtros';
              return activos.length > 0
                ? `Filtrando por ${activos.length} criterio${activos.length > 1 ? 's' : ''}`
                : 'Sin filtros';
            })()}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filters.map((filter, idx) => (
          <div
            key={idx}
            className="filter-row"
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 6, padding: '4px 8px', border: '1.2px solid #e5e7eb', marginBottom: 2 }}
          >
            {idx > 0 && (
              <FormControl size="small" sx={{ minWidth: 48 }}>
                <MinimalSelect
                  value={filter.logicalOperator || 'AND'}
                  onChange={e => setLogicalOperator(idx, (e.target.value as string))}
                  MenuProps={getMenuProps()}
                >
                  {LOGICALS.map(l => (
                    <MinimalMenuItem key={l.value} value={l.value}>{l.label}</MinimalMenuItem>
                  ))}
                </MinimalSelect>
              </FormControl>
            )}
            <FormControl size="small" sx={{ minWidth: 90, maxWidth: 160, flex: 1 }}>
              <MinimalSelect
                value={filter.column}
                displayEmpty
                onChange={e => {
                  const col = e.target.value as string;
                  if (!col) {
                    setFilters(filters.filter((_, i) => i !== idx));
                  } else {
                    setFilters(filters.map((f, i) => i === idx ? { ...f, column: col } : f));
                  }
                }}
                MenuProps={getMenuProps()}
                renderValue={selected => {
                  if (!selected) return 'Columna...';
                  const col = columns.find(c => c.key === selected);
                  return (
                    <span style={{
                      display: 'inline-block',
                      maxWidth: 110,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle',
                    }}>{col ? col.label : String(selected)}</span>
                  );
                }}
              >
                <MinimalMenuItem value="">Columna...</MinimalMenuItem>
                {columns.filter(col => visibleColumns.includes(col.key)).map(col => (
                  <MinimalMenuItem key={col.key} value={col.key}>{col.label}</MinimalMenuItem>
                ))}
              </MinimalSelect>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 48, width: 70, marginRight: 1 }}>
              <MinimalSelect
                value={filter.operator}
                onChange={e => setFilters(filters.map((f, i) => i === idx ? { ...f, operator: (e.target.value as string) } : f))}
                disabled={!filter.column}
                MenuProps={{
                  ...getMenuProps(),
                  PaperProps: {
                    style: {
                      maxHeight: 240,
                      minWidth: 200,
                      width: 200,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      borderRadius: 8,
                      padding: 0,
                      zIndex: 3000,
                    },
                  },
                }}
                renderValue={selected => {
                  const op = OPERATORS.find(op => op.value === selected);
                  return op ? op.label : '';
                }}
              >
                {OPERATORS.map(op => (
                  <MinimalMenuItem key={op.value} value={op.value}>
                    <span style={{ minWidth: 32, display: 'inline-block' }}>{op.label}</span>
                    <span style={{ color: '#888', marginLeft: 8 }}>{op.description}</span>
                  </MinimalMenuItem>
                ))}
              </MinimalSelect>
            </FormControl>
            <input
              type="text"
              value={filter.value}
              onChange={e => {
                const val = e.target.value;
                setFilters(filters.map((f, i) => i === idx ? { ...f, value: val } : f));
              }}
              style={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', padding: '2px 6px 2px 6px', minWidth: 60, maxWidth: 120, flex: 1 }}
              placeholder={getPlaceholder(filter.operator)}
              disabled={!filter.column}
            />
            <button
              onClick={() => removeFilter(idx)}
              className="filter-x"
              style={{ minWidth: 24, width: 24, height: 24, padding: 0, background: 'transparent', borderRadius: '50%', border: 'none', fontWeight: 700, fontSize: 16, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s, background 0.15s', marginLeft: 'auto' }}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
      {/* Línea divisoria sutil */}
      <div style={{ borderTop: '1.5px solid #f1f5f9', margin: '0' }} />
      <div style={{ position: 'absolute', left: 16, bottom: 12, zIndex: 2 }}>
        <button
          onClick={addFilter}
          style={{
            background: '#fff',
            color: '#22c55e',
            border: '1.5px solid #22c55e',
            borderRadius: 6,
            padding: '2px 12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#bbf7d0';
            (e.currentTarget as HTMLButtonElement).style.color = '#166534';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#fff';
            (e.currentTarget as HTMLButtonElement).style.color = '#22c55e';
          }}
        >
          + Añadir filtro
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 0 }}>
        <button
          onClick={() => setFilters([
            { column: '', operator: '=', value: '', logicalOperator: undefined }
          ])}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'color 0.15s',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#888';
          }}
        >
          <Trash2 size={18} style={{ marginRight: 4, transition: 'color 0.15s' }} />
          Borrar filtros
        </button>
      </div>
    </div>,
    document.body
  );
};

export default TableFilterPopover; 