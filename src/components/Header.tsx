import React from "react";
import YCM360Logo from "./YCM360Logo";
import { FaBell, FaUserCircle } from "react-icons/fa";

const BellIcon = FaBell as React.ElementType;
const UserIcon = FaUserCircle as React.ElementType;

const Header = () => (
  <header className="header">
    <div className="header-left">
      <YCM360Logo />
    </div>
    <div className="header-center">
      <input className="header-search" type="text" placeholder="Search" />
    </div>
    <div className="header-right">
      <span className="header-icon"><BellIcon /></span>
      <span className="header-icon"><UserIcon /></span>
    </div>
  </header>
);

export default Header; 