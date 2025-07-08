import { useState, useMemo } from "react";

export type TableColumn = {
  key: string;
  label: string;
};

export type TableFilter = {
  column: string;
  operator: string;
  value: string;
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
    return initialData.filter((row) => {
      return filters.every((filter) => {
        const value = String((row as Record<string, any>)[filter.column] ?? "").toLowerCase();
        const filterValue = filter.value.toLowerCase();
        switch (filter.operator) {
          case "=":
            return value === filterValue;
          case ">=":
            return value >= filterValue;
          case "<=":
            return value <= filterValue;
          case ">":
            return value > filterValue;
          case "<":
            return value < filterValue;
          case "like":
            return value.includes(filterValue);
          case "ilike":
            return value.includes(filterValue);
          case "in":
            return filter.value.split(",").map(v => v.trim().toLowerCase()).includes(value);
          case "is":
            if (filterValue === "null") return !value;
            if (filterValue === "not null") return !!value;
            if (["true", "false"].includes(filterValue)) return value === filterValue;
            return false;
          default:
            return true;
        }
      });
    });
  }, [initialData, filters]);

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