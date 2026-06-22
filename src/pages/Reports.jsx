import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const s   = (v) => (v == null ? '' : String(v));
const cur = (v) => `Rs.${n(v).toLocaleString('en-IN',{minimumFractionDigits:0})}`;
const fmt = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
};

const TABS = ['Summary','Sales','Purchases','Expenses','Outstanding','Analytics'];

export default function Reports() {
  const [tab, setTab]         = useState('Summary');
  const [outSubTab, setOutSubTab] = useState('customers');
  const [data, setData]       = useState({ 
    sales:[], purchases:[], expenses:[], 
    outstanding:[], outstandingSuppliers:[],
    topProducts:[], topCustomers:[], cityReport:[], vendorProfit:[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');

  const sendWhatsApp = (name, amount, city, phone, type) => {
    if (!phone) { alert('Phone number not available'); return; }
    const label = type === 'supplier' ? 'Supplier Payment Reminder' : 'Outstanding Payment Reminder';
    const msg = `Hello ${name}${city ? ' (' + city + ')' : ''},%0A%0A🔔 *${label}*%0A----------------------------%0AYour outstanding balance: *Rs. ${n(amount).toLocaleString('en-IN')}*%0A%0APlease clear dues at your earliest convenience.%0A%0AThank you!`;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('92')) cleanPhone = '92' + cleanPhone;
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const params = {};
      if (from) params.from = from;
      if (to)   params.to   = to;

      const extract = (res) => {
        if (res.status !== 'fulfilled') return [];
        const d = res.value?.data;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d)) return d;
        return [];
      };

      const [sR, pR, eR, outR, outSupR, tpR, tcR, cityR, vpR] = await Promise.allSettled([
        axios.get(`${API}/sales`, { params }),
        axios.get(`${API}/purchases`, { params }),
        axios.get(`${API}/expenses`, { params }),
        axios.get(`${API}/reports/outstanding-customers`, { params }),
        axios.get(`${API}/reports/outstanding-suppliers`, { params }),
        axios.get(`${API}/reports/top-products`, { params }),
        axios.get(`${API}/reports/top-customers`, { params }),
        axios.get(`${API}/reports/city-report`, { params }),
        axios.get(`${API}/reports/vendor-profit`, { params }),
      ]);

      setData({
        sales:                extract(sR),
        purchases:            extract(pR),
        expenses:             extract(eR),
        outstanding:          extract(outR),
        outstandingSuppliers: extract(outSupR),
        topProducts:          extract(tpR),
        topCustomers:         extract(tcR),
        cityReport:           extract(cityR),
        vendorProfit:         extract(vpR),
      });
    } catch (e) { setError('Failed to load report data.'); }
    finally  { setLoading(false); }
  }, [from, to]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totals = {
    sales:     data.sales.reduce((s,r)=>s+n(r.TotalAmount??r.totalAmount),0),
    purchases: data.purchases.reduce((s,r)=>s+n(r.TotalAmount??r.totalAmount),0),
    expenses:  data.expenses.reduce((s,r)=>s+n(r.Amount??r.amount),0),
  };
  totals.net = totals.sales - totals.purchases - totals.expenses;

  const totalOutCust = data.outstanding.reduce((s,r) => s + n(r.TotalOutstanding), 0);
  const totalOutSupp = data.outstandingSuppliers.reduce((s,r) => s + n(r.TotalOutstanding), 0);

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif', maxWidth:1200, margin:'0 auto' }}>
      <h2 style={{ margin:'0 0 4px', fontSize:24, fontWeight:700 }}>📈 Reports</h2>
      <p style={{ margin:'0 0 20px', color:'#6b7280', fontSize:14 }}>Financial overview, analytics & follow-ups</p>

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

      <div style={{ display:'flex', gap:4, borderBottom:'2px solid #e5e7eb', marginBottom:20, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'9px 18px', fontSize:14, fontWeight:500, border:'none', cursor:'pointer',
            borderRadius:'6px 6px 0 0', marginBottom:-2, whiteSpace:'nowrap',
            background: tab===t?'#2563eb':'transparent',
            color:      tab===t?'#fff':'#6b7280',
          }}>{t}</button>
        ))}
      </div>

      {loading ? <div style={S.center}>Loading...</div> : (
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
                <div style={{padding:14, fontWeight:600, background:'#f9fafb'}}>Summary Overview</div>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <tbody>
                    <tr style={{borderBottom:'1px solid #eee'}}><td style={S.td}>Total Sales</td><td style={{...S.td, textAlign:'right', color:'#16a34a'}}>{cur(totals.sales)}</td></tr>
                    <tr style={{borderBottom:'1px solid #eee'}}><td style={S.td}>Total Purchases</td><td style={{...S.td, textAlign:'right', color:'#2563eb'}}>{cur(totals.purchases)}</td></tr>
                    <tr style={{borderBottom:'1px solid #eee'}}><td style={S.td}>Total Expenses</td><td style={{...S.td, textAlign:'right', color:'#dc2626'}}>{cur(totals.expenses)}</td></tr>
                    <tr style={{fontWeight:700, background:'#f0fdf4'}}><td style={S.td}>Net Profit</td><td style={{...S.td, textAlign:'right', color:totals.net>=0?'#16a34a':'#dc2626'}}>{cur(totals.net)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab==='Sales' && <TxTable rows={data.sales} empty="No sales found." cols={[
            { label:'Date',     fn:r=>fmt(r.SaleDate??r.saleDate) },
            { label:'Customer', fn:r=>s(r.CustomerName??r.VendorName)||'-' },
            { label:'Invoice',  fn:r=>s(r.InvoiceNo)||'-' },
            { label:'Amount',   fn:r=>cur(r.TotalAmount??r.totalAmount), color:'#16a34a' },
            { label:'Status',   fn:r=>s(r.PaymentStatus??r.paymentStatus)||'-' },
          ]} />}

          {tab==='Purchases' && <TxTable rows={data.purchases} empty="No purchases found." cols={[
            { label:'Date',    fn:r=>fmt(r.PurchaseDate??r.purchaseDate) },
            { label:'Vendor',  fn:r=>s(r.VendorName)||'-' },
            { label:'Invoice', fn:r=>s(r.InvoiceNo)||'-' },
            { label:'Amount',  fn:r=>cur(r.TotalAmount??r.totalAmount), color:'#2563eb' },
            { label:'Status',  fn:r=>s(r.PaymentStatus??r.paymentStatus)||'-' },
          ]} />}

          {tab==='Expenses' && <TxTable rows={data.expenses} empty="No expenses found." cols={[
            { label:'Date',        fn:r=>fmt(r.ExpenseDate??r.expenseDate) },
            { label:'Category',    fn:r=>s(r.Category??r.category)||'-' },
            { label:'Description', fn:r=>s(r.Description??r.description)||'-' },
            { label:'Amount',      fn:r=>cur(r.Amount??r.amount), color:'#dc2626' },
            { label:'Method',      fn:r=>s(r.PaymentMethod??r.paymentMethod)||'-' },
          ]} />}

          {tab==='Outstanding' && (
            <div>
              {/* Sub Tabs */}
              <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
                <button onClick={() => setOutSubTab('customers')}
                  style={{
                    padding:'7px 20px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                    background: outSubTab==='customers' ? '#2563eb' : '#f3f4f6',
                    color: outSubTab==='customers' ? '#fff' : '#374151'
                  }}>
                  👤 Customers ({data.outstanding.length}) — {cur(totalOutCust)}
                </button>
                <button onClick={() => setOutSubTab('suppliers')}
                  style={{
                    padding:'7px 20px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                    background: outSubTab==='suppliers' ? '#f59e0b' : '#f3f4f6',
                    color: outSubTab==='suppliers' ? '#fff' : '#374151'
                  }}>
                  🏭 Suppliers ({data.outstandingSuppliers.length}) — {cur(totalOutSupp)}
                </button>
              </div>

              {outSubTab === 'customers' && (
                <div>
                  <div style={{ background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:8, padding:'10px 16px', marginBottom:14, fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'#1e40af', fontWeight:600 }}>Total Outstanding from Customers</span>
                    <span style={{ color:'#dc2626', fontWeight:700, fontSize:16 }}>{cur(totalOutCust)}</span>
                  </div>
                  <TxTable
                    rows={data.outstanding}
                    empty="No outstanding customers found."
                    cols={[
                      { label:'Customer', fn:r=>s(r.VendorName)||'-' },
                      { label:'City',     fn:r=>s(r.City)||'-' },
                      { label:'Phone',    fn:r=>(
                        <span>
                          {s(r.Phone) || '-'}
                          {s(r.Phone) && (
                            <a href={`tel:${r.Phone}`} style={{ marginLeft:6, color:'#2563eb', textDecoration:'none' }}>📞</a>
                          )}
                        </span>
                      )},
                      { label:'Balance',  fn:r=>cur(r.TotalOutstanding), color:'#dc2626' },
                      { label:'Action',   fn:r=>(
                        <button
                          onClick={() => sendWhatsApp(r.VendorName, r.TotalOutstanding, r.City, r.Phone, 'customer')}
                          style={{background:'#25D366', color:'#fff', border:'none', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:600}}>
                          📱 WhatsApp
                        </button>
                      )}
                    ]}
                  />
                </div>
              )}

              {outSubTab === 'suppliers' && (
                <div>
                  <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 16px', marginBottom:14, fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'#92400e', fontWeight:600 }}>Total Payable to Suppliers</span>
                    <span style={{ color:'#dc2626', fontWeight:700, fontSize:16 }}>{cur(totalOutSupp)}</span>
                  </div>
                  <TxTable
                    rows={data.outstandingSuppliers}
                    empty="No outstanding suppliers found."
                    cols={[
                      { label:'Supplier', fn:r=>s(r.VendorName)||'-' },
                      { label:'City',     fn:r=>s(r.City)||'-' },
                      { label:'Phone',    fn:r=>(
                        <span>
                          {s(r.Phone) || '-'}
                          {s(r.Phone) && (
                            <a href={`tel:${r.Phone}`} style={{ marginLeft:6, color:'#2563eb', textDecoration:'none' }}>📞</a>
                          )}
                        </span>
                      )},
                      { label:'Balance',  fn:r=>cur(r.TotalOutstanding), color:'#dc2626' },
                      { label:'Action',   fn:r=>(
                        <button
                          onClick={() => sendWhatsApp(r.VendorName, r.TotalOutstanding, r.City, r.Phone, 'supplier')}
                          style={{background:'#25D366', color:'#fff', border:'none', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:600}}>
                          📱 WhatsApp
                        </button>
                      )}
                    ]}
                  />
                </div>
              )}
            </div>
          )}

          {tab==='Analytics' && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(380px, 1fr))', gap:20}}>
              <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:15}}>
                <h4 style={{margin:'0 0 10px', borderBottom:'2px solid #f3f4f6', paddingBottom:5}}>🏆 Top Products</h4>
                <TxTable rows={data.topProducts} empty="No data" cols={[
                  { label:'Product',  fn:r=>s(r.ProductName) },
                  { label:'Sold Qty', fn:r=>n(r.TotalSold), color:'#16a34a' }
                ]} />
              </div>

              <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:15}}>
                <h4 style={{margin:'0 0 10px', borderBottom:'2px solid #f3f4f6', paddingBottom:5}}>👥 Top Customers</h4>
                <TxTable rows={data.topCustomers} empty="No data" cols={[
                  { label:'Customer', fn:r=>s(r.CustomerName) },
                  { label:'City',     fn:r=>s(r.City)||'-' },
                  { label:'Spent',    fn:r=>cur(r.TotalSpent), color:'#2563eb' }
                ]} />
              </div>

              <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:15}}>
                <h4 style={{margin:'0 0 10px', borderBottom:'2px solid #f3f4f6', paddingBottom:5}}>🌍 Sales by City</h4>
                <TxTable rows={data.cityReport} empty="No data" cols={[
                  { label:'City',      fn:r=>s(r.City)||'-' },
                  { label:'Customers', fn:r=>n(r.CustomerCount) },
                  { label:'Sales',     fn:r=>cur(r.TotalSales), color:'#16a34a' }
                ]} />
              </div>

              <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:15}}>
                <h4 style={{margin:'0 0 10px', borderBottom:'2px solid #f3f4f6', paddingBottom:5}}>💰 Vendor Wise Purchases</h4>
                <TxTable rows={data.vendorProfit} empty="No data" cols={[
                  { label:'Vendor',     fn:r=>s(r.VendorName) },
                  { label:'Purchases',  fn:r=>cur(r.TotalPurchases), color:'#2563eb' },
                  { label:'Paid',       fn:r=>cur(r.TotalPaid), color:'#16a34a' },
                  { label:'Balance',    fn:r=>cur(r.TotalBalance), color:'#dc2626' }
                ]} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TxTable({ rows = [], cols, empty }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ color:'#6b7280', fontSize:12, marginBottom:5 }}>{rows.length} record(s)</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead><tr style={{ background:'#f3f4f6' }}>
          <th style={S.th}>#</th>
          {cols.map(c=><th key={c.label} style={S.th}>{c.label}</th>)}
        </tr></thead>
        <tbody>
          {rows.length===0
            ? <tr><td colSpan={cols.length+1} style={{ textAlign:'center', padding:20, color:'#9ca3af' }}>{empty}</td></tr>
            : rows.map((r,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid #f3f4f6', background:i%2===0?'#fff':'#fafafa' }}>
                <td style={S.td}>{i+1}</td>
                {cols.map(c=>(
                  <td key={c.label} style={{ ...S.td, ...(c.color?{fontWeight:600,color:c.color}:{}) }}>
                    {typeof c.fn === 'function' ? c.fn(r) : r[c.fn]}
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
    <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:10, padding:'16px 18px' }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:12, color:'#6b7280', fontWeight:500, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

const S = {
  lbl:    { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:3 },
  dInput: { padding:'7px 10px', borderRadius:6, border:'1px solid #d1d5db', fontSize:13 },
  th:     { padding:'10px 12px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #e5e7eb', whiteSpace:'nowrap' },
  td:     { padding:'10px 12px', verticalAlign:'middle' },
  center: { textAlign:'center', padding:40, color:'#6b7280' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:13 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:500 }),
};