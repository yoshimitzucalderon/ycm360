import React from "react";

const users = [
  { name: "Natali Craig", email: "smith@kpmg.com", date: "Just now", company: "KPMG Consulting Services" },
  { name: "Proveedor 2", email: "proveedor2@empresa.com", date: "2 days ago", company: "Empresa Comercial 2" },
  { name: "Proveedor 3", email: "proveedor3@empresa.com", date: "3 days ago", company: "Empresa Comercial 3" },
  { name: "Proveedor 4", email: "proveedor4@empresa.com", date: "3 days ago", company: "Empresa Comercial 4" },
  { name: "Proveedor 5", email: "proveedor5@empresa.com", date: "5 days ago", company: "Empresa Comercial 5" },
  { name: "Proveedor 6", email: "proveedor6@empresa.com", date: "6 days ago", company: "Empresa Comercial 6" },
  { name: "Proveedor 7", email: "proveedor7@empresa.com", date: "7 days ago", company: "Empresa Comercial 7" },
  { name: "Proveedor 8", email: "proveedor8@empresa.com", date: "8 days ago", company: "Empresa Comercial 8" },
];

const UserTable = () => (
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
        {users.map((user, idx) => (
          <tr key={idx}>
            <td><input type="checkbox" /></td>
            <td className={idx === 0 ? "highlight" : ""}>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.date}</td>
            <td>{user.company}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="user-table-footer">
      <span>Registros del 1 al 8 de 40</span>
      <div className="user-table-pagination">
        <button>{'<'}</button>
        <span>Página 1 de 5</span>
        <button>{'>'}</button>
      </div>
    </div>
  </div>
);

export default UserTable; 