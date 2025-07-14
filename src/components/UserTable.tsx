import React, { useRef, useState, useEffect } from "react";
import { useTableData, TableColumn, TableFilter as TableFilterType } from "../hooks/useTableData";
import TableFilter from "./TableFilter";
import TableFilterPopover from "./TableFilter";
import TableSort from "./TableSort";
import TablePagination from "./TablePagination";
import { supabase } from "../supabaseClient";
import { Filter, ArrowUpDown, Plus, Check, Search, X as XIcon, Download, Columns3, ArrowUp, ArrowDown, MoreVertical, Pin, EyeOff, RotateCcw, PinOff } from 'lucide-react';
import type { CSSProperties } from 'react';
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
import { AiFillFilePdf } from 'react-icons/ai';
import { BsFiletypePdf, BsFiletypeXls, BsFiletypeCsv } from 'react-icons/bs';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import GridOnIcon from '@mui/icons-material/GridOn';
import { BsFillPinFill } from 'react-icons/bs';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import ReactDOM from 'react-dom';

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
  telefonoLegal: 'telefono_responsable_legal',
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

interface UserTableProps {
  isFirstColumnPinned?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ isFirstColumnPinned = false }) => {
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
  // Estado para el menú contextual de columna
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnMenuKey, setColumnMenuKey] = useState<string | null>(null);
  // Estado para columnas fijadas a la izquierda
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([]);
  // Estado para columnas fijadas a la derecha
  const [pinnedColumnsRight, setPinnedColumnsRight] = useState<string[]>([]);
  // Estado para el panel de gestión de columnas fijadas
  const [pinPanelAnchorEl, setPinPanelAnchorEl] = useState<null | HTMLElement>(null);
  const pinPanelOpen = Boolean(pinPanelAnchorEl);
  // Estado para el lado seleccionado en el panel de pin
  const [pinSide, setPinSide] = useState<'left' | 'right'>('left');
  // Estado para forzar re-renderizado cuando cambien las columnas fijadas
  const [pinUpdateTrigger, setPinUpdateTrigger] = useState(0);
  
  // Estado adicional para forzar re-renderizado de offsets
  const [offsetUpdateTrigger, setOffsetUpdateTrigger] = useState(0);
  
  // Función para reordenar columnas según el estado de pinning (lógica MUI DataGrid)
  const getReorderedColumns = () => {
    // 1. Obtener columnas pinned left en orden de pinning (primera pinneada = más a la izquierda)
    const pinnedLeftCols = pinnedColumns.map(pinnedKey => 
      columnOrder.find((col: TableColumn) => col.key === pinnedKey)
    ).filter(Boolean) as TableColumn[];
    
    // 2. Obtener columnas pinned right en orden de pinning INVERSO (primera pinneada = más a la derecha)
    const pinnedRightCols = pinnedColumnsRight.map(pinnedKey => 
      columnOrder.find((col: TableColumn) => col.key === pinnedKey)
    ).filter(Boolean) as TableColumn[];
    
    // 3. Obtener columnas normales (no pinneadas)
    const normalCols = columnOrder.filter((col: TableColumn) => 
      visibleColumns.includes(col.key) && 
      !pinnedColumns.includes(col.key) && 
      !pinnedColumnsRight.includes(col.key)
    );
    
    // 4. Reordenar según la lógica de MUI: pinned left + normal + pinned right
    const reordered = [...pinnedLeftCols, ...normalCols, ...pinnedRightCols];
    
    // Debug: mostrar el ordenamiento
    console.log('Column reordering:', {
      pinnedLeftOrder: pinnedColumns,
      pinnedLeftCols: pinnedLeftCols.map((c: TableColumn) => c.key),
      normalCols: normalCols.map((c: TableColumn) => c.key),
      pinnedRightOrder: pinnedColumnsRight,
      pinnedRightCols: pinnedRightCols.map((c: TableColumn) => c.key),
      finalOrder: reordered.map((c: TableColumn) => c.key)
    });
    
    return reordered;
  };

  // useEffect para forzar aplicación de estilos sticky después del renderizado
  useEffect(() => {
    if (pinUpdateTrigger > 0) {
      // Usar requestAnimationFrame para asegurar que se ejecute después del renderizado
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const tableContainer = document.querySelector('.table-scroll-container') as HTMLElement;
          const tableElement = document.querySelector('table') as HTMLElement;
          
          if (tableContainer && tableElement) {
            // Forzar scroll más significativo para activar sticky
            const currentScroll = tableContainer.scrollLeft;
            const maxScroll = tableContainer.scrollWidth - tableContainer.clientWidth;
            
            if (maxScroll > 0) {
              // Hacer scroll significativo y regresar
              tableContainer.scrollLeft = Math.min(currentScroll + 200, maxScroll);
              setTimeout(() => {
                tableContainer.scrollLeft = currentScroll;
              }, 100);
            } else {
              // Si no hay scroll, forzar scroll mínimo
              tableContainer.scrollLeft = currentScroll + 1;
              tableContainer.scrollLeft = currentScroll;
            }
            
            // Forzar reflow
            tableElement.style.transform = 'translateZ(0)';
            setTimeout(() => {
              tableElement.style.transform = '';
            }, 10);
            
            // Forzar aplicación de estilos sticky en las celdas
            const stickyCells = tableElement.querySelectorAll('th[style*="position: sticky"], td[style*="position: sticky"]');
            stickyCells.forEach((cell: Element) => {
              const cellElement = cell as HTMLElement;
              // Forzar recálculo de estilos
              cellElement.style.position = 'static';
              cellElement.offsetHeight; // Forzar reflow
              cellElement.style.position = 'sticky';
            });
          }
        });
      });
    }
  }, [pinUpdateTrigger]);
  
  // useEffect para forzar aplicación de offsets cuando cambien las columnas fijadas
  useEffect(() => {
    if (offsetUpdateTrigger > 0) {
      setTimeout(() => {
        const tableContainer = document.querySelector('.table-scroll-container') as HTMLElement;
        if (tableContainer) {
          // Aplicar offsets directamente a las celdas sticky
          const stickyCells = tableContainer.querySelectorAll('th[data-col-key], td[data-col-key]');
          stickyCells.forEach((cell: Element) => {
            const cellElement = cell as HTMLElement;
            const colKey = cellElement.getAttribute('data-col-key');
            
            if (colKey && pinnedColumns.includes(colKey)) {
              const offset = getLeftOffset(colKey);
              cellElement.style.left = `${offset}px`;
              console.log(`Applied offset ${offset}px to column ${colKey} in useEffect`);
            }
          });
        }
      }, 50);
    }
  }, [offsetUpdateTrigger, pinnedColumns]);

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

  // Función para fijar columna a la izquierda
  const pinColumnLeft = (colKey: string) => {
    setPinnedColumns(prev => {
      // Si ya está fijada, la quitamos
      if (prev.includes(colKey)) {
        return prev.filter(key => key !== colKey);
      }
      // Si no está fijada, la añadimos al final (será la más a la izquierda visualmente)
      return [...prev, colKey];
    });
    
    // Forzar re-renderizado inmediato
    setPinUpdateTrigger(prev => prev + 1);
    setOffsetUpdateTrigger(prev => prev + 1);
    
    // Forzar aplicación inmediata de estilos sticky
    setTimeout(forceStickyUpdate, 0);
  };

  // Función para fijar columna a la derecha
  const pinColumnRight = (colKey: string) => {
    setPinnedColumnsRight(prev => {
      // Si ya está fijada, la quitamos
      if (prev.includes(colKey)) {
        return prev.filter(key => key !== colKey);
      }
      // Si no está fijada, la añadimos al INICIO del array (unshift)
      // Esto hace que la primera pinneada sea la más a la derecha (orden inverso)
      return [colKey, ...prev];
    });
    
    // Forzar re-renderizado inmediato
    setPinUpdateTrigger(prev => prev + 1);
    setOffsetUpdateTrigger(prev => prev + 1);
    
    // Forzar aplicación inmediata de estilos sticky
    setTimeout(forceStickyUpdate, 0);
  };
  
  // Función para desfijar columna
  const unpinColumn = (colKey: string) => {
    setPinnedColumns(prev => prev.filter(key => key !== colKey));
    setPinnedColumnsRight(prev => prev.filter(key => key !== colKey));
    
    // Forzar re-renderizado inmediato
    setPinUpdateTrigger(prev => prev + 1);
    setOffsetUpdateTrigger(prev => prev + 1);
    
    // Forzar aplicación inmediata de estilos sticky
    setTimeout(forceStickyUpdate, 0);
  };

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

  // Estado para resizer hover/drag
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [hoveredResizer, setHoveredResizer] = useState<string | null>(null);

  // Sistema de redimensionamiento mejorado basado en MUI
  const handleMouseDown = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    setResizingCol(colKey);
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 150;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(60, startWidth + moveEvent.clientX - startX);
      
      // Validar el redimensionamiento según el tipo de columna
      const validation = validateResize(colKey, newWidth);
      if (!validation.valid) {
        console.warn('Resize validation failed:', validation.reason);
        return;
      }
      
      // Aplicar el redimensionamiento con recálculo de layout
      handleColumnResize(colKey, newWidth, startWidth);
    };
    
    const onMouseUp = () => {
      setResizingCol(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      
      // Forzar actualización de offsets después del redimensionamiento
      setTimeout(() => {
        setOffsetUpdateTrigger(prev => prev + 1);
        forceStickyUpdate();
      }, 10);
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Validación de redimensionamiento
  const validateResize = (colKey: string, newWidth: number): { valid: boolean; reason?: string } => {
    // 1. Ancho mínimo
    if (newWidth < 60) {
      return { valid: false, reason: 'Below minimum width' };
    }
    
    // 2. Verificar que no se desborde el contenedor
    const container = document.querySelector('.table-scroll-container') as HTMLElement;
    if (container) {
      const containerWidth = container.clientWidth;
      const currentTotalWidth = Object.values(colWidths).reduce((sum, width) => sum + width, 0);
      const deltaWidth = newWidth - (colWidths[colKey] || 150);
      const newTotalWidth = currentTotalWidth + deltaWidth;
      
      // Para columnas pinned, verificar que quede espacio para normales
      const isLeftPinned = pinnedColumns.includes(colKey);
      const isRightPinned = pinnedColumnsRight.includes(colKey);
      
      if (isLeftPinned || isRightPinned) {
        const pinnedWidth = isLeftPinned ? 
          pinnedColumns.reduce((sum, key) => sum + (colWidths[key] || 150), 0) :
          pinnedColumnsRight.reduce((sum, key) => sum + (colWidths[key] || 150), 0);
        
        if (pinnedWidth + deltaWidth > containerWidth * 0.8) {
          return { valid: false, reason: 'Pinned columns would take too much space' };
        }
      }
    }
    
    return { valid: true };
  };

  // Manejo de redimensionamiento con recálculo de layout
  const handleColumnResize = (colKey: string, newWidth: number, oldWidth: number) => {
    const deltaWidth = newWidth - oldWidth;
    
    // 1. Actualizar el ancho de la columna
    setColWidths(prev => ({ ...prev, [colKey]: newWidth }));
    
    // 2. Recalcular layout según el tipo de columna
    const isLeftPinned = pinnedColumns.includes(colKey);
    const isRightPinned = pinnedColumnsRight.includes(colKey);
    
    if (isLeftPinned) {
      handleLeftPinnedResize(colKey, deltaWidth);
    } else if (isRightPinned) {
      handleRightPinnedResize(colKey, deltaWidth);
    } else {
      handleNormalColumnResize(colKey, deltaWidth);
    }
    
    // 3. Ajustar scroll si es necesario
    adjustScrollAfterResize(colKey, deltaWidth);
  };

  // Redimensionamiento de columnas left pinned
  const handleLeftPinnedResize = (colKey: string, deltaWidth: number) => {
    console.log(`Left pinned resize: ${colKey} by ${deltaWidth}px`);
    
    // Las columnas left pinned posteriores se desplazan automáticamente
    // porque getLeftOffset() las recalcula basándose en colWidths
    // Solo necesitamos forzar la actualización
    setPinUpdateTrigger(prev => prev + 1);
  };

  // Redimensionamiento de columnas right pinned
  const handleRightPinnedResize = (colKey: string, deltaWidth: number) => {
    console.log(`Right pinned resize: ${colKey} by ${deltaWidth}px`);
    
    // Las columnas right pinned mantienen su posición right
    // pero el área de scroll se reduce
    setPinUpdateTrigger(prev => prev + 1);
  };

  // Redimensionamiento de columnas normales
  const handleNormalColumnResize = (colKey: string, deltaWidth: number) => {
    console.log(`Normal column resize: ${colKey} by ${deltaWidth}px`);
    
    // Las columnas normales solo afectan el ancho total
    // No necesitan recálculo de posiciones
  };

  // Ajustar scroll después del redimensionamiento
  const adjustScrollAfterResize = (colKey: string, deltaWidth: number) => {
    const container = document.querySelector('.table-scroll-container') as HTMLElement;
    if (!container) return;
    
    const currentScrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    
    // Si el scroll actual excede el nuevo máximo, ajustarlo
    if (currentScrollLeft > maxScrollLeft) {
      container.scrollLeft = Math.max(0, maxScrollLeft);
    }
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
    console.log('handleSortOption ejecutado:', colKey, direction);
    console.log('sortRules antes:', sortRules);
    // Verificar si ya existe una regla para esta columna
    const existingRuleIndex = sortRules.findIndex(rule => rule.column === colKey);
    if (existingRuleIndex >= 0) {
      // Si ya existe, actualizar la dirección
      const newSortRules = [...sortRules];
      newSortRules[existingRuleIndex] = { column: colKey, direction };
      setSortRules(newSortRules);
      setTimeout(() => {
        console.log('sortRules después (update):', newSortRules);
      }, 0);
    } else {
      // Si no existe, agregar como nueva regla
      const newSortRules = [...sortRules, { column: colKey, direction }];
      setSortRules(newSortRules);
      setTimeout(() => {
        console.log('sortRules después (add):', newSortRules);
      }, 0);
    }
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

  // Handler para abrir/cerrar menú
  const handleOpenColumnMenu = (event: React.MouseEvent<HTMLElement>, colKey: string) => {
    setColumnMenuAnchor(event.currentTarget);
    setColumnMenuKey(colKey);
  };
  const handleCloseColumnMenu = () => {
    setColumnMenuAnchor(null);
    setColumnMenuKey(null);
  };

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuAnchor && !columnMenuAnchor.contains(event.target as Node)) {
        console.log('Click fuera del menú, cerrando...');
        handleCloseColumnMenu();
      }
    };

    if (columnMenuAnchor) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [columnMenuAnchor]);

  const handleOpenDownload = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleCloseDownload = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownloadPDF = () => {
    const exportColumns = columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key));
    const data = searchedData.map(row => exportColumns.map((col: TableColumn) => row[col.key]));
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
    const data = searchedData.map(row => {
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
    const data = searchedData.map(row => {
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
  
  // Función para forzar aplicación inmediata de estilos sticky
  const forceStickyUpdate = () => {
    const tableContainer = document.querySelector('.table-scroll-container') as HTMLElement;
    if (tableContainer) {
      // Forzar aplicación directa de estilos sticky y offsets
      const stickyCells = tableContainer.querySelectorAll('th[style*="position: sticky"], td[style*="position: sticky"]');
      stickyCells.forEach((cell: Element) => {
        const cellElement = cell as HTMLElement;
        const colKey = cellElement.getAttribute('data-col-key');
        
        if (colKey) {
          // Recalcular y aplicar offset inmediatamente
          const isPinnedLeft = pinnedColumns.includes(colKey);
          if (isPinnedLeft) {
            const offset = getLeftOffset(colKey);
            cellElement.style.left = `${offset}px`;
            console.log(`Applied offset ${offset}px to column ${colKey}`);
          }
        }
        
        // Forzar recálculo de estilos
        cellElement.style.position = 'static';
        cellElement.offsetHeight; // Forzar reflow
        cellElement.style.position = 'sticky';
      });
      
      // Forzar reflow del contenedor
      tableContainer.style.transform = 'translateZ(0)';
      setTimeout(() => {
        tableContainer.style.transform = '';
      }, 10);
    }
  };

  // Función para calcular el offset left de una columna fijada a la izquierda
  const getLeftOffset = (colKey: string) => {
    // Con el reordenamiento, las columnas pinned left están al inicio del array
    // Solo necesitamos calcular el offset basado en su posición en el grupo pinned left
    const pinnedLeftCols = getReorderedColumns().filter((col: TableColumn) => 
      pinnedColumns.includes(col.key)
    );
    
    const idx = pinnedLeftCols.findIndex((col: TableColumn) => col.key === colKey);
    if (idx === -1) return 0;
    
    // Calcular offset basado en la posición en el grupo pinned left
    let left = 0;
    for (let i = 0; i < idx; i++) {
      const key = pinnedLeftCols[i].key;
      const width = colWidths[key] || 150;
      left += width;
    }
    
    // Debug: mostrar el cálculo del offset
    console.log(`getLeftOffset for ${colKey}:`, {
      pinnedLeftCols: pinnedLeftCols.map(c => c.key),
      idx,
      left,
      colWidths: colWidths[colKey] || 150
    });
    
    return left;
  };
  // Calcula el offset right para columnas sticky a la derecha
  function getRightOffset(colKey: string) {
    // Las columnas pinned right se ordenan desde la derecha hacia la izquierda
    // La primera en el array es la más a la derecha
    const pinnedRightCols = pinnedColumnsRight.map(pinnedKey => 
      columnOrder.find((col: TableColumn) => col.key === pinnedKey)
    ).filter(Boolean) as TableColumn[];
    
    const idx = pinnedRightCols.findIndex((col: TableColumn) => col.key === colKey);
    if (idx === -1) return 0;
    
    // Calcular offset desde la derecha: sumar anchos de columnas a la derecha de esta
    let offset = 0;
    for (let i = idx + 1; i < pinnedRightCols.length; i++) {
      const key = pinnedRightCols[i].key;
      offset += colWidths[key] || 150;
    }
    
    console.log(`getRightOffset for ${colKey}:`, {
      pinnedRightCols: pinnedRightCols.map(c => c.key),
      idx,
      offset,
      colWidths: colWidths[colKey] || 150
    });
    
    return offset;
  }
  // Calcula el z-index para columnas sticky a la derecha: la más a la derecha tiene el mayor z-index
  function getPinnedRightZIndex(colKey: string) {
    const pinnedRightCols = pinnedColumnsRight.map(pinnedKey => 
      columnOrder.find((col: TableColumn) => col.key === pinnedKey)
    ).filter(Boolean) as TableColumn[];
    
    const idx = pinnedRightCols.findIndex((col: TableColumn) => col.key === colKey);
    if (idx === -1) return 1;
    
    // La primera en el array (más a la derecha) tiene el mayor z-index
    return 1000 + (pinnedRightCols.length - 1 - idx);
  }

  // Helper para sticky position
  const stickyPosition = 'sticky' as CSSProperties['position'];

  // Calcula el z-index para columnas sticky: la más a la izquierda tiene el mayor z-index
  function getPinnedZIndex(colKey: string) {
    // Con el reordenamiento, las columnas pinned left están al inicio del array
    const pinnedLeftCols = getReorderedColumns().filter((col: TableColumn) => 
      pinnedColumns.includes(col.key)
    );
    const idx = pinnedLeftCols.findIndex((col: TableColumn) => col.key === colKey);
    if (idx === -1) return 1; // No sticky
    
    // Debug: mostrar el orden de las columnas fijadas
    console.log('Pinned left columns order:', pinnedLeftCols.map(c => c.key));
    console.log(`Column ${colKey} has index ${idx}, z-index: ${1000 + idx}`);
    
    // La primera en el grupo pinned left tiene el mayor z-index
    return 1000 + idx; // 1000, 1001, 1002, ...
  }

  // EJEMPLO MÍNIMO DE TABLA STICKY PARA DEPURACIÓN

  const handleOpenPinPanel = (event: React.MouseEvent<HTMLElement>) => {
    setPinPanelAnchorEl(event.currentTarget);
  };
  const handleClosePinPanel = () => {
    setPinPanelAnchorEl(null);
  };

  const handleTogglePin = (colKey: string) => {
    if (pinnedColumns.includes(colKey)) {
      unpinColumn(colKey);
    } else {
      pinColumnLeft(colKey);
    }
  };
  const handleUnpinAll = () => {
    pinnedColumns.forEach(unpinColumn);
    handleClosePinPanel();
  };

  // Estado para scrollLeft
  const [scrollLeft, setScrollLeft] = useState(0);
  useEffect(() => {
    const container = document.querySelector('.table-scroll-container');
    if (!container) return;
    const onScroll = () => setScrollLeft(container.scrollLeft);
    container.addEventListener('scroll', onScroll);
    return () => { container.removeEventListener('scroll', onScroll); };
  }, []);

  // Medir anchos reales de columnas tras cada render
  useEffect(() => {
    const table = document.querySelector('.user-table');
    if (!table) return;
    const ths = table.querySelectorAll('th[data-col-key]');
    const newColWidths: { [key: string]: number } = {};
    ths.forEach((th: Element) => {
      const key = th.getAttribute('data-col-key');
      if (key) {
        newColWidths[key] = (th as HTMLElement).getBoundingClientRect().width;
      }
    });
    setColWidths(newColWidths);
  }, [columnOrder, pinnedColumns, pinnedColumnsRight, visibleColumns, pinUpdateTrigger, offsetUpdateTrigger, search, page]);

  // Inicializa colWidths con un valor fijo para cada columna al montar
  useEffect(() => {
    const initialColWidths: { [key: string]: number } = {};
    columnOrder.forEach((col: TableColumn) => {
      initialColWidths[col.key] = colWidths[col.key] || 150;
    });
    setColWidths(initialColWidths);
  }, [columnOrder, colWidths]);

  return (
    <>
      <div className="table-container">
        <div className="user-table-header table-controls">
          <div className="controls-left">
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
              PaperProps={{ style: { minWidth: 260, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb', padding: 16, maxWidth: 1000, maxHeight: 320, overflowY: 'auto' } }}
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
              open={pinPanelOpen}
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
                {columnOrder.filter((col: TableColumn) => visibleColumns.includes(col.key)).map((col: TableColumn) => {
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
                <button
                  onClick={() => {
                    pinnedColumns.forEach(unpinColumn);
                    setPinnedColumnsRight([]);
                    handleClosePinPanel();
                  }}
                  style={{
                    color: '#22c55e',
                    fontWeight: 500,
                    fontSize: 14,
                    textTransform: 'none',
                    background: 'none',
                    border: 'none',
                    boxShadow: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 6,
                    transition: 'color 0.15s',
                  }}
                >
                  <PinOff size={18} style={{ marginRight: 4 }} />
                  Desfijar todas
                </button>
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
        
        {/* ESTRUCTURA MIGRADA DESDE LA TABLA QUE FUNCIONA */}
        {/* IMPORTANTE: No poner z-index, position: relative ni transform en el contenedor de scroll ni en wrappers de la tabla para evitar stacking context que rompa el sticky. */}
        <div className="table-scroll-container" style={{ overflowX: 'auto', width: '100%', margin: '32px 0', border: '1px solid #e5e7eb', position: 'relative' }}>
          <table 
            className={`user-table${resizingCol ? ' resizing' : ''}`}
            key={`table-${pinUpdateTrigger}-${offsetUpdateTrigger}`}
            style={{ minWidth: 1800, width: 'max-content', borderCollapse: 'collapse' }}
          >
            <thead>
              <tr>
                {getReorderedColumns().map((col: TableColumn) => {
                  const isPinnedLeft = pinnedColumns.includes(col.key);
                  const isPinnedRight = pinnedColumnsRight.includes(col.key);
                  return (
                    <th key={col.key} 
                      data-col-key={col.key}
                      style={{
                        position: isPinnedLeft || isPinnedRight ? 'sticky' : 'static',
                        left: isPinnedLeft ? getLeftOffset(col.key) : undefined,
                        right: isPinnedRight ? getRightOffset(col.key) : undefined,
                        background: isPinnedLeft || isPinnedRight ? '#f0f6ff' : '#f8fafc',
                        zIndex: isPinnedLeft ? getPinnedZIndex(col.key) : isPinnedRight ? getPinnedRightZIndex(col.key) : 1,
                        border: '1px solid #e5e7eb',
                        padding: '6px 12px',
                        textAlign: 'left',
                        fontWeight: 500,
                        boxShadow: isPinnedLeft || isPinnedRight ? '2px 0 4px rgba(0,0,0,0.1)' : 'none',
                      }}
                    onMouseEnter={(e) => {
                      const trigger = e.currentTarget.querySelector('.header-menu-trigger') as HTMLElement;
                      if (trigger) trigger.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      const trigger = e.currentTarget.querySelector('.header-menu-trigger') as HTMLElement;
                      if (trigger) trigger.style.opacity = '0';
                    }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {col.label}
                          {(() => {
                            const sortRule = sortRules.find(r => r.column === col.key);
                            if (sortRule) {
                              return sortRule.direction === 'asc' ? 
                                <ArrowUp size={16} style={{ color: '#2563eb', marginLeft: 2 }} /> : 
                                <ArrowDown size={16} style={{ color: '#2563eb', marginLeft: 2 }} />;
                            }
                            return null;
                          })()}
                        </span>
                        <span
                          className="header-menu-trigger"
                          style={{
                            position: 'absolute',
                            right: 6,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            opacity: 0,
                            transition: 'opacity 0.15s',
                            zIndex: 3,
                          }}
                          onClick={e => handleOpenColumnMenu(e, col.key)}
                        >
                          <MoreVertical size={18} style={{ color: '#2563eb' }} />
                        </span>
                        {/* Badge de filtros aplicados */}
                        {filtersByColumn[col.key] > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: 6,
                            right: 4,
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
                        {/* Resizer para redimensionar columnas */}
                        <div
                          className={`col-resizer${resizingCol === col.key ? ' resizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, col.key)}
                          onMouseEnter={() => setHoveredResizer(col.key)}
                          onMouseLeave={() => setHoveredResizer(null)}
                        />
                        {/* Indicador visual del resizer */}
                        <div
                          className={`col-resizer-indicator${resizingCol === col.key ? ' resizing' : ''}`}
                          style={{
                            opacity: (hoveredResizer === col.key || resizingCol === col.key) ? 1 : 0
                          }}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {searchedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((row, index) => (
                <tr key={row.id || index} style={{ 
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {getReorderedColumns().map((col: TableColumn) => {
                    const isPinnedLeft = pinnedColumns.includes(col.key);
                    const isPinnedRight = pinnedColumnsRight.includes(col.key);
                    return (
                      <td key={col.key} 
                        data-col-key={col.key}
                        style={{
                          position: isPinnedLeft || isPinnedRight ? 'sticky' : 'static',
                          left: isPinnedLeft ? getLeftOffset(col.key) : undefined,
                          right: isPinnedRight ? getRightOffset(col.key) : undefined,
                          background: isPinnedLeft || isPinnedRight ? '#f0f6ff' : '#fff',
                          zIndex: isPinnedLeft ? getPinnedZIndex(col.key) : isPinnedRight ? getPinnedRightZIndex(col.key) : 1,
                          border: '1px solid #e5e7eb',
                          padding: '6px 12px',
                          boxShadow: isPinnedLeft || isPinnedRight ? '2px 0 4px rgba(0,0,0,0.1)' : 'none',
                        }}>
                        {row[col.key] || (col.key === 'name' ? row.name || 'Sin nombre' : '-')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Menú contextual para columnas */}
        {columnMenuAnchor && columnMenuKey && ReactDOM.createPortal(
          (() => {
            const rect = columnMenuAnchor.getBoundingClientRect();
            const column = columnOrder.find((col: TableColumn) => col.key === columnMenuKey);
            
            return (
              <div
                style={{
                  position: 'absolute',
                  top: rect.bottom + 4 + window.scrollY,
                  left: rect.left + window.scrollX,
                  minWidth: 170,
                  background: '#fff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  zIndex: 10000,
                  fontSize: 14,
                  padding: 4,
                }}
                tabIndex={-1}
                onBlur={handleCloseColumnMenu}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {/* Opciones de ordenamiento */}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSortOption(columnMenuKey, 'asc');
                    handleCloseColumnMenu();
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <ArrowUp size={16} /> Ordenar ascendente
                </div>
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSortOption(columnMenuKey, 'desc');
                    handleCloseColumnMenu();
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <ArrowDown size={16} /> Ordenar descendente
                </div>
                
                <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                
                {/* Opciones de fijación */}
                {(
                  <>
                    {!pinnedColumns.includes(columnMenuKey) && !pinnedColumnsRight.includes(columnMenuKey) && (
                      <div 
                        className="column-menu-item" 
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          pinColumnLeft(columnMenuKey);
                          handleCloseColumnMenu();
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Pin size={16} /> Fijar a la izquierda
                      </div>
                    )}
                    {pinnedColumns.includes(columnMenuKey) && (
                      <div 
                        className="column-menu-item" 
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          unpinColumn(columnMenuKey);
                          handleCloseColumnMenu();
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <PinOff size={16} /> Desfijar
                      </div>
                    )}
                    {!pinnedColumnsRight.includes(columnMenuKey) && !pinnedColumns.includes(columnMenuKey) && (
                      <div 
                        className="column-menu-item" 
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          pinColumnRight(columnMenuKey);
                          handleCloseColumnMenu();
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Pin size={16} style={{ transform: 'scaleX(-1)' }} /> Fijar a la derecha
                      </div>
                    )}
                    {pinnedColumnsRight.includes(columnMenuKey) && (
                      <div 
                        className="column-menu-item" 
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          unpinColumn(columnMenuKey);
                          handleCloseColumnMenu();
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <PinOff size={16} /> Desfijar
                      </div>
                    )}
                    <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                  </>
                )}
                
                {/* Opción de ocultar columna */}
                <div 
                  className="column-menu-item column-menu-hide" 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', borderRadius: 5, color: '#555', fontWeight: 400 }} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleColumn(columnMenuKey);
                    handleCloseColumnMenu();
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <EyeOff size={16} /> Ocultar columna
                </div>
              </div>
            );
          })(),
          document.body
        )}
        
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
    </>
  );
};

export default UserTable; 