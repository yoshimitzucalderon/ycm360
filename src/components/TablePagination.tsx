import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

type TablePaginationProps = {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

const TablePagination: React.FC<TablePaginationProps> = ({ page, setPage, totalPages, totalItems, pageSize }) => {
  return (
    <div className="pagination-controls">
      <button
        className="pagination-button"
        onClick={() => setPage(1)}
        disabled={page === 1}
      >
        <ChevronsLeft className="pagination-icon" />
      </button>
      <button
        className="pagination-button"
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft className="pagination-icon" />
      </button>
      <span className="pagination-info">
        Página {page} de {totalPages}
      </span>
      <button
        className="pagination-button"
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
      >
        <ChevronRight className="pagination-icon" />
      </button>
      <button
        className="pagination-button"
        onClick={() => setPage(totalPages)}
        disabled={page === totalPages}
      >
        <ChevronsRight className="pagination-icon" />
      </button>
    </div>
  );
};

export default TablePagination; 