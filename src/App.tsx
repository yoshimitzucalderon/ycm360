import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import UserTable from "./components/UserTable";
import RightPanel from "./components/RightPanel";
import "./styles.css";

const App = () => {
  const [isFirstColumnPinned, setIsFirstColumnPinned] = useState(false);

  const handleToggleFirstColumnPin = () => {
    setIsFirstColumnPinned(prev => !prev);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header 
          isFirstColumnPinned={isFirstColumnPinned}
          onToggleFirstColumnPin={handleToggleFirstColumnPin}
        />
        <Tabs />
        <UserTable isFirstColumnPinned={isFirstColumnPinned} />
      </div>
      <RightPanel />
    </div>
  );
};

export default App;
