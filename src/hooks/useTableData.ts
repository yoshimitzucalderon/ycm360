import { useState, useMemo } from "react";

export type TableColumn = {
  key: string;
  label: string;
};

export type TableFilter = {
  column: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR'; // Nuevo campo para AND/OR, opcional para el primer filtro
};

export type TableSortRule = {
  column: string;
  direction: "asc" | "desc";
};

export function useTableData<T>(initialData: T[], columns: TableColumn[]) {
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [sortRules, setSortRules] = useState<TableSortRule[]>([]);

  // Filtrado tipo Supabase
  const filteredData = useMemo(() => {
    // Limpieza extra: solo considera filtros con columna y valor no vacío, no null, no undefined y no solo espacios
    const validFilters = filters.filter(f => f.column && typeof f.value === 'string' && f.value.trim() !== '');
    console.log('DEBUG filters:', filters);
    console.log('DEBUG validFilters:', validFilters);
    if (validFilters.length === 0) return initialData;
    
    // Aplica todos los filtros usando la lógica de Supabase
    return initialData.filter(row => {
      // Para cada fila, evalúa todos los filtros en secuencia
      let result = true;
      let previousOperator: 'AND' | 'OR' = 'AND';
      
      for (let i = 0; i < validFilters.length; i++) {
        const filter = validFilters[i];
        const currentResult = applyFilter(row, filter);
        
        if (i === 0) {
          // Primer filtro siempre se aplica
          result = currentResult;
        } else {
          // Para filtros subsiguientes, usa el operador lógico del filtro actual
          const logicalOperator = filter.logicalOperator || 'AND';
          
          if (logicalOperator === 'AND') {
            result = result && currentResult;
          } else if (logicalOperator === 'OR') {
            result = result || currentResult;
          }
        }
      }
      
      return result;
    });
  }, [initialData, filters]);

  function applyFilter(row: any, filter: TableFilter) {
    const rawValue = (row as Record<string, any>)[filter.column];
    const filterValue = filter.value.trim();
    
    // Manejo especial para el operador 'is'
    if (filter.operator === 'is') {
      switch (filterValue.toLowerCase()) {
        case 'null':
          return rawValue === null || rawValue === undefined || rawValue === '';
        case 'not null':
          return rawValue !== null && rawValue !== undefined && rawValue !== '';
        case 'true':
          return rawValue === true || String(rawValue).toLowerCase() === 'true';
        case 'false':
          return rawValue === false || String(rawValue).toLowerCase() === 'false';
        default:
          return false;
      }
    }
    
    // Para otros operadores, convertir a string para comparación
    const value = String(rawValue ?? '').toLowerCase();
    const filterValueLower = filterValue.toLowerCase();
    
    switch (filter.operator) {
      case '=':
        return value === filterValueLower;
      case '<>':
        return value !== filterValueLower;
      case '>=':
        // Intentar comparación numérica primero
        const numValue = parseFloat(value);
        const numFilterValue = parseFloat(filterValue);
        if (!isNaN(numValue) && !isNaN(numFilterValue)) {
          return numValue >= numFilterValue;
        }
        // Si no son números, comparación lexicográfica
        return value >= filterValueLower;
      case '<=':
        // Intentar comparación numérica primero
        const numValue2 = parseFloat(value);
        const numFilterValue2 = parseFloat(filterValue);
        if (!isNaN(numValue2) && !isNaN(numFilterValue2)) {
          return numValue2 <= numFilterValue2;
        }
        // Si no son números, comparación lexicográfica
        return value <= filterValueLower;
      case '>':
        // Intentar comparación numérica primero
        const numValue3 = parseFloat(value);
        const numFilterValue3 = parseFloat(filterValue);
        if (!isNaN(numValue3) && !isNaN(numFilterValue3)) {
          return numValue3 > numFilterValue3;
        }
        // Si no son números, comparación lexicográfica
        return value > filterValueLower;
      case '<':
        // Intentar comparación numérica primero
        const numValue4 = parseFloat(value);
        const numFilterValue4 = parseFloat(filterValue);
        if (!isNaN(numValue4) && !isNaN(numFilterValue4)) {
          return numValue4 < numFilterValue4;
        }
        // Si no son números, comparación lexicográfica
        return value < filterValueLower;
      case 'like':
        // Coincidencia exacta con comodines SQL
        const likePattern = filterValueLower
          .replace(/%/g, '.*')  // % se convierte en .*
          .replace(/_/g, '.')   // _ se convierte en .
          .replace(/\.\*/g, '.*') // Evitar doble escape
          .replace(/\.\./g, '._'); // Evitar doble escape
        const likeRegex = new RegExp(`^${likePattern}$`, 'i');
        return likeRegex.test(value);
      case 'ilike':
        // Coincidencia sin distinguir mayúsculas/minúsculas con comodines SQL
        const ilikePattern = filterValueLower
          .replace(/%/g, '.*')  // % se convierte en .*
          .replace(/_/g, '.')   // _ se convierte en .
          .replace(/\.\*/g, '.*') // Evitar doble escape
          .replace(/\.\./g, '._'); // Evitar doble escape
        const ilikeRegex = new RegExp(`^${ilikePattern}$`, 'i');
        return ilikeRegex.test(value);
      case 'in':
        // Lista de valores separados por comas
        const inValues = filterValue.split(',').map(v => v.trim().toLowerCase());
        return inValues.includes(value);
      default:
        return true;
    }
  }

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortRules || sortRules.length === 0) return filteredData;
    return [...filteredData].sort((a, b) => {
      for (const rule of sortRules) {
        const aValue = String((a as Record<string, any>)[rule.column] ?? "").toLowerCase();
        const bValue = String((b as Record<string, any>)[rule.column] ?? "").toLowerCase();
        if (aValue < bValue) return rule.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return rule.direction === "asc" ? 1 : -1;
        // Si son iguales, sigue con la siguiente regla
      }
      return 0;
    });
  }, [filteredData, sortRules]);

  return {
    data: sortedData,
    filters,
    setFilters,
    sortRules,
    setSortRules,
    clearFilters: () => setFilters([]),
    clearSort: () => setSortRules([]),
  };
} 