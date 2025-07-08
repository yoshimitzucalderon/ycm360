import React from "react";

type Props = {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

const TablePagination: React.FC<Props> = ({ page, setPage, totalPages, totalItems, pageSize }) => {
  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalItems);

  return (
    <div className="user-table-footer">
      <span>Registros del {startIdx} al {endIdx} de {totalItems}</span>
      <div className="user-table-pagination">
        <button onClick={() => setPage(1)} disabled={page === 1} title="Primera página">⏮️</button>
        <button onClick={() => setPage(page - 1)} disabled={page === 1} title="Anterior">◀️</button>
        <span>Página</span>
        <input
          type="text"
          value={page}
          onChange={e => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 1 && val <= totalPages) setPage(val);
          }}
          style={{ width: 36, textAlign: "center" }}
        />
        <span>de {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} title="Siguiente">▶️</button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Última página">⏭️</button>
      </div>
    </div>
  );
};

export default TablePagination; 