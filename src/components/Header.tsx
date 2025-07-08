import React from "react";
import Logo from "./Logo";
import { FaBell, FaUserCircle } from "react-icons/fa";

const Header = () => (
  <header className="header">
    <div className="header-left">
      <Logo />
    </div>
    <div className="header-center">
      <input className="header-search" type="text" placeholder="Search" />
    </div>
    <div className="header-right">
      <span className="header-icon"><FaBell /></span>
      <span className="header-icon"><FaUserCircle /></span>
    </div>
  </header>
);

export default Header; 