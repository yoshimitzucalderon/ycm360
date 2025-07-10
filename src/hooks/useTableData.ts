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

export type TableSort = {
  column: string;
  direction: "asc" | "desc";
};

export function useTableData<T>(initialData: T[], columns: TableColumn[]) {
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [sort, setSort] = useState<TableSort | null>(null);

  // Filtrado tipo Supabase
  const filteredData = useMemo(() => {
    // Solo filtrar si hay al menos un filtro con columna y valor
    const validFilters = filters.filter(f => f.column && f.value && f.value.trim() !== "");
    if (validFilters.length === 0) return initialData;
    // Agrupa los filtros por operador lógico
    let result = initialData;
    let currentGroup: typeof validFilters = [];
    let currentOperator: 'AND' | 'OR' = 'AND';
    validFilters.forEach((filter, idx) => {
      if (idx === 0) {
        currentGroup = [filter];
        currentOperator = 'AND';
      } else {
        if (filter.logicalOperator === 'OR') {
          currentGroup.push(filter);
        } else {
          // Aplica el grupo anterior
          if (currentOperator === 'AND') {
            result = result.filter(row => currentGroup.every(f => applyFilter(row, f)));
          } else {
            result = result.filter(row => currentGroup.some(f => applyFilter(row, f)));
          }
          // Nuevo grupo
          currentGroup = [filter];
          currentOperator = 'AND';
        }
      }
      // Si es el último filtro, aplica el grupo
      if (idx === validFilters.length - 1) {
        if (currentOperator === 'AND') {
          result = result.filter(row => currentGroup.every(f => applyFilter(row, f)));
        } else {
          result = result.filter(row => currentGroup.some(f => applyFilter(row, f)));
        }
      }
      // Actualiza el operador para el siguiente grupo
      if (filter.logicalOperator) currentOperator = filter.logicalOperator;
    });
    return result;
  }, [initialData, filters]);

  function applyFilter(row: any, filter: TableFilter) {
    const value = String((row as Record<string, any>)[filter.column] ?? '').toLowerCase();
    const filterValue = filter.value.toLowerCase();
    switch (filter.operator) {
      case '=':
        return value === filterValue;
      case '>=':
        return value >= filterValue;
      case '<=':
        return value <= filterValue;
      case '>':
        return value > filterValue;
      case '<':
        return value < filterValue;
      case 'like':
        return value.includes(filterValue);
      case 'ilike':
        return value.includes(filterValue);
      case 'in':
        return filter.value.split(',').map(v => v.trim().toLowerCase()).includes(value);
      case 'is':
        if (filterValue === 'null') return !value;
        if (filterValue === 'not null') return !!value;
        if (["true", "false"].includes(filterValue)) return value === filterValue;
        return false;
      default:
        return true;
    }
  }

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sort) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = String((a as Record<string, any>)[sort.column] ?? "").toLowerCase();
      const bValue = String((b as Record<string, any>)[sort.column] ?? "").toLowerCase();
      if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sort]);

  return {
    data: sortedData,
    filters,
    setFilters,
    sort,
    setSort,
    clearFilters: () => setFilters([]),
    clearSort: () => setSort(null),
  };
} 