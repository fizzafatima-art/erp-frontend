import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';

// All pages — using default exports from our fixed files
import Dashboard from './pages/Dashboard';
import Vendors   from './pages/Vendors';
import Products  from './pages/Products';
import Purchases from './pages/Purchases';
import Sales     from './pages/Sales';
import Stock     from './pages/Stock';
import StockReport from './pages/StockReport';
import Expenses  from './pages/Expenses';
import Ledger    from './pages/Ledger';
import Reports   from './pages/Reports';
import { WarehouseReport } from './pages/WarehouseReport';
import NotFound  from './pages/NotFound';

const NAV_ITEMS = [
  { path: '/dashboard',    label: 'Dashboard',    icon: '📊' },
  { path: '/vendors',      label: 'Vendors',      icon: '👥' },
  { path: '/products',     label: 'Products',     icon: '📦' },
  { path: '/purchases',    label: 'Purchases',    icon: '🛒' },
  { path: '/sales',        label: 'Sales',        icon: '💳' },
  { path: '/stock',        label: 'Stock',        icon: '📚' },
  { path: '/stock-report', label: 'Stock Report', icon: '📊' }, // ← ADD
  { path: '/expenses',     label: 'Expenses',     icon: '💸' },
  { path: '/ledger',       label: 'Ledger',       icon: '📒' },
  { path: '/reports',      label: 'Reports',      icon: '📈' },
];

export default function App() {
  return (
    <Router>
      <div style={S.shell}>
        {/* Sidebar */}
        <aside style={S.sidebar}>
          <div style={S.logo}>
            <span style={{ fontSize: 22 }}>🏢</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>ERP System</span>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto' }}>
            {NAV_ITEMS.map(({ path, label, icon }) => (
              <NavLink key={path} to={path} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 20px', textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                fontSize: 14, fontWeight: isActive ? 600 : 400,
              })}>
                <span style={{ fontSize: 16 }}>{icon}</span>{label}
              </NavLink>
            ))}
          </nav>
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>ERP v1.0</div>
          </div>
        </aside>

        {/* Main */}
        <div style={S.mainWrapper}>
          <header style={S.topbar}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>ERP System</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 18, cursor: 'pointer' }}>🔔</span>
              <span style={{ fontSize: 18, cursor: 'pointer' }}>⚙️</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>A</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.2 }}>Admin User</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Administrator</div>
                </div>
              </div>
            </div>
          </header>
          <main style={S.content}>
            <Routes>
              <Route path="/"           element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/vendors"    element={<Vendors />} />
              <Route path="/products"   element={<Products />} />
              
              <Route path="/purchases"  element={<Purchases />} />
              <Route path="/stock-report" element={<StockReport />} />
              <Route path="/sales"      element={<Sales />} />
              <Route path="/stock"      element={<Stock />} />
              <Route path="/expenses"   element={<Expenses />} />
              <Route path="/ledger"     element={<Ledger />} />
              <Route path="/reports"    element={<Reports />} />
              <Route path="/warehouse-report" element={<WarehouseReport />} />
              <Route path="*"           element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

const S = {
  shell:       { display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f3f4f6' },
  sidebar:     { width: 220, minWidth: 220, flexShrink: 0, background: '#1e3a5f', display: 'flex', flexDirection: 'column', height: '100vh' },
  logo:        { display: 'flex', alignItems: 'center', gap: 10, padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 },
  mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 },
  topbar:      { height: 56, minHeight: 56, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  content:     { flex: 1, overflowY: 'auto', background: '#f3f4f6' },
};
