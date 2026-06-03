import React, { useState } from 'react';
import '../../styles/header.css';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">ERP System Dashboard</h1>
      </div>

      <div className="header-right">
        <div className="header-search">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="header-icons">
          <div className="icon-wrapper">
            <button
              className="header-icon"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
            >
              🔔
              <span className="notification-badge">3</span>
            </button>
            {notificationsOpen && (
              <div className="notification-dropdown">
                <div className="notification-item">Low stock alert</div>
                <div className="notification-item">New purchase order</div>
                <div className="notification-item">Invoice pending</div>
              </div>
            )}
          </div>

          <button className="header-icon" title="Settings">
            ⚙️
          </button>

          <button className="header-icon" title="Help">
            ❓
          </button>
        </div>

        <div className="user-menu">
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <div className="user-name">Admin User</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
