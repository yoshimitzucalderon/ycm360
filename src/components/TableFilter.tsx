import React, { useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { TableColumn, TableFilter as TableFilterType } from "../hooks/useTableData";
import { X } from 'lucide-react';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import { styled } from '@mui/material/styles';

const OPERATORS = [
  { value: "=", label: "= (igual)" },
  { value: "<>", label: "<> (diferente)" },
  { value: ">", label: "> (mayor que)" },
  { value: "<", label: "< (menor que)" },
  { value: ">=", label: ">= (mayor o igual)" },
  { value: "<=", label: "<= (menor o igual)" },
  { value: "like", label: "LIKE (con % y _)" },
  { value: "ilike", label: "ILIKE (sin distinguir mayúsculas)" },
  { value: "in", label: "IN (lista separada por comas)" },
  { value: "is", label: "IS (null, not null, true, false)" },
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
    border: '1px solid #e5e7eb',
  },
}));

const MinimalMenuItem = styled(MenuItem)({
  fontSize: 13,
  padding: '4px 10px',
});

const TableFilterPopover: React.FC<Props> = ({ columns, visibleColumns, filters, setFilters, anchorRef, onClose }) => {
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
      minWidth: 260,
      maxWidth,
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
    if (filters.length === 1) {
      // Si solo queda uno, lo resetea en vez de eliminar
      setFilters([
        {
          column: '',
          operator: '=',
          value: '',
          logicalOperator: undefined,
        },
      ]);
    } else if (filters.length === 2) {
      // Si quedan dos y eliminas uno, el otro se resetea
      setFilters([
        {
          column: '',
          operator: '=',
          value: '',
          logicalOperator: undefined,
        },
      ]);
    } else {
      setFilters(filters.filter((_, i) => i !== idx));
    }
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
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Filtros</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filters.map((filter, idx) => (
          <div
            key={idx}
            className="filter-row"
          >
            <button onClick={() => removeFilter(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 2 }}>
              <X size={16} />
            </button>
            {idx > 0 && (
              <FormControl size="small" sx={{ minWidth: 70 }}>
                <MinimalSelect
                  value={filter.logicalOperator || 'AND'}
                  onChange={e => setLogicalOperator(idx, (e.target.value as string))}
                >
                  {LOGICALS.map(l => (
                    <MinimalMenuItem key={l.value} value={l.value}>{l.label}</MinimalMenuItem>
                  ))}
                </MinimalSelect>
              </FormControl>
            )}
            <FormControl size="small" sx={{ minWidth: 120 }}>
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
              >
                <MinimalMenuItem value="">Columna...</MinimalMenuItem>
                {columns.filter(col => visibleColumns.includes(col.key)).map(col => (
                  <MinimalMenuItem key={col.key} value={col.key}>{col.label}</MinimalMenuItem>
                ))}
              </MinimalSelect>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <MinimalSelect
                value={filter.operator}
                onChange={e => setFilters(filters.map((f, i) => i === idx ? { ...f, operator: (e.target.value as string) } : f))}
                disabled={!filter.column}
              >
                {OPERATORS.map(op => <MinimalMenuItem key={op.value} value={op.value}>{op.label}</MinimalMenuItem>)}
              </MinimalSelect>
            </FormControl>
            <input
              type="text"
              value={filter.value}
              onChange={e => {
                const val = e.target.value;
                setFilters(filters.map((f, i) => i === idx ? { ...f, value: val } : f));
              }}
              style={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', padding: '2px 6px', minWidth: 60, maxWidth: 120 }}
              placeholder={getPlaceholder(filter.operator)}
              disabled={!filter.column}
            />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 16, bottom: 12, zIndex: 2 }}>
        <button
          onClick={addFilter}
          style={{
            background: '#fff',
            color: '#3b82f6',
            border: '1.5px solid #3b82f6',
            borderRadius: 6,
            padding: '2px 12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#dbeafe';
            (e.currentTarget as HTMLButtonElement).style.color = '#1e40af';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#fff';
            (e.currentTarget as HTMLButtonElement).style.color = '#3b82f6';
          }}
        >
          + Añadir filtro
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <button
          onClick={() => setFilters([])}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: 14,
            textDecoration: 'underline',
          }}
        >
          Reestablecer filtros
        </button>
      </div>
    </div>,
    document.body
  );
};

export default TableFilterPopover; 