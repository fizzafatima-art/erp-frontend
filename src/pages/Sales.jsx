import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s   = (v) => (v == null ? '' : String(v));
const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const fmt = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
};

export function Sales() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts]   = useState([]);

  const [formData, setFormData] = useState({
    CustomerID: '',
    SaleDate: new Date().toISOString().split('T')[0],
    Description: '',
    ReceivedAmount: 0,
    PaymentMethod: 'Cash',
    ChequeNo: '',
    BankDetails: '',
    Items: [{ ProductID: '', Quantity: 1, Rate: 0, Amount: 0, Stock: 0 }]
  });

  const [payForm, setPayForm] = useState({
    amount: '',
    method: 'Cash',
    chequeNo: '',
    bankDetails: '',
    notes: ''
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

  const updateItem = (index, field, value) => {
    const newItems = [...formData.Items];
    newItems[index][field] = value;

    if (field === 'ProductID') {
      const prod = products.find(p => String(p.ProductID) === String(value));
      newItems[index].Stock = prod ? n(prod.CurrentQuantity) : 0;
      newItems[index].Rate  = prod ? n(prod.Price) : 0;
    }

    if (field === 'Quantity' || field === 'Rate') {
      const qty  = Number(newItems[index].Quantity) || 0;
      const rate = Number(newItems[index].Rate) || 0;
      newItems[index].Amount = qty * rate;
    }

    setFormData({ ...formData, Items: newItems });
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      Items: [...formData.Items, { ProductID: '', Quantity: 1, Rate: 0, Amount: 0, Stock: 0 }]
    });
  };

  const removeItemRow = (index) => {
    setFormData({ ...formData, Items: formData.Items.filter((_, i) => i !== index) });
  };

  const getTotal = () => formData.Items.reduce((sum, item) => sum + (Number(item.Amount) || 0), 0);

  const handleReturn = async (id) => {
    if (!id) return;
    if (window.confirm('Return this sale? Stock will be restored.')) {
      try {
        await axios.post(`${API}/sales/return`, { SaleID: id });
        alert('Sale Returned Successfully!');
        load();
      } catch (err) {
        alert('Error returning sale: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = getTotal();
      const paid  = Number(formData.ReceivedAmount) || 0;
      const payload = {
        CustomerID:     formData.CustomerID,
        SaleDate:       formData.SaleDate,
        Description:    formData.Description,
        TotalAmount:    total,
        ReceivedAmount: paid,
        Items:          formData.Items,
      };
      await axios.post(`${API}/sales`, payload);
      alert('Sale Created Successfully!');
      setShowModal(false);
      setFormData({
        CustomerID: '', SaleDate: new Date().toISOString().split('T')[0],
        Description: '', ReceivedAmount: 0, PaymentMethod: 'Cash',
        ChequeNo: '', BankDetails: '',
        Items: [{ ProductID: '', Quantity: 1, Rate: 0, Amount: 0, Stock: 0 }]
      });
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const openPayModal = (sale) => {
    setSelectedSale(sale);
    setPayForm({ amount: n(sale.BalanceAmount).toFixed(2), method: 'Cash', chequeNo: '', bankDetails: '', notes: '' });
    setShowPayModal(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/sales/${selectedSale.SaleID}/payment`, {
        amount:      Number(payForm.amount),
        method:      payForm.method,
        chequeNo:    payForm.chequeNo,
        bankDetails: payForm.bankDetails,
        notes:       payForm.notes,
      });
      alert('Payment recorded!');
      setShowPayModal(false);
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return s(r.CustomerName).toLowerCase().includes(q) || s(r.InvoiceNo).toLowerCase().includes(q);
  });

  const totalSales = filtered.reduce((sum, r) => sum + n(r.TotalAmount), 0);

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <div style={S.hdr}>
        <h2 style={{ margin:0 }}>💳 Sales</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
          <button onClick={() => setShowModal(true)} style={S.btn('#2563eb')}>+ New Sale</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <Card label="Total Sales"  value={`Rs.${totalSales.toLocaleString('en-IN')}`} color="#16a34a" />
        <Card label="Records"      value={rows.length} color="#374151" />
        <Card label="Unpaid"       value={rows.filter(r=>r.PaymentStatus!=='Paid').length} color="#dc2626" />
      </div>

      {error && <div style={S.err}>{error}</div>}
      <input placeholder="Search customer or invoice..." value={search}
        onChange={e=>setSearch(e.target.value)} style={S.search} />

      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr style={{ background:'#f3f4f6' }}>
              {['#','Date','Customer','Invoice #','Total','Paid','Balance','Status','Actions'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={9} style={S.empty}>No sales found.</td></tr>
                : filtered.map((r,i) => (
                  <tr key={r.SaleID} style={{ borderBottom:'1px solid #e5e7eb' }}>
                    <td style={S.td}>{i+1}</td>
                    <td style={S.td}>{fmt(r.SaleDate)}</td>
                    <td style={{...S.td, fontWeight:500}}>{s(r.CustomerName)||'-'}</td>
                    <td style={S.td}>{s(r.InvoiceNo)||'-'}</td>
                    <td style={{...S.td, fontWeight:600}}>Rs.{n(r.TotalAmount).toFixed(2)}</td>
                    <td style={S.td}>Rs.{n(r.PaidAmount).toFixed(2)}</td>
                    <td style={{...S.td, color: n(r.BalanceAmount)>0?'#dc2626':'#16a34a', fontWeight:600}}>
                      Rs.{n(r.BalanceAmount).toFixed(2)}
                    </td>
                    <td style={S.td}>
                      <span style={{
                        padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600,
                        background: r.PaymentStatus==='Paid'?'#f0fdf4':'#fef2f2',
                        color:      r.PaymentStatus==='Paid'?'#16a34a':'#dc2626'
                      }}>{r.PaymentStatus}</span>
                    </td>
                    <td style={{...S.td, display:'flex', gap:4}}>
                      {r.PaymentStatus !== 'Returned' && r.PaymentStatus !== 'Paid' && (
                        <button onClick={() => openPayModal(r)} style={S.btnSm('#16a34a')}>Pay</button>
                      )}
                      {r.PaymentStatus !== 'Returned' && (
                        <button onClick={() => handleReturn(r.SaleID)} style={S.btnSm('#f59e0b')}>Return</button>
                      )}
                      {r.PaymentStatus === 'Returned' && (
                        <span style={{color:'#9ca3af', fontSize:12}}>Returned</span>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* NEW SALE MODAL */}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0 }}>New Sale</h3>
            <form onSubmit={handleSubmit}>
              <div style={{display:'flex', gap:10}}>
                <div style={{flex:1}}>
                  <label style={S.label}>Customer *</label>
                  <select required style={S.input} value={formData.CustomerID}
                    onChange={e=>setFormData({...formData, CustomerID: e.target.value})}>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.VendorID} value={c.VendorID}>{c.VendorName}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={S.label}>Date *</label>
                  <input required type="date" style={S.input} value={formData.SaleDate}
                    onChange={e=>setFormData({...formData, SaleDate: e.target.value})} />
                </div>
              </div>

              <label style={{...S.label, marginTop:10}}>Items</label>
              <div style={{border:'1px solid #e5e7eb', borderRadius:4, padding:10, background:'#f9fafb', maxHeight:280, overflowY:'auto'}}>
                {formData.Items.map((item, idx) => (
                  <div key={idx} style={{marginBottom:8}}>
                    <div style={{display:'flex', gap:5, alignItems:'center'}}>
                      <select style={{...S.input, flex:2}} value={item.ProductID}
                        onChange={e=>updateItem(idx, 'ProductID', e.target.value)}>
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.ProductID} value={p.ProductID}>{p.ProductName} ({p.Unit})</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" style={{...S.input, flex:1}}
                        value={item.Quantity} onChange={e=>updateItem(idx, 'Quantity', e.target.value)} />
                      <input type="number" placeholder="Rate" style={{...S.input, flex:1}}
                        value={item.Rate} onChange={e=>updateItem(idx, 'Rate', e.target.value)} />
                      <div style={{...S.input, flex:1, background:'#fff', color:'#374151', fontWeight:600}}>
                        Rs.{n(item.Amount).toFixed(0)}
                      </div>
                      <button type="button" onClick={()=>removeItemRow(idx)}
                        style={{color:'red', background:'none', border:'none', cursor:'pointer', fontSize:16}}>✕</button>
                    </div>
                    {item.ProductID && (
                      <div style={{fontSize:11, color: n(item.Stock) < n(item.Quantity) ? '#dc2626' : '#16a34a', marginTop:2, paddingLeft:4}}>
                        Stock available: {n(item.Stock)} {n(item.Stock) < n(item.Quantity) ? '⚠️ Low!' : '✓'}
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addItemRow}
                  style={{width:'100%', padding:6, background:'#e0f2fe', color:'#0284c7', border:'none', borderRadius:4, cursor:'pointer'}}>
                  + Add Item
                </button>
              </div>

              {/* Payment Section */}
              <div style={{marginTop:12, padding:12, background:'#f0fdf4', borderRadius:6, border:'1px solid #86efac'}}>
                <div style={{fontWeight:600, marginBottom:8, color:'#15803d'}}>💰 Payment Details</div>
                <div style={{display:'flex', gap:10}}>
                  <div style={{flex:1}}>
                    <label style={S.label}>Amount Received</label>
                    <input type="number" style={S.input} placeholder="0"
                      value={formData.ReceivedAmount}
                      onChange={e=>setFormData({...formData, ReceivedAmount: e.target.value})} />
                  </div>
                  <div style={{flex:1}}>
                    <label style={S.label}>Payment Method</label>
                    <select style={S.input} value={formData.PaymentMethod}
                      onChange={e=>setFormData({...formData, PaymentMethod: e.target.value})}>
                      <option>Cash</option>
                      <option>Cheque</option>
                      <option>Online</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                </div>
                {formData.PaymentMethod === 'Cheque' && (
                  <div style={{marginTop:8}}>
                    <label style={S.label}>Cheque No</label>
                    <input style={S.input} placeholder="Cheque Number"
                      value={formData.ChequeNo}
                      onChange={e=>setFormData({...formData, ChequeNo: e.target.value})} />
                  </div>
                )}
                {(formData.PaymentMethod === 'Online' || formData.PaymentMethod === 'Bank Transfer') && (
                  <div style={{marginTop:8}}>
                    <label style={S.label}>Bank / Reference Details</label>
                    <input style={S.input} placeholder="Bank name or reference"
                      value={formData.BankDetails}
                      onChange={e=>setFormData({...formData, BankDetails: e.target.value})} />
                  </div>
                )}
              </div>

              <div style={{marginTop:12, textAlign:'right', fontSize:16, fontWeight:700}}>
                Grand Total: Rs.{getTotal().toFixed(2)} |
                Balance: Rs.{(getTotal() - n(formData.ReceivedAmount)).toFixed(2)}
              </div>

              <div style={{display:'flex', gap:10, marginTop:16}}>
                <button type="button" onClick={()=>setShowModal(false)} style={{...S.btn('#6b7280'), flex:1}}>Cancel</button>
                <button type="submit" style={{...S.btn('#2563eb'), flex:1}}>Save Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPayModal && selectedSale && (
        <div style={S.overlay}>
          <div style={{...S.modal, width:400}}>
            <h3 style={{marginTop:0}}>Record Payment</h3>
            <p style={{color:'#6b7280', fontSize:13}}>Invoice: {selectedSale.InvoiceNo} | Balance: Rs.{n(selectedSale.BalanceAmount).toFixed(2)}</p>
            <form onSubmit={handlePaySubmit}>
              <label style={S.label}>Amount *</label>
              <input required type="number" style={S.input} value={payForm.amount}
                onChange={e=>setPayForm({...payForm, amount: e.target.value})} />

              <label style={{...S.label, marginTop:10}}>Payment Method *</label>
              <select required style={S.input} value={payForm.method}
                onChange={e=>setPayForm({...payForm, method: e.target.value})}>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Online</option>
                <option>Bank Transfer</option>
              </select>

              {payForm.method === 'Cheque' && (
                <div style={{marginTop:8}}>
                  <label style={S.label}>Cheque No</label>
                  <input style={S.input} value={payForm.chequeNo}
                    onChange={e=>setPayForm({...payForm, chequeNo: e.target.value})} />
                </div>
              )}

              {(payForm.method === 'Online' || payForm.method === 'Bank Transfer') && (
                <div style={{marginTop:8}}>
                  <label style={S.label}>Bank / Reference</label>
                  <input style={S.input} value={payForm.bankDetails}
                    onChange={e=>setPayForm({...payForm, bankDetails: e.target.value})} />
                </div>
              )}

              <label style={{...S.label, marginTop:10}}>Notes</label>
              <input style={S.input} value={payForm.notes}
                onChange={e=>setPayForm({...payForm, notes: e.target.value})} />

              <div style={{display:'flex', gap:10, marginTop:16}}>
                <button type="button" onClick={()=>setShowPayModal(false)} style={{...S.btn('#6b7280'), flex:1}}>Cancel</button>
                <button type="submit" style={{...S.btn('#16a34a'), flex:1}}>Record Payment</button>
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
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'9px 18px', cursor:'pointer', fontSize:14, fontWeight:500, marginLeft:4 }),
  btnSm:  (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:4, padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:500 }),
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modal:   { background:'#fff', padding:24, borderRadius:8, width:'680px', maxWidth:'95%', maxHeight:'90vh', overflowY:'auto' },
  label:   { display:'block', marginBottom:4, fontSize:13, fontWeight:600, color:'#374151' },
  input:   { padding:'8px', borderRadius:4, border:'1px solid #d1d5db', width:'100%', boxSizing:'border-box', fontSize:13 },
};