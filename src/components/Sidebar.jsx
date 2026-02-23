import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Folder,
  Link2,
  BarChart2,
  Users,
  Flag,
  Inbox,
  Settings,
  ShieldCheck,
  Menu,
  ChevronLeft,
} from 'lucide-react';

import './Sidebar.css';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { pathname } = useLocation();
  const { role } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { to: '/projects', label: 'Projects', icon: <Folder size={18} /> },
    { to: '/backlinks', label: 'Main DataBase', icon: <Link2 size={18} /> },
    { to: '/reports', label: 'Reports', icon: <BarChart2 size={18} /> },
    { to: '/team', label: 'Team', icon: <Users size={18} /> },
    { to: '/goals', label: 'Goals', icon: <Flag size={18} /> },
    { to: '/inbox', label: 'Inbox', icon: <Inbox size={18} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
    ...(role === 'admin'
      ? [
          { to: '/admin/users', label: 'Manage Users', icon: <ShieldCheck size={18} /> },
          { to: '/trash', label: 'Trash', icon: <Folder size={18} /> },
        ]
      : []),
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h2 className="brand">Menu</h2>}

        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.to} className={pathname === item.to ? 'active' : ''}>
            <Link to={item.to}>
              <span className="icon">{item.icon}</span>
              {!collapsed && <span className="label">{item.label}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
