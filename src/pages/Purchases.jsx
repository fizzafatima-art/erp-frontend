import React, { useState, useEffect } from 'react';
import axios from 'axios';

// MATCHES backend: GET /api/v1/purchases → returns { success, data: [{...VendorName, ...}] }
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s   = (v) => (v == null ? '' : String(v));
const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

// Named export — matches existing Purchases.jsx convention
export function Purchases() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/purchases`);
      const raw = res.data;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setRows(arr);
    } catch (e) {
      setError('Failed to load purchases. Check backend connection.');
    } finally { setLoading(false); }
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return s(r.VendorName).toLowerCase().includes(q) || s(r.InvoiceNo).toLowerCase().includes(q);
  });

  const total = filtered.reduce((sum, r) => sum + n(r.TotalAmount ?? r.totalAmount), 0);

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <div style={S.hdr}>
        <h2 style={{ margin:0 }}>🛒 Purchases</h2>
        <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
      </div>

      {/* Summary */}
      <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <Card label="Total Purchases" value={`₹${total.toLocaleString('en-IN',{minimumFractionDigits:2})}`} color="#2563eb" />
        <Card label="Records" value={rows.length} color="#374151" />
        <Card label="Unpaid"
          value={rows.filter(r=>s(r.PaymentStatus).toLowerCase()!=='paid').length}
          color="#dc2626" />
      </div>

      {error && <div style={S.err}>{error}</div>}

      <input placeholder="Search vendor or invoice…" value={search}
        onChange={e=>setSearch(e.target.value)} style={S.search} />

      {loading ? <p>Loading…</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr style={{ background:'#f3f4f6' }}>
              {['#','Date','Vendor','Invoice #','Total','Paid','Balance','Status'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={8} style={S.empty}>No purchase records found.</td></tr>
                : filtered.map((r,i) => {
                  const status = s(r.PaymentStatus ?? r.paymentStatus) || 'Pending';
                  const isPaid = status.toLowerCase() === 'paid';
                  return (
                    <tr key={r.PurchaseID ?? i} style={{ borderBottom:'1px solid #e5e7eb' }}>
                      <td style={S.td}>{i+1}</td>
                      <td style={S.td}>{fmt(r.PurchaseDate ?? r.purchaseDate)}</td>
                      <td style={{ ...S.td, fontWeight:500 }}>{s(r.VendorName)||'—'}</td>
                      <td style={S.td}>{s(r.InvoiceNo)||'—'}</td>
                      <td style={{ ...S.td, fontWeight:600 }}>₹{n(r.TotalAmount).toFixed(2)}</td>
                      <td style={S.td}>₹{n(r.PaidAmount ?? r.paidAmount).toFixed(2)}</td>
                      <td style={{ ...S.td, color: n(r.BalanceAmount)>0?'#dc2626':'#16a34a', fontWeight:600 }}>
                        ₹{n(r.BalanceAmount ?? r.balanceAmount).toFixed(2)}
                      </td>
                      <td style={S.td}>
                        <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600,
                          background: isPaid?'#f0fdf4':'#fef2f2',
                          color:      isPaid?'#16a34a':'#dc2626' }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Also export as default so both import styles work
export default Purchases;

function Card({ label, value, color }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'14px 20px', minWidth:150 }}>
      <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

const S = {
  hdr:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  search: { padding:'8px 12px', width:280, borderRadius:6, border:'1px solid #d1d5db', marginBottom:16, fontSize:14 },
  th:     { padding:'10px 12px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #e5e7eb' },
  td:     { padding:'10px 12px', verticalAlign:'middle' },
  empty:  { textAlign:'center', padding:28, color:'#6b7280' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:14 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'9px 18px', cursor:'pointer', fontSize:14, fontWeight:500 }),
};