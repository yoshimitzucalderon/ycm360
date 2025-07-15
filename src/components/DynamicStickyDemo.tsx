import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pin, PinOff, AlertTriangle, GripVertical } from 'lucide-react';
import { supabase } from "../supabaseClient";

interface Column {
  key: string;
  label: string;
  isPinnedLeft: boolean;
  isPinnedRight: boolean;
  width: number;
  minWidth: number;
  maxWidth: number;
}

const initialColumns = [
  { key: "a", label: "A" },
  { key: "b", label: "B" },
  { key: "c", label: "C" },
  { key: "d", label: "Dato 1" },
  { key: "e", label: "Dato 2" },
  { key: "f", label: "X" },
  { key: "g", label: "Y" },
];

const data = [
  ["A", "B", "C", "Dato 1", "Dato 2", "X", "Y"],
  ["D", "E", "F", "Dato 3", "Dato 4", "W", "Z"],
  ["G", "H", "I", "Dato 5", "Dato 6", "M", "N"],
];

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
  const totalRows = data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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

  // Layout de columnas (igual que abajo)
  const tableLayout: TableLayout = useMemo(() => {
    const leftPinned = columns.filter((c) => c.isPinnedLeft);
    const rightPinned = columns.filter((c) => c.isPinnedRight);
    const normal = columns.filter((c) => !c.isPinnedLeft && !c.isPinnedRight);
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
  }, [columns, containerWidth]);

  // Pinning
  const canPinLeft = (colKey: string): boolean => {
    const col = columns.find((c) => c.key === colKey);
    if (!col || col.isPinnedLeft) return true;
    const testCols = columns.map((c) => c.key === colKey ? { ...c, isPinnedLeft: true, isPinnedRight: false } : c);
    const testLeft = testCols.filter((c) => c.isPinnedLeft).reduce((sum, c) => sum + c.width, 0);
    const testRight = tableLayout.rightTotalWidth;
    return testLeft + testRight + 100 <= containerWidth;
  };
  const canPinRight = (colKey: string): boolean => {
    const col = columns.find((c) => c.key === colKey);
    if (!col || col.isPinnedRight) return true;
    const testCols = columns.map((c) => c.key === colKey ? { ...c, isPinnedRight: true, isPinnedLeft: false } : c);
    const testRight = testCols.filter((c) => c.isPinnedRight).reduce((sum, c) => sum + c.width, 0);
    const testLeft = tableLayout.leftTotalWidth;
    return testLeft + testRight + 100 <= containerWidth;
  };
  const pinLeft = (key: string) => {
    setColumns((cols) => cols.map((c) => c.key === key ? { ...c, isPinnedLeft: !c.isPinnedLeft, isPinnedRight: false } : c));
  };
  const pinRight = (key: string) => {
    setColumns((cols) => cols.map((c) => c.key === key ? { ...c, isPinnedRight: !c.isPinnedRight, isPinnedLeft: false } : c));
  };
  const clearAllPins = () => {
    setColumns((cols) => cols.map((c) => ({ ...c, isPinnedLeft: false, isPinnedRight: false })));
  };

  // Resize
  const handleResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const col = columns.find((c) => c.key === colKey);
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

  // Render
  return (
    <div style={{ margin: "32px 0 32px 0" }}>
      <h3 style={{ fontWeight: 500, color: "#111827", marginBottom: 8 }}>Proveedores (Supabase)</h3>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 1200,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff",
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
            height: maxTableHeight ? maxTableHeight : undefined,
          }}
        >
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed", minWidth: 900, height: "100%" }}>
            <thead>
              <tr>
                {tableLayout.orderedColumns.map((col: ProveedorColumn) => {
                  const position = tableLayout.positions[col.key as string];
                  let style = {
                    minWidth: col.width,
                    width: col.width,
                    position: 'relative',
                  };
                  let pinIcon = null;
                  if (col.isPinnedLeft && position?.left !== undefined) {
                    // @ts-ignore
                    style = {
                      position: "sticky",
                      // @ts-ignore
                      left: position.left,
                      // @ts-ignore
                      top: 0,
                      background: "#f8fafc",
                      zIndex: 300,
                      minWidth: col.width,
                      width: col.width,
                      boxShadow: "2px 0 4px -1px rgba(0,0,0,0.1)",
                      borderRight: "2px solid #3b82f6"
                    };
                    pinIcon = (
                      <PinOff size={14} style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => pinLeft(col.key)} />
                    );
                  } else if (col.isPinnedRight && position?.right !== undefined) {
                    // @ts-ignore
                    style = {
                      position: "sticky",
                      // @ts-ignore
                      right: position.right,
                      // @ts-ignore
                      top: 0,
                      background: "#faf5ff",
                      zIndex: 300,
                      minWidth: col.width,
                      width: col.width,
                      boxShadow: "-2px 0 4px -1px rgba(0,0,0,0.1)",
                      borderLeft: "2px solid #8b5cf6"
                    };
                    pinIcon = (
                      <PinOff size={14} style={{ color: "#7c3aed", cursor: "pointer" }} onClick={() => pinRight(col.key)} />
                    );
                  } else {
                    // @ts-ignore
                    style = {
                      ...style,
                      position: "sticky",
                      // @ts-ignore
                      top: 0,
                      background: "#fff",
                      zIndex: 200,
                    };
                    const canLeft = canPinLeft(col.key);
                    const canRight = canPinRight(col.key);
                    pinIcon = (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Pin size={12} style={{ color: canLeft ? "#3b82f6" : "#d1d5db", cursor: canLeft ? "pointer" : "not-allowed", marginRight: 4 }} onClick={() => canLeft && pinLeft(col.key)} />
                        <Pin size={12} style={{ color: canRight ? "#7c3aed" : "#d1d5db", cursor: canRight ? "pointer" : "not-allowed", transform: 'scaleX(-1)' }} onClick={() => canRight && pinRight(col.key)} />
                      </div>
                    );
                  }
                  // @ts-ignore
                  return (
                     // @ts-ignore
                    <th key={col.key} style={style}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                          {pinIcon}
                          <button style={{ padding: 4, cursor: "col-resize", borderRadius: 4, border: "none", backgroundColor: "transparent" }} onMouseDown={(e) => handleResizeStart(col.key, e)}>
                            <GripVertical size={12} style={{ color: "#6b7280" }} />
                          </button>
                        </div>
                      </div>
                      <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: "100%", cursor: "col-resize", backgroundColor: "transparent", zIndex: 1000 }} onMouseDown={(e) => handleResizeStart(col.key, e)} />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody
              style={{ minHeight: maxTableHeight ? maxTableHeight - 48 : undefined }}
            >
              {loading && (
                <tr><td colSpan={columns.length} style={{ textAlign: "center", padding: 24 }}>Cargando...</td></tr>
              )}
              {error && (
                <tr><td colSpan={columns.length} style={{ textAlign: "center", color: "#dc2626", padding: 24 }}>{error}</td></tr>
              )}
              {!loading && !error && paginatedData.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  {tableLayout.orderedColumns.map((col: ProveedorColumn) => {
                    const position = tableLayout.positions[col.key as string];
                    let style: React.CSSProperties = {
                      minWidth: col.width,
                      width: col.width,
                      position: col.isPinnedLeft || col.isPinnedRight ? 'sticky' : 'relative',
                      ...(col.isPinnedLeft && position?.left !== undefined ? { left: position.left } : {}),
                      ...(col.isPinnedRight && position?.right !== undefined ? { right: position.right } : {}),
                      background: col.isPinnedLeft ? '#f8fafc' : col.isPinnedRight ? '#faf5ff' : undefined,
                      zIndex: (col.isPinnedLeft || col.isPinnedRight) && position ? position.zIndex : undefined,
                      boxShadow: col.isPinnedLeft ? '2px 0 4px -1px rgba(0,0,0,0.1)' : col.isPinnedRight ? '-2px 0 4px -1px rgba(0,0,0,0.1)' : undefined,
                      borderRight: col.isPinnedLeft ? '2px solid #3b82f6' : undefined,
                      borderLeft: col.isPinnedRight ? '2px solid #8b5cf6' : undefined,
                    };
                    // @ts-ignore
                    return (
                      <td key={col.key} style={style}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row[col.key]}</div>
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
      <div style={{ fontSize: 12, color: "#6b7280", backgroundColor: "#f9fafb", padding: 12, borderRadius: 4, marginTop: 16 }}>
        <div style={{ fontWeight: 500, color: "#374151", marginBottom: 8 }}>Funcionalidades:</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          📏 <strong>Redimensionar</strong>: Usa el botón <GripVertical size={12} style={{ color: "#6b7280", margin: "0 4px" }} /> o arrastra el borde derecho de cada columna (100px - 300px)
        </div>
        <div style={{ marginBottom: 4 }}>📌 <strong>Fijar columnas</strong>: Usa los iconos de pin para fijar a izquierda/derecha</div>
      </div>
    </div>
  );
}

export default function DynamicStickyDemo() {
  const [columns, setColumns] = useState<Column[]>(
    initialColumns.map((col, i) => ({ 
      ...col, 
      isPinnedLeft: false, 
      isPinnedRight: false, 
      width: 120, 
      minWidth: 80,
      maxWidth: 300
    }))
  );
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(700);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{x: number, width: number} | null>(null);
  const [autoResolveMessage, setAutoResolveMessage] = useState<string | null>(null);

  // Observar cambios en el tamaño del contenedor
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setContainerWidth(width);
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // CALCULAR TODO DE UNA VEZ - MEMOIZADO
  const exampleTableLayout = useMemo(() => {
    console.log('🔄 Recalculando layout completo...');
    
    // Separar columnas por tipo manteniendo orden original
    const leftPinned = columns
      .filter(c => c.isPinnedLeft)
      .sort((a, b) => initialColumns.findIndex(ic => ic.key === a.key) - initialColumns.findIndex(ic => ic.key === b.key));
    
    const rightPinned = columns
      .filter(c => c.isPinnedRight)
      .sort((a, b) => initialColumns.findIndex(ic => ic.key === a.key) - initialColumns.findIndex(ic => ic.key === b.key));
    
    const normal = columns
      .filter(c => !c.isPinnedLeft && !c.isPinnedRight)
      .sort((a, b) => initialColumns.findIndex(ic => ic.key === a.key) - initialColumns.findIndex(ic => ic.key === b.key));

    // Orden final de columnas
    const orderedColumns = [...leftPinned, ...normal, ...rightPinned];

    // Calcular posiciones FIJAS
    const positions: Record<string, {left?: number, right?: number, zIndex: number}> = {};
    
    // Posiciones izquierda (acumulativas de izquierda a derecha)
    let currentLeftOffset = 0;
    leftPinned.forEach((col, index) => {
      positions[col.key] = {
        left: currentLeftOffset,
        zIndex: 100 + leftPinned.length - index
      };
      currentLeftOffset += col.width;
    });

    // Posiciones derecha (acumulativas de derecha a izquierda)
    let currentRightOffset = 0;
    [...rightPinned].reverse().forEach((col, index) => {
      const originalIndex = rightPinned.length - 1 - index;
      positions[col.key] = {
        right: currentRightOffset,
        zIndex: 100 + rightPinned.length - originalIndex
      };
      currentRightOffset += col.width;
    });

    // Métricas
    const leftTotalWidth = leftPinned.reduce((sum, col) => sum + col.width, 0);
    const rightTotalWidth = rightPinned.reduce((sum, col) => sum + col.width, 0);
    const normalTotalWidth = normal.reduce((sum, col) => sum + col.width, 0);

    const result = {
      orderedColumns,
      leftPinned,
      rightPinned,
      normal,
      positions,
      leftTotalWidth,
      rightTotalWidth,
      normalTotalWidth,
      hasOverlap: leftTotalWidth + rightTotalWidth + 100 > containerWidth,
      actualOverlap: leftTotalWidth + rightTotalWidth > containerWidth
    };

    console.log('📊 Layout calculado:', {
      leftPinned: leftPinned.map(c => `${c.key}:${c.width}px`),
      rightPinned: rightPinned.map(c => `${c.key}:${c.width}px`),
      positions: Object.entries(positions).map(([key, pos]) => 
        `${key}@${pos.left !== undefined ? `L${pos.left}` : `R${pos.right}`}px`
      ),
      leftTotal: leftTotalWidth,
      rightTotal: rightTotalWidth
    });

    return result;
  }, [columns, containerWidth]);

  // Validación para pin
  const canPinLeft = (colKey: string): boolean => {
    const col = columns.find(c => c.key === colKey);
    if (!col || col.isPinnedLeft) return true;
    
    const testCols = columns.map(c => 
      c.key === colKey ? { ...c, isPinnedLeft: true, isPinnedRight: false } : c
    );
    
    const testLeftPin = testCols.filter(c => c.isPinnedLeft).reduce((sum, c) => sum + c.width, 0);
    const testRightPin = exampleTableLayout.rightTotalWidth;
    
    return testLeftPin + testRightPin + 100 <= containerWidth;
  };

  const canPinRight = (colKey: string): boolean => {
    const col = columns.find(c => c.key === colKey);
    if (!col || col.isPinnedRight) return true;
    
    const testCols = columns.map(c => 
      c.key === colKey ? { ...c, isPinnedRight: true, isPinnedLeft: false } : c
    );
    
    const testRightPin = testCols.filter(c => c.isPinnedRight).reduce((sum, c) => sum + c.width, 0);
    const testLeftPin = exampleTableLayout.leftTotalWidth;
    
    return testLeftPin + testRightPin + 100 <= containerWidth;
  };

  const pinLeft = (key: string) => {
    const col = columns.find(c => c.key === key);
    if (!col) return;
    
    if (col.isPinnedLeft) {
      setColumns(cols => cols.map(c => 
        c.key === key ? { ...c, isPinnedLeft: false } : c
      ));
    } else if (canPinLeft(key)) {
      setColumns(cols => cols.map(c => 
        c.key === key ? { ...c, isPinnedLeft: true, isPinnedRight: false } : c
      ));
    } else {
      alert(`❌ No se puede fijar "${col.label}" a la izquierda - causaría superposición.`);
    }
  };

  const pinRight = (key: string) => {
    const col = columns.find(c => c.key === key);
    if (!col) return;
    
    if (col.isPinnedRight) {
      setColumns(cols => cols.map(c => 
        c.key === key ? { ...c, isPinnedRight: false } : c
      ));
    } else if (canPinRight(key)) {
      setColumns(cols => cols.map(c => 
        c.key === key ? { ...c, isPinnedRight: true, isPinnedLeft: false } : c
      ));
    } else {
      alert(`❌ No se puede fijar "${col.label}" a la derecha - causaría superposición.`);
    }
  };

  const clearAllPins = () => {
    setColumns(cols => cols.map(c => ({ ...c, isPinnedLeft: false, isPinnedRight: false })));
  };

  // Auto-resolver superposición crítica
  useEffect(() => {
    if (exampleTableLayout.actualOverlap && !isResizing) {
      console.log('🚨 Resolviendo superposición automáticamente...');
      
      let resolveMessage = '';
      setColumns(prevCols => {
        const newCols = [...prevCols];
        
        // Liberar la columna más grande fijada
        const allPinned = [...exampleTableLayout.leftPinned, ...exampleTableLayout.rightPinned]
          .sort((a, b) => b.width - a.width);
        
        if (allPinned.length > 0) {
          const toRelease = allPinned[0];
          const colIndex = newCols.findIndex(c => c.key === toRelease.key);
          newCols[colIndex] = { ...newCols[colIndex], isPinnedLeft: false, isPinnedRight: false };
          resolveMessage = `Se liberó automáticamente "${toRelease.label}" para evitar superposición`;
        }
        
        if (resolveMessage) {
          setAutoResolveMessage(resolveMessage);
          setTimeout(() => setAutoResolveMessage(null), 3000);
        }
        
        return newCols;
      });
    }
  }, [exampleTableLayout.actualOverlap, isResizing]);

  // Manejadores de redimensionamiento
  const handleResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const col = columns.find(c => c.key === colKey);
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
    const newWidth = Math.max(80, Math.min(300, resizeStart.width + deltaX));
    
    setColumns(cols => cols.map(c => 
      c.key === isResizing ? { ...c, width: newWidth } : c
    ));
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

  return (
    <>
      <StickyProveedorTable />
      {/* Panel de información */}
      <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h3 style={{ fontWeight: "500", color: "#111827" }}>Columnas Redimensionables con Control de Superposición</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(exampleTableLayout.hasOverlap || exampleTableLayout.actualOverlap) && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626" }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  {exampleTableLayout.actualOverlap ? 'Superposición crítica' : 'Espacio limitado'}
                </span>
              </div>
            )}
            <button 
              onClick={clearAllPins}
              style={{ 
                fontSize: "12px", 
                backgroundColor: "#dbeafe", 
                padding: "4px 12px", 
                borderRadius: "4px", 
                border: "none",
                cursor: "pointer"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#bfdbfe"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dbeafe"}
            >
              Liberar todas
            </button>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", fontSize: "14px" }}>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Contenedor</div>
            <div style={{ color: "#6b7280" }}>{containerWidth}px</div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Fijadas izq.</div>
            <div style={{ color: "#2563eb" }}>{exampleTableLayout.leftTotalWidth}px ({exampleTableLayout.leftPinned.length})</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              {exampleTableLayout.leftPinned.map(c => `${c.label}:${c.width}`).join(', ') || 'Ninguna'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Fijadas der.</div>
            <div style={{ color: "#7c3aed" }}>{exampleTableLayout.rightTotalWidth}px ({exampleTableLayout.rightPinned.length})</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              {exampleTableLayout.rightPinned.map(c => `${c.label}:${c.width}`).join(', ') || 'Ninguna'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Normales</div>
            <div style={{ color: "#6b7280" }}>{exampleTableLayout.normalTotalWidth}px ({exampleTableLayout.normal.length})</div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Espacio libre</div>
            <div style={{ 
              color: containerWidth - exampleTableLayout.leftTotalWidth - exampleTableLayout.rightTotalWidth < 100 ? "#dc2626" : "#059669",
              fontWeight: containerWidth - exampleTableLayout.leftTotalWidth - exampleTableLayout.rightTotalWidth < 100 ? "500" : "normal"
            }}>
              {Math.max(0, containerWidth - exampleTableLayout.leftTotalWidth - exampleTableLayout.rightTotalWidth)}px
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Usado: {exampleTableLayout.leftTotalWidth + exampleTableLayout.rightTotalWidth}px
            </div>
          </div>
        </div>
        
        {autoResolveMessage && (
          <div style={{ 
            marginTop: "12px", 
            padding: "8px", 
            backgroundColor: "#f0fdf4", 
            border: "1px solid #22c55e", 
            borderRadius: "4px", 
            fontSize: "14px", 
            color: "#166534" 
          }}>
            ✅ {autoResolveMessage}
          </div>
        )}
        
        {isResizing && (
          <div style={{ 
            marginTop: "12px", 
            padding: "8px", 
            backgroundColor: "#eff6ff", 
            border: "1px solid #3b82f6", 
            borderRadius: "4px", 
            fontSize: "14px", 
            color: "#1e40af" 
          }}>
            🔄 Redimensionando columna... Arrastra para ajustar el ancho
          </div>
        )}
        
        {exampleTableLayout.hasOverlap && !isResizing && !autoResolveMessage && (
          <div style={{ 
            marginTop: "12px", 
            padding: "8px", 
            backgroundColor: "#fef3c7", 
            border: "1px solid #f59e0b", 
            borderRadius: "4px", 
            fontSize: "14px", 
            color: "#92400e" 
          }}>
            ⚠️ Espacio insuficiente. El redimensionamiento y pinning pueden estar limitados para prevenir superposición.
          </div>
        )}
      </div>

      {/* Debug simplificado */}
      <div style={{ backgroundColor: "#eff6ff", border: "1px solid #3b82f6", borderRadius: "4px", padding: "12px", fontSize: "12px", marginBottom: "16px" }}>
        <div style={{ fontWeight: "500", marginBottom: "4px" }}>🔍 Debug - Layout calculado:</div>
        <div><strong>Orden:</strong> {exampleTableLayout.orderedColumns.map(c => `${c.key}(${c.isPinnedLeft ? 'L' : c.isPinnedRight ? 'R' : 'N'})`).join(' → ')}</div>
        <div><strong>Posiciones:</strong> {Object.entries(exampleTableLayout.positions).map(([key, pos]) => 
          `${key}@${pos.left !== undefined ? `L${pos.left}` : `R${pos.right}`}px`
        ).join(', ')}</div>
      </div>

      {/* Tabla */}
      <div 
        ref={containerRef}
        style={{ 
          border: `2px solid ${exampleTableLayout.actualOverlap ? '#ef4444' : exampleTableLayout.hasOverlap ? '#f59e0b' : '#e5e7eb'}`, 
          borderRadius: "8px", 
          overflow: "hidden",
          width: 700, 
          overflowX: "auto" 
        }}
      >
        <table 
          style={{ 
            borderCollapse: "separate", 
            borderSpacing: 0, 
            width: "100%", 
            minWidth: Math.max(800, exampleTableLayout.leftTotalWidth + exampleTableLayout.rightTotalWidth + 300),
            tableLayout: "fixed" 
          }}
        >
          <thead>
            <tr>
              {exampleTableLayout.orderedColumns.map((col: any) => {
                const position = exampleTableLayout.positions[col.key];
                let style: any = {
                  minWidth: col.width,
                  width: col.width,
                  position: 'relative',
                };
                if (col.isPinnedLeft && position?.left !== undefined) {
                  // @ts-ignore
                  style = {
                    position: "sticky",
                    // @ts-ignore
                    left: position.left,
                    background: exampleTableLayout.actualOverlap ? "#fee2e2" : "#f8fafc",
                    zIndex: position.zIndex,
                    minWidth: col.width,
                    width: col.width,
                    boxShadow: "2px 0 4px -1px rgba(0,0,0,0.1)",
                    borderRight: "2px solid #3b82f6"
                  };
                } else if (col.isPinnedRight && position?.right !== undefined) {
                  // @ts-ignore
                  style = {
                    position: "sticky",                  
                    // @ts-ignore
                    right: position.right,
                    background: exampleTableLayout.actualOverlap ? "#fee2e2" : "#faf5ff",
                    zIndex: position.zIndex,
                    minWidth: col.width,
                    width: col.width,
                    boxShadow: "-2px 0 4px -1px rgba(0,0,0,0.1)",
                    borderLeft: "2px solid #8b5cf6"
                  };
                }
                let pinIcon = null;
                
                if (col.isPinnedLeft && position?.left !== undefined) {
                  pinIcon = (
                    <PinOff 
                      size={14} 
                      style={{ color: "#2563eb", cursor: "pointer" }}
                      onClick={() => pinLeft(col.key)}
                    />
                  );
                } else if (col.isPinnedRight && position?.right !== undefined) {
                  pinIcon = (
                    <PinOff 
                      size={14} 
                      style={{ color: "#7c3aed", cursor: "pointer" }}
                      onClick={() => pinRight(col.key)}
                    />
                  );
                } else {
                  const canLeft = canPinLeft(col.key);
                  const canRight = canPinRight(col.key);
                  
                  pinIcon = (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Pin 
                        size={12} 
                        style={{ 
                          color: canLeft ? "#3b82f6" : "#d1d5db", 
                          cursor: canLeft ? "pointer" : "not-allowed",
                          marginRight: "4px"
                        }}
                        onClick={() => canLeft && pinLeft(col.key)} 
                      />
                      <Pin 
                        size={12} 
                        style={{ 
                          color: canRight ? "#7c3aed" : "#d1d5db", 
                          cursor: canRight ? "pointer" : "not-allowed",
                          transform: 'scaleX(-1)'
                        }}
                        onClick={() => canRight && pinRight(col.key)} 
                      />
                    </div>
                  );
                }
                
                return (
                  <th key={col.key} style={style} className="px-2 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1", minWidth: 0 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.label}</span>
                        <span style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>({col.width}px)</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}>
                        {pinIcon}
                        <button
                          style={{ 
                            padding: "4px", 
                            cursor: "col-resize",
                            borderRadius: "4px",
                            border: "none",
                            backgroundColor: "transparent"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e5e7eb"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          onMouseDown={(e) => handleResizeStart(col.key, e)}
                        >
                          <GripVertical size={12} style={{ color: "#6b7280" }} />
                        </button>
                      </div>
                    </div>
                    
                    <div 
                      style={{ 
                        position: "absolute", 
                        top: 0, 
                        right: 0, 
                        width: "8px", 
                        height: "100%", 
                        cursor: "col-resize", 
                        backgroundColor: "transparent",
                        zIndex: 1000
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#bfdbfe"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      onMouseDown={(e) => handleResizeStart(col.key, e)}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: "white" }}>
            {data.map((row, i) => (
              <tr key={i} style={{ backgroundColor: "white" }}>
                {exampleTableLayout.orderedColumns.map((col: any) => {
                  const position = exampleTableLayout.positions[col.key];
                  let style: any = {
                    minWidth: col.width,
                    width: col.width,
                    position: col.isPinnedLeft || col.isPinnedRight ? 'sticky' : 'relative',
                  };
                  if (col.isPinnedLeft && position?.left !== undefined) {
                    // @ts-ignore
                    style = {
                      position: "sticky",
                      // @ts-ignore
                      left: position.left,
                      background: "#f8fafc",
                      zIndex: position.zIndex,
                      minWidth: col.width,
                      width: col.width,
                      boxShadow: "2px 0 4px -1px rgba(0,0,0,0.1)",
                      borderRight: "2px solid #3b82f6"
                    };
                  } else if (col.isPinnedRight && position?.right !== undefined) {
                    // @ts-ignore
                    style = {
                      position: "sticky",
                      // @ts-ignore
                      right: position.right,
                      background: "#faf5ff",
                      zIndex: position.zIndex,
                      minWidth: col.width,
                      width: col.width,
                      boxShadow: "-2px 0 4px -1px rgba(0,0,0,0.1)",
                      borderLeft: "2px solid #8b5cf6"
                    };
                  }
                  // @ts-ignore
                  return (
                    <td key={col.key} style={style} className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100">
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row[col.key]}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div style={{ fontSize: "12px", color: "#6b7280", backgroundColor: "#f9fafb", padding: "12px", borderRadius: "4px", marginTop: "16px" }}>
        <div style={{ fontWeight: "500", color: "#374151", marginBottom: "8px" }}>Funcionalidades:</div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
          📏 <strong>Redimensionar</strong>: Usa el botón <GripVertical size={12} style={{ color: "#6b7280", margin: "0 4px" }} /> o arrastra el borde derecho de cada columna (80px - 300px)
        </div>
        <div style={{ marginBottom: "4px" }}>📌 <strong>Fijar columnas</strong>: Usa los iconos de pin para fijar a izquierda/derecha</div>
        <div style={{ marginBottom: "4px" }}>🛡️ <strong>Prevención automática</strong>: No permite acciones que causen superposición</div>
        <div style={{ marginBottom: "4px" }}>🔄 <strong>Auto-resolución</strong>: Libera automáticamente columnas si hay superposición crítica</div>
        <div style={{ marginBottom: "4px" }}>🎯 <strong>Layout calculado</strong>: Todas las posiciones se calculan una vez por render</div>
        <div style={{ color: "#2563eb", fontWeight: "500", marginTop: "8px", padding: "8px", backgroundColor: "#eff6ff", borderRadius: "4px" }}>
          💡 <strong>Nuevo enfoque</strong>: Layout completamente pre-calculado para máxima consistencia
        </div>
      </div>
    </>
  );
} 