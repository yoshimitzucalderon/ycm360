import React, { useState, useEffect } from "react";
import { useTableData, TableColumn, TableFilter as TableFilterType } from "../hooks/useTableData";
import TableFilter from "./TableFilter";
import TableSort from "./TableSort";
import TablePagination from "./TablePagination";
import { supabase } from "../supabaseClient";

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

const UserTable = () => {
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: filteredData,
    filters,
    setFilters,
    sort,
    setSort,
    clearFilters,
    clearSort
  } = useTableData(data, columns);

  // Fetch de Supabase con filtros AND/OR
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      let query = supabase.from('erp_proveedor_alta_de_proveedor').select('*');

      // Construir filtros AND/OR
      if (filters.length > 0) {
        let andFilters: TableFilterType[] = [];
        let orFilters: TableFilterType[] = [];
        filters.forEach((filter, idx) => {
          if (idx === 0 || filter.logicalOperator === 'AND') {
            andFilters.push(filter);
          } else if (filter.logicalOperator === 'OR') {
            orFilters.push(filter);
          }
        });

        // Aplica filtros AND
        andFilters.forEach(f => {
          if (f.operator === '=')
            query = query.eq(f.column, f.value);
          else if (f.operator === 'like' || f.operator === 'ilike')
            query = query[f.operator](f.column, `%${f.value}%`);
          else
            query = query.filter(f.column, f.operator, f.value);
        });

        // Aplica filtros OR (si hay)
        if (orFilters.length > 0) {
          const orString = orFilters.map(f => `${f.column}.${f.operator}.${f.value}`).join(',');
          query = query.or(orString);
        }
      }

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

  // Paginación
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Handlers para filtros y ordenamiento
  const handleApplyFilter = () => setPage(1);
  const handleApplySort = () => setPage(1);

  // Ordenamiento rápido por header
  const handleHeaderClick = (colKey: string) => {
    if (sort && sort.column === colKey) {
      setSort({ column: colKey, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      setSort({ column: colKey, direction: "asc" });
    }
    setPage(1);
  };

  return (
    <div className="user-table-container">
      <div className="user-table-header">
        <button onClick={() => setShowFilter(f => !f)} className="user-table-filter-btn">&#x1F50D; Filter</button>
        <button onClick={() => setShowSort(s => !s)} className="user-table-sort-btn">&#x21C5; Sort</button>
        <button className="user-table-add">Agregar Proveedor</button>
      </div>
      {showFilter && (
        <TableFilter
          columns={columns}
          filters={filters}
          setFilters={setFilters}
          onApply={handleApplyFilter}
          onClear={clearFilters}
        />
      )}
      {showSort && (
        <TableSort
          columns={columns}
          sort={sort}
          setSort={setSort}
          onApply={handleApplySort}
          onClear={clearSort}
        />
      )}
      {loading ? (
        <div style={{ padding: 24 }}>Cargando datos...</div>
      ) : error ? (
        <div style={{ color: "red", padding: 24 }}>{error}</div>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th></th>
              {columns.slice(0, 4).map(col => (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col.key)}
                  className="user-table-header-cell"
                  style={{ cursor: "pointer" }}
                >
                  {col.label}
                  {sort && sort.column === col.key && (
                    <span style={{ marginLeft: 4 }}>{sort.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((user, idx) => (
              <tr key={user.id || idx}>
                <td><input type="checkbox" /></td>
                <td>{user.name}</td>
                <td>{user.company}</td>
                <td>{user.rfc}</td>
                <td>{user.giro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <TablePagination
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        totalItems={filteredData.length}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
};

export default UserTable; 