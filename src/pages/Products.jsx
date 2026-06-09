import React, { useState, useEffect } from 'react';
import axios from 'axios';

// MATCHES backend: GET /api/v1/products
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s = (v) => (v == null ? '' : String(v));
const n = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };

const INIT = { ProductName:'', Category:'', Unit:'', Description:'', MinimumQuantity:'', Price:'' };

export default function Products() {
  const [rows, setRows]       = useState([]);
  const [form, setForm]       = useState(INIT);
  const [editId, setEditId]   = useState(null);
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
      const res = await axios.get(`${API}/products`);
      const raw = res.data;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setRows(arr);
    } catch (e) {
      setError('Failed to load products.');
    } finally { setLoading(false); }
  };

  const openAdd = () => {
    setForm(INIT); setEditId(null); setError(''); setSuccess(''); setShow(true);
  };

  // FIX 1: Form ko load karte waqt 'Price' use karo (UnitPrice nahi)
  const openEdit = (r) => {
    setForm({
      ProductName:     s(r.ProductName     || r.productName),
      Category:        s(r.Category        || r.categoryName || r.CategoryName),
      Price:           s(r.Price           || r.price || r.UnitPrice), // Fallback added just in case
      Unit:            s(r.Unit            || r.unit),
      Description:     s(r.Description     || r.description),
      MinimumQuantity: s(r.MinimumQuantity || r.minimumQuantity),
    });
    setEditId(r.ProductID ?? r.productId ?? r.id);
    setError(''); setSuccess(''); setShow(true);
  };

  const closeModal = () => { setShow(false); setError(''); };
  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.ProductName.trim())                               { setError('Product name is required.'); return; }
    if (!form.Price || isNaN(Number(form.Price)))                { setError('Valid price is required.'); return; }

    // FIX 2: Payload mein 'price' bhejo (Backend 'price' expect kar raha hai)
    const payload = {
      productName:     form.ProductName.trim(),
      category:        form.Category.trim(),
      price:           Number(form.Price),  // Changed from unitPrice to price
      unit:            form.Unit.trim(),
      description:     form.Description.trim(),
      minimumQuantity: form.MinimumQuantity ? Number(form.MinimumQuantity) : 0,
    };

    try {
      setSaving(true);
      if (editId) {
        await axios.put(`${API}/products/${editId}`, payload);
        setSuccess('Product updated.');
      } else {
        await axios.post(`${API}/products`, payload);
        setSuccess('Product added.');
      }
      closeModal();
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message
        || (typeof e?.response?.data === 'string' ? e.response.data : '')
        || e?.message || 'Failed to save product.';
      setError(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API}/products/${id}`);
      setSuccess('Product deleted.');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Delete failed.');
    }
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return s(r.ProductName).toLowerCase().includes(q) || s(r.Category).toLowerCase().includes(q);
  });

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <div style={S.hdr}>
        <h2 style={{ margin:0 }}>📦 Products</h2>
        <button onClick={openAdd} style={S.btn('#2563eb')}>+ Add Product</button>
      </div>

      {error   && <div style={S.err}>{error}</div>}
      {success && <div style={S.ok}>{success}</div>}

      <input placeholder="Search by name or category…" value={search}
        onChange={e=>setSearch(e.target.value)} style={S.search} />

      {loading ? <p>Loading…</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr style={{ background:'#f3f4f6' }}>
              {['#','Name','Category','Unit','Price (Rs.)','Min Qty','Status','Actions'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={8} style={S.empty}>No products found.</td></tr>
                : filtered.map((r,i) => {
                  const id    = r.ProductID ?? r.id;
                  // FIX 3: Table mein dikhane ke liye 'Price' use karo
                  const price = n(r.Price || r.price); 
                  const isActive = r.IsActive ?? r.isActive ?? 1;
                  return (
                    <tr key={id??i} style={{ borderBottom:'1px solid #e5e7eb' }}>
                      <td style={S.td}>{i+1}</td>
                      <td style={{ ...S.td, fontWeight:500 }}>{s(r.ProductName)||'—'}</td>
                      <td style={S.td}>{s(r.Category)||'—'}</td>
                      <td style={S.td}>{s(r.Unit)||'—'}</td>
                      <td style={{ ...S.td, fontWeight:600 }}>Rs.{price.toFixed(2)}</td>
                      <td style={S.td}>{r.MinimumQuantity ?? r.minimumQuantity ?? 0}</td>
                      <td style={S.td}>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:12, fontWeight:600,
                          background: isActive?'#f0fdf4':'#f3f4f6',
                          color:      isActive?'#16a34a':'#6b7280' }}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button onClick={()=>openEdit(r)} style={S.btnSm('#2563eb')}>Edit</button>
                        <button onClick={()=>handleDelete(id)} style={{ ...S.btnSm('#dc2626'), marginLeft:6 }}>Delete</button>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0 }}>{editId?'Edit Product':'Add Product'}</h3>
            {error && <div style={S.err}>{error}</div>}
            <form onSubmit={handleSubmit}>
              {[
                { label:'Product Name *', name:'ProductName', placeholder:'e.g. Basmati Rice' },
                { label:'Category',       name:'Category',    placeholder:'e.g. Grains' },
                // FIX 4: Input field ka name 'Price' rakha
                { label:'Unit Price (Rs.) *',name:'Price', type:'number', step:'0.01' },
                { label:'Unit',           name:'Unit',        placeholder:'e.g. kg, pcs, litre' },
                { label:'Minimum Qty',    name:'MinimumQuantity', type:'number' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:4 }}>{f.label}</label>
                  <input name={f.name} type={f.type||'text'} step={f.step}
                    value={form[f.name]} onChange={handleChange}
                    placeholder={f.placeholder} style={S.input} />
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:4 }}>Description</label>
                <textarea name="Description" value={form.Description} onChange={handleChange}
                  rows={3} style={{ ...S.input, resize:'vertical' }} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={closeModal} style={S.btn('#6b7280')}>Cancel</button>
                <button type="submit" disabled={saving} style={S.btn('#2563eb')}>
                  {saving?'Saving…':(editId?'Update':'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  hdr:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  search: { padding:'8px 12px', width:280, borderRadius:6, border:'1px solid #d1d5db', marginBottom:16, fontSize:14 },
  th:     { padding:'10px 12px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #e5e7eb' },
  td:     { padding:'10px 12px', verticalAlign:'middle' },
  empty:  { textAlign:'center', padding:28, color:'#6b7280' },
  input:  { width:'100%', padding:'8px 10px', borderRadius:6, border:'1px solid #d1d5db', fontSize:14, boxSizing:'border-box', fontFamily:'inherit' },
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:  { background:'#fff', borderRadius:10, padding:28, width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:14 },
  ok:     { background:'#f0fdf4', border:'1px solid #86efac', color:'#15803d', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:14 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'9px 18px', cursor:'pointer', fontSize:14, fontWeight:500 }),
  btnSm:  (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontSize:13, fontWeight:500 }),
};
