import React, { useState, useEffect } from 'react';
import axios from 'axios';

// MATCHES backend: GET /api/v1/expenses  POST /api/v1/expenses
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s   = (v) => (v == null ? '' : String(v));
const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

const INIT = { Category:'', ExpenseDate:'', Description:'', Amount:'', PaymentMethod:'Cash' };
const METHODS = ['Cash','Bank Transfer','Cheque','Card','UPI','Other'];

export default function Expenses() {
  const [rows, setRows]       = useState([]);
  const [form, setForm]       = useState(INIT);
  const [showModal, setShow]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch]   = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/expenses`);
      const raw = res.data;
      // backend returns { success:true, data: [...] }
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setRows(arr);
    } catch (e) {
      setError('Failed to load expenses. Check backend connection.');
    } finally { setLoading(false); }
  };

  const openAdd  = () => { setForm(INIT); setError(''); setSuccess(''); setShow(true); };
  const closeModal = () => { setShow(false); setError(''); };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.Category.trim())                                       { setError('Category is required.'); return; }
    if (!form.Amount || isNaN(Number(form.Amount)) || +form.Amount<=0) { setError('Enter a valid amount.'); return; }

    try {
      setSaving(true);
      // backend createExpense expects: { category, description, amount, paymentMethod }
      await axios.post(`${API}/expenses`, {
        category:      form.Category.trim(),
        expenseDate: form.ExpenseDate || new Date().toISOString().split('T')[0],
        description:   form.Description.trim(),
        amount:        Number(form.Amount),
        paymentMethod: form.PaymentMethod,
      });
      // Optimistic Update: Show user selected date immediately
      const newExpense = {
        ExpenseID: Date.now(),
        ExpenseDate: form.ExpenseDate,
        Category: form.Category,
        Description: form.Description,
        Amount: form.Amount,
        PaymentMethod: form.PaymentMethod
      };
      setRows([newExpense, ...rows]);
      setSuccess('Expense recorded.');
      closeModal();
// await load(); // Disabled to keep frontend date correct
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save.');
    } finally { setSaving(false); }
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
        <button onClick={openAdd} style={S.btn('#2563eb')}>+ Add Expense</button>
      </div>

      {/* Summary */}
      <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <Card label="Total (filtered)" value={`Rs.${total.toLocaleString('en-IN',{minimumFractionDigits:2})}`} color="#dc2626" />
        <Card label="Records"          value={rows.length} color="#2563eb" />
      </div>

      {error   && <div style={S.err}>{error}</div>}
      {success && <div style={S.ok}>{success}</div>}

      <input placeholder="Search category or description…" value={search}
        onChange={e=>setSearch(e.target.value)} style={S.search} />

      {loading ? <p>Loading…</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={S.table}>
            <thead><tr style={{ background:'#f3f4f6' }}>
              {['#','Date','Category','Description','Amount','Method'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={6} style={S.empty}>No expenses found.</td></tr>
                : filtered.map((r,i) => (
                  <tr key={r.ExpenseID ?? i} style={{ borderBottom:'1px solid #e5e7eb' }}>
                    <td style={S.td}>{i+1}</td>
                    <td style={S.td}>{fmt(r.ExpenseDate)}</td>
                    <td style={S.td}>
                      <span style={{ background:'#eff6ff', color:'#2563eb', padding:'2px 8px', borderRadius:10, fontSize:12 }}>
                        {s(r.Category)||'—'}
                      </span>
                    </td>
                    <td style={S.td}>{s(r.Description)||'—'}</td>
                    <td style={{ ...S.td, fontWeight:600, color:'#dc2626' }}>
                      Rs.{n(r.Amount).toLocaleString('en-IN',{minimumFractionDigits:2})}
                    </td>
                    <td style={S.td}>{s(r.PaymentMethod)||'—'}</td>
                  </tr>
                ))
              }
            </tbody>
            {filtered.length>0 && (
              <tfoot><tr style={{ background:'#f9fafb', fontWeight:600 }}>
                <td colSpan={4} style={{ ...S.td, textAlign:'right' }}>Total:</td>
                <td style={{ ...S.td, color:'#dc2626' }}>
                  Rs.{total.toLocaleString('en-IN',{minimumFractionDigits:2})}
                </td>
                <td />
              </tr></tfoot>
            )}
          </table>
        </div>
      )}

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0 }}>Add Expense</h3>
            {error && <div style={S.err}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <F label="Category *">
                <select name="Category" value={form.Category} onChange={handleChange} style={S.input}>
                  <option value="">— Select —</option>
                  {['Rent','Utilities','Salary','Transport','Office Supplies','Marketing','Maintenance','Insurance','Taxes','Other'].map(c=>(
                    <option key={c}>{c}</option>
                  ))}
                </select>
              <F label="Date *">
                <input type="date" name="ExpenseDate" value={form.ExpenseDate} onChange={handleChange} style={S.input} required />
              </F>
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
              <F label="Description">
                <textarea name="Description" value={form.Description} onChange={handleChange}
                  rows={3} style={{ ...S.input, resize:'vertical' }} />
              </F>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={closeModal} style={S.btn('#6b7280')}>Cancel</button>
                <button type="submit" disabled={saving} style={S.btn('#2563eb')}>{saving?'Saving…':'Add Expense'}</button>
              </div>
            </form>
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
      <div style={{ fontSize:22, fontWeight:700, color }}>{value}</div>
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
  modal:  { background:'#fff', borderRadius:10, padding:28, width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:14 },
  ok:     { background:'#f0fdf4', border:'1px solid #86efac', color:'#15803d', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:14 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'9px 18px', cursor:'pointer', fontSize:14, fontWeight:500 }),
};

