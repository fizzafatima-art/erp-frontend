import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/layout.css';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="layout">
      {/* Pass state to Sidebar so it knows when to collapse */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      {/* Add 'collapsed' class to main-content if sidebar is collapsed */}
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Header />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
