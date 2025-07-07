import React from "react";

const Header = () => (
  <header className="header">
    <div className="header-left">
      <span className="header-breadcrumb">Dashboards / <b>Default</b></span>
    </div>
    <div className="header-right">
      <input className="header-search" type="text" placeholder="Search" />
      <span className="header-icon">🔔</span>
      <span className="header-icon">👤</span>
    </div>
  </header>
);

export default Header; 