import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Axios seedha use karenge

// Backend API URL
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const n = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const cur = (v) => `Rs.${n(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      
      // Direct API Call (Service hata rahe hain seedha clear view ke liye)
      const res = await axios.get(`${API}/reports/dashboard`);
      
      console.log("Raw Response:", res.data); // Console check karo

      // Data Extract karna (Backend { success: true, data: {...} } bhejta hai)
      const row = res.data?.data ?? res.data; 

      setDashboard({
        totalSales: n(row.totalSales),
        totalPurchases: n(row.totalPurchases),
        totalExpenses: n(row.totalExpenses),
        outstandingPayables: n(row.outstandingPayables),
        outstandingReceivables: n(row.outstandingReceivables),
        lowStockCount: n(row.lowStockCount),
        recentPurchases: row.recentPurchases || [],
        recentSales: row.recentSales || []
      });

    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{padding:20, textAlign:'center'}}>Loading...</div>;
  if (error) return <div style={{padding:20, color:'red'}}>Error: {error} <button onClick={load}>Retry</button></div>;

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <h2 style={{ margin:'0 0 20px' }}>📊 Dashboard</h2>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:20, marginBottom:30 }}>
        
        {/* KPI Cards */}
        <KPICard title="Total Sales" value={cur(dashboard.totalSales)} icon="💳" color="#16a34a" />
        <KPICard title="Total Purchases" value={cur(dashboard.totalPurchases)} icon="🛒" color="#2563eb" />
        <KPICard title="Total Expenses" value={cur(dashboard.totalExpenses)} icon="💸" color="#dc2626" />
        <KPICard title="Outstanding Payables" value={cur(dashboard.outstandingPayables)} icon="📤" color="#7c3aed" />
        <KPICard title="Outstanding Receivables" value={cur(dashboard.outstandingReceivables)} icon="📥" color="#d97706" />
        <KPICard title="Low Stock Items" value={dashboard.lowStockCount} icon="📦" color="#ea580c" />

      </div>

      {/* Recent Transactions Section */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:'#fff', padding:20, borderRadius:10, boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Recent Sales</h3>
          {dashboard.recentSales && dashboard.recentSales.length > 0 ? (
            <table style={{ width:'100%', borderCollapse:'collapse', marginTop:10 }}>
              <thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>Invoice</th><th>Amount</th></tr></thead>
              <tbody>
                {dashboard.recentSales.map((s, i) => (
                  <tr key={i}><td>{s.invoiceNo}</td><td>{cur(s.totalAmount)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{color:'#888'}}>No recent sales.</p>}
        </div>

        <div style={{ background:'#fff', padding:20, borderRadius:10, boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Recent Purchases</h3>
          {dashboard.recentPurchases && dashboard.recentPurchases.length > 0 ? (
             <table style={{ width:'100%', borderCollapse:'collapse', marginTop:10 }}>
              <thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>Invoice</th><th>Amount</th></tr></thead>
              <tbody>
                {dashboard.recentPurchases.map((p, i) => (
                  <tr key={i}><td>{p.invoiceNo}</td><td>{cur(p.totalAmount)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{color:'#888'}}>No recent purchases.</p>}
        </div>
      </div>
    </div>
  );
}

// Simple KPI Card Component
function KPICard({ title, value, icon, color }) {
  return (
    <div style={{ background:'#fff', padding:20, borderRadius:12, border:'1px solid #f3f4f6', boxShadow:'0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontSize:24 }}>{icon}</span>
      </div>
      <div style={{ fontSize:12, color:'#6b7280', fontWeight:600, textTransform:'uppercase' }}>{title}</div>
      <div style={{ fontSize:24, fontWeight:700, color:color, marginTop:5 }}>{value}</div>
    </div>
  );
}
