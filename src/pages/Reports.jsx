import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// MATCHES backend routes:
//   GET /api/v1/sales      → getAllSales
//   GET /api/v1/purchases  → getAllPurchases
//   GET /api/v1/expenses   → getAllExpenses
//   GET /api/v1/reports/outstanding → getOutstanding
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const s   = (v) => (v == null ? '' : String(v));
const cur = (v) => `₹${n(v).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

const TABS = ['Summary','Sales','Purchases','Expenses'];

export default function Reports() {
  const [tab, setTab]         = useState('Summary');
  const [data, setData]       = useState({ sales:[], purchases:[], expenses:[] });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');

  // useCallback fixes ESLint exhaustive-deps warning
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const params = {};
      if (from) params.from = from;
      if (to)   params.to   = to;

      const extract = (res, keys) => {
        if (res.status !== 'fulfilled') return [];
        const d = res.value.data;
        if (Array.isArray(d)) return d;
        for (const k of keys) if (Array.isArray(d?.[k])) return d[k];
        return [];
      };

      const [sR, pR, eR] = await Promise.allSettled([
        axios.get(`${API}/sales`,     { params }),
        axios.get(`${API}/purchases`, { params }),
        axios.get(`${API}/expenses`,  { params }),
      ]);

      setData({
        sales:     extract(sR, ['data','sales']),
        purchases: extract(pR, ['data','purchases']),
        expenses:  extract(eR, ['data','expenses']),
      });
    } catch { setError('Failed to load report data.'); }
    finally  { setLoading(false); }
  }, [from, to]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totals = {
    sales:     data.sales.reduce((s,r)=>s+n(r.TotalAmount??r.totalAmount??r.Amount??r.amount),0),
    purchases: data.purchases.reduce((s,r)=>s+n(r.TotalAmount??r.totalAmount??r.Amount??r.amount),0),
    expenses:  data.expenses.reduce((s,r)=>s+n(r.Amount??r.amount),0),
  };
  totals.net = totals.sales - totals.purchases - totals.expenses;

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif', maxWidth:1100 }}>
      <h2 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700 }}>📈 Reports</h2>
      <p style={{ margin:'0 0 20px', color:'#6b7280', fontSize:14 }}>Financial overview &amp; transaction history</p>

      {/* Date filter */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div>
          <label style={S.lbl}>From</label>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={S.dInput} />
        </div>
        <div>
          <label style={S.lbl}>To</label>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={S.dInput} />
        </div>
        <button onClick={fetchAll} style={S.btn('#2563eb')}>Apply</button>
        <button onClick={()=>{setFrom('');setTo('');}} style={S.btn('#6b7280')}>Clear</button>
      </div>

      {error && <div style={S.err}>{error}</div>}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:'2px solid #e5e7eb', marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'9px 18px', fontSize:14, fontWeight:500, border:'none', cursor:'pointer',
            borderRadius:'6px 6px 0 0', marginBottom:-2,
            background: tab===t?'#2563eb':'transparent',
            color:      tab===t?'#fff':'#6b7280',
          }}>{t}</button>
        ))}
      </div>

      {loading ? <div style={S.center}>Loading…</div> : (
        <>
          {tab==='Summary' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
                <KPI label="Total Sales"     value={cur(totals.sales)}     color="#16a34a" bg="#f0fdf4" bdr="#86efac" icon="💳" />
                <KPI label="Total Purchases" value={cur(totals.purchases)} color="#2563eb" bg="#eff6ff" bdr="#93c5fd" icon="🛒" />
                <KPI label="Total Expenses"  value={cur(totals.expenses)}  color="#dc2626" bg="#fef2f2" bdr="#fca5a5" icon="💸" />
                <KPI label="Net Profit"      value={cur(totals.net)}
                  color={totals.net>=0?'#16a34a':'#dc2626'}
                  bg={totals.net>=0?'#f0fdf4':'#fef2f2'}
                  bdr={totals.net>=0?'#86efac':'#fca5a5'} icon="📊" />
              </div>
              <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid #e5e7eb', fontWeight:600 }}>
                  Summary Table
                  {(from||to) && <span style={{ fontSize:12, color:'#6b7280', fontWeight:400, marginLeft:8 }}>({from||'—'} → {to||'—'})</span>}
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                  <thead><tr style={{ background:'#f9fafb' }}>
                    <th style={S.th}>Category</th>
                    <th style={{ ...S.th, textAlign:'right' }}>Amount</th>
                    <th style={{ ...S.th, textAlign:'right' }}>Records</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { cat:'💳 Sales',     amt:totals.sales,     cnt:data.sales.length,     col:'#16a34a' },
                      { cat:'🛒 Purchases', amt:totals.purchases, cnt:data.purchases.length, col:'#2563eb' },
                      { cat:'💸 Expenses',  amt:totals.expenses,  cnt:data.expenses.length,  col:'#dc2626' },
                    ].map(r=>(
                      <tr key={r.cat} style={{ borderTop:'1px solid #e5e7eb' }}>
                        <td style={S.td}>{r.cat}</td>
                        <td style={{ ...S.td, textAlign:'right', fontWeight:600, color:r.col }}>{cur(r.amt)}</td>
                        <td style={{ ...S.td, textAlign:'right', color:'#6b7280' }}>{r.cnt}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop:'2px solid #e5e7eb', background:'#f9fafb', fontWeight:700 }}>
                      <td style={S.td}>📊 Net Profit</td>
                      <td style={{ ...S.td, textAlign:'right', color:totals.net>=0?'#16a34a':'#dc2626' }}>{cur(totals.net)}</td>
                      <td style={S.td}/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab==='Sales' && (
            <TxTable rows={data.sales} empty="No sales found." cols={[
              { label:'Date',     fn:r=>fmt(r.SaleDate??r.saleDate??r.Date) },
              { label:'Customer', fn:r=>s(r.CustomerName??r.VendorName)||'—' },
              { label:'Invoice',  fn:r=>s(r.InvoiceNo)||'—' },
              { label:'Amount',   fn:r=>cur(r.TotalAmount??r.totalAmount??r.Amount), color:'#16a34a' },
              { label:'Status',   fn:r=>s(r.PaymentStatus??r.paymentStatus)||'—' },
            ]} />
          )}

          {tab==='Purchases' && (
            <TxTable rows={data.purchases} empty="No purchases found." cols={[
              { label:'Date',   fn:r=>fmt(r.PurchaseDate??r.purchaseDate??r.Date) },
              { label:'Vendor', fn:r=>s(r.VendorName)||'—' },
              { label:'Invoice',fn:r=>s(r.InvoiceNo)||'—' },
              { label:'Amount', fn:r=>cur(r.TotalAmount??r.totalAmount??r.Amount), color:'#2563eb' },
              { label:'Status', fn:r=>s(r.PaymentStatus??r.paymentStatus)||'—' },
            ]} />
          )}

          {tab==='Expenses' && (
            <TxTable rows={data.expenses} empty="No expenses found." cols={[
              { label:'Date',        fn:r=>fmt(r.ExpenseDate??r.expenseDate??r.Date) },
              { label:'Category',    fn:r=>s(r.Category??r.category)||'—' },
              { label:'Description', fn:r=>s(r.Description??r.description)||'—' },
              { label:'Amount',      fn:r=>cur(r.Amount??r.amount), color:'#dc2626' },
              { label:'Method',      fn:r=>s(r.PaymentMethod??r.paymentMethod)||'—' },
            ]} />
          )}
        </>
      )}
    </div>
  );
}

function TxTable({ rows, cols, empty }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ color:'#6b7280', fontSize:13, marginBottom:8 }}>{rows.length} record(s)</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
        <thead><tr style={{ background:'#f3f4f6' }}>
          <th style={S.th}>#</th>
          {cols.map(c=><th key={c.label} style={S.th}>{c.label}</th>)}
        </tr></thead>
        <tbody>
          {rows.length===0
            ? <tr><td colSpan={cols.length+1} style={{ textAlign:'center', padding:32, color:'#6b7280' }}>{empty}</td></tr>
            : rows.map((r,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid #e5e7eb', background:i%2===0?'#fff':'#fafafa' }}>
                <td style={S.td}>{i+1}</td>
                {cols.map(c=>(
                  <td key={c.label} style={{ ...S.td, ...(c.color?{fontWeight:600,color:c.color}:{}) }}>
                    {c.fn(r)}
                  </td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

function KPI({ label, value, color, bg, bdr, icon }) {
  return (
    <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:12, padding:'16px 18px' }}>
      <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:12, color:'#6b7280', fontWeight:500, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

const S = {
  lbl:    { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:3 },
  dInput: { padding:'7px 10px', borderRadius:6, border:'1px solid #d1d5db', fontSize:13 },
  th:     { padding:'10px 14px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #e5e7eb' },
  td:     { padding:'10px 14px', verticalAlign:'middle' },
  center: { textAlign:'center', padding:60, color:'#6b7280' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:14 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:500 }),
};