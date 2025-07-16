import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pin, PinOff, AlertTriangle, GripVertical, MoreVertical, Filter, ArrowUpDown, Plus, Check, Search, X as XIcon, Download, Columns3, ArrowUp, ArrowDown, RotateCcw, EyeOff } from 'lucide-react';
import { supabase } from "../supabaseClient";
import Popover from '@mui/material/Popover';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import GridOnIcon from '@mui/icons-material/GridOn';
import TableFilterPopover from "./TableFilter";
import TableSort from "./TableSort";
import TablePagination from "./TablePagination";

// --- NUEVA TABLA STICKY CON DATOS DE SUPABASE ---
const proveedorColumns = [
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

// Tipos para columnas y layout
interface ProveedorColumn {
  key: string;
  label: string;
  isPinnedLeft: boolean;
  isPinnedRight: boolean;
  width: number;
  minWidth: number;
  maxWidth: number;
}
interface TableLayout {
  orderedColumns: ProveedorColumn[];
  leftPinned: ProveedorColumn[];
  rightPinned: ProveedorColumn[];
  normal: ProveedorColumn[];
  positions: Record<string, { left?: number; right?: number; zIndex: number }>;
  leftTotalWidth: number;
  rightTotalWidth: number;
}

// Tipos para las funcionalidades de la barra de acciones
interface TableColumn {
  key: string;
  label: string;
}

interface TableFilter {
  column: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface SortRule {
  column: string;
  direction: 'asc' | 'desc';
}

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
  telefonoLegal: row.telefono_responsable_legal,
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

// Componente ColumnManager para administrar columnas
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
            <div style={{ borderTop: '1.5px solid #f1f5f9', marginTop: 10, marginBottom: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
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
                sx={{
                  color: '#888',
                  fontWeight: 500,
                  fontSize: 14,
                  textTransform: 'none',
                  background: 'none',
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                  transition: 'color 0.15s',
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
        </Popover>
      )}
    </>
  );
};

function StickyProveedorTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de columnas: pinning y resize
  const [columns, setColumns] = useState<ProveedorColumn[]>(
    proveedorColumns.map((col) => ({
      ...col,
      isPinnedLeft: false,
      isPinnedRight: false,
      width: 160,
      minWidth: 100,
      maxWidth: 300,
    }))
  );

  // --- PAGINACIÓN ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const rowsPerPageOptions = [10, 25, 50, 100, 1000];

  // Layout container
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; width: number } | null>(null);

  // --- SCROLL VERTICAL SI HAY MÁS DE 10 FILAS ---
  // Altura estimada de fila (ajustar si tu fila es más alta/baja)
  const rowHeight = 44; // px
  const headerHeight = 48; // px (aprox)
  const maxVisibleRows = 10;
  const maxTableHeight = rowsPerPage > maxVisibleRows ? headerHeight + rowHeight * maxVisibleRows : undefined;

  // Estado para menú contextual de columna
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnMenuKey, setColumnMenuKey] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Estados para orden, filtros, pinning y anclas
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null);
  const [pinPanelAnchorEl, setPinPanelAnchorEl] = useState<null | HTMLElement>(null);
  const [pinSide, setPinSide] = useState<'left' | 'right'>('left');
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([]);
  const [pinnedColumnsRight, setPinnedColumnsRight] = useState<string[]>([]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const filterOpen = Boolean(filterAnchorEl);
  // Estados de búsqueda y columnas visibles
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(proveedorColumns.map(col => col.key));

  const handleOpenColumnMenu = (event: React.MouseEvent<HTMLElement>, colKey: string) => {
    setColumnMenuAnchor(event.currentTarget as HTMLElement);
    setColumnMenuKey(colKey);
  };
  const handleCloseColumnMenu = () => {
    setColumnMenuAnchor(null);
    setColumnMenuKey(null);
  };
  // Cierre por click fuera
  useEffect(() => {
    if (!columnMenuAnchor) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        columnMenuAnchor && !columnMenuAnchor.contains(event.target as Node)
      ) {
        handleCloseColumnMenu();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [columnMenuAnchor]);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("erp_proveedor_alta_de_proveedor")
      .select("*")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setData((data || []).map(mapProveedor));
        setLoading(false);
      });
  }, []);

  // Sincronizar estados de pinning con columnas
  useEffect(() => {
    const leftPinned = columns.filter(col => col.isPinnedLeft).map(col => col.key);
    const rightPinned = columns.filter(col => col.isPinnedRight).map(col => col.key);
    setPinnedColumns(leftPinned);
    setPinnedColumnsRight(rightPinned);
  }, [columns]);

  // Resetear página cuando cambian filtros o búsqueda
  useEffect(() => {
    setPage(0);
  }, [search, filters, sortRules]);

  // Manejar animación del campo de búsqueda
  useEffect(() => {
    if (showSearch) {
      setSearchVisible(true);
    } else {
      // Esperar la duración de la animación antes de desmontar
      const timeout = setTimeout(() => setSearchVisible(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [showSearch]);

  // Cerrar búsqueda al hacer click fuera
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

  // Observar tamaño del contenedor
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new window.ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setContainerWidth(width);
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Pinning
  const canPinLeft = (colKey: string): boolean => {
    const col = visibleColumnsData.find((c) => c.key === colKey);
    if (!col || col.isPinnedLeft) return true;
    const testCols = visibleColumnsData.map((c) => c.key === colKey ? { ...c, isPinnedLeft: true, isPinnedRight: false } : c);
    const testLeft = testCols.filter((c) => c.isPinnedLeft).reduce((sum, c) => sum + c.width, 0);
    const testRight = tableLayout.rightTotalWidth;
    return testLeft + testRight + 100 <= containerWidth;
  };
  const canPinRight = (colKey: string): boolean => {
    const col = visibleColumnsData.find((c) => c.key === colKey);
    if (!col || col.isPinnedRight) return true;
    const testCols = visibleColumnsData.map((c) => c.key === colKey ? { ...c, isPinnedRight: true, isPinnedLeft: false } : c);
    const testRight = testCols.filter((c) => c.isPinnedRight).reduce((sum, c) => sum + c.width, 0);
    const testLeft = tableLayout.leftTotalWidth;
    return testLeft + testRight + 100 <= containerWidth;
  };
  const pinLeft = (key: string) => {
    setColumns((cols) => cols.map((c) => c.key === key ? { ...c, isPinnedLeft: !c.isPinnedLeft, isPinnedRight: false } : c));
    // Sincronizar con estados de la barra de acciones
    setPinnedColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    setPinnedColumnsRight(prev => prev.filter(k => k !== key));
  };
  const pinRight = (key: string) => {
    setColumns((cols) => cols.map((c) => c.key === key ? { ...c, isPinnedRight: !c.isPinnedRight, isPinnedLeft: false } : c));
    // Sincronizar con estados de la barra de acciones
    setPinnedColumnsRight(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    setPinnedColumns(prev => prev.filter(k => k !== key));
  };
  const clearAllPins = () => {
    setColumns((cols) => cols.map((c) => ({ ...c, isPinnedLeft: false, isPinnedRight: false })));
  };

  // Resize
  const handleResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const col = visibleColumnsData.find((c) => c.key === colKey);
    if (!col) return;
    setIsResizing(colKey);
    setResizeStart({ x: e.clientX, width: col.width });
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeStart) return;
    e.preventDefault();
    const deltaX = e.clientX - resizeStart.x;
    const newWidth = Math.max(100, Math.min(300, resizeStart.width + deltaX));
    setColumns((cols) => cols.map((c) => c.key === isResizing ? { ...c, width: newWidth } : c));
  }, [isResizing, resizeStart]);
  const handleResizeEnd = useCallback(() => {
    setIsResizing(null);
    setResizeStart(null);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // --- FUNCIONES PARA LA BARRA DE ACCIONES ---
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev: string[]) => 
      prev.includes(key) ? prev.filter((k: string) => k !== key) : [...prev, key]
    );
  };

  const showAllColumns = () => setVisibleColumns(proveedorColumns.map(c => c.key));
  const hideAllColumns = () => setVisibleColumns([]);
  const resetColumns = () => setVisibleColumns(proveedorColumns.map(c => c.key));

  const pinColumnLeft = (colKey: string) => {
    setPinnedColumns((prev: string[]) => [...prev, colKey]);
    setPinnedColumnsRight((prev: string[]) => prev.filter((k: string) => k !== colKey));
    // Sincronizar con columnas
    setColumns((cols) => cols.map((c) => c.key === colKey ? { ...c, isPinnedLeft: true, isPinnedRight: false } : c));
  };

  const pinColumnRight = (colKey: string) => {
    setPinnedColumnsRight((prev: string[]) => [...prev, colKey]);
    setPinnedColumns((prev: string[]) => prev.filter((k: string) => k !== colKey));
    // Sincronizar con columnas
    setColumns((cols) => cols.map((c) => c.key === colKey ? { ...c, isPinnedRight: true, isPinnedLeft: false } : c));
  };

  const unpinColumn = (colKey: string) => {
    setPinnedColumns((prev: string[]) => prev.filter((k: string) => k !== colKey));
    setPinnedColumnsRight((prev: string[]) => prev.filter((k: string) => k !== colKey));
    // Sincronizar con columnas
    setColumns((cols) => cols.map((c) => c.key === colKey ? { ...c, isPinnedLeft: false, isPinnedRight: false } : c));
  };

  const handleOpenSort = (event: React.MouseEvent<HTMLElement>) => setSortAnchorEl(event.currentTarget);
  const handleCloseSort = () => setSortAnchorEl(null);

  const handleOpenDownload = (event: React.MouseEvent<HTMLElement>) => setDownloadAnchorEl(event.currentTarget);
  const handleCloseDownload = () => setDownloadAnchorEl(null);

  const handleOpenPinPanel = (event: React.MouseEvent<HTMLElement>) => setPinPanelAnchorEl(event.currentTarget);
  const handleClosePinPanel = () => setPinPanelAnchorEl(null);

  const handleOpenFilter = (event: React.MouseEvent<HTMLElement>) => setFilterAnchorEl(event.currentTarget);
  const handleCloseFilter = () => setFilterAnchorEl(null);

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Aplicar búsqueda
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(row => {
        return proveedorColumns.some(col => {
          const value = row[col.key];
          return value && value.toString().toLowerCase().includes(searchLower);
        });
      });
    }

    // Filtrado estilo Supabase (igual que UserTable)
    if (filters.length > 0) {
      const validFilters = filters.filter(
        (f: TableFilter) => f.column && f.operator && f.value !== undefined && f.value !== null && f.value !== ''
      );

      if (validFilters.length > 0) {
        result = result.filter(row => {
          // Lógica secuencial AND/OR igual que useTableData
          let res = true;
          for (let i = 0; i < validFilters.length; i++) {
            const filter = validFilters[i];
            const value = row[filter.column];
            let currentResult = false;
            if (value !== undefined && value !== null) {
              switch (filter.operator) {
                case '=': case 'eq':
                  currentResult = value.toString() === filter.value;
                  break;
                case '!=': case '<>': case 'neq':
                  currentResult = value.toString() !== filter.value;
                  break;
                case 'like':
                  if (filter.value.startsWith('%') && filter.value.endsWith('%')) {
                    currentResult = value.toString().toLowerCase().includes(filter.value.replace(/%/g, '').toLowerCase());
                  } else if (filter.value.startsWith('%')) {
                    currentResult = value.toString().toLowerCase().endsWith(filter.value.replace(/%/g, '').toLowerCase());
                  } else if (filter.value.endsWith('%')) {
                    currentResult = value.toString().toLowerCase().startsWith(filter.value.replace(/%/g, '').toLowerCase());
                  } else {
                    currentResult = value.toString().toLowerCase() === filter.value.toLowerCase();
                  }
                  break;
                case 'ilike':
                  currentResult = value.toString().toLowerCase().includes(filter.value.toLowerCase());
                  break;
                case '>': case 'gt':
                  currentResult = value > filter.value;
                  break;
                case '<': case 'lt':
                  currentResult = value < filter.value;
                  break;
                case '>=': case 'gte':
                  currentResult = value >= filter.value;
                  break;
                case '<=': case 'lte':
                  currentResult = value <= filter.value;
                  break;
                case 'in':
                  currentResult = filter.value
                    .split(',')
                    .map((v: string) => v.trim())
                    .includes(value.toString());
                  break;
                case 'is':
                  if (filter.value === 'null') currentResult = value === null || value === '';
                  else if (filter.value === 'not null') currentResult = value !== null && value !== '';
                  else if (filter.value === 'true') currentResult = value === true || value === 'true';
                  else if (filter.value === 'false') currentResult = value === false || value === 'false';
                  else currentResult = false;
                  break;
                default:
                  currentResult = true;
              }
            }
            if (i === 0) {
              res = currentResult;
            } else {
              const logic = filter.logicalOperator || 'AND';
              if (logic === 'AND') {
                res = res && currentResult;
              } else if (logic === 'OR') {
                res = res || currentResult;
              }
            }
          }
          return res;
        });
      }
    }

    // Aplicar ordenamiento
    if (sortRules.length > 0) {
      result.sort((a, b) => {
        for (const rule of sortRules) {
          const aValue = a[rule.column];
          const bValue = b[rule.column];
          if (aValue === bValue) continue;
          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return rule.direction === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return result;
  }, [data, search, filters, sortRules, filterLogic]);
  // Actualizar datos paginados con los datos filtrados
  const paginatedData = filteredAndSortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalRows = filteredAndSortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  // Filtrar columnas visibles
  const visibleColumnsData = useMemo(() => {
    return columns.filter(col => visibleColumns.includes(col.key));
  }, [columns, visibleColumns]);

  // Actualizar layout con columnas visibles
  const tableLayout: TableLayout = useMemo(() => {
    const leftPinned = visibleColumnsData.filter((c) => c.isPinnedLeft);
    const rightPinned = visibleColumnsData.filter((c) => c.isPinnedRight);
    const normal = visibleColumnsData.filter((c) => !c.isPinnedLeft && !c.isPinnedRight);
    const orderedColumns = [...leftPinned, ...normal, ...rightPinned];
    const positions: Record<string, { left?: number; right?: number; zIndex: number }> = {};
    let currentLeft = 0;
    leftPinned.forEach((col, i) => {
      positions[col.key] = { left: currentLeft, zIndex: 100 + leftPinned.length - i };
      currentLeft += col.width;
    });
    let currentRight = 0;
    [...rightPinned].reverse().forEach((col, i) => {
      const origIdx = rightPinned.length - 1 - i;
      positions[col.key] = { right: currentRight, zIndex: 100 + rightPinned.length - origIdx };
      currentRight += col.width;
    });
    const leftTotalWidth = leftPinned.reduce((sum, col) => sum + col.width, 0);
    const rightTotalWidth = rightPinned.reduce((sum, col) => sum + col.width, 0);
    return { orderedColumns, leftPinned, rightPinned, normal, positions, leftTotalWidth, rightTotalWidth };
  }, [visibleColumnsData, containerWidth]);

  // Para exportar columnas en el orden visual real (mismo orden que se muestra en pantalla)
  const getExportColumns = () => {
    // Usar el mismo orden que se muestra en la tabla: tableLayout.orderedColumns
    return tableLayout.orderedColumns;
  };

  const handleDownloadPDF = () => {
    // Usar el mismo orden de columnas que se muestra en pantalla
    const exportCols = getExportColumns();
    const tableData = filteredAndSortedData.map((row: any) =>
      exportCols.map(col => row[col.key] || '')
    );
    const doc = new jsPDF();
    autoTable(doc, {
      head: [exportCols.map(col => col.label)],
      body: tableData,
    });
    doc.save('proveedores.pdf');
    handleCloseDownload();
  };

  const handleDownloadXLSX = () => {
    // Usar el mismo orden de columnas que se muestra en pantalla
    const exportCols = getExportColumns();
    const exportData = filteredAndSortedData.map((row: any) => {
      const obj: any = {};
      exportCols.forEach(col => {
        obj[col.label] = row[col.key] || '';
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Proveedores");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, 'proveedores.xlsx');
    handleCloseDownload();
  };

  const handleDownloadCSV = () => {
    // Usar el mismo orden de columnas que se muestra en pantalla
    const exportCols = getExportColumns();
    const headers = exportCols.map(col => col.label).join(',');
    const csvData = filteredAndSortedData.map((row: any) =>
      exportCols.map(col => `"${row[col.key] || ''}"`).join(',')
    ).join('\n');
    const csvContent = `${headers}\n${csvData}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'proveedores.csv');
    handleCloseDownload();
  };

  const clearSort = () => setSortRules([]);
  
  // Calcular filtros activos por columna y total (solo los que tienen columna y valor no vacío)
  const filtersByColumn: { [key: string]: number } = {};
  filters.forEach(f => {
    if (f.column && f.value && f.value.trim() !== "") {
      filtersByColumn[f.column] = (filtersByColumn[f.column] || 0) + 1;
    }
  });
  const totalFilters = filters.filter(f => f.column && f.value && f.value.trim() !== "").length;

  // Add this helper inside StickyProveedorTable, near other handlers
  const handleSortOption = (colKey: string, direction: 'asc' | 'desc') => {
    // Check if already sorted by this column
    const existingRuleIndex = sortRules.findIndex(rule => rule.column === colKey);
    if (existingRuleIndex >= 0) {
      // Update direction
      const newSortRules = [...sortRules];
      newSortRules[existingRuleIndex] = { column: colKey, direction };
      setSortRules(newSortRules);
    } else {
      // Add new rule
      setSortRules([...sortRules, { column: colKey, direction }]);
    }
  };

  // Render
  return (
    <div style={{ margin: "32px 0 32px 0" }}>
      {/* BARRA DE ACCIONES */}
      <div className="table-container">
        <div className="user-table-header table-controls">
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, width: '100%' }}>
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
              columns={proveedorColumns.map(col => ({ key: col.key, label: col.label }))}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onShowAll={showAllColumns}
              onHideAll={hideAllColumns}
              onReset={resetColumns}
            />
            {/* En la barra de acciones: */}
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
            {filterOpen && (
              <TableFilterPopover
                columns={proveedorColumns.map(col => ({ key: col.key, label: col.label }))}
                visibleColumns={visibleColumns}
                filters={filters}
                setFilters={setFilters}
                filterLogic={filterLogic}
                setFilterLogic={setFilterLogic}
                anchorRef={{ current: filterAnchorEl }}
                onClose={handleCloseFilter}
              />
            )}
            {/* En la barra de acciones (arriba a la derecha): */}
            <button
              className={`action-button${Boolean(sortAnchorEl) ? ' active' : ''}`}
              onClick={handleOpenSort}
              title="Ordenar"
              style={{ position: 'relative' }}
            >
              <ArrowUpDown className="action-icon" />
              {sortRules.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#2563eb',
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
              PaperProps={{ style: { minWidth: 260, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb', padding: 16, maxWidth: 1000, maxHeight: 320, overflowY: 'auto' } }}
            >
              <TableSort
                columns={proveedorColumns.map(col => ({ key: col.key, label: col.label }))}
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
            {/* Botón de pin en la barra de acciones: */}
            <button
              className="action-button"
              title="Columnas fijadas"
              style={{ position: 'relative', marginLeft: 4 }}
              onClick={handleOpenPinPanel}
            >
              <Pin className="action-icon" style={{ color: '#22c55e', width: 20, height: 20 }} />
              {(pinnedColumns.length + pinnedColumnsRight.length) > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#22c55e',
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
                }}>{pinnedColumns.length + pinnedColumnsRight.length}</span>
              )}
            </button>
            <Popover
              open={Boolean(pinPanelAnchorEl)}
              anchorEl={pinPanelAnchorEl}
              onClose={handleClosePinPanel}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{
                style: {
                  minWidth: 240,
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
                {/* Toggle minimalista */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  <button
                    onClick={() => setPinSide('left')}
                    style={{
                      flex: 1,
                      background: pinSide === 'left' ? '#f0fdf4' : 'transparent',
                      border: 'none',
                      borderBottom: pinSide === 'left' ? '2px solid #22c55e' : '2px solid transparent',
                      color: pinSide === 'left' ? '#22c55e' : '#888',
                      fontWeight: 600,
                      fontSize: 15,
                      padding: '6px 0',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >Fijar a la izquierda</button>
                  <button
                    onClick={() => setPinSide('right')}
                    style={{
                      flex: 1,
                      background: pinSide === 'right' ? '#f0fdf4' : 'transparent',
                      border: 'none',
                      borderBottom: pinSide === 'right' ? '2px solid #22c55e' : '2px solid transparent',
                      color: pinSide === 'right' ? '#22c55e' : '#888',
                      fontWeight: 600,
                      fontSize: 15,
                      padding: '6px 0',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >Fijar a la derecha</button>
                </div>
                <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 8 }}>
                  {pinSide === 'left' ? 'Columnas fijadas a la izquierda' : 'Columnas fijadas a la derecha'}
                </div>
                {proveedorColumns.filter((col) => visibleColumns.includes(col.key)).map((col) => {
                  const isPinnedLeft = pinnedColumns.includes(col.key);
                  const isPinnedRight = pinnedColumnsRight.includes(col.key);
                  return (
                    <div key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, opacity: pinSide === 'left' && isPinnedRight ? 0.4 : pinSide === 'right' && isPinnedLeft ? 0.4 : 1 }}>
                      <Checkbox
                        checked={pinSide === 'left' ? isPinnedLeft : isPinnedRight}
                        disabled={pinSide === 'left' ? isPinnedRight : isPinnedLeft}
                        onChange={() => {
                          if (pinSide === 'left') {
                            if (isPinnedLeft) {
                              unpinColumn(col.key);
                            } else {
                              pinColumnLeft(col.key);
                              if (isPinnedRight) setPinnedColumnsRight(prev => prev.filter(k => k !== col.key));
                            }
                          } else {
                            if (isPinnedRight) {
                              unpinColumn(col.key);
                            } else {
                              pinColumnRight(col.key);
                              if (isPinnedLeft) setPinnedColumns(prev => prev.filter(k => k !== col.key));
                            }
                          }
                        }}
                        sx={{ color: '#22c55e', '&.Mui-checked': { color: '#22c55e' } }}
                      />
                      <span style={{ fontSize: 14 }}>{col.label}</span>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1.5px solid #f1f5f9', margin: '10px 0' }} />
                {pinSide === 'left' && (
                  <button
                    onClick={() => {
                      [...pinnedColumns, ...pinnedColumnsRight].forEach(unpinColumn);
                      handleClosePinPanel();
                    }}
                    style={{
                      color: '#888',
                      fontWeight: 500,
                      fontSize: 14,
                      textTransform: 'none',
                      background: 'none',
                      border: 'none',
                      boxShadow: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end', // <-- Mueve el contenido al extremo derecho
                      width: '100%',              // <-- Ocupa todo el ancho del panel
                      gap: 4,
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 6,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}
                  >
                    <PinOff size={18} style={{ marginRight: 4, color: 'inherit' }} />
                    Desfijar todas
                  </button>
                )}
                {pinSide === 'right' && (
                  <button
                    onClick={() => {
                      [...pinnedColumns, ...pinnedColumnsRight].forEach(unpinColumn);
                      handleClosePinPanel();
                    }}
                    style={{
                      color: '#888',
                      fontWeight: 500,
                      fontSize: 14,
                      textTransform: 'none',
                      background: 'none',
                      border: 'none',
                      boxShadow: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end', // <-- Mueve el contenido al extremo derecho
                      width: '100%',              // <-- Ocupa todo el ancho del panel
                      gap: 4,
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 6,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#888'; }}
                  >
                    <PinOff size={18} style={{ marginRight: 4, color: 'inherit' }} />
                    Desfijar todas
                  </button>
                )}
              </div>
            </Popover>
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
                <span style={{ fontSize: 18, color: '#e11d48', display: 'flex', alignItems: 'center' }}><PictureAsPdfIcon fontSize="inherit" /></span>
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
                <span style={{ fontSize: 18, color: '#22c55e', display: 'flex', alignItems: 'center' }}><TableChartIcon fontSize="inherit" /></span>
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
                <span style={{ fontSize: 18, color: '#2563eb', display: 'flex', alignItems: 'center' }}><GridOnIcon fontSize="inherit" /></span>
                Descargar CSV
              </button>
            </Menu>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "none",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
          margin: 0,
          padding: 0,
        }}
      >
        <div
          ref={containerRef}
          style={{
            flex: "1 1 auto",
            overflowX: "auto",
            overflowY: rowsPerPage > maxVisibleRows ? "auto" : "visible",
            maxHeight: maxTableHeight,
            transition: "max-height 0.2s",
            width: "100%",
            maxWidth: "none",
            margin: 0,
            padding: 0,
            height: maxTableHeight ? maxTableHeight : undefined,
            position: "relative", // <-- agregado para sticky
          }}
        >
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed", minWidth: 900, fontFamily: 'Roboto, Helvetica, Arial, sans-serif', fontSize: '14px' }}>
            <thead>
              <tr>
                {tableLayout.orderedColumns.map((col) => {
                  const position = tableLayout.positions[col.key];
                  const style: React.CSSProperties = {
                    minWidth: col.width,
                    width: col.width,
                    position: 'sticky', // SIEMPRE sticky
                    top: 0,             // SIEMPRE top 0
                    background: col.isPinnedLeft ? '#f8fafc' : col.isPinnedRight ? '#faf5ff' : '#fff',
                    zIndex: col.isPinnedLeft || col.isPinnedRight ? (1000 + (position?.zIndex || 0)) : 500,
                    ...(col.isPinnedLeft && position?.left !== undefined ? { left: position.left, boxShadow: '2px 0 4px -1px rgba(0,0,0,0.1)', borderRight: '2px solid #3b82f6' } : {}),
                    ...(col.isPinnedRight && position?.right !== undefined ? { right: position.right, boxShadow: '-2px 0 4px -1px rgba(0,0,0,0.1)', borderLeft: '2px solid #8b5cf6' } : {}),
                  };
                  return (
                    <th key={col.key} style={style}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                          {col.label}
                          {/* Badge de filtros activos por columna */}
                          {filtersByColumn[col.key] > 0 && (
                            <span style={{
                              marginLeft: 6,
                              background: '#22c55e',
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
                          {/* Flechas de ordenamiento */}
                          {(() => {
                            const sortRule = sortRules.find(r => r.column === col.key);
                            if (sortRule) {
                              return sortRule.direction === 'asc' ? (
                                <ArrowUp size={16} style={{ color: '#2563eb', marginLeft: 4 }} />
                              ) : (
                                <ArrowDown size={16} style={{ color: '#2563eb', marginLeft: 4 }} />
                              );
                            }
                            return null;
                          })()}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, position: 'relative' }}>
                          <span
                            className="header-menu-trigger"
                            style={{
                              position: 'relative',
                              opacity: 0,
                              transition: 'opacity 0.15s',
                              zIndex: 3,
                              display: 'inline-flex',
                            }}
                          >
                            <button
                              ref={columnMenuKey === col.key ? buttonRef : undefined}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                padding: 4, 
                                cursor: 'pointer', 
                                borderRadius: 4, 
                                display: 'flex', 
                                alignItems: 'center',
                                opacity: 0.6,
                                transition: 'opacity 0.15s'
                              }}
                              onClick={e => { e.stopPropagation(); handleOpenColumnMenu(e, col.key); }}
                              title='Opciones de columna'
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                            >
                              <MoreVertical size={16} style={{ color: '#2563eb' }} />
                            </button>
                          </span>
                          {/* Menú contextual de columna, solo para la columna activa */}
                          {columnMenuAnchor && columnMenuKey === col.key && (
                            <div
                              ref={menuRef}
                              style={{
                                position: 'absolute',
                                top: 32,
                                right: 0,
                                minWidth: 170,
                                background: '#fff',
                                border: '1.5px solid #e5e7eb',
                                borderRadius: 8,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                zIndex: 10000,
                                fontSize: 14,
                                padding: 4,
                              }}
                              onClick={e => e.stopPropagation()}
                            >
                              {/* Ordenar ascendente */}
                              <div
                                className="column-menu-item"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '7px 12px',
                                  cursor: 'pointer',
                                  borderRadius: 5,
                                  color: '#555',
                                  fontWeight: 400
                                }}
                                onClick={() => { handleSortOption(columnMenuKey, 'asc'); handleCloseColumnMenu(); }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <ArrowUp size={16} /> Ordenar ascendente
                              </div>
                              {/* Ordenar descendente */}
                              <div
                                className="column-menu-item"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '7px 12px',
                                  cursor: 'pointer',
                                  borderRadius: 5,
                                  color: '#555',
                                  fontWeight: 400
                                }}
                                onClick={() => { handleSortOption(columnMenuKey, 'desc'); handleCloseColumnMenu(); }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <ArrowDown size={16} /> Ordenar descendente
                              </div>
                              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                              {/* Pin/unpin options (existing) */}
                              {!visibleColumnsData.find(c => c.key === columnMenuKey)?.isPinnedLeft && !visibleColumnsData.find(c => c.key === columnMenuKey)?.isPinnedRight && (
                                <div
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }}
                                  onClick={() => { pinLeft(columnMenuKey); handleCloseColumnMenu(); }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Pin size={16} /> Fijar a la izquierda
                                </div>
                              )}
                              {visibleColumnsData.find(c => c.key === columnMenuKey)?.isPinnedLeft && (
                                <div
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }}
                                  onClick={() => { pinLeft(columnMenuKey); handleCloseColumnMenu(); }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <PinOff size={16} /> Desfijar izquierda
                                </div>
                              )}
                              {!visibleColumnsData.find(c => c.key === columnMenuKey)?.isPinnedRight && !visibleColumnsData.find(c => c.key === columnMenuKey)?.isPinnedLeft && (
                                <div
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }}
                                  onClick={() => { pinRight(columnMenuKey); handleCloseColumnMenu(); }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Pin size={16} style={{ transform: 'scaleX(-1)' }} /> Fijar a la derecha
                                </div>
                              )}
                              {visibleColumnsData.find(c => c.key === columnMenuKey)?.isPinnedRight && (
                                <div
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }}
                                  onClick={() => { pinRight(columnMenuKey); handleCloseColumnMenu(); }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <PinOff size={16} /> Desfijar derecha
                                </div>
                              )}
                              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                              {/* Ocultar columna */}
                              <div
                                className="column-menu-item column-menu-hide"
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }}
                                onClick={() => { toggleColumn(columnMenuKey); handleCloseColumnMenu(); }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <EyeOff size={16} /> Ocultar columna
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          width: 8, 
                          height: '100%', 
                          cursor: 'col-resize', 
                          backgroundColor: 'transparent', 
                          zIndex: 1000,
                          transition: 'background-color 0.15s ease'
                        }} 
                        onMouseDown={(e) => handleResizeStart(col.key, e)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={tableLayout.orderedColumns.length} style={{ textAlign: 'center', padding: 24 }}>Cargando...</td></tr>
              )}
              {error && (
                <tr><td colSpan={tableLayout.orderedColumns.length} style={{ textAlign: 'center', color: '#dc2626', padding: 24 }}>{error}</td></tr>
              )}
              {!loading && !error && paginatedData.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  {tableLayout.orderedColumns.map(col => {
                    const position = tableLayout.positions[col.key];
                    const style: React.CSSProperties = {
                      minWidth: col.width,
                      width: col.width,
                      // Solo las celdas pinned son sticky horizontalmente
                      position: col.isPinnedLeft || col.isPinnedRight ? 'sticky' : 'relative',
                      ...(col.isPinnedLeft && position?.left !== undefined ? { left: position.left } : {}),
                      ...(col.isPinnedRight && position?.right !== undefined ? { right: position.right } : {}),
                      background: col.isPinnedLeft ? '#f8fafc' : col.isPinnedRight ? '#faf5ff' : undefined,
                      zIndex: (col.isPinnedLeft || col.isPinnedRight) && position ? position.zIndex : undefined,
                      boxShadow: col.isPinnedLeft ? '2px 0 4px -1px rgba(0,0,0,0.1)' : col.isPinnedRight ? '-2px 0 4px -1px rgba(0,0,0,0.1)' : undefined,
                      borderRight: col.isPinnedLeft ? '2px solid #3b82f6' : undefined,
                      borderLeft: col.isPinnedRight ? '2px solid #8b5cf6' : undefined,
                    };
                    return (
                      <td key={col.key} style={style}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[col.key]}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* PAGINACIÓN */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 0 0", fontSize: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Filas por página:</span>
          <select
            value={rowsPerPage}
            onChange={e => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 8px", background: "#fff", fontSize: 14 }}
          >
            {rowsPerPageOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>{totalRows === 0 ? 0 : page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, totalRows)} de {totalRows}</span>
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
            title="Primera página"
          >{'|<'}</button>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
            title="Página anterior"
          >{'<'}</button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.5 : 1 }}
            title="Página siguiente"
          >{'>'}</button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.5 : 1 }}
            title="Última página"
          >{'>|'}</button>
        </div>
      </div>
    </div>
  );
}

export default function DynamicStickyDemo() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <StickyProveedorTable />
    </div>
  );
}