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
  const [warehouses, setWarehouses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [formData, setFormData] = useState({
    CustomerID: '',
    SaleDate: new Date().toISOString().split('T')[0],
    Description: '',
    ReceivedAmount: 0,
    PaymentMethod: 'Cash',
    ChequeNo: '',
    BankAccountID: '',
    BankDetails: '',
    Items: [{ ProductID: '', Quantity: 1, Rate: 0, Amount: 0, Stock: 0, WarehouseID: '', WarehouseStock: [] }]
  });

  const [payForm, setPayForm] = useState({
    amount: '',
    method: 'Cash',
    chequeNo: '',
    bankAccountID: '',
    bankDetails: '',
    notes: ''
  });

  useEffect(() => { load(); loadDropdowns(); }, []);

  const loadDropdowns = async () => {
    try {
      const vRes = await axios.get(`${API}/vendors`);
      const allVendors = Array.isArray(vRes.data?.data) ? vRes.data.data : [];
      const cust = allVendors.filter(v => {
        const t = (v.VendorType || '').toUpperCase();
        return t === 'CUSTOMER' || t === 'BOTH';
      });
      setCustomers(cust);

      const wRes = await axios.get(`${API}/warehouse/warehouses`);
      setWarehouses(Array.isArray(wRes.data?.data) ? wRes.data.data : []);

      const pRes = await axios.get(`${API}/products`);
      const allProds = Array.isArray(pRes.data?.data) ? pRes.data.data : [];
      setProducts(allProds);

      try {
        const bRes = await axios.get(`${API}/bank-reconciliation/accounts`);
        setBankAccounts(Array.isArray(bRes.data?.data) ? bRes.data.data : []);
      } catch (e) {
        console.warn('Bank accounts load failed:', e.message);
      }
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

  const updateItem = async (index, field, value) => {
    const newItems = [...formData.Items];
    newItems[index][field] = value;

    if (field === 'ProductID') {
      newItems[index].Rate = 0;
      newItems[index].Stock = 0;
      newItems[index].WarehouseID = '';
      newItems[index].WarehouseStock = [];
      newItems[index].Amount = 0;

      if (value) {
        const prod = products.find(p => String(p.ProductID) === String(value));
        newItems[index].Rate = prod ? n(prod.Price) : 0;

        try {
          const res = await axios.get(`${API}/sales/product-stock/${value}`);
          newItems[index].WarehouseStock = res.data?.data || [];
        } catch (e) {
          console.warn('Warehouse stock fetch failed:', e.message);
          newItems[index].WarehouseStock = [];
        }
      }
    }

    if (field === 'WarehouseID') {
      const wStock = newItems[index].WarehouseStock || [];
      const found = wStock.find(w => String(w.WarehouseID) === String(value));
      newItems[index].Stock = found ? n(found.CurrentQuantity) : 0;
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
      Items: [...formData.Items, { ProductID: '', Quantity: 1, Rate: 0, Amount: 0, Stock: 0, WarehouseID: '', WarehouseStock: [] }]
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

  const handleDownloadInvoice = async (sale) => {
    let items = [];
    try {
      const res  = await axios.get(`${API}/sales/${sale.SaleID}`);
      const data = res.data?.data || res.data;
      items = data?.Items || data?.items || data?.SaleItems || data?.saleItems || data?.sale_items || data?.products || [];
    } catch (e) {
      console.warn('Detail API failed:', e.message);
    }

    if (!items || items.length === 0) {
      items = sale.Items || sale.items || sale.SaleItems || sale.saleItems || [];
    }

    const resolvedItems = (items || []).map(item => {
      const pid  = String(item.ProductID || item.productID || item.product_id || '');
      const prod = products.find(p => String(p.ProductID || p.productID || p.product_id) === pid);
      return {
        ProductName: item.ProductName || item.productName || item.product_name || item.name || item.Name || prod?.ProductName || prod?.productName || pid || '-',
        Quantity: Number(item.Quantity ?? item.quantity ?? item.qty ?? 0),
        Rate:     Number(item.Rate || item.rate || item.price || item.Price || 0),
        Amount:   Number(item.Amount || item.amount || item.total || item.Total || 0),
      };
    });

    generateInvoicePDF({
      type:       'sale',
      invoiceNo:  sale.InvoiceNo   || sale.invoiceNo   || '-',
      date:       fmt(sale.SaleDate || sale.saleDate),
      partyLabel: 'Customer',
      partyName:  sale.CustomerName  || sale.customerName  || '-',
      partyPhone: sale.CustomerPhone || sale.customerPhone || '',
      partyCity:  sale.CustomerCity  || sale.customerCity  || '',
      items:      resolvedItems,
      total:      n(sale.TotalAmount    || sale.totalAmount),
      paid:       n(sale.PaidAmount     || sale.ReceivedAmount || sale.paidAmount || 0),
      balance:    n(sale.BalanceAmount  || sale.balanceAmount  || 0),
      status:     sale.PaymentStatus   || sale.paymentStatus   || 'Pending',
    });
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
        PaymentMethod:  formData.PaymentMethod,
        ChequeNo:       formData.ChequeNo,
        BankAccountID:  formData.BankAccountID || null,
        BankDetails:    formData.BankDetails,
        Items:          formData.Items,
      };
      await axios.post(`${API}/sales`, payload);
      alert('Sale Created Successfully!');
      setShowModal(false);
      setFormData({
        CustomerID: '', SaleDate: new Date().toISOString().split('T')[0],
        Description: '', ReceivedAmount: 0, PaymentMethod: 'Cash',
        ChequeNo: '', BankAccountID: '', BankDetails: '',
        Items: [{ ProductID: '', Quantity: 1, Rate: 0, Amount: 0, Stock: 0, WarehouseID: '', WarehouseStock: [] }]
      });
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const openPayModal = (sale) => {
    setSelectedSale(sale);
    setPayForm({ amount: n(sale.BalanceAmount).toFixed(2), method: 'Cash', chequeNo: '', bankAccountID: '', bankDetails: '', notes: '' });
    setShowPayModal(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/sales/${selectedSale.SaleID}/payment`, {
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
    return s(r.CustomerName).toLowerCase().includes(q) || s(r.InvoiceNo).toLowerCase().includes(q);
  });

  const totalSales = filtered.reduce((sum, r) => sum + n(r.TotalAmount), 0);

  const BankFields = ({ method, bankAccountID, setBankAccountID, chequeNo, setChequeNo, bankDetails, setBankDetails }) => (
    <>
      {(method === 'Online' || method === 'Bank Transfer') && (
        <div style={{ marginTop: 8 }}>
          <label style={S.label}>🏦 Bank Account <span style={{ color: '#dc2626' }}>*</span></label>
          <select required style={S.input} value={bankAccountID} onChange={e => setBankAccountID(e.target.value)}>
            <option value="">-- Select Bank Account --</option>
            {bankAccounts.length === 0 && (
              <option disabled>No bank accounts found — add from Bank Reconciliation</option>
            )}
            {bankAccounts.map(b => (
              <option key={b.BankAccountID} value={b.BankAccountID}>
                {b.BankName} — {b.AccountNumber} ({b.AccountTitle})
              </option>
            ))}
          </select>
        </div>
      )}
      {method === 'Cheque' && (
        <div style={{ marginTop: 8 }}>
          <label style={S.label}>Cheque No</label>
          <input style={S.input} placeholder="Cheque Number"
            value={chequeNo} onChange={e => setChequeNo(e.target.value)} />
        </div>
      )}
      {(method === 'Online' || method === 'Bank Transfer') && (
        <div style={{ marginTop: 8 }}>
          <label style={S.label}>Reference / Transaction ID</label>
          <input style={S.input} placeholder="e.g. TXN123456"
            value={bankDetails} onChange={e => setBankDetails(e.target.value)} />
        </div>
      )}
    </>
  );

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
              {['#','Date','Customer','Invoice #','Total','Paid','Balance','Status','🏭 Warehouse','Actions'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={10} style={S.empty}>No sales found.</td></tr>
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
                    {/* ✅ NEW: Warehouse column */}
                    <td style={{...S.td, fontSize:12, color:'#6b7280'}}>
                      {s(r.Warehouses) || '-'}
                    </td>
                    <td style={{...S.td}}>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        <button onClick={() => handleDownloadInvoice(r)} style={S.btnSm('#0284c7')} title="Download Invoice">
                          🧾 Invoice
                        </button>
                        {r.PaymentStatus !== 'Returned' && r.PaymentStatus !== 'Paid' && (
                          <button onClick={() => openPayModal(r)} style={S.btnSm('#16a34a')}>Pay</button>
                        )}
                        {r.PaymentStatus !== 'Returned' && (
                          <button onClick={() => handleReturn(r.SaleID)} style={S.btnSm('#f59e0b')}>Return</button>
                        )}
                        {r.PaymentStatus === 'Returned' && (
                          <span style={{color:'#9ca3af', fontSize:12}}>Returned</span>
                        )}
                      </div>
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
              <div style={{border:'1px solid #e5e7eb', borderRadius:4, padding:10, background:'#f9fafb', maxHeight:320, overflowY:'auto'}}>
                {formData.Items.map((item, idx) => (
                  <div key={idx} style={{marginBottom:12, paddingBottom:10, borderBottom:'1px dashed #e5e7eb'}}>

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
                      <div style={{display:'flex', alignItems:'center', gap:8, marginTop:6}}>
                        <span style={{fontSize:12, color:'#6b7280', whiteSpace:'nowrap'}}>🏭 Warehouse:</span>
                        <select style={{...S.input, flex:1, fontSize:12}}
                          value={item.WarehouseID}
                          onChange={e=>updateItem(idx, 'WarehouseID', e.target.value)}>
                          <option value="">-- Select Warehouse --</option>
                          {(item.WarehouseStock && item.WarehouseStock.length > 0
                            ? item.WarehouseStock
                            : warehouses
                          ).map(w => (
                            <option key={w.WarehouseID} value={w.WarehouseID}>
                              {w.WarehouseName}{w.City ? ` — ${w.City}` : ''}
                              {w.CurrentQuantity !== undefined ? `  |  Stock: ${n(w.CurrentQuantity)}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {item.ProductID && item.WarehouseID && (
                      <div style={{
                        fontSize:11, marginTop:4, paddingLeft:4, fontWeight:600,
                        color: n(item.Stock) <= 0 ? '#dc2626' : n(item.Stock) < n(item.Quantity) ? '#d97706' : '#16a34a'
                      }}>
                        {n(item.Stock) <= 0
                          ? `❌ Out of Stock in selected warehouse!`
                          : n(item.Stock) < n(item.Quantity)
                            ? `⚠️ Insufficient! Available: ${n(item.Stock)}, Requested: ${n(item.Quantity)}`
                            : `✓ Available: ${n(item.Stock)}`
                        }
                      </div>
                    )}

                    {!item.ProductID && (
                      <div style={{fontSize:11, color:'#9ca3af', marginTop:4, paddingLeft:2}}>
                        ↑ Product select karein — warehouse stock automatically dikhega
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addItemRow}
                  style={{width:'100%', padding:6, background:'#e0f2fe', color:'#0284c7', border:'none', borderRadius:4, cursor:'pointer'}}>
                  + Add Item
                </button>
              </div>

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
          <div style={{...S.modal, width:440}}>
            <h3 style={{marginTop:0}}>Record Payment</h3>
            <p style={{color:'#6b7280', fontSize:13}}>
              Invoice: <strong>{selectedSale.InvoiceNo}</strong> | Balance: <strong>Rs.{n(selectedSale.BalanceAmount).toFixed(2)}</strong>
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

              <label style={{...S.label, marginTop:10}}>Notes</label>
              <input style={S.input} value={payForm.notes}
                onChange={e=>setPayForm({...payForm, notes: e.target.value})} />

              {(payForm.method === 'Online' || payForm.method === 'Bank Transfer') && !payForm.bankAccountID && (
                <div style={{marginTop:8, padding:'8px 12px', background:'#fef3c7', border:'1px solid #fcd34d', borderRadius:4, fontSize:12, color:'#92400e'}}>
                  ⚠️ Bank Transfer ke liye bank account select karna zaruri hai — warna Bank Reconciliation mein nahi ayega.
                </div>
              )}

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