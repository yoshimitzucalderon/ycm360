import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Briefcase,
  TrendingUp,
  ListTodo,
  CalendarDays,
  Files,
  BellRing,
  MessagesSquare,
  Cog
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  Users,
  CreditCard,
  Briefcase,
  TrendingUp,
  ListTodo,
  CalendarDays,
  Files,
  BellRing,
  MessagesSquare,
  Cog
};

const menuBlocks = [
  [
    { key: 'dashboards', label: 'Dashboards', icon: 'LayoutDashboard' },
    { key: 'administracion', label: 'Administración', icon: 'Users' },
    { key: 'finanzas', label: 'Finanzas', icon: 'CreditCard' },
    { key: 'proyectos', label: 'Proyectos', icon: 'Briefcase' }
  ],
  [
    { key: 'reportes', label: 'Reportes', icon: 'TrendingUp' },
    { key: 'tareas', label: 'Tareas', icon: 'ListTodo' },
    { key: 'calendario', label: 'Calendario', icon: 'CalendarDays' },
    { key: 'documentos', label: 'Documentos', icon: 'Files' }
  ],
  [
    { key: 'notificaciones', label: 'Notificaciones', icon: 'BellRing' },
    { key: 'chat', label: 'Chat', icon: 'MessagesSquare' },
    { key: 'configuracion', label: 'Configuración', icon: 'Cog' }
  ]
];

const SidebarItem = ({ item, isActive, onClick }) => {
  const Icon = iconMap[item.icon];
  return (
    <div
      className={`sidebar-item${isActive ? ' active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <Icon className="sidebar-icon" />
      <span className="sidebar-text">{item.label}</span>
    </div>
  );
};

const SidebarMenu = () => {
  const [activeItem, setActiveItem] = useState('dashboards');
  return (
    <nav className="sidebar">
      {menuBlocks.map((block, blockIndex) => (
        <div key={blockIndex} className="sidebar-block">
          {block.map((item) => (
            <SidebarItem
              key={item.key}
              item={item}
              isActive={activeItem === item.key}
              onClick={() => setActiveItem(item.key)}
            />
          ))}
        </div>
      ))}
    </nav>
  );
};

export default SidebarMenu;
