import { useEffect, useCallback } from 'react';

interface UseStickyColumnsProps {
  leftPinnedColumns: string[];
  rightPinnedColumns: string[];
  colWidths: Record<string, number>;
  containerRef: React.RefObject<HTMLElement>;
  columnOrder: Array<{ key: string; label: string }>;
  enabled?: boolean;
}

export function useStickyColumns({
  leftPinnedColumns,
  rightPinnedColumns,
  colWidths,
  containerRef,
  columnOrder,
  enabled = true
}: UseStickyColumnsProps) {
  
  // Calcula offsets para columnas sticky basándose en el orden visual real
  const getStickyStyles = useCallback((colKey: string) => {
    if (!enabled) return {};
    
    const isLeft = leftPinnedColumns.includes(colKey);
    const isRight = rightPinnedColumns.includes(colKey);
    
    if (!isLeft && !isRight) return {};

    let offset = 0;
    
    if (isLeft) {
      // Para columnas left: calcular offset basándose en el orden visual real
      const visualOrder = columnOrder.map(col => col.key);
      const currentColIndex = visualOrder.indexOf(colKey);
      
      // Sumar anchos de todas las columnas pinned que están visualmente a la izquierda
      for (const pinnedCol of leftPinnedColumns) {
        const pinnedColIndex = visualOrder.indexOf(pinnedCol);
        if (pinnedColIndex < currentColIndex) {
          offset += colWidths[pinnedCol] || 150;
        }
      }
      
      return {
        position: 'sticky' as const,
        left: offset,
        zIndex: 2000 + (leftPinnedColumns.length - leftPinnedColumns.indexOf(colKey)),
        background: '#f8fafc',
        boxShadow: '2px 0 4px rgba(0,0,0,0.15)'
      };
    }
    
    if (isRight) {
      // Para columnas right: calcular offset desde la derecha
      const visualOrder = columnOrder.map(col => col.key);
      const currentColIndex = visualOrder.indexOf(colKey);
      
      // Sumar anchos de todas las columnas pinned right que están visualmente a la derecha
      for (const pinnedCol of rightPinnedColumns) {
        const pinnedColIndex = visualOrder.indexOf(pinnedCol);
        if (pinnedColIndex > currentColIndex) {
          offset += colWidths[pinnedCol] || 150;
        }
      }
      
      return {
        position: 'sticky' as const,
        right: offset,
        zIndex: 2000 + (rightPinnedColumns.length - rightPinnedColumns.indexOf(colKey)),
        background: '#f8fafc',
        boxShadow: '-2px 0 4px rgba(0,0,0,0.15)'
      };
    }
    
    return {};
  }, [leftPinnedColumns, rightPinnedColumns, colWidths, enabled, columnOrder]);

  // Aplica estilos sticky a th y td después de cada render
  const applyStickyStyles = useCallback(() => {
    if (!enabled || !containerRef.current) {
      console.log('❌ applyStickyStyles: Not enabled or no container');
      return;
    }
    
    console.log('🔧 Applying sticky styles...', {
      leftPinned: leftPinnedColumns,
      rightPinned: rightPinnedColumns,
      colWidths: Object.keys(colWidths).length
    });
    
    const ths = containerRef.current.querySelectorAll('th[data-col-key]');
    const tds = containerRef.current.querySelectorAll('td[data-col-key]');
    
    console.log(`Found ${ths.length} headers and ${tds.length} cells with data-col-key`);
    
    // Limpiar estilos sticky previos de columnas no pinneadas
    Array.from(ths).concat(Array.from(tds)).forEach((el) => {
      const key = el.getAttribute('data-col-key');
      if (!key) return;
      
      const htmlEl = el as HTMLElement;
      if (!leftPinnedColumns.includes(key) && !rightPinnedColumns.includes(key)) {
        htmlEl.style.position = 'static';
        htmlEl.style.left = 'auto';
        htmlEl.style.right = 'auto';
        htmlEl.style.zIndex = 'auto';
        htmlEl.style.boxShadow = 'none';
        htmlEl.style.background = '';
        htmlEl.classList.remove('sticky');
      }
    });
    
    // Aplicar estilos sticky a headers
    ths.forEach((el) => {
      const key = el.getAttribute('data-col-key');
      if (!key) return;
      const styles = getStickyStyles(key);
      
      if (styles.position === 'sticky') {
        (el as HTMLElement).classList.add('sticky');
        Object.assign((el as HTMLElement).style, styles);
        console.log(`📌 Applied sticky to TH ${key}:`, styles);
      } else {
        (el as HTMLElement).classList.remove('sticky');
      }
    });
    
    // Aplicar estilos sticky a celdas (con background diferente)
    tds.forEach((el) => {
      const key = el.getAttribute('data-col-key');
      if (!key) return;
      const styles = getStickyStyles(key);
      
      if (styles.position === 'sticky') {
        (el as HTMLElement).classList.add('sticky');
        // Para TD, cambiar el background a blanco para mejor contraste
        const tdStyles = { ...styles, background: '#ffffff' };
        Object.assign((el as HTMLElement).style, tdStyles);
      } else {
        (el as HTMLElement).classList.remove('sticky');
      }
    });
    
    console.log('✅ Sticky styles applied successfully');
  }, [getStickyStyles, containerRef, enabled, leftPinnedColumns, rightPinnedColumns]);

  // Validación de configuración sticky
  const validateConfiguration = useCallback(() => {
    const warnings: string[] = [];
    if (!containerRef.current) return { isValid: true, warnings };
    
    let el: HTMLElement | null = containerRef.current;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      const tagName = el.tagName.toLowerCase();
      const className = el.className ? '.' + el.className.split(' ').join('.') : '';
      
      if (['relative', 'absolute', 'fixed'].includes(style.position)) {
        warnings.push(`❌ ${tagName}${className} tiene position: ${style.position}`);
      }
      
      if (style.overflow !== 'visible' && style.overflow !== 'unset' && el !== containerRef.current) {
        warnings.push(`❌ ${tagName}${className} tiene overflow: ${style.overflow}`);
      }
      
      if (style.transform !== 'none') {
        warnings.push(`❌ ${tagName}${className} tiene transform: ${style.transform}`);
      }
      
      el = el.parentElement;
    }
    
    return { isValid: warnings.length === 0, warnings };
  }, [containerRef]);

  // Función de diagnóstico mejorada
  const diagnoseSticky = useCallback(() => {
    console.log('🔍 === DIAGNÓSTICO STICKY COMPLETO ===');
    
    // 1. Configuración
    console.log('1. 🔧 Configuración:', {
      enabled,
      leftPinnedColumns,
      rightPinnedColumns,
      colWidthsCount: Object.keys(colWidths).length,
      colWidths
    });
    
    // 2. Container
    console.log('2. 📦 Container:', containerRef.current ? '✅ Encontrado' : '❌ No encontrado');
    if (containerRef.current) {
      const containerStyles = window.getComputedStyle(containerRef.current);
      console.log('   Estilos del container:', {
        position: containerStyles.position,
        transform: containerStyles.transform,
        overflow: containerStyles.overflow,
        overflowX: containerStyles.overflowX
      });
    }
    
    // 3. Headers
    const headers = document.querySelectorAll('th[data-col-key]');
    console.log(`3. 🏷️  Headers encontrados: ${headers.length}`);
    
    headers.forEach((header, idx) => {
      const colKey = header.getAttribute('data-col-key');
      const styles = window.getComputedStyle(header);
      const isPinned = leftPinnedColumns.includes(colKey || '') || rightPinnedColumns.includes(colKey || '');
      
      console.log(`   Header ${idx} (${colKey}) [${isPinned ? '📌 PINNED' : '📄 NORMAL'}]:`, {
        position: styles.position,
        left: styles.left,
        right: styles.right,
        zIndex: styles.zIndex,
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow
      });
    });
    
    // 4. Validación de configuración
    const validation = validateConfiguration();
    console.log('4. ✅ Validación de configuración:');
    if (validation.isValid) {
      console.log('   ✅ Todo correcto para sticky positioning');
    } else {
      console.log('   ❌ Problemas encontrados:');
      validation.warnings.forEach(warning => console.log(`     ${warning}`));
    }
    
    // 5. Test manual de sticky en segunda columna
    const secondHeader = document.querySelector('th[data-col-key="company"]');
    if (secondHeader && leftPinnedColumns.includes('company')) {
      console.log('5. 🧪 Test manual de segunda columna:');
      const headerEl = secondHeader as HTMLElement;
      const computedStyles = window.getComputedStyle(headerEl);
      
      console.log('   Estado actual:', {
        position: computedStyles.position,
        left: computedStyles.left,
        zIndex: computedStyles.zIndex
      });
      
      console.log('   ✅ Segunda columna configurada correctamente');
    } else {
      console.log('5. ⚠️  Segunda columna no está pinneada o no se encontró');
    }
    
    return validation;
  }, [enabled, leftPinnedColumns, rightPinnedColumns, colWidths, containerRef, validateConfiguration]);

  // Aplica estilos sticky tras cada render relevante
  useEffect(() => {
    if (!enabled) return;
    
    // Usar un timeout breve para asegurar que el DOM esté actualizado
    const timeoutId = setTimeout(() => {
      applyStickyStyles();
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [leftPinnedColumns, rightPinnedColumns, colWidths, enabled, applyStickyStyles]);

  // Reaplica estilos tras scroll horizontal
  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    
    const el = containerRef.current;
    const onScroll = () => {
      requestAnimationFrame(() => {
        applyStickyStyles();
      });
    };
    
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef, enabled, applyStickyStyles]);

  return {
    getStickyStyles,
    applyStickyStyles,
    validateConfiguration,
    diagnoseSticky // ✅ Exportar la función de diagnóstico
  };
} 