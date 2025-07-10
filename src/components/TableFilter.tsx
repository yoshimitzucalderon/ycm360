import React, { useRef, useEffect, useState } from "react";
import { TableColumn, TableFilter as TableFilterType } from "../hooks/useTableData";
import { X } from 'lucide-react';

const OPERATORS = [
  { value: "=", label: "= (igual)" },
  { value: "<>", label: "<> (diferente)" },
  { value: ">", label: "> (mayor que)" },
  { value: "<", label: "< (menor que)" },
  { value: ">=", label: ">= (mayor o igual)" },
  { value: "<=", label: "<= (menor o igual)" },
  { value: "like", label: "~ Coincidencia exacta" },
  { value: "ilike", label: "~* Coincidencia sin mayúsculas" },
  { value: "in", label: "in (Uno de la lista)" },
  { value: "is", label: "is (Valores especiales: null, true, false)" },
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

const TableFilterPopover: React.FC<Props> = ({ columns, visibleColumns, filters, setFilters, anchorRef, onClose }) => {
  const [newFilter, setNewFilter] = useState<TableFilterType>({ column: "", operator: "=", value: "" });
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

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

  // Si no hay filtros, mostrar una fila editable (newFilter) siempre
  const showNewFilterRow = filters.length === 0;

  const addFilter = () => {
    if (newFilter.column && newFilter.operator) {
      setFilters([
        ...filters,
        {
          ...newFilter,
          logicalOperator: filters.length === 0 ? undefined : 'AND' as 'AND',
        },
      ]);
      setNewFilter({ column: '', operator: '=', value: '' });
    }
  };

  const removeFilter = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const setLogicalOperator = (idx: number, op: string) => {
    setFilters(filters.map((f, i) =>
      i === idx ? { ...f, logicalOperator: op as 'AND' | 'OR' } : f
    ));
  };

  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
    >
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Filtros</div>
      {filters.map((filter, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => removeFilter(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 2 }}>
            <X size={16} />
          </button>
          {idx > 0 && (
            <select
              value={filter.logicalOperator || 'AND'}
              onChange={e => setLogicalOperator(idx, e.target.value)}
              style={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb', background: '#f8fafc', padding: '2px 6px' }}
            >
              {LOGICALS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          )}
          <select
            value={filter.column}
            onChange={e => setFilters(filters.map((f, i) => i === idx ? { ...f, column: e.target.value } : f))}
            style={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb', background: '#f8fafc', padding: '2px 6px' }}
          >
            {columns.filter(col => visibleColumns.includes(col.key)).map(col => (
              <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>
          <select
            value={filter.operator}
            onChange={e => setFilters(filters.map((f, i) => i === idx ? { ...f, operator: e.target.value } : f))}
            style={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb', background: '#f8fafc', padding: '2px 6px' }}
          >
            {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
          </select>
          <input
            type="text"
            value={filter.value}
            onChange={e => setFilters(filters.map((f, i) => i === idx ? { ...f, value: e.target.value } : f))}
            style={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', padding: '2px 6px', minWidth: 60, maxWidth: 120 }}
            placeholder="Valor"
          />
        </div>
      ))}
      {showNewFilterRow && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={newFilter.column}
            onChange={e => setNewFilter(f => ({ ...f, column: e.target.value }))}
            style={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb', background: '#f8fafc', padding: '2px 6px' }}
          >
            <option value="">Columna...</option>
            {columns.filter(col => visibleColumns.includes(col.key)).map(col => (
              <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>
          <select
            value={newFilter.operator}
            onChange={e => setNewFilter(f => ({ ...f, operator: e.target.value }))}
            style={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb', background: '#f8fafc', padding: '2px 6px' }}
          >
            {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
          </select>
          <input
            type="text"
            placeholder="Valor"
            value={newFilter.value}
            onChange={e => setNewFilter(f => ({ ...f, value: e.target.value }))}
            style={{ fontSize: 13, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', padding: '2px 6px', minWidth: 60, maxWidth: 120 }}
          />
          <button onClick={addFilter} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 500, cursor: 'pointer' }}>+ Añadir filtro</button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={() => setFilters([])} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 500, cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
          Reestablecer filtros
        </button>
      </div>
    </div>
  );
};

export default TableFilterPopover; 