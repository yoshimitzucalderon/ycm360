import React, { useState } from "react";
import { useTableData, TableColumn } from "../hooks/useTableData";
import TableFilter from "./TableFilter";
import TableSort from "./TableSort";
import TablePagination from "./TablePagination";

const columns: TableColumn[] = [
  { key: "name", label: "Proveedor" },
  { key: "email", label: "Email" },
  { key: "date", label: "Fecha de creación" },
  { key: "company", label: "Proveedor nombre comercial" },
  { key: "rfc", label: "RFC" },
  { key: "giro", label: "Giro de la empresa" },
  { key: "id", label: "Id" },
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
];

const initialData = [
  { name: "Natali Craig", email: "smith@kpmg.com", date: "Just now", company: "KPMG Consulting Services", rfc: "KMP850101ABC", giro: "Consultoría", id: "1", servicio: "Auditoría", moneda: "MXN", nacionalidad: "México", banco: "BBVA", cuenta: "1234567890", clabe: "123456789012345678", anexos: "Contrato.pdf", responsableLegal: "Juan Pérez", direccionLegal: "Av. Reforma 123", correoLegal: "juan@kpmg.com", telefonoLegal: "555-1234", responsableAdmin: "María García" },
  ...Array.from({ length: 39 }, (_, i) => ({
    name: `Proveedor ${i + 2}`,
    email: `proveedor${i + 2}@empresa.com`,
    date: `${i + 2} days ago`,
    company: `Empresa Comercial ${i + 2}`,
    rfc: `RFC${i + 2}`,
    giro: "Servicios",
    id: `${i + 2}`,
    servicio: "Consultoría",
    moneda: "MXN",
    nacionalidad: "México",
    banco: "BBVA",
    cuenta: `12345678${i + 2}`,
    clabe: `1234567890123456${i + 2}`,
    anexos: "Contrato.pdf",
    responsableLegal: `Responsable ${i + 2}`,
    direccionLegal: `Calle ${i + 2}", Ciudad` ,
    correoLegal: `legal${i + 2}@empresa.com`,
    telefonoLegal: `555-12${i + 2}`,
    responsableAdmin: `Admin ${i + 2}`
  }))
];

const PAGE_SIZE = 8;

const UserTable = () => {
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const {
    data,
    filters,
    setFilters,
    sort,
    setSort,
    clearFilters,
    clearSort
  } = useTableData(initialData, columns);

  // Paginación
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <input type="text" placeholder="Search" className="user-table-search" />
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
              <td>{user.email}</td>
              <td>{user.date}</td>
              <td>{user.company}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <TablePagination
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        totalItems={data.length}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
};

export default UserTable; 