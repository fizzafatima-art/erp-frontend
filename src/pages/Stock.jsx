import React, { useState, useEffect } from 'react';
import axios from 'axios';

// MATCHES backend: GET /api/v1/stock  → getCurrentStock
// Returns: s.StockID, s.ProductID, s.CurrentQuantity, s.MinimumQuantity, p.ProductName, p.Category, p.Unit
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s = (v) => (v == null ? '' : String(v));
const n = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };

export default function Stock() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch]   = useState('');

  // Adjust modal
  const [showAdj, setShowAdj]     = useState(false);
  const [adjItem, setAdjItem]     = useState(null);
  const [adjForm, setAdjForm]     = useState({ AdjustmentType:'Add', Quantity:'', Reason:'' });
  const [adjSaving, setAdjSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/stock`);
      const raw = res.data;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setRows(arr);
    } catch (e) {
      setError('Failed to load stock data.');
    } finally { setLoading(false); }
  };

  const openAdj = (item) => {
    setAdjItem(item);
    setAdjForm({ AdjustmentType:'Add', Quantity:'', Reason:'' });
    setError(''); setSuccess('');
    setShowAdj(true);
  };
  const closeAdj = () => { setShowAdj(false); setAdjItem(null); setError(''); };

 const handleAdj = async (e) => {
    e.preventDefault(); setError('');
    const qty = Number(adjForm.Quantity);
    if (!adjForm.Quantity || isNaN(qty) || qty <= 0) { 
        setError('Enter a valid quantity > 0.'); 
        return; 
    }

    // ✅ SIRF StockID use karo
    const id = adjItem.StockID;
    if (!id) { setError('StockID missing. Please refresh and try again.'); return; }

    try {
        setAdjSaving(true);
        // ✅ Sirf ek call, koi fallback nahi
        const res = await axios.post(`${API}/stock/${id}/adjust`, {
            adjustmentType: adjForm.AdjustmentType,
            quantity: qty,
            reason: adjForm.Reason || 'Manual adjustment',
        });

        if (res.data?.success) {
            setSuccess(`Stock updated for "${adjItem.ProductName}".`);
            closeAdj();
            await load();
        } else {
            setError(res.data?.message || 'Adjustment failed.');
        }
    } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Adjustment failed.');
    } finally { 
        setAdjSaving(false); 
    }
};
  const filtered = rows.filter(r =>
    s(r.ProductName).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif' }}>
      <div style={S.hdr}>
        <h2 style={{ margin:0 }}>📚 Stock</h2>
        <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
      </div>

      {/* Low stock alert banner */}
      {(() => {
        const low = rows.filter(r => n(r.CurrentQuantity) < n(r.MinimumQuantity));
        return low.length > 0 ? (
          <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 16px', borderRadius:8, marginBottom:16, fontSize:14 }}>
            ⚠ {low.length} item(s) are below minimum stock level.
          </div>
        ) : null;
      })()}

      {error   && <div style={S.err}>{error}</div>}
      {success && <div style={S.ok}>{success}</div>}

      <input placeholder="Search product…" value={search}
        onChange={e=>setSearch(e.target.value)} style={S.search} />

      {loading ? <p>Loading…</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead><tr style={{ background:'#f3f4f6' }}>
              {['#','Product','Category','Current Qty','Min Qty','Unit','Status','Action'].map(h=>(
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={8} style={S.empty}>No stock records found.</td></tr>
                : filtered.map((r,i) => {
                  const current = n(r.CurrentQuantity ?? r.currentQuantity);
                  const minimum = n(r.MinimumQuantity ?? r.minimumQuantity);
                  const isLow   = current < minimum;
                  return (
                    <tr key={r.StockID ?? i} style={{ borderBottom:'1px solid #e5e7eb' }}>
                      <td style={S.td}>{i+1}</td>
                      <td style={{ ...S.td, fontWeight:500 }}>{s(r.ProductName)||'—'}</td>
                      <td style={S.td}>{s(r.Category)||'—'}</td>
                      <td style={{ ...S.td, fontWeight:700, color: isLow?'#dc2626':'#111' }}>{current}</td>
                      <td style={S.td}>{minimum}</td>
                      <td style={S.td}>{s(r.Unit)||'—'}</td>
                      <td style={S.td}>
                        <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600,
                          background: isLow?'#fef2f2':'#f0fdf4',
                          color:      isLow?'#b91c1c':'#15803d' }}>
                          {isLow ? '⚠ Low' : '✓ OK'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button onClick={()=>openAdj(r)} style={S.btnSm('#2563eb')}>Adjust Stock</button>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdj && adjItem && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop:0 }}>Adjust Stock</h3>
            <p style={{ color:'#6b7280', fontSize:14, marginTop:-8, marginBottom:16 }}>
              <strong>{s(adjItem.ProductName)}</strong>&nbsp;|&nbsp;
              Current: <strong>{n(adjItem.CurrentQuantity ?? adjItem.currentQuantity)}</strong>
            </p>
            {error && <div style={S.err}>{error}</div>}
            <form onSubmit={handleAdj}>
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>Adjustment Type</label>
                <select value={adjForm.AdjustmentType}
                  onChange={e=>setAdjForm(p=>({...p,AdjustmentType:e.target.value}))} style={S.input}>
                  <option value="Add">Add (increase stock)</option>
                  <option value="Subtract">Subtract (decrease stock)</option>
                  <option value="Set">Set (exact quantity)</option>
                </select>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>Quantity *</label>
                <input type="number" min="1" value={adjForm.Quantity}
                  onChange={e=>setAdjForm(p=>({...p,Quantity:e.target.value}))}
                  placeholder="Enter quantity" style={S.input} />
                {adjForm.Quantity && !isNaN(+adjForm.Quantity) && (
                  <p style={{ fontSize:12, color:'#6b7280', margin:'4px 0 0' }}>
                    New quantity will be: <strong>{(() => {
                      const c=n(adjItem.CurrentQuantity), q=+adjForm.Quantity;
                      if(adjForm.AdjustmentType==='Add')      return c+q;
                      if(adjForm.AdjustmentType==='Subtract') return Math.max(0,c-q);
                      return q;
                    })()}</strong>
                  </p>
                )}
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Reason</label>
                <input type="text" value={adjForm.Reason}
                  onChange={e=>setAdjForm(p=>({...p,Reason:e.target.value}))}
                  placeholder="e.g. Stock received, damaged…" style={S.input} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={closeAdj} style={S.btn('#6b7280')}>Cancel</button>
                <button type="submit" disabled={adjSaving} style={S.btn('#2563eb')}>
                  {adjSaving?'Saving…':'Apply Adjustment'}
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
  label:  { display:'block', fontSize:13, fontWeight:500, marginBottom:4 },
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
