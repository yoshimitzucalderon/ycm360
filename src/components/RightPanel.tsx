import React from "react";

const RightPanel = () => (
  <aside className="right-panel">
    <section className="right-panel-section">
      <h4>Notifications</h4>
      <ul>
        <li>🔵 You have a bug that needs... <span className="time">Just now</span></li>
        <li>🔵 New user registered <span className="time">59 minutes ago</span></li>
        <li>🔵 Andi Lane subscribed to you <span className="time">Today, 11:59 AM</span></li>
      </ul>
    </section>
    <section className="right-panel-section">
      <h4>Activities</h4>
      <ul>
        <li>⚫ Released a new version <span className="time">59 minutes ago</span></li>
        <li>⚫ Modified data in Page X <span className="time">Today, 11:59 AM</span></li>
      </ul>
    </section>
    <section className="right-panel-section">
      <h4>Contacts</h4>
      <ul>
        <li>🟢 Natali Craig</li>
        <li>🔴 Drew Cano</li>
        <li>⚫ Orlando Diggs</li>
      </ul>
    </section>
  </aside>
);

export default RightPanel; 