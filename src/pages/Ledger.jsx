import React, { useState, useEffect } from 'react';
import axios from 'axios';

// MATCHES backend: GET /api/v1/ledger → getGeneralLedger
// Returns: l.*, v.VendorName  FROM Ledger l JOIN Vendors v ON l.VendorCustomerID = v.VendorID
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s   = (v) => (v == null ? '' : String(v));
const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

export function Ledger() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState('All');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/ledger`);
      const raw = res.data;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setRows(arr);
    } catch (e) {
      setError('Failed to load ledger. Check backend connection.');
    } finally { setLoading(false); }
  };

  // All unique transaction types for filter
  const types = ['All', ...new Set(rows.map(r => s(r.TransactionType ?? r.transactionType)).filter(Boolean))];

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = s(r.VendorName).toLowerCase().includes(q)
      || s(r.Description ?? r.Narration).toLowerCase().includes(q);
    const matchType = typeFilter === 'All'
      || s(r.TransactionType ?? r.transactionType) === typeFilter;
    return matchSearch && matchType;
  });

  // Running balance
  let runBalance = 0;
  const withBalance = [...filtered].reverse().map(r => {
    const dr = n(r.Debit  ?? r.debit);
    const cr = n(r.Credit ?? r.credit);
    runBalance += cr - dr;
    return { ...r, _runBal: runBalance };
  }).reverse();

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <div style={S.hdr}>
        <h2 style={{ margin:0 }}>📒 General Ledger</h2>
        <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
      </div>

      {error && <div style={S.err}>{error}</div>}

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="Search vendor or description…" value={search}
          onChange={e=>setSearch(e.target.value)} style={{ ...S.search, marginBottom:0 }} />
        <select value={typeFilter} onChange={e=>setType(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:6, border:'1px solid #d1d5db', fontSize:14 }}>
          {types.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <p>Loading…</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr style={{ background:'#f3f4f6' }}>
              {['#','Date','Vendor / Customer','Type','Description','Debit (Rs.)','Credit (Rs.)','Balance'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {withBalance.length===0
                ? <tr><td colSpan={8} style={S.empty}>No ledger entries found.</td></tr>
                : withBalance.map((r,i) => {
                  const dr  = n(r.Debit  ?? r.debit);
                  const cr  = n(r.Credit ?? r.credit);
                  const bal = n(r.Balance ?? r.balance ?? r._runBal);
                  return (
                    <tr key={r.LedgerID ?? r.id ?? i}
                      style={{ borderBottom:'1px solid #e5e7eb', background: i%2===0?'#fff':'#fafafa' }}>
                      <td style={S.td}>{i+1}</td>
                      <td style={S.td}>{fmt(r.TransactionDate ?? r.transactionDate ?? r.Date)}</td>
                      <td style={{ ...S.td, fontWeight:500 }}>{s(r.VendorName)||'—'}</td>
                      <td style={S.td}>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:12, fontWeight:600,
                          background:'#eff6ff', color:'#2563eb' }}>
                          {s(r.TransactionType ?? r.transactionType)||'—'}
                        </span>
                      </td>
                      <td style={S.td}>{s(r.Description ?? r.Narration ?? r.description)||'—'}</td>
                      <td style={{ ...S.td, color: dr>0?'#dc2626':'#9ca3af', fontWeight: dr>0?600:400 }}>
                        {dr>0 ? `Rs.${dr.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ ...S.td, color: cr>0?'#16a34a':'#9ca3af', fontWeight: cr>0?600:400 }}>
                        {cr>0 ? `Rs.${cr.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ ...S.td, fontWeight:700, color: bal>=0?'#2563eb':'#dc2626' }}>
                        Rs.{Math.abs(bal).toFixed(2)} {bal<0?'Dr':'Cr'}
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

export default Ledger;

const S = {
  hdr:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  search: { padding:'8px 12px', width:280, borderRadius:6, border:'1px solid #d1d5db', fontSize:14 },
  th:     { padding:'10px 12px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #e5e7eb' },
  td:     { padding:'10px 12px', verticalAlign:'middle' },
  empty:  { textAlign:'center', padding:28, color:'#6b7280' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:14 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'9px 18px', cursor:'pointer', fontSize:14, fontWeight:500 }),
};
