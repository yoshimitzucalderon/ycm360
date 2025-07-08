import React from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { Search } from 'lucide-react';

const BellIcon = FaBell as React.ElementType;
const UserIcon = FaUserCircle as React.ElementType;

const Header = () => (
  <header className="header">
    <div className="header-left">
      {/* Logo eliminado, solo iconos o contenido adicional aquí si se requiere */}
    </div>
    <div className="header-center">
      <div className="header-searchbox">
        <Search className="header-search-icon" size={18} />
        <input
          className="header-search"
          type="text"
          placeholder="Search..."
        />
        <span className="header-search-shortcut">Ctrl+K</span>
      </div>
    </div>
    <div className="header-right">
      <span className="header-icon"><BellIcon /></span>
      <span className="header-icon"><UserIcon /></span>
    </div>
  </header>
);

export default Header; 