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

const DEFAULT_CATEGORIES = ['Rent','Utilities','Salary','Transport','Office Supplies','Marketing','Maintenance','Insurance','Taxes','Other'];
const METHODS = ['Cash','Bank Transfer','Cheque','Card','Other'];
const INIT = { Category:'', CustomCategory:'', ExpenseDate:'', Description:'', Amount:'', PaymentMethod:'Cash', ChequeNo:'' };

export default function Expenses() {
  const [tab, setTab] = useState('expenses'); // 'expenses' | 'pettycash'
  const [rows, setRows]         = useState([]);
  const [form, setForm]         = useState(INIT);
  const [showModal, setShow]    = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [customTypes, setCustomTypes] = useState([]);

  // Petty Cash state
  const [pcBalance, setPcBalance]   = useState(0);
  const [pcTxns, setPcTxns]         = useState([]);
  const [pcLoading, setPcLoading]   = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showPcExpModal, setShowPcExpModal] = useState(false);
  const [pcFundForm, setPcFundForm] = useState({ amount:'', description:'', date: new Date().toISOString().split('T')[0] });
  const [pcExpForm, setPcExpForm]   = useState({ amount:'', category:'', description:'', date: new Date().toISOString().split('T')[0] });
  const [newTypeName, setNewTypeName] = useState('');

  useEffect(() => { load(); loadTypes(); }, []);
  useEffect(() => { if (tab === 'pettycash') loadPettyCash(); }, [tab]);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/expenses`);
      const raw = res.data;
      setRows(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
    } catch (e) { setError('Failed to load expenses.'); }
    finally { setLoading(false); }
  };

  const loadTypes = async () => {
    try {
      const res = await axios.get(`${API}/expenses/types`);
      setCustomTypes(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { console.warn('Types load failed:', e.message); }
  };

  const loadPettyCash = async () => {
    try {
      setPcLoading(true);
      const res = await axios.get(`${API}/expenses/petty-cash`);
      setPcBalance(n(res.data?.balance));
      setPcTxns(Array.isArray(res.data?.transactions) ? res.data.transactions : []);
    } catch (e) { console.warn('Petty cash load failed:', e.message); }
    finally { setPcLoading(false); }
  };

  const allCategories = [...DEFAULT_CATEGORIES.filter(c => c !== 'Other'), ...customTypes.map(t => t.TypeName), 'Other'];

  const addCustomType = async () => {
    const name = newTypeName.trim();
    if (!name) return;
    try {
      await axios.post(`${API}/expenses/types`, { typeName: name });
      setNewTypeName('');
      loadTypes();
    } catch (e) { alert(e.response?.data?.message || 'Failed to add type.'); }
  };

  const removeCustomType = async (id) => {
    if (!window.confirm('Delete this expense type?')) return;
    try {
      await axios.delete(`${API}/expenses/types/${id}`);
      loadTypes();
    } catch (e) { alert('Failed to delete type.'); }
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const category = form.Category === 'Other' && form.CustomCategory.trim()
      ? form.CustomCategory.trim() : form.Category;
    if (!category) { setError('Category is required.'); return; }
    if (!form.Amount || isNaN(Number(form.Amount)) || +form.Amount <= 0) { setError('Enter a valid amount.'); return; }
    try {
      setSaving(true);
      await axios.post(`${API}/expenses`, {
        category,
        expenseDate:   form.ExpenseDate || new Date().toISOString().split('T')[0],
        description:   form.Description.trim(),
        amount:        Number(form.Amount),
        paymentMethod: form.PaymentMethod,
        chequeNo:      form.ChequeNo || '',
      });
      setShow(false);
      load();
    } catch (e) { setError(e?.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/expenses/${id}`);
      load();
    } catch (e) { alert('Failed to delete expense.'); }
  };

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses/petty-cash/fund`, pcFundForm);
      setShowFundModal(false);
      setPcFundForm({ amount:'', description:'', date: new Date().toISOString().split('T')[0] });
      loadPettyCash();
    } catch (e) { alert(e.response?.data?.message || 'Failed.'); }
  };

  const handlePcExpSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses/petty-cash/expense`, pcExpForm);
      setShowPcExpModal(false);
      setPcExpForm({ amount:'', category:'', description:'', date: new Date().toISOString().split('T')[0] });
      loadPettyCash();
    } catch (e) { alert(e.response?.data?.message || 'Failed.'); }
  };

  const handleDeletePcTxn = async (id) => {
    if (!window.confirm('Delete this transaction? Balance will be reversed.')) return;
    try {
      await axios.delete(`${API}/expenses/petty-cash/${id}`);
      loadPettyCash();
    } catch (e) { alert('Failed to delete.'); }
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return s(r.Category).toLowerCase().includes(q) || s(r.Description).toLowerCase().includes(q);
  });
  const total = filtered.reduce((sum, r) => sum + n(r.Amount), 0);

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <div style={S.hdr}>
        <h2 style={{ margin:0 }}>💸 Expenses</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setShowTypeModal(true)} style={S.btn('#7c3aed')}>⚙️ Manage Types</button>
          <button onClick={tab==='expenses'?load:loadPettyCash} style={S.btn('#6b7280')}>↻ Refresh</button>
          {tab === 'expenses' && <button onClick={()=>{ setForm(INIT); setError(''); setShow(true); }} style={S.btn('#2563eb')}>+ Add Expense</button>}
          {tab === 'pettycash' && <>
            <button onClick={()=>setShowFundModal(true)} style={S.btn('#16a34a')}>+ Add Fund</button>
            <button onClick={()=>setShowPcExpModal(true)} style={S.btn('#dc2626')}>- Add Expense</button>
          </>}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'2px solid #e5e7eb' }}>
        {[['expenses','💸 Expenses'],['pettycash','💰 Petty Cash']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{
            padding:'10px 24px', border:'none', background:'none', cursor:'pointer',
            fontWeight: tab===key ? 700 : 400,
            color: tab===key ? '#2563eb' : '#6b7280',
            borderBottom: tab===key ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom:-2, fontSize:14
          }}>{label}</button>
        ))}
      </div>

      {/* ── EXPENSES TAB ── */}
      {tab === 'expenses' && (
        <>
          <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
            <Card label="Total (filtered)" value={`Rs.${total.toLocaleString('en-IN',{minimumFractionDigits:2})}`} color="#dc2626" />
            <Card label="Records" value={rows.length} color="#2563eb" />
          </div>

          {error && <div style={S.err}>{error}</div>}
          <input placeholder="Search category or description..." value={search}
            onChange={e=>setSearch(e.target.value)} style={S.search} />

          {loading ? <p>Loading...</p> : (
            <div style={{ overflowX:'auto' }}>
              <table style={S.table}>
                <thead><tr style={{ background:'#f3f4f6' }}>
                  {['#','Date','Category','Description','Amount','Method','Actions'].map(h=>(
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.length===0
                    ? <tr><td colSpan={7} style={S.empty}>No expenses found.</td></tr>
                    : filtered.map((r,i) => (
                      <tr key={r.ExpenseID??i} style={{ borderBottom:'1px solid #e5e7eb' }}>
                        <td style={S.td}>{i+1}</td>
                        <td style={S.td}>{fmt(r.ExpenseDate)}</td>
                        <td style={S.td}>
                          <span style={{ background:'#eff6ff', color:'#2563eb', padding:'2px 8px', borderRadius:10, fontSize:12 }}>
                            {s(r.Category)||'-'}
                          </span>
                        </td>
                        <td style={S.td}>{s(r.Description)||'-'}</td>
                        <td style={{ ...S.td, fontWeight:600, color:'#dc2626' }}>
                          Rs.{n(r.Amount).toLocaleString('en-IN',{minimumFractionDigits:2})}
                        </td>
                        <td style={S.td}>{s(r.PaymentMethod)||'-'}</td>
                        <td style={S.td}>
                          <button onClick={()=>handleDelete(r.ExpenseID)} style={S.btnSm('#dc2626')}>🗑 Delete</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
                {filtered.length > 0 && (
                  <tfoot><tr style={{ background:'#f9fafb', fontWeight:600 }}>
                    <td colSpan={4} style={{ ...S.td, textAlign:'right' }}>Total:</td>
                    <td style={{ ...S.td, color:'#dc2626' }}>Rs.{total.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    <td /><td />
                  </tr></tfoot>
                )}
              </table>
            </div>
          )}
        </>
      )}

      {/* ── PETTY CASH TAB ── */}
      {tab === 'pettycash' && (
        <>
          <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
            <Card label="Current Balance" value={`Rs.${n(pcBalance).toLocaleString('en-IN',{minimumFractionDigits:2})}`} color={pcBalance < 0 ? '#dc2626' : '#16a34a'} />
            <Card label="Total Transactions" value={pcTxns.length} color="#2563eb" />
            <Card label="Total Fund Added" value={`Rs.${pcTxns.filter(t=>t.TransactionType==='Fund Add').reduce((s,t)=>s+n(t.Amount),0).toLocaleString('en-IN',{minimumFractionDigits:2})}`} color="#16a34a" />
            <Card label="Total Spent" value={`Rs.${pcTxns.filter(t=>t.TransactionType==='Expense').reduce((s,t)=>s+n(t.Amount),0).toLocaleString('en-IN',{minimumFractionDigits:2})}`} color="#dc2626" />
          </div>

          {pcLoading ? <p>Loading...</p> : (
            <div style={{ overflowX:'auto' }}>
              <table style={S.table}>
                <thead><tr style={{ background:'#f3f4f6' }}>
                  {['#','Date','Type','Category','Description','Amount','Balance After','Actions'].map(h=>(
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {pcTxns.length===0
                    ? <tr><td colSpan={8} style={S.empty}>No petty cash transactions yet.</td></tr>
                    : pcTxns.map((t,i) => (
                      <tr key={t.TransactionID??i} style={{ borderBottom:'1px solid #e5e7eb' }}>
                        <td style={S.td}>{i+1}</td>
                        <td style={S.td}>{fmt(t.TransactionDate)}</td>
                        <td style={S.td}>
                          <span style={{
                            padding:'2px 8px', borderRadius:10, fontSize:12, fontWeight:600,
                            background: t.TransactionType==='Fund Add' ? '#f0fdf4' : '#fef2f2',
                            color:      t.TransactionType==='Fund Add' ? '#16a34a' : '#dc2626'
                          }}>{t.TransactionType}</span>
                        </td>
                        <td style={S.td}>{s(t.Category)||'-'}</td>
                        <td style={S.td}>{s(t.Description)||'-'}</td>
                        <td style={{ ...S.td, fontWeight:600, color: t.TransactionType==='Fund Add'?'#16a34a':'#dc2626' }}>
                          {t.TransactionType==='Fund Add'?'+':'-'}Rs.{n(t.Amount).toLocaleString('en-IN',{minimumFractionDigits:2})}
                        </td>
                        <td style={{ ...S.td, color:'#374151' }}>Rs.{n(t.BalanceAfter).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                        <td style={S.td}>
                          <button onClick={()=>handleDeletePcTxn(t.TransactionID)} style={S.btnSm('#dc2626')}>🗑 Delete</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ADD EXPENSE MODAL */}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0 }}>Add Expense</h3>
            {error && <div style={S.err}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <F label="Category *">
                <select name="Category" value={form.Category} onChange={handleChange} style={S.input} required>
                  <option value="">— Select Category —</option>
                  {allCategories.map(c => <option key={c}>{c}</option>)}
                </select>
              </F>
              {form.Category === 'Other' && (
                <F label="Custom Category Name *">
                  <input name="CustomCategory" value={form.CustomCategory} onChange={handleChange}
                    style={S.input} placeholder="Enter category name" required />
                </F>
              )}
              <F label="Date *">
                <input type="date" name="ExpenseDate" value={form.ExpenseDate} onChange={handleChange} style={S.input} required />
              </F>
              <F label="Amount (Rs.) *">
                <input name="Amount" type="number" step="0.01" min="0.01"
                  value={form.Amount} onChange={handleChange} style={S.input} placeholder="0.00" />
              </F>
              <F label="Payment Method">
                <select name="PaymentMethod" value={form.PaymentMethod} onChange={handleChange} style={S.input}>
                  {METHODS.map(m=><option key={m}>{m}</option>)}
                </select>
              </F>
              {form.PaymentMethod === 'Cheque' && (
                <F label="Cheque No *">
                  <input name="ChequeNo" value={form.ChequeNo} onChange={handleChange}
                    style={S.input} placeholder="Enter cheque number" required />
                </F>
              )}
              <F label="Description">
                <textarea name="Description" value={form.Description} onChange={handleChange}
                  rows={3} style={{ ...S.input, resize:'vertical' }} />
              </F>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>setShow(false)} style={S.btn('#6b7280')}>Cancel</button>
                <button type="submit" disabled={saving} style={S.btn('#2563eb')}>{saving?'Saving...':'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FUND MODAL */}
      {showFundModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0, color:'#16a34a' }}>💰 Add Petty Cash Fund</h3>
            <p style={{ fontSize:13, color:'#6b7280' }}>Current Balance: <strong>Rs.{n(pcBalance).toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></p>
            <form onSubmit={handleFundSubmit}>
              <F label="Amount (Rs.) *">
                <input type="number" step="0.01" min="0.01" required style={S.input}
                  value={pcFundForm.amount} onChange={e=>setPcFundForm({...pcFundForm, amount:e.target.value})} placeholder="0.00" />
              </F>
              <F label="Date *">
                <input type="date" required style={S.input}
                  value={pcFundForm.date} onChange={e=>setPcFundForm({...pcFundForm, date:e.target.value})} />
              </F>
              <F label="Description">
                <input style={S.input} value={pcFundForm.description}
                  onChange={e=>setPcFundForm({...pcFundForm, description:e.target.value})} placeholder="e.g. Weekly petty cash replenishment" />
              </F>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>setShowFundModal(false)} style={S.btn('#6b7280')}>Cancel</button>
                <button type="submit" style={S.btn('#16a34a')}>Add Fund</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PETTY CASH EXPENSE MODAL */}
      {showPcExpModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0, color:'#dc2626' }}>💸 Petty Cash Expense</h3>
            <p style={{ fontSize:13, color:'#6b7280' }}>Current Balance: <strong>Rs.{n(pcBalance).toLocaleString('en-IN',{minimumFractionDigits:2})}</strong></p>
            <form onSubmit={handlePcExpSubmit}>
              <F label="Category *">
                <select required style={S.input} value={pcExpForm.category}
                  onChange={e=>setPcExpForm({...pcExpForm, category:e.target.value})}>
                  <option value="">— Select Category —</option>
                  {allCategories.filter(c=>c!=='Other').map(c=><option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="Amount (Rs.) *">
                <input type="number" step="0.01" min="0.01" required style={S.input}
                  value={pcExpForm.amount} onChange={e=>setPcExpForm({...pcExpForm, amount:e.target.value})} placeholder="0.00" />
              </F>
              <F label="Date *">
                <input type="date" required style={S.input}
                  value={pcExpForm.date} onChange={e=>setPcExpForm({...pcExpForm, date:e.target.value})} />
              </F>
              <F label="Description">
                <input style={S.input} value={pcExpForm.description}
                  onChange={e=>setPcExpForm({...pcExpForm, description:e.target.value})} placeholder="What was this expense for?" />
              </F>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>setShowPcExpModal(false)} style={S.btn('#6b7280')}>Cancel</button>
                <button type="submit" style={S.btn('#dc2626')}>Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE EXPENSE TYPES MODAL */}
      {showTypeModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0 }}>⚙️ Manage Expense Types</h3>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>Custom categories — database mein store hote hain.</p>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:8 }}>DEFAULT CATEGORIES</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {DEFAULT_CATEGORIES.map(c => (
                  <span key={c} style={{ background:'#f3f4f6', color:'#374151', padding:'4px 10px', borderRadius:20, fontSize:12 }}>{c}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:8 }}>CUSTOM CATEGORIES</div>
              {customTypes.length === 0
                ? <p style={{ fontSize:13, color:'#9ca3af' }}>No custom categories yet.</p>
                : (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {customTypes.map(t => (
                      <span key={t.TypeID} style={{ background:'#eff6ff', color:'#2563eb', padding:'4px 10px', borderRadius:20, fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
                        {t.TypeName}
                        <button onClick={()=>removeCustomType(t.TypeID)}
                          style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>
                      </span>
                    ))}
                  </div>
                )
              }
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              <input value={newTypeName} onChange={e=>setNewTypeName(e.target.value)}
                placeholder="New category name..." style={{ ...S.input, flex:1 }}
                onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addCustomType())} />
              <button onClick={addCustomType} style={S.btn('#2563eb')}>Add</button>
            </div>

            <button onClick={()=>setShowTypeModal(false)} style={{...S.btn('#6b7280'), width:'100%'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'14px 20px', minWidth:160 }}>
      <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

function F({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:4 }}>{label}</label>
      {children}
    </div>
  );
}

const S = {
  hdr:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  search: { padding:'8px 12px', width:280, borderRadius:6, border:'1px solid #d1d5db', marginBottom:16, fontSize:14 },
  table:  { width:'100%', borderCollapse:'collapse', fontSize:14 },
  th:     { padding:'10px 12px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #e5e7eb' },
  td:     { padding:'10px 12px', verticalAlign:'middle' },
  empty:  { textAlign:'center', padding:28, color:'#6b7280' },
  input:  { width:'100%', padding:'8px 10px', borderRadius:6, border:'1px solid #d1d5db', fontSize:14, boxSizing:'border-box', fontFamily:'inherit' },
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:  { background:'#fff', borderRadius:10, padding:28, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:13 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'9px 18px', cursor:'pointer', fontSize:13, fontWeight:500 }),
  btnSm:  (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:4, padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:500 }),
};