import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

// Helpers
const s   = (v) => (v == null ? '' : String(v));
const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

export function Sales() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  
  // Dropdown Data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts]   = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    CustomerID: '',
    SaleDate: new Date().toISOString().split('T')[0],
    Description: '',
    Items: [{ ProductID: '', Quantity: 1, Rate: 0, Amount: 0 }]
  });

  useEffect(() => { load(); loadDropdowns(); }, []);

  const loadDropdowns = async () => {
    try {
      const vRes = await axios.get(`${API}/vendors`); 
      const allVendors = Array.isArray(vRes.data?.data) ? vRes.data.data : [];
      const cust = allVendors.filter(v => v.VendorType === 'Customer' || v.VendorType === 'Both');
      setCustomers(cust);

      const pRes = await axios.get(`${API}/products`);
      const allProds = Array.isArray(pRes.data?.data) ? pRes.data.data : [];
      setProducts(allProds);
    } catch (e) { console.error("Dropdown Error", e); }
  };

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/sales`);
      const raw = res.data;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setRows(arr);
    } catch (e) {
      setError('Failed to load sales.');
    } finally { setLoading(false); }
  };

  // --- Calculation Logic ---
  const updateItem = (index, field, value) => {
    const newItems = [...formData.Items];
    newItems[index][field] = value;
    
    if (field === 'Quantity' || field === 'Rate') {
      const qty = Number(newItems[index].Quantity) || 0;
      const rate = Number(newItems[index].Rate) || 0;
      newItems[index].Amount = qty * rate;
    }
    
    setFormData({ ...formData, Items: newItems });
  };

  const addItemRow = () => {
    setFormData({ 
      ...formData, 
      Items: [...formData.Items, { ProductID: '', Quantity: 1, Rate: 0, Amount: 0 }] 
    });
  };

  const removeItemRow = (index) => {
    const newItems = formData.Items.filter((_, i) => i !== index);
    setFormData({ ...formData, Items: newItems });
  };

  const getTotal = () => {
    return formData.Items.reduce((sum, item) => sum + (Number(item.Amount) || 0), 0);
  };

  // --- Return Sale Function ---
  const handleReturn = async (id) => {
    if (!id) return; // Header row se bachne ke liye
    if (window.confirm('Are you sure you want to return this sale? Stock will be restored.')) {
      try {
        await axios.post(`${API}/sales/return`, { SaleID: id, ReturnDate: new Date().toISOString().split('T')[0] });
        alert('Sale Returned Successfully!');
        load();
      } catch (err) {
        console.error(err);
        alert('Error returning sale');
      }
    }
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        TotalAmount: getTotal(),
        ReceivedAmount: 0,
      };

      await axios.post(`${API}/sales`, payload);
      alert('Sale Created Successfully!');
      setShowModal(false);
      setFormData({
        CustomerID: '', SaleDate: new Date().toISOString().split('T')[0],
        Description: '', Items: [{ ProductID: '', Quantity: 1, Rate: 0, Amount: 0 }]
      });
      load();
    } catch (err) {
      console.error(err);
      alert('Error creating sale');
    }
  };

  // --- Render Logic ---
  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return s(r.CustomerName).toLowerCase().includes(q) || s(r.InvoiceNo).toLowerCase().includes(q);
  });

  const totalSales = filtered.reduce((sum, r) => sum + n(r.TotalAmount), 0);

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <div style={S.hdr}>
        <h2 style={{ margin:0 }}>💳 Sales</h2>
        <div>
          <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
          <button onClick={() => setShowModal(true)} style={S.btn('#2563eb')}>+ New Sale</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <Card label="Total Sales"  value={`Rs.${totalSales.toLocaleString('en-IN')}`} color="#16a34a" />
        <Card label="Records"      value={rows.length} color="#374151" />
        <Card label="Unpaid"      value={rows.filter(r=>r.PaymentStatus!=='Paid').length} color="#dc2626" />
      </div>

      {error && <div style={S.err}>{error}</div>}
      <input placeholder="Search customer or invoice…" value={search} onChange={e=>setSearch(e.target.value)} style={S.search} />

      {loading ? <p>Loading…</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr style={{ background:'#f3f4f6' }}>
              {['#','Date','Customer','Invoice #','Total','Paid','Balance','Status','Actions'].map(h=>(<th key={h} style={S.th}>{h}</th>))}
            </tr></thead>
            <tbody>
              {filtered.length===0 ? <tr><td colSpan={9} style={S.empty}>No sales found.</td></tr> :
              filtered.map((r,i) => (
                <tr key={r.SaleID} style={{ borderBottom:'1px solid #e5e7eb' }}>
                  <td style={S.td}>{i+1}</td>
                  <td style={S.td}>{fmt(r.SaleDate)}</td>
                  <td style={{...S.td, fontWeight:500}}>{s(r.CustomerName)||'—'}</td>
                  <td style={S.td}>{s(r.InvoiceNo)||'—'}</td>
                  <td style={{...S.td, fontWeight:600}}>Rs.{n(r.TotalAmount).toFixed(2)}</td>
                  <td style={S.td}>Rs.{n(r.PaidAmount).toFixed(2)}</td>
                  <td style={{...S.td, color: n(r.BalanceAmount)>0?'#dc2626':'#16a34a', fontWeight:600 }}>
                    Rs.{n(r.BalanceAmount).toFixed(2)}
                  </td>
                  <td style={S.td}>
                    <span style={{
                      padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600,
                      background: r.PaymentStatus==='Paid'?'#f0fdf4':'#fef2f2',
                      color:      r.PaymentStatus==='Paid'?'#16a34a':'#dc2626'
                    }}>{r.PaymentStatus}</span>
                  </td>
                  <td style={S.td}>
                    {/* Actions Column */}
                    {r.PaymentStatus !== 'Returned' && (
                        <button onClick={() => handleReturn(r.SaleID)} style={S.btnSm('#f59e0b')}>Return</button>
                    )}
                    {r.PaymentStatus === 'Returned' && <span style={{color:'#9ca3af', fontSize:12}}>Returned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD SALE MODAL --- */}
      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0 }}>New Sale</h3>
            <form onSubmit={handleSubmit}>
              <div style={{display:'flex', gap:10}}>
                <div style={{flex:1}}>
                  <label style={S.label}>Customer *</label>
                  <select required style={S.input} value={formData.CustomerID} onChange={e=>setFormData({...formData, CustomerID: e.target.value})}>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.VendorID} value={c.VendorID}>{c.VendorName}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={S.label}>Date *</label>
                  <input required type="date" style={S.input} value={formData.SaleDate} onChange={e=>setFormData({...formData, SaleDate: e.target.value})} />
                </div>
              </div>
              
              <label style={{...S.label, marginTop:10}}>Items</label>
              <div style={{border:'1px solid #e5e7eb', borderRadius:4, padding:10, background:'#f9fafb', maxHeight:300, overflowY:'auto'}}>
                {formData.Items.map((item, idx) => (
                  <div key={idx} style={{display:'flex', gap:5, marginBottom:8, alignItems:'center'}}>
                    <select style={{...S.input, flex:2}} value={item.ProductID} onChange={e=>updateItem(idx, 'ProductID', e.target.value)}>
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.ProductID} value={p.ProductID}>{p.ProductName} ({p.Unit})</option>
                      ))}
                    </select>
                    <input type="number" placeholder="Qty" style={{...S.input, flex:1}} value={item.Quantity} onChange={e=>updateItem(idx, 'Quantity', e.target.value)} />
                    <input type="number" placeholder="Rate" style={{...S.input, flex:1}} value={item.Rate} onChange={e=>updateItem(idx, 'Rate', e.target.value)} />
                    <div style={{...S.input, flex:1, background:'#fff', color:'#666'}}>Rs.{item.Amount}</div>
                    <button type="button" onClick={()=>removeItemRow(idx)} style={{color:'red', background:'none', border:'none', cursor:'pointer'}}>✕</button>
                  </div>
                ))}
                <button type="button" onClick={addItemRow} style={{width:'100%', padding:5, background:'#e0f2fe', color:'#0284c7', border:'none', borderRadius:4, cursor:'pointer'}}>+ Add Item</button>
              </div>

              <div style={{marginTop:15, textAlign:'right', fontSize:16, fontWeight:700}}>
                Grand Total: Rs.{getTotal().toFixed(2)}
              </div>

              <div style={{display:'flex', gap:10, marginTop:20}}>
                <button type="button" onClick={()=>setShowModal(false)} style={{...S.btn('#6b7280'), flex:1}}>Cancel</button>
                <button type="submit" style={{...S.btn('#2563eb'), flex:1}}>Save Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;

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
  btnSm:  (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:4, padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:500 }),
  modalOverlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modal:      { background:'#fff', padding:24, borderRadius:8, width:'650px', maxWidth:'90%', maxHeight:'90vh', overflowY:'auto' },
  label:      { display:'block', marginBottom:4, fontSize:13, fontWeight:600, color:'#374151' },
  input:      { padding:'8px', borderRadius:4, border:'1px solid #d1d5db', width:'100%', boxSizing:'border-box' },
};
