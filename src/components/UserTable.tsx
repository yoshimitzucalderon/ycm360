import React, { useRef, useState, useEffect } from "react";
import { useTableData, TableColumn, TableFilter as TableFilterType } from "../hooks/useTableData";
import TableFilter from "./TableFilter";
import TableSort from "./TableSort";
import TablePagination from "./TablePagination";
import { supabase } from "../supabaseClient";
import { Filter, ArrowUpDown, Plus, Check, Search, X as XIcon, Download, Columns3 } from 'lucide-react';
import { RiArrowDownSLine, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';

const ArrowDownIcon = RiArrowDownSLine as React.ElementType;
const ArrowUpLineIcon = RiArrowUpLine as React.ElementType;
const ArrowDownLineIcon = RiArrowDownLine as React.ElementType;

const columns: TableColumn[] = [
  { key: "name", label: "Proveedor" },
  { key: "company", label: "Proveedor nombre comercial" },
  { key: "rfc", label: "RFC" },
  { key: "giro", label: "Giro de la empresa" },
  { key: "servicio", label: "Servicio que brinda" },
  { key: "moneda", label: "Moneda" },
  { key: "nacionalidad", label: "Nacionalidad" },
  { key: "banco", label: "Banco" },
  { key: "cuenta", label: "Cuenta bancaria" },
  { key: "clabe", label: "Clabe interbancaria" },
  { key: "anexos", label: "Anexos" },
  { key: "responsableLegal", label: "Responsable legal" },
  { key: "direccionLegal", label: "Dirección responsable legal" },
  { key: "correoLegal", label: "Correo electrónico responsable legal" },
  { key: "telefonoLegal", label: "Teléfono responsable legal" },
  { key: "responsableAdmin", label: "Responsable administrativo" },
  { key: "correoAdmin", label: "Correo electrónico responsable administrativo" },
  { key: "telefonoAdmin", label: "Teléfono responsable administrativo" },
  { key: "id", label: "Id" },
  { key: "date", label: "Fecha de creación" },
  { key: "createdBy", label: "Creado por" },
  { key: "updatedAt", label: "Última actualización" },
  { key: "updatedBy", label: "Actualizado por" },
  { key: "deletedBy", label: "Eliminado por" },
  { key: "deletedAt", label: "Fecha de eliminación" },
];

const PAGE_SIZE = 8;

// Mapeo de columnas frontend -> backend
const columnMap: Record<string, string> = {
  name: 'proveedor',
  company: 'proveedor_nombre_comercial',
  rfc: 'rfc',
  giro: 'giro_de_la_empresa',
  servicio: 'servicio_que_brinda',
  moneda: 'moneda',
  nacionalidad: 'nacionalidad',
  banco: 'banco',
  cuenta: 'cuenta_bancaria',
  clabe: 'clabe_interbancaria',
  anexos: 'anexos_expediente_proveedor',
  responsableLegal: 'nombre_completo_responsable_legal',
  direccionLegal: 'direccion_responsable_legal',
  correoLegal: 'correo_electronico_responsable_legal',
  telefonoLegal: 'telefono responsable legal',
  responsableAdmin: 'nombre_completo_responsable_administrativo',
  correoAdmin: 'correo_electronico_responsable_administrativo',
  telefonoAdmin: 'telefono_responsable_administrativo',
  id: 'id',
  date: 'created_at',
  createdBy: 'created_by',
  updatedAt: 'updated_at',
  updatedBy: 'updated_by',
  deletedBy: 'deleted_by',
  deletedAt: 'deleted_at',
};

// Mapeo de operadores para Supabase .or()
const opMap: Record<string, string> = {
  '=': 'eq',
  '>': 'gt',
  '<': 'lt',
  '>=': 'gte',
  '<=': 'lte',
  'like': 'like',
  'ilike': 'ilike',
  'in': 'in',
  'is': 'is',
};

const mapProveedor = (row: any) => ({
  name: row.proveedor,
  company: row.proveedor_nombre_comercial,
  rfc: row.rfc,
  giro: row.giro_de_la_empresa,
  servicio: row.servicio_que_brinda,
  moneda: row.moneda,
  nacionalidad: row.nacionalidad,
  banco: row.banco,
  cuenta: row.cuenta_bancaria,
  clabe: row.clabe_interbancaria,
  anexos: row.anexos_expediente_proveedor,
  responsableLegal: row.nombre_completo_responsable_legal,
  direccionLegal: row.direccion_responsable_legal,
  correoLegal: row.correo_electronico_responsable_legal,
  telefonoLegal: row["telefono responsable legal"],
  responsableAdmin: row.nombre_completo_responsable_administrativo,
  correoAdmin: row.correo_electronico_responsable_administrativo,
  telefonoAdmin: row.telefono_responsable_administrativo,
  id: row.id,
  date: row.created_at,
  createdBy: row.created_by,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
  deletedBy: row.deleted_by,
  deletedAt: row.deleted_at,
});

// Helper para aplicar un filtro AND
const applyFilter = (query: any, filter: TableFilterType) => {
  const dbColumn = columnMap[filter.column] || filter.column;
  const op = opMap[filter.operator] || filter.operator;
  switch (op) {
    case 'eq':
      return query.eq(dbColumn, filter.value);
    case 'gt':
      return query.gt(dbColumn, filter.value);
    case 'gte':
      return query.gte(dbColumn, filter.value);
    case 'lt':
      return query.lt(dbColumn, filter.value);
    case 'lte':
      return query.lte(dbColumn, filter.value);
    case 'like':
      return query.like(dbColumn, `%${filter.value}%`);
    case 'ilike':
      return query.ilike(dbColumn, `%${filter.value}%`);
    case 'in':
      return query.in(dbColumn, filter.value.split(',').map((v: string) => v.trim()));
    case 'is':
      return query.is(dbColumn, null);
    default:
      return query;
  }
};

// Helper para construir la query de Supabase con filtros AND/OR
const buildSupabaseQuery = (baseQuery: any, filters: TableFilterType[]) => {
  if (filters.length === 0) return baseQuery;

  // Si hay al menos un OR, agrupa todos los filtros en .or()
  const hasOr = filters.some((f, idx) => idx > 0 && f.logicalOperator === 'OR');
  if (hasOr) {
    const orString = filters.map(f => {
      const dbColumn = columnMap[f.column] || f.column;
      const op = opMap[f.operator] || f.operator;
      return `${dbColumn}.${op}.${f.value}`;
    }).join(',');
    return baseQuery.or(orString);
  } else {
    // Todos los filtros son AND
    let query = baseQuery;
    filters.forEach(f => {
      query = applyFilter(query, f);
    });
    return query;
  }
};

const ORIGINAL_COLUMNS = columns; // Asume que 'columns' es el array original importado o definido arriba

const getStoredColumnOrder = () => {
  try {
    const stored = localStorage.getItem('columnOrder');
    if (stored) {
      const keys = JSON.parse(stored);
      // Reconstruir columnas según el orden guardado
      return keys.map((k: string) => ORIGINAL_COLUMNS.find(c => c.key === k)).filter(Boolean);
    }
  } catch {}
  return ORIGINAL_COLUMNS;
};

const getStoredVisibleColumns = () => {
  try {
    const stored = localStorage.getItem('visibleColumns');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return columns.map(c => c.key);
};

const UserTable = () => {
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [colWidths, setColWidths] = useState<{ [key: string]: number }>({});
  const tableRef = useRef<HTMLTableElement>(null);
  const [columnOrder, setColumnOrder] = useState(getStoredColumnOrder());
  const [sortMenu, setSortMenu] = useState<{ colKey: string | null; anchor: HTMLElement | null }>({ colKey: null, anchor: null });
  const [selectedRows, setSelectedRows] = useState<{ [id: string]: boolean }>({});
  const toggleRow = (id: string) => {
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [showSearch, setShowSearch] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(getStoredVisibleColumns());
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const [columnMenuSearch, setColumnMenuSearch] = useState("");

  useEffect(() => {
    if (showSearch) {
      setSearchVisible(true);
    } else {
      // Esperar la duración de la animación antes de desmontar
      const timeout = setTimeout(() => setSearchVisible(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [showSearch]);

  useEffect(() => {
    if (!showSearch) return;
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearch]);

  const {
    data: filteredData,
    filters,
    setFilters,
    sort,
    setSort,
    clearFilters,
    clearSort
  } = useTableData(data, columns);

  // Persistir orden en localStorage
  useEffect(() => {
    localStorage.setItem('columnOrder', JSON.stringify(columnOrder.map((c: TableColumn) => c.key)));
  }, [columnOrder]);

  // Restaurar columnas
  const isOrderModified = columnOrder.map((c: TableColumn) => c.key).join(',') !== ORIGINAL_COLUMNS.map((c: TableColumn) => c.key).join(',');
  const handleRestoreColumns = () => setColumnOrder(ORIGINAL_COLUMNS);

  // Persistir columnas visibles
  useEffect(() => {
    localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Cerrar menú columnas al hacer click fuera
  useEffect(() => {
    if (!columnMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setColumnMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [columnMenuOpen]);

  // Helpers columnas
  const allChecked = visibleColumns.length === columns.length;
  const noneChecked = visibleColumns.length === 0;
  const toggleColumn = (key: string) => {
    setVisibleColumns(cols =>
      cols.includes(key) ? cols.filter(k => k !== key) : [...cols, key]
    );
  };
  const showAllColumns = () => setVisibleColumns(columns.map(c => c.key));
  const hideAllColumns = () => setVisibleColumns([]);
  const resetColumns = () => setVisibleColumns(columns.map(c => c.key));

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!sortMenu.anchor) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return;
      if (!sortMenu.anchor || !sortMenu.anchor.contains(e.target)) setSortMenu({ colKey: null, anchor: null });
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sortMenu]);

  // Fetch de Supabase con filtros AND/OR
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      let baseQuery = supabase.from('erp_proveedor_alta_de_proveedor').select('*');
      let query = buildSupabaseQuery(baseQuery, filters);

      const { data: proveedores, error } = await query;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setData((proveedores || []).map(mapProveedor));
      setLoading(false);
    };
    fetchData();
  }, [filters]);

  // Filtrado por búsqueda en todas las columnas activas (sobre todos los datos filtrados)
  const searchedData = filteredData.filter((row) => {
    if (!search.trim()) return true;
    return columns.some(col => {
      const value = row[col.key];
      return value && value.toString().toLowerCase().includes(search.toLowerCase());
    });
  });

  // Paginación sobre el resultado de la búsqueda
  const totalPages = Math.ceil(searchedData.length / PAGE_SIZE);
  const paginatedData = searchedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Handlers para filtros y ordenamiento
  const handleApplyFilter = () => setPage(1);
  const handleApplySort = () => setPage(1);

  // Ordenamiento rápido por header
  const handleHeaderClick = (colKey: string) => {
    if (sort && sort.column === colKey) {
      setSort({ column: colKey, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      setSort({ column: colKey, direction: "asc" });
    }
    setPage(1);
  };

  // Handler para resize
  const handleMouseDown = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 150;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(60, startWidth + moveEvent.clientX - startX);
      setColWidths((prev) => ({ ...prev, [colKey]: newWidth }));
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Drag and drop handlers
  const dragCol = useRef<string | null>(null);
  const handleDragStart = (colKey: string) => { dragCol.current = colKey; };
  const handleDragOver = (e: React.DragEvent, overKey: string) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, dropKey: string) => {
    e.preventDefault();
    const fromKey = dragCol.current;
    if (!fromKey || fromKey === dropKey) return;
    const fromIdx = columnOrder.findIndex((c: TableColumn) => c.key === fromKey);
    const toIdx = columnOrder.findIndex((c: TableColumn) => c.key === dropKey);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = [...columnOrder];
    const [removed] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, removed);
    setColumnOrder(newOrder);
    dragCol.current = null;
  };

  const handleSortMenu = (e: React.MouseEvent, colKey: string) => {
    e.stopPropagation();
    setSortMenu({ colKey, anchor: e.currentTarget as HTMLElement });
  };
  const handleSortOption = (colKey: string, direction: 'asc' | 'desc') => {
    setSort({ column: colKey, direction });
    setSortMenu({ colKey: null, anchor: null });
    setPage(1);
  };

  const allVisibleSelected = paginatedData.length > 0 && paginatedData.every(user => selectedRows[user.id]);
  const someVisibleSelected = paginatedData.some(user => selectedRows[user.id]) && !allVisibleSelected;
  const toggleAllVisible = () => {
    const newState = !allVisibleSelected;
    const updated: { [id: string]: boolean } = { ...selectedRows };
    paginatedData.forEach(user => {
      updated[user.id] = newState;
    });
    setSelectedRows(updated);
  };

  return (
    <div className="table-container">
      <div className="user-table-header table-controls">
        <div className="controls-left"></div>
        <div className="controls-right search-flex-group">
          {searchVisible ? (
            <div
              className={`search-animate${showSearch ? ' expanded' : ''}`}
              ref={searchContainerRef}
            >
              <Search className="search-icon-inside" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus={showSearch}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch("")}
                  tabIndex={-1}
                  aria-label="Limpiar búsqueda"
                >
                  <XIcon className="search-clear-icon" />
                </button>
              )}
            </div>
          ) : null}
          {!searchVisible && (
            <button
              className={`action-button`}
              onClick={() => setShowSearch(s => !s)}
              title="Buscar"
              aria-label="Buscar"
              style={{ zIndex: 2 }}
            >
              <Search className="action-icon" />
            </button>
          )}
          {/* Botón Seleccionar Columnas */}
          <div style={{ position: 'relative' }}>
            <button
              className="action-button"
              title="Seleccionar columnas"
              onClick={() => setColumnMenuOpen(open => !open)}
              aria-label="Seleccionar columnas"
            >
              <Columns3 className="action-icon" />
            </button>
            {columnMenuOpen && (
              <div
                ref={columnMenuRef}
                style={{
                  position: 'absolute',
                  top: 40,
                  left: 0,
                  minWidth: 220,
                  background: '#fff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  zIndex: 100,
                  padding: 12,
                  maxHeight: 340,
                  overflowY: 'auto',
                }}
              >
                {/* Barra de búsqueda */}
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bdbdbd', width: 18, height: 18 }} />
                  <input
                    type="text"
                    value={columnMenuSearch}
                    onChange={e => setColumnMenuSearch(e.target.value)}
                    placeholder="Buscar..."
                    style={{
                      width: '100%',
                      padding: '7px 32px 7px 34px',
                      border: '2px solid #10b981',
                      borderRadius: 20,
                      fontSize: 15,
                      outline: 'none',
                      color: '#222',
                      background: '#fff',
                    }}
                  />
                  {columnMenuSearch && (
                    <button
                      type="button"
                      onClick={() => setColumnMenuSearch("")}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      tabIndex={-1}
                      aria-label="Limpiar búsqueda"
                    >
                      <XIcon style={{ width: 18, height: 18, color: '#bdbdbd' }} />
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 15 }}>Seleccionar columnas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {columns.filter(col =>
                    col.label.toLowerCase().includes(columnMenuSearch.toLowerCase())
                  ).map(col => (
                    <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '2px 0' }}>
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        style={{ accentColor: '#10b981', width: 16, height: 16, marginRight: 4 }}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 8 }}>
                  <button
                    style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}
                    onClick={allChecked ? hideAllColumns : showAllColumns}
                  >
                    {allChecked ? 'Ocultar todas' : 'Mostrar todas'}
                  </button>
                  <button
                    style={{ background: 'none', border: 'none', color: '#888', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}
                    onClick={resetColumns}
                  >
                    Resetear
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            className={`action-button${showFilter ? ' active' : ''}`}
            onClick={() => setShowFilter(f => !f)}
            title="Filtrar"
          >
            <Filter className="action-icon" />
          </button>
          <button
            className={`action-button${showSort ? ' active' : ''}`}
            onClick={() => setShowSort(s => !s)}
            title="Ordenar"
          >
            <ArrowUpDown className="action-icon" />
          </button>
          <button className="btn-minimal" title="Agregar proveedor">
            <Plus className="btn-icon" />
          </button>
          <button className="btn-minimal" title="Descargar">
            <Download className="btn-icon" />
          </button>
        </div>
      </div>
      <div className="table-wrapper">
        {noneChecked ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, color: '#222', fontSize: 15, background: '#fafbfc' }}>
            <div style={{ marginBottom: 8 }}>No hay columnas seleccionadas</div>
            <div style={{ color: '#10b981', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontSize: 15 }} onClick={() => setColumnMenuOpen(true)}>
              Seleccionar columnas a través del botón correspondiente
            </div>
          </div>
        ) : (
          <table className="user-table" ref={tableRef}>
            <colgroup>
              <col style={{ width: 40, minWidth: 40, maxWidth: 40 }} /> {/* Para el checkbox */}
              {columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key)).map((col: TableColumn) => (
                <col key={col.key} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th
                  style={{
                    minWidth: 40,
                    maxWidth: 40,
                    width: 40,
                    padding: 0,
                    background: '#f8fafc',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <input
                      type="checkbox"
                      className="user-checkbox"
                      checked={allVisibleSelected}
                      ref={el => { if (el) el.indeterminate = someVisibleSelected; }}
                      onChange={toggleAllVisible}
                    />
                  </div>
                </th>
                {columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key)).map((col: TableColumn) => (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={() => handleDragStart(col.key)}
                    onDragOver={e => handleDragOver(e, col.key)}
                    onDrop={e => handleDrop(e, col.key)}
                    className={`user-table-header-cell${sort && sort.column === col.key ? ' sorted' : ''}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((user, idx) => (
                <tr key={user.id || idx}>
                  <td className="user-table-checkbox-cell" style={{ minWidth: 40, maxWidth: 40, width: 40, padding: 0, textAlign: 'center', verticalAlign: 'middle' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedRows[user.id]}
                      onChange={() => toggleRow(user.id)}
                      className="user-checkbox"
                    />
                  </td>
                  {columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key)).map((col: TableColumn) => (
                    <td key={col.key}>{user[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="table-footer">
        <TablePagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalItems={searchedData.length}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
};

export default UserTable;