import React from "react";
import { Bell, Activity, User, Circle } from "lucide-react";

const RightPanel = () => (
  <aside className="right-panel">
    <section className="right-panel-section">
      <h4><Bell size={18} style={{marginRight: 6, verticalAlign: 'middle'}} /> Notifications</h4>
      <ul>
        <li><Circle size={12} color="#0ea5e9" style={{marginRight: 6, verticalAlign: 'middle'}} /> You have a bug that needs... <span className="time">Just now</span></li>
        <li><Circle size={12} color="#0ea5e9" style={{marginRight: 6, verticalAlign: 'middle'}} /> New user registered <span className="time">59 minutes ago</span></li>
        <li><Circle size={12} color="#0ea5e9" style={{marginRight: 6, verticalAlign: 'middle'}} /> Andi Lane subscribed to you <span className="time">Today, 11:59 AM</span></li>
      </ul>
    </section>
    <section className="right-panel-section">
      <h4><Activity size={18} style={{marginRight: 6, verticalAlign: 'middle'}} /> Activities</h4>
      <ul>
        <li><Circle size={12} color="#222" style={{marginRight: 6, verticalAlign: 'middle'}} /> Released a new version <span className="time">59 minutes ago</span></li>
        <li><Circle size={12} color="#222" style={{marginRight: 6, verticalAlign: 'middle'}} /> Modified data in Page X <span className="time">Today, 11:59 AM</span></li>
      </ul>
    </section>
    <section className="right-panel-section">
      <h4><User size={18} style={{marginRight: 6, verticalAlign: 'middle'}} /> Contacts</h4>
      <ul>
        <li><Circle size={12} color="#22c55e" style={{marginRight: 6, verticalAlign: 'middle'}} /> Natali Craig</li>
        <li><Circle size={12} color="#ef4444" style={{marginRight: 6, verticalAlign: 'middle'}} /> Drew Cano</li>
        <li><Circle size={12} color="#222" style={{marginRight: 6, verticalAlign: 'middle'}} /> Orlando Diggs</li>
      </ul>
    </section>
  </aside>
);

export default RightPanel; 