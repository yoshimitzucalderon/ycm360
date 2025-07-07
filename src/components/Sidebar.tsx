import React from "react";

const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <img src="/logo-ycm360.png" alt="YCM360 Logo" className="sidebar-logo-img" />
    </div>
    <nav className="sidebar-nav">
      <div className="sidebar-section">
        <div className="sidebar-section-title">DASHBOARDS</div>
        <ul>
          <li className="active"><span className="icon">$</span> Finanzas</li>
          <li><span className="icon">⚙️</span> Administración</li>
          <li><span className="icon">💼</span> Comercialización</li>
          <li><span className="icon">📈</span> Marketing</li>
        </ul>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-section-title">PAGES</div>
        <ul>
          <li><span className="icon">👤</span> User Profile</li>
          <li><span className="icon">🏠</span> Overview</li>
          <li><span className="icon">📁</span> Projects</li>
          <li><span className="icon">📢</span> Campaigns</li>
          <li><span className="icon">📄</span> Documents</li>
          <li><span className="icon">👥</span> Followers</li>
          <li><span className="icon">⚙️</span> Account</li>
          <li><span className="icon">💬</span> Social</li>
        </ul>
      </div>
    </nav>
  </aside>
);

export default Sidebar;
