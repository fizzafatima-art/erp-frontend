import React, { useState } from 'react';  
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
const n = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const s = (v) => (v == null ? '' : String(v));

export function Warehouses() {
  const [warehouses, setWarehouses]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editData, setEditData]         = useState(null);

  const [form, setForm] = useState({ WarehouseName: '', Location: '', City: '', Phone: '' });

  const [transfer, setTransfer] = useState({
    FromWarehouseID: '',
    ToWarehouseID: '',
    TransferDate: new Date().toISOString().split('T')[0],
    Notes: '',
    Items: [{ ProductID: '', Quantity: 1, Rate: 0 }]
  });

  const [fromStock, setFromStock] = useState([]);

 

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/warehouse/warehouses`);
      setWarehouses(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { setError('Failed to load warehouses.'); }
    finally { setLoading(false); }
  };

 

  const loadFromStock = async (warehouseId) => {
    if (!warehouseId) return setFromStock([]);
    try {
      const res = await axios.get(`${API}/warehouse/warehouse-stock?warehouseId=${warehouseId}`);
      setFromStock(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { setFromStock([]); }
  };

  const openAdd = () => {
    setEditData(null);
    setForm({ WarehouseName: '', Location: '', City: '', Phone: '' });
    setShowModal(true);
  };

  const openEdit = (w) => {
    setEditData(w);
    setForm({ WarehouseName: w.WarehouseName, Location: w.Location||'', City: w.City||'', Phone: w.Phone||'' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editData) {
        await axios.put(`${API}/warehouse/warehouses/${editData.WarehouseID}`, form);
        alert('Warehouse updated!');
      } else {
        await axios.post(`${API}/warehouse/warehouses`, form);
        alert('Warehouse added!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this warehouse?')) return;
    try {
      await axios.delete(`${API}/warehouse/warehouses/${id}`);
      alert('Warehouse deleted!');
      load();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateTransferItem = (idx, field, value) => {
    const items = [...transfer.Items];
    items[idx][field] = value;
    if (field === 'ProductID') {
      const stock = fromStock.find(s => String(s.ProductID) === String(value));
      items[idx].Rate = stock ? n(stock.Rate) : 0;
    }
    setTransfer({ ...transfer, Items: items });
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/warehouse/transfer`, {
        FromWarehouseID: Number(transfer.FromWarehouseID),
        ToWarehouseID:   Number(transfer.ToWarehouseID),
        TransferDate:    transfer.TransferDate,
        Notes:           transfer.Notes,
        Items:           transfer.Items.map(i => ({
          ProductID: Number(i.ProductID),
          Quantity:  Number(i.Quantity),
          Rate:      Number(i.Rate),
        }))
      });
      alert('Stock transferred successfully!');
      setShowTransfer(false);
      setTransfer({
        FromWarehouseID: '', ToWarehouseID: '',
        TransferDate: new Date().toISOString().split('T')[0],
        Notes: '', Items: [{ ProductID: '', Quantity: 1, Rate: 0 }]
      });
      setFromStock([]);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={S.hdr}>
        <h2 style={{ margin: 0 }}>🏭 Warehouse Management</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
          <button onClick={() => setShowTransfer(true)} style={S.btn('#16a34a')}>🚚 Transfer Stock</button>
          <button onClick={openAdd} style={S.btn('#2563eb')}>+ New Warehouse</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <Card label="Total Warehouses" value={warehouses.length} color="#2563eb" />
        <Card label="Active" value={warehouses.filter(w => w.IsActive).length} color="#16a34a" />
      </div>

      {error && <div style={S.err}>{error}</div>}

      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                {['#', 'Warehouse Name', 'Location', 'City', 'Phone', 'Actions'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0
                ? <tr><td colSpan={6} style={S.empty}>No warehouses found.</td></tr>
                : warehouses.map((w, i) => (
                  <tr key={w.WarehouseID} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{s(w.WarehouseName)}</td>
                    <td style={S.td}>{s(w.Location) || '-'}</td>
                    <td style={S.td}>{s(w.City) || '-'}</td>
                    <td style={S.td}>{s(w.Phone) || '-'}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(w)} style={S.btnSm('#2563eb')}>✏️ Edit</button>
                        <button onClick={() => handleDelete(w.WarehouseID)} style={S.btnSm('#dc2626')}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 420 }}>
            <h3 style={{ marginTop: 0 }}>{editData ? 'Edit Warehouse' : 'New Warehouse'}</h3>
            <form onSubmit={handleSave}>
              <label style={S.label}>Warehouse Name *</label>
              <input required style={S.input} value={form.WarehouseName}
                onChange={e => setForm({ ...form, WarehouseName: e.target.value })} />

              <label style={{ ...S.label, marginTop: 10 }}>Location</label>
              <input style={S.input} value={form.Location}
                onChange={e => setForm({ ...form, Location: e.target.value })} />

              <label style={{ ...S.label, marginTop: 10 }}>City</label>
              <input style={S.input} value={form.City}
                onChange={e => setForm({ ...form, City: e.target.value })} />

              <label style={{ ...S.label, marginTop: 10 }}>Phone</label>
              <input style={S.input} value={form.Phone}
                onChange={e => setForm({ ...form, Phone: e.target.value })} />

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...S.btn('#6b7280'), flex: 1 }}>Cancel</button>
                <button type="submit" style={{ ...S.btn('#2563eb'), flex: 1 }}>
                  {editData ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransfer && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: 640 }}>
            <h3 style={{ marginTop: 0 }}>🚚 Stock Transfer</h3>
            <form onSubmit={handleTransfer}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>From Warehouse *</label>
                  <select required style={S.input} value={transfer.FromWarehouseID}
                    onChange={e => {
                      setTransfer({ ...transfer, FromWarehouseID: e.target.value, Items: [{ ProductID: '', Quantity: 1, Rate: 0 }] });
                      loadFromStock(e.target.value);
                    }}>
                    <option value="">Select</option>
                    {warehouses.map(w => <option key={w.WarehouseID} value={w.WarehouseID}>{w.WarehouseName}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>To Warehouse *</label>
                  <select required style={S.input} value={transfer.ToWarehouseID}
                    onChange={e => setTransfer({ ...transfer, ToWarehouseID: e.target.value })}>
                    <option value="">Select</option>
                    {warehouses.filter(w => String(w.WarehouseID) !== String(transfer.FromWarehouseID))
                      .map(w => <option key={w.WarehouseID} value={w.WarehouseID}>{w.WarehouseName}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Transfer Date</label>
                  <input type="date" style={S.input} value={transfer.TransferDate}
                    onChange={e => setTransfer({ ...transfer, TransferDate: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Notes</label>
                  <input style={S.input} value={transfer.Notes}
                    onChange={e => setTransfer({ ...transfer, Notes: e.target.value })} />
                </div>
              </div>

              <label style={{ ...S.label, marginTop: 12 }}>Items</label>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: 10, background: '#f9fafb', maxHeight: 240, overflowY: 'auto' }}>
                {transfer.Items.map((item, idx) => {
                  const stock = fromStock.find(s => String(s.ProductID) === String(item.ProductID));
                  return (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select style={{ ...S.input, flex: 3 }} value={item.ProductID}
                          onChange={e => updateTransferItem(idx, 'ProductID', e.target.value)}>
                          <option value="">Select Product</option>
                          {fromStock.map(s => (
                            <option key={s.ProductID} value={s.ProductID}>
                              {s.ProductName} (Available: {n(s.CurrentQuantity)})
                            </option>
                          ))}
                        </select>
                        <input type="number" placeholder="Qty" style={{ ...S.input, flex: 1 }}
                          value={item.Quantity}
                          onChange={e => updateTransferItem(idx, 'Quantity', e.target.value)} />
                        <button type="button" onClick={() => {
                          const items = transfer.Items.filter((_, i) => i !== idx);
                          setTransfer({ ...transfer, Items: items.length ? items : [{ ProductID: '', Quantity: 1, Rate: 0 }] });
                        }} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
                      </div>
                      {stock && (
                        <div style={{ fontSize: 11, marginTop: 2, paddingLeft: 4,
                          color: n(stock.CurrentQuantity) < n(item.Quantity) ? '#dc2626' : '#16a34a' }}>
                          Available: {n(stock.CurrentQuantity)}
                          {n(stock.CurrentQuantity) < n(item.Quantity) ? ' ⚠️ Insufficient!' : ' ✓'}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button"
                  onClick={() => setTransfer({ ...transfer, Items: [...transfer.Items, { ProductID: '', Quantity: 1, Rate: 0 }] })}
                  style={{ width: '100%', padding: 6, background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  + Add Item
                </button>
              </div>

              {!transfer.FromWarehouseID && (
                <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 6 }}>⚠️ Pehle "From Warehouse" select karo</div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => setShowTransfer(false)} style={{ ...S.btn('#6b7280'), flex: 1 }}>Cancel</button>
                <button type="submit" style={{ ...S.btn('#16a34a'), flex: 1 }}>Transfer Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Warehouses;

function Card({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 20px', minWidth: 150 }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

const S = {
  hdr:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  th:    { padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e5e7eb' },
  td:    { padding: '10px 12px', verticalAlign: 'middle' },
  empty: { textAlign: 'center', padding: 28, color: '#6b7280' },
  err:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, marginBottom: 14 },
  btn:   (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginLeft: 4 }),
  btnSm: (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }),
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal:   { background: '#fff', padding: 24, borderRadius: 8, maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' },
  label:   { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#374151' },
  input:   { padding: '8px', borderRadius: 4, border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box', fontSize: 13 },
};