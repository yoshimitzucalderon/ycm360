import React, { useState } from "react";

const users = [
  { name: "Natali Craig", email: "smith@kpmg.com", date: "Just now", company: "KPMG Consulting Services" },
  { name: "Proveedor 2", email: "proveedor2@empresa.com", date: "2 days ago", company: "Empresa Comercial 2" },
  { name: "Proveedor 3", email: "proveedor3@empresa.com", date: "3 days ago", company: "Empresa Comercial 3" },
  { name: "Proveedor 4", email: "proveedor4@empresa.com", date: "3 days ago", company: "Empresa Comercial 4" },
  { name: "Proveedor 5", email: "proveedor5@empresa.com", date: "5 days ago", company: "Empresa Comercial 5" },
  { name: "Proveedor 6", email: "proveedor6@empresa.com", date: "6 days ago", company: "Empresa Comercial 6" },
  { name: "Proveedor 7", email: "proveedor7@empresa.com", date: "7 days ago", company: "Empresa Comercial 7" },
  { name: "Proveedor 8", email: "proveedor8@empresa.com", date: "8 days ago", company: "Empresa Comercial 8" },
  // Simular más usuarios para varias páginas
  ...Array.from({ length: 32 }, (_, i) => ({
    name: `Proveedor ${i + 9}`,
    email: `proveedor${i + 9}@empresa.com`,
    date: `${i + 9} days ago`,
    company: `Empresa Comercial ${i + 9}`
  }))
];

const USERS_PER_PAGE = 8;
const totalPages = Math.ceil(users.length / USERS_PER_PAGE);

const UserTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState("1");

  const startIdx = (currentPage - 1) * USERS_PER_PAGE;
  const endIdx = startIdx + USERS_PER_PAGE;
  const currentUsers = users.slice(startIdx, endIdx);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleInputBlur = () => {
    let page = parseInt(inputPage, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
    setInputPage(page.toString());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  const goToFirst = () => {
    setCurrentPage(1);
    setInputPage("1");
  };
  const goToLast = () => {
    setCurrentPage(totalPages);
    setInputPage(totalPages.toString());
  };
  const goToPrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setInputPage((currentPage - 1).toString());
    }
  };
  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setInputPage((currentPage + 1).toString());
    }
  };

  return (
    <div className="user-table-container">
      <div className="user-table-header">
        <input type="text" placeholder="Search" className="user-table-search" />
        <button className="user-table-add">Agregar Proveedor</button>
      </div>
      <table className="user-table">
        <thead>
          <tr>
            <th></th>
            <th>Proveedor</th>
            <th>Email</th>
            <th>Fecha de registro</th>
            <th>Proveedor nombre comercial</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, idx) => (
            <tr key={startIdx + idx}>
              <td><input type="checkbox" /></td>
              <td className={startIdx + idx === 0 ? "highlight" : ""}>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.date}</td>
              <td>{user.company}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="user-table-footer">
        <span>Registros del {startIdx + 1} al {Math.min(endIdx, users.length)} de {users.length}</span>
        <div className="user-table-pagination">
          <button onClick={goToFirst} disabled={currentPage === 1} title="Primera página">⏮️</button>
          <button onClick={goToPrev} disabled={currentPage === 1} title="Anterior">◀️</button>
          <span>Página</span>
          <input
            type="text"
            value={inputPage}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            style={{ width: 36, textAlign: "center" }}
          />
          <span>de {totalPages}</span>
          <button onClick={goToNext} disabled={currentPage === totalPages} title="Siguiente">▶️</button>
          <button onClick={goToLast} disabled={currentPage === totalPages} title="Última página">⏭️</button>
        </div>
      </div>
    </div>
  );
};

export default UserTable; 