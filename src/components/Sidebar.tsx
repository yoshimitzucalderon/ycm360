import React, { useState } from "react";
import { FaDollarSign, FaCog, FaStore, FaBullhorn, FaUser, FaHome, FaFolderOpen, FaRegFileAlt, FaUsers, FaShareAlt } from "react-icons/fa";
import { IconType } from "react-icons";

const dashboards: { name: string; icon: IconType }[] = [
  { name: "Finanzas", icon: FaDollarSign },
  { name: "Administración", icon: FaCog },
  { name: "Comercialización", icon: FaStore },
  { name: "Marketing", icon: FaBullhorn },
];

const pages: { name: string; icon: IconType }[] = [
  { name: "User Profile", icon: FaUser },
  { name: "Overview", icon: FaHome },
  { name: "Projects", icon: FaFolderOpen },
  { name: "Campaigns", icon: FaBullhorn },
  { name: "Documents", icon: FaRegFileAlt },
  { name: "Followers", icon: FaUsers },
  { name: "Account", icon: FaCog },
  { name: "Social", icon: FaShareAlt },
];

const Sidebar = () => {
  const [selectedItem, setSelectedItem] = useState("Finanzas");

  const handleItemClick = (itemName: string) => {
    setSelectedItem(itemName);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <a href="#" onClick={() => setSelectedItem("Finanzas")}> {/* Simula navegación al dashboard */}
          <img src="/logo-ycm360.png" alt="YCM360 Logo" className="sidebar-logo-img" />
        </a>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">DASHBOARDS</div>
          <ul>
            {dashboards.map((item) => {
              const Icon: IconType = item.icon;
              return (
                <li
                  key={item.name}
                  className={selectedItem === item.name ? "sidebar-item active" : "sidebar-item"}
                  onClick={() => handleItemClick(item.name)}
                >
                  <span className="icon"><Icon /></span>
                  <span className="sidebar-text">{item.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">PAGES</div>
          <ul>
            {pages.map((item) => {
              const Icon: IconType = item.icon;
              return (
                <li
                  key={item.name}
                  className={selectedItem === item.name ? "sidebar-item active" : "sidebar-item"}
                  onClick={() => handleItemClick(item.name)}
                >
                  <span className="icon"><Icon /></span>
                  <span className="sidebar-text">{item.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
