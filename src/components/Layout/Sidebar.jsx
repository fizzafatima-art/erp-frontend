import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/sidebar.css';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const location = useLocation();

  const menuItems = [
    { path: '/', label: '📊 Dashboard', icon: '📊' },
    { path: '/vendors', label: '👥 Vendors', icon: '👥' },
    { path: '/products', label: '📦 Products', icon: '📦' },
    { path: '/purchases', label: '🛒 Purchases', icon: '🛒' },
    { path: '/sales', label: '💳 Sales', icon: '💳' },
    { path: '/stock', label: '📚 Stock', icon: '📚' },
    { path: '/expenses', label: '💸 Expenses', icon: '💸' },
    { path: '/ledger', label: '📒 Ledger', icon: '📒' },
    { path: '/reports', label: '📈 Reports', icon: '📈' },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      
      <div className="sidebar-header">
        <h2>ERP</h2>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="collapse-btn"
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${
              location.pathname === item.path ? 'active' : ''
            }`}
            title={item.label}
          >
            <span className="menu-icon">{item.icon}</span>
            
            {!isCollapsed && (
              <span className="menu-label">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

    </aside>
  );
}
