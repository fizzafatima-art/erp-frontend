import React, { useState, useEffect } from 'react';
// FIXED: removed broken imports of Input.jsx, Button.jsx (case-mismatch) and ../../styles/pages.css (outside src/)

const METHODS     = ['Cash','Bank Transfer','Cheque','Card','UPI','Other'];
const CATEGORIES  = ['Rent','Utilities','Salary','Transport','Office Supplies','Marketing','Maintenance','Insurance','Taxes','Other'];
const INIT        = { Category:'', Description:'', Amount:'', PaymentMethod:'Cash' };
const s           = (v) => (v == null ? '' : String(v));

/**
 * ExpenseForm — self-contained, no external component dependencies
 * Props:
 *   onSubmit(data)  — called with { category, description, amount, paymentMethod }
 *   onCancel()
 *   initialData     — pre-fill for edit mode
 *   loading         — show spinner on submit button
 *   error           — external error string
 */
export default function ExpenseForm({ onSubmit, onCancel, initialData, loading = false, error = '' }) {
  const [form, setForm]     = useState(INIT);
  const [localErr, setLocalErr] = useState('');

  useEffect(() => {
    if (!initialData) { setForm(INIT); return; }
    setForm({
      Category:      s(initialData.Category      ?? initialData.category),
      Description:   s(initialData.Description   ?? initialData.description ?? initialData.Notes ?? initialData.notes),
      Amount:        s(initialData.Amount         ?? initialData.amount),
      PaymentMethod: s(initialData.PaymentMethod  ?? initialData.paymentMethod) || 'Cash',
    });
  }, [initialData]);

  const onChange = (e) => { setForm(p=>({...p,[e.target.name]:e.target.value})); setLocalErr(''); };

  const onSubmitForm = (e) => {
    e.preventDefault(); setLocalErr('');
    if (!form.Category.trim())                                         { setLocalErr('Category is required.'); return; }
    if (!form.Amount || isNaN(+form.Amount) || +form.Amount <= 0)     { setLocalErr('Enter a valid amount.'); return; }
    onSubmit?.({ category:form.Category.trim(), description:form.Description.trim(), amount:+form.Amount, paymentMethod:form.PaymentMethod });
  };

  const msg = error || localErr;

  return (
    <form onSubmit={onSubmitForm}>
      {msg && <div style={S.err}>{msg}</div>}

      <F label="Category *">
        <select name="Category" value={form.Category} onChange={onChange} style={S.input}>
          <option value="">— Select —</option>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
      </F>

      <F label="Amount (Rs.) *">
        <input name="Amount" type="number" step="0.01" min="0.01"
          value={form.Amount} onChange={onChange} placeholder="0.00" style={S.input} />
      </F>

      <F label="Payment Method">
        <select name="PaymentMethod" value={form.PaymentMethod} onChange={onChange} style={S.input}>
          {METHODS.map(m=><option key={m}>{m}</option>)}
        </select>
      </F>

      <F label="Description">
        <textarea name="Description" value={form.Description} onChange={onChange}
          rows={3} placeholder="Optional…" style={{...S.input,resize:'vertical'}} />
      </F>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
        {onCancel && <button type="button" onClick={onCancel} style={S.btnSec} disabled={loading}>Cancel</button>}
        <button type="submit" style={S.btnPri} disabled={loading}>
          {loading ? 'Saving…' : (initialData ? 'Update' : 'Add Expense')}
        </button>
      </div>
    </form>
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
  input:  { width:'100%', padding:'8px 10px', borderRadius:6, border:'1px solid #d1d5db', fontSize:14, boxSizing:'border-box', fontFamily:'inherit' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:13 },
  btnPri: { background:'#2563eb', color:'#fff', border:'none', borderRadius:6, padding:'9px 20px', cursor:'pointer', fontSize:14, fontWeight:500 },
  btnSec: { background:'#f3f4f6', color:'#374151', border:'1px solid #d1d5db', borderRadius:6, padding:'9px 20px', cursor:'pointer', fontSize:14, fontWeight:500 },
};
