import React, { useState } from "react";

const Sidebar = () => {
  const [selectedItem, setSelectedItem] = useState("Finanzas");

  const handleItemClick = (itemName: string) => {
    setSelectedItem(itemName);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="./logo-ycm360.png" alt="YCM360 Logo" className="sidebar-logo-img" />
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">DASHBOARDS</div>
          <ul>
            <li 
              className={selectedItem === "Finanzas" ? "active" : ""}
              onClick={() => handleItemClick("Finanzas")}
            >
              <span className="icon">$</span> Finanzas
            </li>
            <li 
              className={selectedItem === "Administración" ? "active" : ""}
              onClick={() => handleItemClick("Administración")}
            >
              <span className="icon">⚙️</span> Administración
            </li>
            <li 
              className={selectedItem === "Comercialización" ? "active" : ""}
              onClick={() => handleItemClick("Comercialización")}
            >
              <span className="icon">💼</span> Comercialización
            </li>
            <li 
              className={selectedItem === "Marketing" ? "active" : ""}
              onClick={() => handleItemClick("Marketing")}
            >
              <span className="icon">📈</span> Marketing
            </li>
          </ul>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">PAGES</div>
          <ul>
            <li 
              className={selectedItem === "User Profile" ? "active" : ""}
              onClick={() => handleItemClick("User Profile")}
            >
              <span className="icon">👤</span> User Profile
            </li>
            <li 
              className={selectedItem === "Overview" ? "active" : ""}
              onClick={() => handleItemClick("Overview")}
            >
              <span className="icon">🏠</span> Overview
            </li>
            <li 
              className={selectedItem === "Projects" ? "active" : ""}
              onClick={() => handleItemClick("Projects")}
            >
              <span className="icon">📁</span> Projects
            </li>
            <li 
              className={selectedItem === "Campaigns" ? "active" : ""}
              onClick={() => handleItemClick("Campaigns")}
            >
              <span className="icon">📢</span> Campaigns
            </li>
            <li 
              className={selectedItem === "Documents" ? "active" : ""}
              onClick={() => handleItemClick("Documents")}
            >
              <span className="icon">📄</span> Documents
            </li>
            <li 
              className={selectedItem === "Followers" ? "active" : ""}
              onClick={() => handleItemClick("Followers")}
            >
              <span className="icon">👥</span> Followers
            </li>
            <li 
              className={selectedItem === "Account" ? "active" : ""}
              onClick={() => handleItemClick("Account")}
            >
              <span className="icon">⚙️</span> Account
            </li>
            <li 
              className={selectedItem === "Social" ? "active" : ""}
              onClick={() => handleItemClick("Social")}
            >
              <span className="icon">💬</span> Social
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
