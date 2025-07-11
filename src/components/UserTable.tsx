import React, { useRef, useState, useEffect } from "react";
import { useTableData, TableColumn, TableFilter as TableFilterType } from "../hooks/useTableData";
import TableFilter from "./TableFilter";
import TableFilterPopover from "./TableFilter";
import TableSort from "./TableSort";
import TablePagination from "./TablePagination";
import { supabase } from "../supabaseClient";
import { Filter, ArrowUpDown, Plus, Check, Search, X as XIcon, Download, Columns3, ArrowUp, ArrowDown } from 'lucide-react';
import { RiArrowDownSLine, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';
import Popover from '@mui/material/Popover';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  // Limpieza extra: solo pasa filtros con columna y valor no vacío, no null, no undefined y no solo espacios
  const validFilters = filters.filter(f => f.column && typeof f.value === 'string' && f.value.trim() !== '');
  if (validFilters.length === 0) return baseQuery;

  // Si hay al menos un OR, agrupa todos los filtros en .or()
  const hasOr = validFilters.some((f, idx) => idx > 0 && f.logicalOperator === 'OR');
  if (hasOr) {
    const orString = validFilters.map(f => {
      const dbColumn = columnMap[f.column] || f.column;
      const op = opMap[f.operator] || f.operator;
      return `${dbColumn}.${op}.${f.value}`;
    }).join(',');
    return baseQuery.or(orString);
  } else {
    // Todos los filtros son AND
    let query = baseQuery;
    validFilters.forEach(f => {
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

// Estilos globales para los componentes
const MinimalCheckbox = styled(Checkbox)({
  color: '#22c55e',
  '&.Mui-checked': {
    color: '#22c55e',
  },
});

const MinimalButton = styled(Button)({
  color: '#22c55e',
  fontWeight: 500,
  fontSize: 14,
  textTransform: 'none',
  '&:hover': {
    background: '#bbf7d0',
    color: '#166534',
  },
});

// Componente separado para el menú de columnas
const ColumnManager = ({ 
  columns, 
  visibleColumns, 
  onToggleColumn, 
  onShowAll, 
  onHideAll, 
  onReset 
}: {
  columns: TableColumn[];
  visibleColumns: string[];
  onToggleColumn: (key: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onReset: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [search, setSearch] = useState("");
  const [popoverPosition, setPopoverPosition] = useState<'down' | 'up'>('down');

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < 350 && spaceAbove > spaceBelow) {
      setPopoverPosition('up');
    } else {
      setPopoverPosition('down');
    }
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  const allChecked = visibleColumns.length === columns.length;

  return (
    <>
      <button
        className="action-button"
        title="Administrar columnas"
        onClick={handleOpen}
        aria-label="Administrar columnas"
      >
        <Columns3 className="action-icon" />
      </button>
      {open && anchorEl && (
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={popoverPosition === 'up' ? { vertical: 'top', horizontal: 'left' } : { vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={popoverPosition === 'up' ? { vertical: 'bottom', horizontal: 'left' } : { vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            style: {
              minWidth: 220,
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1.5px solid #e5e7eb',
              padding: 12,
              maxHeight: 340,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f8fafc',
            },
          }}
        >
          <div style={{ minWidth: 220 }}>
            <TextField
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              size="small"
              fullWidth
              variant="outlined"
              sx={{ mb: 1, background: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 15, paddingLeft: 1 } }}
              InputProps={{
                startAdornment: <Search style={{ color: '#bdbdbd', width: 18, height: 18, marginRight: 6 }} />,
                endAdornment: search && (
                  <XIcon style={{ cursor: 'pointer', color: '#bdbdbd', width: 18, height: 18 }} onClick={() => setSearch('')} />
                ),
              }}
            />
            <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 15 }}>Administrar columnas</div>
            <FormGroup>
              {columns.filter(col =>
                col.label.toLowerCase().includes(search.toLowerCase())
              ).map(col => (
                <FormControlLabel
                  key={col.key}
                  control={
                    <Checkbox
                      checked={visibleColumns.includes(col.key)}
                      onChange={() => onToggleColumn(col.key)}
                      sx={{ 
                        color: '#22c55e',
                        '&.Mui-checked': {
                          color: '#22c55e',
                        },
                      }}
                    />
                  }
                  label={col.label}
                  sx={{ fontSize: 14, ml: 0 }}
                />
              ))}
            </FormGroup>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 8 }}>
              <Button
                onClick={allChecked ? onHideAll : onShowAll}
                sx={{
                  color: '#22c55e',
                  fontWeight: 500,
                  fontSize: 14,
                  textTransform: 'none',
                  '&:hover': {
                    background: '#bbf7d0',
                    color: '#166534',
                  },
                }}
              >
                {allChecked ? 'Ocultar todas' : 'Mostrar todas'}
              </Button>
              <Button
                onClick={onReset}
                sx={{ color: '#888', fontWeight: 500, fontSize: 14, textTransform: 'none' }}
              >
                Resetear
              </Button>
            </div>
          </div>
        </Popover>
      )}
    </>
  );
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
  // Estado para el menú de orden
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);
  const orderButtonRef = useRef<HTMLButtonElement>(null);
  const [orderPanelPosition, setOrderPanelPosition] = useState<{ top: number | null; left: number | null }>({ top: null, left: null });
  const [selectMenuOpen, setSelectMenuOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<{ [id: string]: boolean }>({});
  const toggleRow = (id: string) => {
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [showSearch, setShowSearch] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(getStoredVisibleColumns());
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const filterOpen = Boolean(filterAnchorEl);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<'down' | 'up'>('down');
  const [columnMenuSearch, setColumnMenuSearch] = useState("");
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null);

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
    sortRules,
    setSortRules,
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
      if (columnMenuAnchorEl && !columnMenuAnchorEl.contains(event.target as Node)) {
        setColumnMenuAnchorEl(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [columnMenuOpen, columnMenuAnchorEl]);

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
    if (!orderButtonRef.current) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return;
      if (!orderButtonRef.current || !orderButtonRef.current.contains(e.target)) setOrderPanelOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [orderButtonRef.current]);

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
    return visibleColumns.some(colKey => {
      const value = row[colKey];
      return value && value.toString().toLowerCase().includes(search.toLowerCase());
    });
  });

  // Paginación sobre el resultado de la búsqueda
  const totalPages = Math.ceil(searchedData.length / PAGE_SIZE);
  const paginatedData = searchedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Handlers para filtros y ordenamiento
  const handleApplyFilter = () => setPage(1);
  const handleApplySort = () => setPage(1);

  // Ordenamiento rápido por header (deshabilitado para multi-sort, o puedes implementar lógica para agregar/quitar reglas aquí)
  // const handleHeaderClick = (colKey: string) => {
  //   // Implementar lógica de multi-sort si se desea
  // };

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
    // setSortMenu({ colKey, anchor: e.currentTarget as HTMLElement }); // This state is removed
  };
  const handleSortOption = (colKey: string, direction: 'asc' | 'desc') => {
    setSortRules([{ column: colKey, direction }]);
    // setSortMenu({ colKey: null, anchor: null }); // This state is removed
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

  // Calcular filtros activos por columna y total (solo los que tienen columna y valor no vacío)
  const filtersByColumn: { [key: string]: number } = {};
  filters.forEach(f => {
    if (f.column && f.value && f.value.trim() !== "") {
      filtersByColumn[f.column] = (filtersByColumn[f.column] || 0) + 1;
    }
  });
  const totalFilters = filters.filter(f => f.column && f.value && f.value.trim() !== "").length;

  // Estilo minimalista para el Popover y scroll
  const MinimalPopover = styled(Popover)({
    '& .MuiPaper-root': {
      minWidth: 220,
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      border: '1.5px solid #e5e7eb',
      padding: 12,
      maxHeight: 340,
      overflowY: 'auto',
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

  const handleOpenFilter = (event: React.MouseEvent<HTMLElement>) => setFilterAnchorEl(event.currentTarget);
  const handleCloseFilter = () => setFilterAnchorEl(null);

  const handleOpenColumnMenu = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < 350 && spaceAbove > spaceBelow) {
      setPopoverPosition('up');
    } else {
      setPopoverPosition('down');
    }
    setColumnMenuAnchorEl(event.currentTarget);
    setColumnMenuOpen(true);
  };
  const handleCloseColumnMenu = () => {
    setColumnMenuAnchorEl(null);
    setColumnMenuSearch("");
  };

  const handleOpenDownload = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleCloseDownload = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownloadPDF = () => {
    const exportColumns = columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key));
    const data = paginatedData.map(row => exportColumns.map((col: TableColumn) => row[col.key]));
    const doc = new jsPDF({ orientation: 'landscape' });
    autoTable(doc, {
      head: [exportColumns.map((col: TableColumn) => col.label)],
      body: data,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }, // azul
      margin: { top: 20 },
      tableWidth: 'auto',
    });
    doc.save('tabla.pdf');
    handleCloseDownload();
  };

  const handleDownloadXLSX = () => {
    // Exportar solo las columnas visibles y los datos paginados/filtrados
    const exportColumns = columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key));
    const data = paginatedData.map(row => {
      const obj: any = {};
      exportColumns.forEach((col: TableColumn) => {
        obj[col.label] = row[col.key];
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'tabla.xlsx');
    handleCloseDownload();
  };

  const handleDownloadCSV = () => {
    // Exportar solo las columnas visibles y los datos paginados/filtrados
    const exportColumns = columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key));
    const data = paginatedData.map(row => {
      const obj: any = {};
      exportColumns.forEach((col: TableColumn) => {
        obj[col.label] = row[col.key];
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'tabla.csv');
    handleCloseDownload();
  };

  const dummyRef = useRef<HTMLElement>(null);

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
          <ColumnManager
            columns={columns}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onShowAll={showAllColumns}
            onHideAll={hideAllColumns}
            onReset={resetColumns}
          />
          <button
            className={`action-button${filterOpen ? ' active' : ''}`}
            onClick={handleOpenFilter}
            title="Filtrar"
            style={{ position: 'relative' }}
          >
            <Filter className="action-icon" />
            {totalFilters > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#22c55e',
                color: '#fff',
                borderRadius: '50%',
                fontSize: 10,
                minWidth: 15,
                height: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                zIndex: 2
              }}>{totalFilters}</span>
            )}
          </button>
          {filterAnchorEl && (
            <TableFilterPopover
              columns={columns}
              visibleColumns={visibleColumns}
              filters={filters}
              setFilters={setFilters}
              anchorRef={{ current: filterAnchorEl }}
              onClose={handleCloseFilter}
            />
          )}
          {/* En la barra de acciones (arriba a la derecha): */}
          <button
            className={`action-button${Boolean(sortAnchorEl) ? ' active' : ''}`}
            onClick={e => setSortAnchorEl(e.currentTarget)}
            title="Ordenar"
            style={{ position: 'relative' }}
          >
            <ArrowUpDown className="action-icon" />
            {sortRules.length > 0 && (
              <span style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#2563eb', // azul más oscuro para sort
                color: '#fff',
                borderRadius: '50%',
                fontSize: 11,
                minWidth: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                zIndex: 2
              }}>{sortRules.length}</span>
            )}
          </button>
          {/* Popover de Ordenamiento */}
          <Popover
            open={Boolean(sortAnchorEl)}
            anchorEl={sortAnchorEl}
            onClose={() => setSortAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ style: { minWidth: 260, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb', padding: 16, maxWidth: 340, maxHeight: 320, overflowY: 'auto' } }}
          >
            <TableSort
              columns={columns}
              visibleColumns={visibleColumns}
              sortRules={sortRules}
              setSortRules={setSortRules}
              onApply={() => setSortAnchorEl(null)}
              onClear={clearSort}
            />
          </Popover>
          {/* El botón de las flechas para ordenar va en cada columna, no aquí */}
            <button className="btn-minimal" title="Agregar proveedor">
              <Plus className="btn-icon" />
            </button>
          <button 
            className={`btn-minimal${Boolean(downloadAnchorEl) ? ' active' : ''}`} 
            title="Descargar"
            onClick={handleOpenDownload}
          >
            <Download className="btn-icon" />
          </button>
          {/* Menu de Descarga */}
          <Menu
            anchorEl={downloadAnchorEl}
            open={Boolean(downloadAnchorEl)}
            onClose={handleCloseDownload}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              style: {
                minWidth: 140,
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb',
                padding: 4
              }
            }}
          >
            <button
              onClick={handleDownloadPDF}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: 4,
                fontSize: 13,
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 16 }}>📄</span>
              Descargar PDF
            </button>
            <button
              onClick={handleDownloadXLSX}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: 4,
                fontSize: 13,
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 16 }}>📊</span>
              Descargar XLSX
            </button>
            <button
              onClick={handleDownloadCSV}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: 4,
                fontSize: 13,
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 16 }}>📋</span>
              Descargar CSV
            </button>
          </Menu>
        </div>
      </div>
      <div className="table-wrapper" style={{ position: 'relative' }}>
        {/* Filtros y orden siempre renderizados */}
        <div style={{ position: 'relative', zIndex: 100 }}>
          {/* No hay filtros abiertos */}
        </div>
        {/* Menu de Ordenamiento */}
        {/* Elimina cualquier Popover/Menu/Dialog de orden */}
        {/* Tabla o mensaje de no columnas seleccionadas */}
        {noneChecked ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, color: '#222', fontSize: 15, background: '#fafbfc' }}>
            <div style={{ marginBottom: 8 }}>No hay columnas seleccionadas</div>
            <div style={{ color: '#10b981', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', fontSize: 15 }} onClick={() => setColumnMenuAnchorEl(null)}>
              Seleccionar columnas a través del botón correspondiente
            </div>
          </div>
        ) : (
          <div className="table-data-area" style={{ minHeight: 240, overflow: 'auto' }}>
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
                  {columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key)).map((col: TableColumn) => {
                    const sortRule = sortRules.find(rule => rule.column === col.key);
                    return (
                      <th
                        key={col.key}
                        draggable
                        onDragStart={() => handleDragStart(col.key)}
                        onDragOver={e => handleDragOver(e, col.key)}
                        onDrop={e => handleDrop(e, col.key)}
                        className="user-table-header-cell"
                        style={{ position: 'relative' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {col.label}
                          {sortRule && (
                            sortRule.direction === 'asc' ?
                              <ArrowUp size={16} style={{ color: '#2563eb', marginLeft: 2 }} /> :
                              <ArrowDown size={16} style={{ color: '#2563eb', marginLeft: 2 }} />
                          )}
                        </span>
                        {filtersByColumn[col.key] > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: 6,
                            right: 4,
                            background: '#22c55e', // verde para filtros
                            color: '#fff',
                            borderRadius: '50%',
                            fontSize: 10,
                            minWidth: 15,
                            height: 15,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            zIndex: 2
                          }}>{filtersByColumn[col.key]}</span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((user, idx) => (
                  <tr key={user.id || idx}>
                    <td className="user-table-checkbox-cell">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <input
                          type="checkbox"
                          checked={!!selectedRows[user.id]}
                          onChange={() => toggleRow(user.id)}
                          className="user-checkbox"
                        />
                      </div>
                    </td>
                    {columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key)).map((col: TableColumn) => (
                      <td key={col.key}>{user[col.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedData.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                minWidth: 320,
                minHeight: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888',
                fontSize: 16,
                pointerEvents: 'none',
                background: 'rgba(255,255,255,0.96)',
                zIndex: 2000
                // Eliminados: boxShadow y borderRadius
              }}>
                No se encontraron resultados para los criterios seleccionados.
              </div>
            )}
          </div>
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