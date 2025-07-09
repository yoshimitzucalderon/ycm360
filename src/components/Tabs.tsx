import React, { useState } from "react";

const tabLabels = [
  "Overview",
  "Targets",
  "Budget",
  "Users",
  "Files",
  "Activity",
  "Settings"
];

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("Users");
  return (
    <div className="tabs">
      {tabLabels.map(label => (
        <button
          key={label}
          className={"tab" + (activeTab === label ? " active" : "")}
          onClick={() => setActiveTab(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default Tabs; 