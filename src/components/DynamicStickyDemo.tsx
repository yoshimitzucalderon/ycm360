import React, { useState, useEffect, useRef } from "react";
import { Pin, PinOff, AlertTriangle } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  isPinnedLeft: boolean;
  isPinnedRight: boolean;
  width: number;
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
const colWidths = [120, 120, 120, 120, 120, 120, 120];
const data = [
  ["A", "B", "C", "Dato 1", "Dato 2", "X", "Y"],
  ["D", "E", "F", "Dato 3", "Dato 4", "W", "Z"],
  ["G", "H", "I", "Dato 5", "Dato 6", "M", "N"],
];

export default function DynamicStickyDemo() {
  const [columns, setColumns] = useState<Column[]>(
    initialColumns.map((col, i) => ({ ...col, isPinnedLeft: false, isPinnedRight: false, width: colWidths[i] }))
  );
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [containerWidth, setContainerWidth] = useState(700);
  const [tableWidth, setTableWidth] = useState(1000);

  // Observar cambios en el tamaño del contenedor y tabla
  useEffect(() => {
    if (!containerRef.current || !tableRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === containerRef.current) {
          setContainerWidth(entry.contentRect.width);
        } else if (entry.target === tableRef.current) {
          setTableWidth(entry.contentRect.width);
        }
      });
    });
    
    resizeObserver.observe(containerRef.current);
    resizeObserver.observe(tableRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Reordenar columnas
  const leftPinned = columns.filter(c => c.isPinnedLeft);
  const rightPinned = columns.filter(c => c.isPinnedRight);
  const normal = columns.filter(c => !c.isPinnedLeft && !c.isPinnedRight);
  const ordered = [...leftPinned, ...normal, ...rightPinned];
  
  // Calcular anchos totales
  const leftTotalWidth = leftPinned.reduce((sum, col) => sum + col.width, 0);
  const rightTotalWidth = rightPinned.reduce((sum, col) => sum + col.width, 0);
  const normalTotalWidth = normal.reduce((sum, col) => sum + col.width, 0);
  
  // DETECCIÓN DE SUPERPOSICIÓN MÁS PRECISA
  const minVisibleNormalWidth = 100; // Mínimo ancho visible para columnas normales
  const hasOverlap = leftTotalWidth + rightTotalWidth + minVisibleNormalWidth > containerWidth;
  
  // Calcular si existe superposición real (cuando las columnas fijadas se tocan)
  const actualOverlap = leftTotalWidth + rightTotalWidth > containerWidth;

  const getLeftOffset = (colKey: string): number => {
    const colIndex = leftPinned.findIndex(c => c.key === colKey);
    let offset = 0;
    for (let i = 0; i < colIndex; i++) {
      offset += leftPinned[i].width;
    }
    return offset;
  };

  const getRightOffset = (colKey: string): number => {
    const colIndex = rightPinned.findIndex(c => c.key === colKey);
    let offset = 0;
    for (let i = rightPinned.length - 1; i > colIndex; i--) {
      offset += rightPinned[i].width;
    }
    return offset;
  };

  // Auto-resolver superposición cuando es crítica
  useEffect(() => {
    if (actualOverlap) {
      // Liberar automáticamente columnas de la derecha primero
      setColumns(cols => {
        const newCols = [...cols];
        // Liberar de derecha a izquierda hasta resolver la superposición
        let currentLeftWidth = leftTotalWidth;
        let currentRightWidth = rightTotalWidth;
        
        // Primero intentar liberar columnas de la derecha
        const rightCols = newCols.filter(c => c.isPinnedRight);
        for (const col of rightCols) {
          if (currentLeftWidth + (currentRightWidth - col.width) < containerWidth - minVisibleNormalWidth) {
            const colIndex = newCols.findIndex(c => c.key === col.key);
            newCols[colIndex] = { ...newCols[colIndex], isPinnedRight: false };
            currentRightWidth -= col.width;
            break;
          }
        }
        
        // Si aún hay superposición, liberar de la izquierda
        if (currentLeftWidth + currentRightWidth > containerWidth - minVisibleNormalWidth) {
          const leftCols = newCols.filter(c => c.isPinnedLeft);
          for (const col of leftCols.reverse()) {
            const colIndex = newCols.findIndex(c => c.key === col.key);
            newCols[colIndex] = { ...newCols[colIndex], isPinnedLeft: false };
            currentLeftWidth -= col.width;
            if (currentLeftWidth + currentRightWidth <= containerWidth - minVisibleNormalWidth) {
              break;
            }
          }
        }
        
        return newCols;
      });
    }
  }, [actualOverlap, containerWidth, leftTotalWidth, rightTotalWidth]);

  // Funciones de pin con validación estricta
  const canPinLeft = (colKey: string): boolean => {
    const col = columns.find(c => c.key === colKey);
    if (!col || col.isPinnedLeft) return true; // Ya está fijada
    
    const newLeftWidth = leftTotalWidth + col.width;
    return newLeftWidth + rightTotalWidth + minVisibleNormalWidth <= containerWidth;
  };

  const canPinRight = (colKey: string): boolean => {
    const col = columns.find(c => c.key === colKey);
    if (!col || col.isPinnedRight) return true; // Ya está fijada
    
    const newRightWidth = rightTotalWidth + col.width;
    return leftTotalWidth + newRightWidth + minVisibleNormalWidth <= containerWidth;
  };

  const pinLeft = (key: string) => {
    if (!canPinLeft(key)) {
      return; // Silenciosamente no hace nada si no se puede
    }
    
    setColumns(cols => cols.map(c => 
      c.key === key ? { ...c, isPinnedLeft: !c.isPinnedLeft, isPinnedRight: false } : c
    ));
  };

  const pinRight = (key: string) => {
    if (!canPinRight(key)) {
      return; // Silenciosamente no hace nada si no se puede
    }
    
    setColumns(cols => cols.map(c => 
      c.key === key ? { ...c, isPinnedRight: !c.isPinnedRight, isPinnedLeft: false } : c
    ));
  };

  const clearAllPins = () => {
    setColumns(cols => cols.map(c => ({ ...c, isPinnedLeft: false, isPinnedRight: false })));
  };

  return (
    <div style={{ margin: "32px 0 8px 0" }}>
      {/* Panel de información y controles */}
      <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h3 style={{ fontWeight: "500", color: "#111827" }}>Control de Columnas Fijas</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(hasOverlap || actualOverlap) && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626" }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  {actualOverlap ? 'Superposición crítica' : 'Espacio limitado'}
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
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", fontSize: "14px" }}>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Contenedor</div>
            <div style={{ color: "#6b7280" }}>{containerWidth}px</div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Fijadas izq.</div>
            <div style={{ color: "#2563eb" }}>{leftTotalWidth}px ({leftPinned.length})</div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Fijadas der.</div>
            <div style={{ color: "#7c3aed" }}>{rightTotalWidth}px ({rightPinned.length})</div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Espacio libre</div>
            <div style={{ 
              color: containerWidth - leftTotalWidth - rightTotalWidth < minVisibleNormalWidth ? "#dc2626" : "#059669",
              fontWeight: containerWidth - leftTotalWidth - rightTotalWidth < minVisibleNormalWidth ? "500" : "normal"
            }}>
              {Math.max(0, containerWidth - leftTotalWidth - rightTotalWidth)}px
            </div>
          </div>
        </div>
        
        {hasOverlap && (
          <div style={{ 
            marginTop: "12px", 
            padding: "8px", 
            backgroundColor: "#fef3c7", 
            border: "1px solid #f59e0b", 
            borderRadius: "4px", 
            fontSize: "14px", 
            color: "#92400e" 
          }}>
            ⚠️ Espacio insuficiente para más columnas fijas. Se previene automáticamente la superposición.
          </div>
        )}
      </div>

      {/* Tabla */}
      <div 
        ref={containerRef}
        style={{ 
          border: `2px solid ${actualOverlap ? '#ef4444' : hasOverlap ? '#f59e0b' : '#e5e7eb'}`, 
          borderRadius: "8px", 
          overflow: "hidden",
          width: 700, 
          overflowX: "auto" 
        }}
      >
        <table 
          ref={tableRef}
          style={{ 
            borderCollapse: "separate", 
            borderSpacing: 0, 
            width: "100%", 
            minWidth: Math.max(800, leftTotalWidth + rightTotalWidth + 300),
            tableLayout: "fixed" 
          }}
        >
          <thead>
            <tr>
              {ordered.map((col) => {
                let style: React.CSSProperties = { 
                  minWidth: col.width,
                  width: col.width
                };
                let pinIcon = null;
                
                if (col.isPinnedLeft) {
                  style = {
                    position: "sticky",
                    left: getLeftOffset(col.key),
                    background: actualOverlap ? "#fee2e2" : "#f8fafc",
                    zIndex: 10 + (leftPinned.length - leftPinned.findIndex(c => c.key === col.key)),
                    minWidth: col.width,
                    width: col.width,
                    boxShadow: "2px 0 4px -1px rgba(0,0,0,0.1)",
                    borderRight: "2px solid #3b82f6"
                  };
                  pinIcon = (
                    <PinOff 
                      size={14} 
                      style={{ color: "#2563eb", cursor: "pointer", marginLeft: "4px" }}
                      onClick={() => pinLeft(col.key)}
                    />
                  );
                } else if (col.isPinnedRight) {
                  style = {
                    position: "sticky",
                    right: getRightOffset(col.key),
                    background: actualOverlap ? "#fee2e2" : "#faf5ff",
                    zIndex: 10 + (rightPinned.length - rightPinned.findIndex(c => c.key === col.key)),
                    minWidth: col.width,
                    width: col.width,
                    boxShadow: "-2px 0 4px -1px rgba(0,0,0,0.1)",
                    borderLeft: "2px solid #8b5cf6"
                  };
                  pinIcon = (
                    <PinOff 
                      size={14} 
                      style={{ color: "#7c3aed", cursor: "pointer", marginLeft: "4px" }}
                      onClick={() => pinRight(col.key)}
                    />
                  );
                } else {
                  const canLeft = canPinLeft(col.key);
                  const canRight = canPinRight(col.key);
                  
                  pinIcon = (
                    <div style={{ display: "flex", alignItems: "center", marginLeft: "4px" }}>
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
                  <th key={col.key} style={style} className="px-3 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.label}</span>
                      {pinIcon}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: "white" }}>
            {data.map((row, i) => (
              <tr key={i} style={{ backgroundColor: "white" }}>
                {ordered.map((col) => {
                  let style: React.CSSProperties = { 
                    minWidth: col.width,
                    width: col.width
                  };
                  
                  if (col.isPinnedLeft) {
                    style = {
                      position: "sticky",
                      left: getLeftOffset(col.key),
                      background: actualOverlap ? "#fee2e2" : "#f8fafc",
                      zIndex: 10 + (leftPinned.length - leftPinned.findIndex(c => c.key === col.key)),
                      minWidth: col.width,
                      width: col.width,
                      boxShadow: "2px 0 4px -1px rgba(0,0,0,0.1)",
                      borderRight: "2px solid #3b82f6"
                    };
                  } else if (col.isPinnedRight) {
                    style = {
                      position: "sticky",
                      right: getRightOffset(col.key),
                      background: actualOverlap ? "#fee2e2" : "#faf5ff",
                      zIndex: 10 + (rightPinned.length - rightPinned.findIndex(c => c.key === col.key)),
                      minWidth: col.width,
                      width: col.width,
                      boxShadow: "-2px 0 4px -1px rgba(0,0,0,0.1)",
                      borderLeft: "2px solid #8b5cf6"
                    };
                  }
                  
                  const originalIndex = initialColumns.findIndex(c => c.key === col.key);
                  return (
                    <td key={col.key} style={style} className="px-3 py-2 text-sm text-gray-900 border-b border-gray-100">
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row[originalIndex]}</div>
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
        <div style={{ fontWeight: "500", color: "#374151", marginBottom: "8px" }}>Leyenda:</div>
        <div>🔵 <span style={{ color: "#2563eb" }}>Azul</span>: Columnas fijadas a la izquierda</div>
        <div>🟣 <span style={{ color: "#7c3aed" }}>Morado</span>: Columnas fijadas a la derecha</div>
        <div>🔴 <span style={{ color: "#dc2626" }}>Rojo</span>: Superposición detectada</div>
        <div>⚪ <span style={{ color: "#9ca3af" }}>Gris</span>: Acción no disponible</div>
      </div>
    </div>
  );
} 