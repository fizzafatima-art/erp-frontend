import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s   = (v) => (v == null ? '' : String(v));
const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
};
const cur = (v) => `Rs.${n(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export function Ledger() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [typeFilter, setType]   = useState('All');
  const [vendorFilter, setVendor] = useState('All');
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/ledger`);
      const raw = res.data;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      // Sort by date ascending for running balance
      arr.sort((a,b) => new Date(a.TransactionDate||a.transactionDate) - new Date(b.TransactionDate||b.transactionDate));
      setRows(arr);
    } catch (e) {
      setError('Failed to load ledger.');
    } finally { setLoading(false); }
  };

  const types   = ['All', ...new Set(rows.map(r => s(r.TransactionType??r.transactionType)).filter(Boolean))];
  const vendors = ['All', ...new Set(rows.map(r => s(r.VendorName)).filter(Boolean))];

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = s(r.VendorName).toLowerCase().includes(q)
      || s(r.Remarks??r.Description??r.Narration??r.description).toLowerCase().includes(q)
      || s(r.InvoiceNo).toLowerCase().includes(q);
    const matchType   = typeFilter   === 'All' || s(r.TransactionType??r.transactionType) === typeFilter;
    const matchVendor = vendorFilter === 'All' || s(r.VendorName) === vendorFilter;
    const matchFrom   = !from || new Date(r.TransactionDate||r.transactionDate) >= new Date(from);
    const matchTo     = !to   || new Date(r.TransactionDate||r.transactionDate) <= new Date(to);
    return matchSearch && matchType && matchVendor && matchFrom && matchTo;
  });

  // Running balance — sorted oldest first
  let runBalance = 0;
  const withBalance = filtered.map(r => {
    const dr = n(r.Debit??r.debit);
    const cr = n(r.Credit??r.credit);
    runBalance = runBalance + cr - dr;
    return { ...r, _runBal: runBalance };
  });

  const totalDebit  = filtered.reduce((s,r) => s + n(r.Debit??r.debit), 0);
  const totalCredit = filtered.reduce((s,r) => s + n(r.Credit??r.credit), 0);
  const netBalance  = totalCredit - totalDebit;

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <div style={S.hdr}>
        <div>
          <h2 style={{ margin:'0 0 4px' }}>📒 General Ledger</h2>
          <p style={{ margin:0, color:'#6b7280', fontSize:13 }}>Date-wise transaction history with running balance</p>
        </div>
        <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <KPI label="Total Debit"  value={cur(totalDebit)}  color="#dc2626" bg="#fef2f2" bdr="#fca5a5" />
        <KPI label="Total Credit" value={cur(totalCredit)} color="#16a34a" bg="#f0fdf4" bdr="#86efac" />
        <KPI label="Net Balance"  value={cur(Math.abs(netBalance))+' '+(netBalance>=0?'Cr':'Dr')}
          color={netBalance>=0?'#2563eb':'#dc2626'} bg="#eff6ff" bdr="#93c5fd" />
        <KPI label="Entries" value={filtered.length} color="#374151" bg="#f9fafb" bdr="#e5e7eb" />
      </div>

      {error && <div style={S.err}>{error}</div>}

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="Search vendor, invoice, remarks..." value={search}
          onChange={e=>setSearch(e.target.value)} style={S.search} />
        <select value={typeFilter} onChange={e=>setType(e.target.value)} style={S.select}>
          {types.map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={vendorFilter} onChange={e=>setVendor(e.target.value)} style={{...S.select, maxWidth:180}}>
          {vendors.map(t=><option key={t}>{t}</option>)}
        </select>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={S.select} title="From date" />
        <input type="date" value={to}   onChange={e=>setTo(e.target.value)}   style={S.select} title="To date" />
        <button onClick={()=>{setFrom('');setTo('');setSearch('');setType('All');setVendor('All');}}
          style={S.btn('#6b7280')}>Clear</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#1e3a5f', color:'#fff' }}>
                {['#','Date','Vendor / Customer','Type','Invoice','Remarks','Debit','Credit','Balance'].map(h=>(
                  <th key={h} style={{...S.th, background:'#1e3a5f', color:'#fff', borderBottom:'none'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withBalance.length===0
                ? <tr><td colSpan={9} style={S.empty}>No ledger entries found.</td></tr>
                : withBalance.map((r,i) => {
                  const dr  = n(r.Debit??r.debit);
                  const cr  = n(r.Credit??r.credit);
                  const bal = r._runBal;
                  const txType = s(r.TransactionType??r.transactionType);
                  const typeColor = txType==='Sale'?'#16a34a':txType==='Purchase'?'#2563eb':txType==='Payment'?'#7c3aed':'#374151';
                  const typeBg   = txType==='Sale'?'#f0fdf4':txType==='Purchase'?'#eff6ff':txType==='Payment'?'#faf5ff':'#f3f4f6';
                  return (
                    <tr key={r.LedgerID??r.id??i}
                      style={{ borderBottom:'1px solid #e5e7eb', background:i%2===0?'#fff':'#fafafa' }}>
                      <td style={{...S.td, color:'#9ca3af', fontSize:11}}>{i+1}</td>
                      <td style={{...S.td, whiteSpace:'nowrap', fontWeight:500}}>{fmt(r.TransactionDate??r.transactionDate)}</td>
                      <td style={{...S.td, fontWeight:600, maxWidth:160}}>{s(r.VendorName)||'—'}</td>
                      <td style={S.td}>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600,
                          background:typeBg, color:typeColor }}>
                          {txType||'—'}
                        </span>
                      </td>
                      <td style={{...S.td, fontSize:12, color:'#6b7280'}}>{s(r.InvoiceNo)||'—'}</td>
                      <td style={{...S.td, maxWidth:200, fontSize:12}}>{s(r.Remarks??r.Description??r.Narration??r.description)||'—'}</td>
                      <td style={{...S.td, color:dr>0?'#dc2626':'#d1d5db', fontWeight:dr>0?700:400, textAlign:'right'}}>
                        {dr>0 ? cur(dr) : '—'}
                      </td>
                      <td style={{...S.td, color:cr>0?'#16a34a':'#d1d5db', fontWeight:cr>0?700:400, textAlign:'right'}}>
                        {cr>0 ? cur(cr) : '—'}
                      </td>
                      <td style={{...S.td, fontWeight:700, textAlign:'right',
                        color:bal>=0?'#2563eb':'#dc2626'}}>
                        {cur(Math.abs(bal))} <span style={{fontSize:10}}>{bal>=0?'Cr':'Dr'}</span>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
            {withBalance.length > 0 && (
              <tfoot>
                <tr style={{ background:'#1e3a5f', color:'#fff', fontWeight:700 }}>
                  <td colSpan={6} style={{...S.td, textAlign:'right', color:'#fff'}}>TOTALS:</td>
                  <td style={{...S.td, textAlign:'right', color:'#fca5a5'}}>{cur(totalDebit)}</td>
                  <td style={{...S.td, textAlign:'right', color:'#86efac'}}>{cur(totalCredit)}</td>
                  <td style={{...S.td, textAlign:'right', color:netBalance>=0?'#93c5fd':'#fca5a5'}}>
                    {cur(Math.abs(netBalance))} {netBalance>=0?'Cr':'Dr'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

export default Ledger;

function KPI({ label, value, color, bg, bdr }) {
  return (
    <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:10, padding:'12px 16px', minWidth:160 }}>
      <div style={{ fontSize:11, color:'#6b7280', fontWeight:500, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

const S = {
  hdr:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  search: { padding:'8px 12px', width:220, borderRadius:6, border:'1px solid #d1d5db', fontSize:13 },
  select: { padding:'8px 10px', borderRadius:6, border:'1px solid #d1d5db', fontSize:13 },
  th:     { padding:'10px 12px', textAlign:'left', fontWeight:600, whiteSpace:'nowrap' },
  td:     { padding:'9px 12px', verticalAlign:'middle' },
  empty:  { textAlign:'center', padding:28, color:'#6b7280' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:13 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:500 }),
};