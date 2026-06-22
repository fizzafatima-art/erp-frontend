import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { generateInvoicePDF } from '../utils/invoiceGenerator';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s   = (v) => (v == null ? '' : String(v));
const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const fmt = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
};

export function Purchases() {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [vendors, setVendors]     = useState([]);
  const [products, setProducts]   = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [formData, setFormData] = useState({
    VendorID: '',
    PurchaseDate: new Date().toISOString().split('T')[0],
    Description: '',
    PaidAmount: 0,
    PaymentMethod: 'Cash',
    ChequeNo: '',
    BankAccountID: '',
    BankDetails: '',
    Items: [{ ProductID: '', Quantity: 1, Rate: 0, Amount: 0, Stock: 0, MinStock: 10, WarehouseID: '' }]
  });

  const [payForm, setPayForm] = useState({
    amount: '', method: 'Cash', chequeNo: '', bankAccountID: '', bankDetails: '', notes: ''
  });

  useEffect(() => { load(); loadDropdowns(); }, []); // eslint-disable-line

  const loadDropdowns = async () => {
    try {
      const vRes = await axios.get(`${API}/vendors`);
      const allVendors = Array.isArray(vRes.data?.data) ? vRes.data.data : [];
      setVendors(allVendors.filter(v => { const t = (v.VendorType || "").toUpperCase(); return t === "SUPPLIER" || t === "VENDOR" || t === "BOTH"; }));

      const wRes = await axios.get(`${API}/warehouse/warehouses`);
      setWarehouses(Array.isArray(wRes.data?.data) ? wRes.data.data : []);

      const pRes = await axios.get(`${API}/products`);
      setProducts(Array.isArray(pRes.data?.data) ? pRes.data.data : []);

      try {
        const bRes = await axios.get(`${API}/bank-reconciliation/accounts`);
        setBankAccounts(Array.isArray(bRes.data?.data) ? bRes.data.data : []);
      } catch (e) { console.warn('Bank accounts load failed:', e.message); }
    } catch (e) { console.error("Dropdown Error", e); }
  };

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/purchases`);
      const raw = res.data;
      setRows(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
    } catch (e) {
      setError('Failed to load purchases.');
    } finally { setLoading(false); }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.Items];
    newItems[index][field] = value;
    if (field === 'ProductID') {
      const prod = products.find(p => String(p.ProductID) === String(value));
      newItems[index].Stock    = prod ? n(prod.CurrentQuantity) : 0;
      newItems[index].MinStock = prod ? n(prod.MinimumQuantity) : 10;
      newItems[index].Rate     = prod ? n(prod.Price) : 0;
    }
    if (field === 'Quantity' || field === 'Rate') {
      newItems[index].Amount = (Number(newItems[index].Quantity) || 0) * (Number(newItems[index].Rate) || 0);
    }
    setFormData({ ...formData, Items: newItems });
  };

  const addItemRow = () => setFormData({ ...formData, Items: [...formData.Items, { ProductID: '', Quantity: 1, Rate: 0, Amount: 0, Stock: 0, MinStock: 10, WarehouseID: '' }] });
  const removeItemRow = (i) => setFormData({ ...formData, Items: formData.Items.filter((_, idx) => idx !== i) });
  const getTotal = () => formData.Items.reduce((sum, item) => sum + (Number(item.Amount) || 0), 0);

  const handleDownloadInvoice = async (purchase) => {
    let items = [];
    try {
      const res  = await axios.get(`${API}/purchases/${purchase.PurchaseID}`);
      const data = res.data?.data || res.data;
      items = data?.Items || data?.items || data?.PurchaseItems || [];
    } catch (e) { console.warn('Detail API failed:', e.message); }
    if (!items || items.length === 0) {
      items = purchase.Items || purchase.items || purchase.PurchaseItems || [];
    }
    const resolvedItems = (items || []).map(item => {
      const pid  = String(item.ProductID || item.productID || '');
      const prod = products.find(p => String(p.ProductID) === pid);
      return {
        ProductName: item.ProductName || item.productName || prod?.ProductName || pid || '-',
        Quantity: Number(item.Quantity ?? item.quantity ?? 0),
        Rate:     Number(item.Rate || item.rate || 0),
        Amount:   Number(item.Amount || item.amount || 0),
      };
    });
    generateInvoicePDF({
      type:       'purchase',
      invoiceNo:  purchase.InvoiceNo   || '-',
      date:       fmt(purchase.PurchaseDate || purchase.purchaseDate),
      partyLabel: 'Supplier',
      partyName:  purchase.VendorName  || '-',
      partyPhone: purchase.VendorPhone || purchase.vendorPhone || '',
      partyCity:  purchase.VendorCity  || purchase.vendorCity  || '',
      items:      resolvedItems,
      total:      n(purchase.TotalAmount   || purchase.totalAmount),
      paid:       n(purchase.PaidAmount    || purchase.paidAmount   || 0),
      balance:    n(purchase.BalanceAmount || purchase.balanceAmount || 0),
      status:     purchase.PaymentStatus  || purchase.paymentStatus  || 'Pending',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = getTotal();
      const paid  = Number(formData.PaidAmount) || 0;
      await axios.post(`${API}/purchases`, {
        VendorID:      formData.VendorID,
        PurchaseDate:  formData.PurchaseDate,
        Description:   formData.Description,
        TotalAmount:   total,
        PaidAmount:    paid,
        PaymentMethod: formData.PaymentMethod,
        ChequeNo:      formData.ChequeNo,
        BankAccountID: formData.BankAccountID || null,
        BankDetails:   formData.BankDetails,
        Items:         formData.Items,
      });
      alert('Purchase Created Successfully!');
      setShowModal(false);
      setFormData({
        VendorID: '', PurchaseDate: new Date().toISOString().split('T')[0],
        Description: '', PaidAmount: 0, PaymentMethod: 'Cash',
        ChequeNo: '', BankAccountID: '', BankDetails: '',
        Items: [{ ProductID: '', Quantity: 1, Rate: 0, Amount: 0, Stock: 0, MinStock: 10, WarehouseID: '' }]
      });
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const openPayModal = (purchase) => {
    setSelectedPurchase(purchase);
    setPayForm({ amount: n(purchase.BalanceAmount).toFixed(2), method: 'Cash', chequeNo: '', bankAccountID: '', bankDetails: '', notes: '' });
    setShowPayModal(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/purchases/${selectedPurchase.PurchaseID}/payment`, {
        amount:        Number(payForm.amount),
        method:        payForm.method,
        chequeNo:      payForm.chequeNo,
        bankAccountID: payForm.bankAccountID || null,
        bankDetails:   payForm.bankDetails,
        notes:         payForm.notes,
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
    return s(r.VendorName).toLowerCase().includes(q) || s(r.InvoiceNo).toLowerCase().includes(q);
  });

  const total = filtered.reduce((sum, r) => sum + n(r.TotalAmount ?? r.totalAmount), 0);

  // Reusable bank fields component
  const BankFields = ({ method, bankAccountID, setBankAccountID, chequeNo, setChequeNo, bankDetails, setBankDetails }) => (
    <>
      {(method === 'Online' || method === 'Bank Transfer') && (
        <div style={{ marginTop: 8 }}>
          <label style={S.label}>🏦 Bank Account <span style={{color:'#dc2626'}}>*</span></label>
          <select required style={S.input} value={bankAccountID} onChange={e => setBankAccountID(e.target.value)}>
            <option value="">-- Select Bank Account --</option>
            {bankAccounts.length === 0 && <option disabled>No accounts — add from Bank Reconciliation</option>}
            {bankAccounts.map(b => (
              <option key={b.AccountID} value={b.AccountID}>
                {b.BankName} — {b.AccountNo} ({b.AccountTitle})
              </option>
            ))}
          </select>
        </div>
      )}
      {method === 'Cheque' && (
        <div style={{ marginTop: 8 }}>
          <label style={S.label}>Cheque No</label>
          <input style={S.input} placeholder="Cheque Number" value={chequeNo} onChange={e => setChequeNo(e.target.value)} />
        </div>
      )}
      {(method === 'Online' || method === 'Bank Transfer') && (
        <div style={{ marginTop: 8 }}>
          <label style={S.label}>Reference / Transaction ID</label>
          <input style={S.input} placeholder="e.g. TXN123456" value={bankDetails} onChange={e => setBankDetails(e.target.value)} />
        </div>
      )}
    </>
  );

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <div style={S.hdr}>
        <h2 style={{ margin:0 }}>🛒 Purchases</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
          <button onClick={() => setShowModal(true)} style={S.btn('#2563eb')}>+ New Purchase</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <Card label="Total Purchases" value={`Rs.${total.toLocaleString('en-IN',{minimumFractionDigits:2})}`} color="#2563eb" />
        <Card label="Records" value={rows.length} color="#374151" />
        <Card label="Unpaid" value={rows.filter(r=>s(r.PaymentStatus).toLowerCase()!=='paid').length} color="#dc2626" />
      </div>

      {error && <div style={S.err}>{error}</div>}
      <input placeholder="Search vendor or invoice..." value={search}
        onChange={e=>setSearch(e.target.value)} style={S.search} />

      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr style={{ background:'#f3f4f6' }}>
              {['#','Date','Vendor','Invoice #','Total','Paid','Balance','Status','Actions'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={9} style={S.empty}>No purchase records found.</td></tr>
                : filtered.map((r,i) => {
                  const status = s(r.PaymentStatus ?? r.paymentStatus) || 'Pending';
                  const isPaid = status.toLowerCase() === 'paid';
                  return (
                    <tr key={r.PurchaseID ?? i} style={{ borderBottom:'1px solid #e5e7eb' }}>
                      <td style={S.td}>{i+1}</td>
                      <td style={S.td}>{fmt(r.PurchaseDate ?? r.purchaseDate)}</td>
                      <td style={{...S.td, fontWeight:500}}>{s(r.VendorName)||'-'}</td>
                      <td style={S.td}>{s(r.InvoiceNo)||'-'}</td>
                      <td style={{...S.td, fontWeight:600}}>Rs.{n(r.TotalAmount).toFixed(2)}</td>
                      <td style={S.td}>Rs.{n(r.PaidAmount ?? r.paidAmount).toFixed(2)}</td>
                      <td style={{...S.td, color: n(r.BalanceAmount)>0?'#dc2626':'#16a34a', fontWeight:600}}>
                        Rs.{n(r.BalanceAmount ?? r.balanceAmount).toFixed(2)}
                      </td>
                      <td style={S.td}>
                        <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600,
                          background: isPaid?'#f0fdf4':'#fef2f2',
                          color:      isPaid?'#16a34a':'#dc2626' }}>
                          {status}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          <button onClick={() => handleDownloadInvoice(r)} style={S.btnSm('#0284c7')} title="Download Invoice">
                            🧾 Invoice
                          </button>
                          {!isPaid && (
                            <button onClick={() => openPayModal(r)} style={S.btnSm('#16a34a')}>Pay</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      )}

      {/* NEW PURCHASE MODAL */}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0 }}>New Purchase</h3>
            <form onSubmit={handleSubmit}>
              <div style={{display:'flex', gap:10}}>
                <div style={{flex:1}}>
                  <label style={S.label}>Vendor *</label>
                  <select required style={S.input} value={formData.VendorID}
                    onChange={e=>setFormData({...formData, VendorID: e.target.value})}>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.VendorID} value={v.VendorID}>{v.VendorName}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={S.label}>Date *</label>
                  <input required type="date" style={S.input} value={formData.PurchaseDate}
                    onChange={e=>setFormData({...formData, PurchaseDate: e.target.value})} />
                </div>
              </div>

              <label style={{...S.label, marginTop:10}}>Items</label>
              <div style={{border:'1px solid #e5e7eb', borderRadius:4, padding:10, background:'#f9fafb', maxHeight:320, overflowY:'auto'}}>
                {formData.Items.map((item, idx) => (
                  <div key={idx} style={{marginBottom:10, paddingBottom:10, borderBottom:'1px solid #e5e7eb'}}>
                    <div style={{display:'flex', gap:5, alignItems:'center', marginBottom:5}}>
                      <select style={{...S.input, flex:3}} value={item.ProductID}
                        onChange={e=>updateItem(idx, 'ProductID', e.target.value)}>
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.ProductID} value={p.ProductID}>{p.ProductName} ({p.Unit})</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" style={{...S.input, flex:1}}
                        value={item.Quantity} onChange={e=>updateItem(idx,'Quantity', e.target.value)} />
                      <input type="number" placeholder="Rate" style={{...S.input, flex:1}}
                        value={item.Rate} onChange={e=>updateItem(idx, 'Rate', e.target.value)} />
                      <div style={{...S.input, flex:1, background:'#fff', fontWeight:600}}>
                        Rs.{n(item.Amount).toFixed(0)}
                      </div>
                      <button type="button" onClick={()=>removeItemRow(idx)}
                        style={{color:'red', background:'none', border:'none', cursor:'pointer', fontSize:16}}>✕</button>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <span style={{fontSize:12, color:'#6b7280', whiteSpace:'nowrap'}}>📦 Warehouse:</span>
                      <select style={{...S.input, flex:1, fontSize:12}}
                        value={item.WarehouseID}
                        onChange={e=>updateItem(idx, 'WarehouseID', e.target.value)}>
                        <option value="">Select Warehouse</option>
                        {warehouses.map(w => (
                          <option key={w.WarehouseID} value={w.WarehouseID}>{w.WarehouseName} — {w.City||''}</option>
                        ))}
                      </select>
                    </div>
                    {item.ProductID && (
                      <div style={{
                        fontSize:11, marginTop:4, paddingLeft:4,
                        color: n(item.Stock) <= n(item.MinStock) ? '#dc2626' : '#16a34a',
                        fontWeight: n(item.Stock) <= n(item.MinStock) ? 600 : 400
                      }}>
                        📦 Current Stock: {n(item.Stock)} {n(item.Stock) === 0 ? '⚠ Low Stock!' : '✓ In Stock'}
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
              <div style={{marginTop:12, padding:12, background:'#eff6ff', borderRadius:6, border:'1px solid #93c5fd'}}>
                <div style={{fontWeight:600, marginBottom:8, color:'#1d4ed8'}}>💰 Payment Details</div>
                <div style={{display:'flex', gap:10}}>
                  <div style={{flex:1}}>
                    <label style={S.label}>Amount Paid</label>
                    <input type="number" style={S.input} placeholder="0"
                      value={formData.PaidAmount}
                      onChange={e=>setFormData({...formData, PaidAmount: e.target.value})} />
                  </div>
                  <div style={{flex:1}}>
                    <label style={S.label}>Payment Method</label>
                    <select style={S.input} value={formData.PaymentMethod}
                      onChange={e=>setFormData({...formData, PaymentMethod: e.target.value, BankAccountID: '', BankDetails: '', ChequeNo: ''})}>
                      <option>Cash</option>
                      <option>Cheque</option>
                      <option>Online</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                </div>
                <BankFields
                  method={formData.PaymentMethod}
                  bankAccountID={formData.BankAccountID}
                  setBankAccountID={v => setFormData({...formData, BankAccountID: v})}
                  chequeNo={formData.ChequeNo}
                  setChequeNo={v => setFormData({...formData, ChequeNo: v})}
                  bankDetails={formData.BankDetails}
                  setBankDetails={v => setFormData({...formData, BankDetails: v})}
                />
              </div>

              <div style={{marginTop:12, textAlign:'right', fontSize:16, fontWeight:700}}>
                Grand Total: Rs.{getTotal().toFixed(2)} |
                Balance: Rs.{(getTotal() - n(formData.PaidAmount)).toFixed(2)}
              </div>

              <div style={{display:'flex', gap:10, marginTop:16}}>
                <button type="button" onClick={()=>setShowModal(false)} style={{...S.btn('#6b7280'), flex:1}}>Cancel</button>
                <button type="submit" style={{...S.btn('#2563eb'), flex:1}}>Save Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPayModal && selectedPurchase && (
        <div style={S.overlay}>
          <div style={{...S.modal, width:440}}>
            <h3 style={{marginTop:0}}>Record Payment</h3>
            <p style={{color:'#6b7280', fontSize:13}}>
              Invoice: <strong>{selectedPurchase.InvoiceNo}</strong> | Balance: <strong>Rs.{n(selectedPurchase.BalanceAmount).toFixed(2)}</strong>
            </p>
            <form onSubmit={handlePaySubmit}>
              <label style={S.label}>Amount *</label>
              <input required type="number" style={S.input} value={payForm.amount}
                onChange={e=>setPayForm({...payForm, amount: e.target.value})} />

              <label style={{...S.label, marginTop:10}}>Payment Method *</label>
              <select required style={S.input} value={payForm.method}
                onChange={e=>setPayForm({...payForm, method: e.target.value, bankAccountID: '', bankDetails: '', chequeNo: ''})}>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Online</option>
                <option>Bank Transfer</option>
              </select>

              <BankFields
                method={payForm.method}
                bankAccountID={payForm.bankAccountID}
                setBankAccountID={v => setPayForm({...payForm, bankAccountID: v})}
                chequeNo={payForm.chequeNo}
                setChequeNo={v => setPayForm({...payForm, chequeNo: v})}
                bankDetails={payForm.bankDetails}
                setBankDetails={v => setPayForm({...payForm, bankDetails: v})}
              />

              {(payForm.method === 'Online' || payForm.method === 'Bank Transfer') && !payForm.bankAccountID && (
                <div style={{marginTop:8, padding:'8px 12px', background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:4, fontSize:12, color:'#92400e'}}>
                  ⚠️ Bank account select karna zaruri hai — warna Bank Reconciliation mein nahi ayega.
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
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'9px 18px', cursor:'pointer', fontSize:14, fontWeight:500, marginLeft:4 }),
  btnSm:  (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:4, padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:500 }),
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modal:   { background:'#fff', padding:24, borderRadius:8, width:'700px', maxWidth:'95%', maxHeight:'90vh', overflowY:'auto' },
  label:   { display:'block', marginBottom:4, fontSize:13, fontWeight:600, color:'#374151' },
  input:   { padding:'8px', borderRadius:4, border:'1px solid #d1d5db', width:'100%', boxSizing:'border-box', fontSize:13 },
};