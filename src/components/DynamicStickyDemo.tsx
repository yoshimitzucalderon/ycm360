import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Pin, PinOff, AlertTriangle, GripVertical } from 'lucide-react';

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
  const tableLayout = useMemo(() => {
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
    
    const testLeft = testCols.filter(c => c.isPinnedLeft).reduce((sum, c) => sum + c.width, 0);
    const testRight = tableLayout.rightTotalWidth;
    
    return testLeft + testRight + 100 <= containerWidth;
  };

  const canPinRight = (colKey: string): boolean => {
    const col = columns.find(c => c.key === colKey);
    if (!col || col.isPinnedRight) return true;
    
    const testCols = columns.map(c => 
      c.key === colKey ? { ...c, isPinnedRight: true, isPinnedLeft: false } : c
    );
    
    const testRight = testCols.filter(c => c.isPinnedRight).reduce((sum, c) => sum + c.width, 0);
    const testLeft = tableLayout.leftTotalWidth;
    
    return testLeft + testRight + 100 <= containerWidth;
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
    if (tableLayout.actualOverlap && !isResizing) {
      console.log('🚨 Resolviendo superposición automáticamente...');
      
      let resolveMessage = '';
      setColumns(prevCols => {
        const newCols = [...prevCols];
        
        // Liberar la columna más grande fijada
        const allPinned = [...tableLayout.leftPinned, ...tableLayout.rightPinned]
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
  }, [tableLayout.actualOverlap, isResizing]);

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
    <div style={{ margin: "32px 0 8px 0" }}>
      {/* Panel de información */}
      <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h3 style={{ fontWeight: "500", color: "#111827" }}>Columnas Redimensionables con Control de Superposición</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(tableLayout.hasOverlap || tableLayout.actualOverlap) && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626" }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  {tableLayout.actualOverlap ? 'Superposición crítica' : 'Espacio limitado'}
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
            <div style={{ color: "#2563eb" }}>{tableLayout.leftTotalWidth}px ({tableLayout.leftPinned.length})</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              {tableLayout.leftPinned.map(c => `${c.label}:${c.width}`).join(', ') || 'Ninguna'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Fijadas der.</div>
            <div style={{ color: "#7c3aed" }}>{tableLayout.rightTotalWidth}px ({tableLayout.rightPinned.length})</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              {tableLayout.rightPinned.map(c => `${c.label}:${c.width}`).join(', ') || 'Ninguna'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Normales</div>
            <div style={{ color: "#6b7280" }}>{tableLayout.normalTotalWidth}px ({tableLayout.normal.length})</div>
          </div>
          <div>
            <div style={{ fontWeight: "500", color: "#374151" }}>Espacio libre</div>
            <div style={{ 
              color: containerWidth - tableLayout.leftTotalWidth - tableLayout.rightTotalWidth < 100 ? "#dc2626" : "#059669",
              fontWeight: containerWidth - tableLayout.leftTotalWidth - tableLayout.rightTotalWidth < 100 ? "500" : "normal"
            }}>
              {Math.max(0, containerWidth - tableLayout.leftTotalWidth - tableLayout.rightTotalWidth)}px
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Usado: {tableLayout.leftTotalWidth + tableLayout.rightTotalWidth}px
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
        
        {tableLayout.hasOverlap && !isResizing && !autoResolveMessage && (
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
        <div><strong>Orden:</strong> {tableLayout.orderedColumns.map(c => `${c.key}(${c.isPinnedLeft ? 'L' : c.isPinnedRight ? 'R' : 'N'})`).join(' → ')}</div>
        <div><strong>Posiciones:</strong> {Object.entries(tableLayout.positions).map(([key, pos]) => 
          `${key}@${pos.left !== undefined ? `L${pos.left}` : `R${pos.right}`}px`
        ).join(', ')}</div>
      </div>

      {/* Tabla */}
      <div 
        ref={containerRef}
        style={{ 
          border: `2px solid ${tableLayout.actualOverlap ? '#ef4444' : tableLayout.hasOverlap ? '#f59e0b' : '#e5e7eb'}`, 
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
            minWidth: Math.max(800, tableLayout.leftTotalWidth + tableLayout.rightTotalWidth + 300),
            tableLayout: "fixed" 
          }}
        >
          <thead>
            <tr>
              {tableLayout.orderedColumns.map((col) => {
                const position = tableLayout.positions[col.key];
                let style: React.CSSProperties = { 
                  minWidth: col.width,
                  width: col.width,
                  position: 'relative'
                };
                let pinIcon = null;
                
                if (col.isPinnedLeft && position?.left !== undefined) {
                  style = {
                    position: "sticky",
                    left: position.left,
                    background: tableLayout.actualOverlap ? "#fee2e2" : "#f8fafc",
                    zIndex: position.zIndex,
                    minWidth: col.width,
                    width: col.width,
                    boxShadow: "2px 0 4px -1px rgba(0,0,0,0.1)",
                    borderRight: "2px solid #3b82f6"
                  };
                  pinIcon = (
                    <PinOff 
                      size={14} 
                      style={{ color: "#2563eb", cursor: "pointer" }}
                      onClick={() => pinLeft(col.key)}
                    />
                  );
                } else if (col.isPinnedRight && position?.right !== undefined) {
                  style = {
                    position: "sticky",
                    right: position.right,
                    background: tableLayout.actualOverlap ? "#fee2e2" : "#faf5ff",
                    zIndex: position.zIndex,
                    minWidth: col.width,
                    width: col.width,
                    boxShadow: "-2px 0 4px -1px rgba(0,0,0,0.1)",
                    borderLeft: "2px solid #8b5cf6"
                  };
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
                {tableLayout.orderedColumns.map((col) => {
                  const position = tableLayout.positions[col.key];
                  let style: React.CSSProperties = { 
                    minWidth: col.width,
                    width: col.width,
                    position: 'relative'
                  };
                  
                  if (col.isPinnedLeft && position?.left !== undefined) {
                    style = {
                      position: "sticky",
                      left: position.left,
                      background: tableLayout.actualOverlap ? "#fee2e2" : "#f8fafc",
                      zIndex: position.zIndex,
                      minWidth: col.width,
                      width: col.width,
                      boxShadow: "2px 0 4px -1px rgba(0,0,0,0.1)",
                      borderRight: "2px solid #3b82f6"
                    };
                  } else if (col.isPinnedRight && position?.right !== undefined) {
                    style = {
                      position: "sticky",
                      right: position.right,
                      background: tableLayout.actualOverlap ? "#fee2e2" : "#faf5ff",
                      zIndex: position.zIndex,
                      minWidth: col.width,
                      width: col.width,
                      boxShadow: "-2px 0 4px -1px rgba(0,0,0,0.1)",
                      borderLeft: "2px solid #8b5cf6"
                    };
                  }
                  
                  const originalIndex = initialColumns.findIndex(c => c.key === col.key);
                  return (
                    <td key={col.key} style={style} className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100">
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
    </div>
  );
} 