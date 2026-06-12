import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const fmt = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
};

const TYPE_COLORS = {
  Purchase:   { bg: '#f0fdf4', color: '#16a34a' },
  Sale:       { bg: '#fef2f2', color: '#dc2626' },
  Adjustment: { bg: '#eff6ff', color: '#2563eb' },
  Return:     { bg: '#fefce8', color: '#d97706' },
};

export function StockReport() {
  const [movements, setMovements] = useState([]);
  const [stockSummary, setStockSummary] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('All');
  const [activeTab, setActiveTab] = useState('summary'); // summary | movement

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true); setError('');
      const [movRes, stockRes] = await Promise.all([
        axios.get(`${API}/stock/movement`),
        axios.get(`${API}/stock`)
      ]);
      setMovements(Array.isArray(movRes.data?.data) ? movRes.data.data : []);
      setStockSummary(Array.isArray(stockRes.data?.data) ? stockRes.data.data : []);
    } catch (e) {
      setError('Failed to load stock data.');
    } finally { setLoading(false); }
  };

  // Summary tab filters
  const filteredSummary = stockSummary.filter(r =>
    r.ProductName?.toLowerCase().includes(search.toLowerCase())
  );
  const totalStockValue = filteredSummary.reduce((sum, r) => sum + (n(r.CurrentQuantity) * n(r.Price)), 0);
  const lowStockCount   = filteredSummary.filter(r => n(r.CurrentQuantity) <= n(r.MinimumQuantity)).length;
  const outOfStock      = filteredSummary.filter(r => n(r.CurrentQuantity) === 0).length;

  // Movement tab filters
  const filteredMovements = movements.filter(r => {
    const matchSearch = r.ProductName?.toLowerCase().includes(search.toLowerCase());
    const matchType   = filterType === 'All' || r.MovementType === filterType;
    return matchSearch && matchType;
  });

  const totalIn  = filteredMovements.filter(r => r.MovementType === 'Purchase' || (r.MovementType === 'Adjustment') || r.MovementType === 'Return').reduce((s, r) => s + n(r.Quantity), 0);
  const totalOut = filteredMovements.filter(r => r.MovementType === 'Sale').reduce((s, r) => s + n(r.Quantity), 0);

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ margin:0 }}>📦 Stock Report</h2>
        <button onClick={loadData} style={S.btn('#6b7280')}>↻ Refresh</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <Card label="Total Products"   value={stockSummary.length}                                          color="#374151" />
        <Card label="Total Stock Value" value={`Rs.${totalStockValue.toLocaleString('en-IN', {minimumFractionDigits:0})}`} color="#2563eb" />
        <Card label="Low Stock Items"  value={lowStockCount}                                                color="#d97706" />
        <Card label="Out of Stock"     value={outOfStock}                                                   color="#dc2626" />
      </div>

      {error && <div style={S.err}>{error}</div>}

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:16, borderBottom:'2px solid #e5e7eb' }}>
        {['summary','movement'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); setFilterType('All'); }}
            style={{
              padding:'10px 24px', border:'none', cursor:'pointer', fontSize:14, fontWeight:600,
              background: activeTab===tab ? '#2563eb' : 'transparent',
              color:      activeTab===tab ? '#fff'    : '#6b7280',
              borderRadius: '6px 6px 0 0'
            }}>
            {tab === 'summary' ? '📊 Current Stock' : '📋 Stock Movement'}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input placeholder="Search product..." value={search}
          onChange={e=>setSearch(e.target.value)} style={S.search} />
        {activeTab === 'movement' && (
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={S.select}>
            <option value="All">All Types</option>
            <option value="Purchase">Purchase (IN)</option>
            <option value="Sale">Sale (OUT)</option>
            <option value="Adjustment">Adjustment</option>
            <option value="Return">Return</option>
          </select>
        )}
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          {/* SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                <thead><tr style={{ background:'#f3f4f6' }}>
                  {['#','Product','Category','Unit','Current Stock','Min Stock','Stock Value','Status'].map(h=>(
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredSummary.length === 0
                    ? <tr><td colSpan={8} style={S.empty}>No stock data found.</td></tr>
                    : filteredSummary.map((r, i) => {
                      const qty      = n(r.CurrentQuantity);
                      const minQty   = n(r.MinimumQuantity);
                      const price    = n(r.Price);
                      const value    = qty * price;
                      const isOut    = qty === 0;
                      const isLow    = qty <= minQty && qty > 0;
                      const statusLabel = isOut ? '❌ Out of Stock' : isLow ? '⚠️ Low Stock' : '✓ OK';
                      const statusColor = isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a';
                      const statusBg    = isOut ? '#fef2f2' : isLow ? '#fefce8' : '#f0fdf4';
                      return (
                        <tr key={r.ProductID} style={{ borderBottom:'1px solid #e5e7eb' }}>
                          <td style={S.td}>{i+1}</td>
                          <td style={{...S.td, fontWeight:600}}>{r.ProductName}</td>
                          <td style={S.td}>{r.Category || '-'}</td>
                          <td style={S.td}>{r.Unit}</td>
                          <td style={{...S.td, fontWeight:700, fontSize:15, color: isOut?'#dc2626': isLow?'#d97706':'#374151'}}>
                            {qty}
                          </td>
                          <td style={{...S.td, color:'#6b7280'}}>{minQty}</td>
                          <td style={{...S.td, fontWeight:600, color:'#2563eb'}}>
                            Rs.{value.toLocaleString('en-IN', {minimumFractionDigits:0})}
                          </td>
                          <td style={S.td}>
                            <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600, background:statusBg, color:statusColor }}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
                {filteredSummary.length > 0 && (
                  <tfoot>
                    <tr style={{ background:'#f3f4f6', fontWeight:700 }}>
                      <td colSpan={6} style={{...S.td, textAlign:'right'}}>Total Stock Value:</td>
                      <td style={{...S.td, color:'#2563eb', fontSize:15}}>
                        Rs.{totalStockValue.toLocaleString('en-IN', {minimumFractionDigits:0})}
                      </td>
                      <td style={S.td}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* MOVEMENT TAB */}
          {activeTab === 'movement' && (
            <>
              <div style={{ display:'flex', gap:14, marginBottom:14, flexWrap:'wrap' }}>
                <Card label="Total IN"  value={totalIn}  color="#16a34a" />
                <Card label="Total OUT" value={totalOut} color="#dc2626" />
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                  <thead><tr style={{ background:'#f3f4f6' }}>
                    {['#','Date','Product','Unit','Type','Qty IN','Qty OUT','Current Stock','Remarks'].map(h=>(
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredMovements.length === 0
                      ? <tr><td colSpan={9} style={S.empty}>No movement records found.</td></tr>
                      : filteredMovements.map((r, i) => {
                        const isIn  = r.MovementType === 'Purchase' || r.MovementType === 'Adjustment' || r.MovementType === 'Return';
                        const isOut = r.MovementType === 'Sale';
                        const tc    = TYPE_COLORS[r.MovementType] || { bg:'#f3f4f6', color:'#374151' };
                        return (
                          <tr key={r.MovementID ?? i} style={{ borderBottom:'1px solid #e5e7eb' }}>
                            <td style={S.td}>{i+1}</td>
                            <td style={S.td}>{fmt(r.Date)}</td>
                            <td style={{...S.td, fontWeight:600}}>{r.ProductName}</td>
                            <td style={S.td}>{r.Unit}</td>
                            <td style={S.td}>
                              <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600, background:tc.bg, color:tc.color }}>
                                {r.MovementType}
                              </span>
                            </td>
                            <td style={{...S.td, color:'#16a34a', fontWeight:600}}>
                              {isIn ? `+${n(r.Quantity)}` : '-'}
                            </td>
                            <td style={{...S.td, color:'#dc2626', fontWeight:600}}>
                              {isOut ? `-${n(r.Quantity)}` : '-'}
                            </td>
                            <td style={{...S.td, fontWeight:700}}>{n(r.CurrentQuantity)}</td>
                            <td style={{...S.td, color:'#6b7280', fontSize:12}}>{r.Remarks || '-'}</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default StockReport;

function Card({ label, value, color }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'14px 20px', minWidth:150 }}>
      <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

const S = {
  search: { padding:'8px 12px', width:260, borderRadius:6, border:'1px solid #d1d5db', fontSize:14 },
  select: { padding:'8px 12px', borderRadius:6, border:'1px solid #d1d5db', fontSize:14, background:'#fff' },
  th:     { padding:'10px 12px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #e5e7eb', whiteSpace:'nowrap' },
  td:     { padding:'10px 12px', verticalAlign:'middle' },
  empty:  { textAlign:'center', padding:28, color:'#6b7280' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:14 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'9px 18px', cursor:'pointer', fontSize:14, fontWeight:500 }),
};