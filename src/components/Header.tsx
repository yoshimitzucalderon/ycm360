import React, { useState } from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { Search, X as XIcon } from 'lucide-react';

const BellIcon = FaBell as React.ElementType;
const UserIcon = FaUserCircle as React.ElementType;

const Header = () => {
  const [search, setSearch] = useState("");
  return (
    <header className="header">
      <div className="header-left">
        {/* Logo eliminado, solo iconos o contenido adicional aquí si se requiere */}
      </div>
      <div className="header-center">
        <div className="header-searchbox" style={{ position: 'relative' }}>
          <Search className="header-search-icon" size={18} />
          <input
            className="header-search"
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              tabIndex={-1}
              aria-label="Limpiar búsqueda"
              style={{ right: 8, top: '50%', transform: 'translateY(-50%)', position: 'absolute' }}
            >
              <XIcon className="search-clear-icon" />
            </button>
          )}
        </div>
      </div>
      <div className="header-right">
        <span className="header-icon"><BellIcon /></span>
        <span className="header-icon"><UserIcon /></span>
      </div>
    </header>
  );
};

export default Header; 