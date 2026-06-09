import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API Base URL
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s = (v) => (v == null ? '' : String(v));

export function Vendors() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    VendorName: '', ContactPerson: '', Phone: '', Email: '', 
    City: '', Address: '', VendorType: 'Vendor', NTN: '', STRN: '', OpeningBalance: 0
  });

  useEffect(() => { load(); }, []);

  // --- DATA LOADING ---
  const load = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/vendors`);
      const raw = res.data;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setRows(arr);
    } catch (e) {
      setError('Failed to load vendors.');
      console.error(e);
    } finally { setLoading(false); }
  };

  // --- FILTERING ---
  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return s(r.VendorName).toLowerCase().includes(q)
      || s(r.ContactPerson ?? r.contactPerson).toLowerCase().includes(q)
      || s(r.Email ?? r.email).toLowerCase().includes(q);
  });

  // --- FORM HANDLING ---
  const resetForm = () => {
    setFormData({
      VendorName: '', ContactPerson: '', Phone: '', Email: '', 
      City: '', Address: '', VendorType: 'Vendor', NTN: '', STRN: '', OpeningBalance: 0
    });
    setIsEditing(false);
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsEditing(false); // Ensure it is NOT editing
    setEditId(null);     // Ensure ID is NULL
    setShowModal(true);
  };

  const openEditModal = async (id) => {
    try {
      const res = await axios.get(`${API}/vendors/${id}`);
      const data = res.data.data || res.data; // Handle different response structures
      if(data) {
        setFormData(data);
        setEditId(id);
        setIsEditing(true);
        setShowModal(true);
      }
    } catch (err) {
      alert("Failed to fetch vendor details");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // --- FIXED SUBMIT FUNCTION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form Data:", formData); // Debugging
    console.log("Is Editing:", isEditing, "ID:", editId); // Debugging

    try {
      if (isEditing && editId) {
        // UPDATE LOGIC
        await axios.put(`${API}/vendors/${editId}`, formData);
        alert('Vendor updated successfully');
      } else {
        // CREATE LOGIC (POST)
        await axios.post(`${API}/vendors`, formData);
        alert('Vendor added successfully');
      }
      setShowModal(false);
      load(); // Refresh list
    } catch (err) {
      console.error("Full Error:", err);
      console.error("Response:", err.response?.data);
      const errorMsg = err.response?.data?.message || err.message;
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`${API}/vendors/${id}`);
        alert('Vendor deleted');
        load();
      } catch (err) {
        alert('Error deleting vendor');
      }
    }
  };

  // --- STYLES (S) ---
  const S = {
    container: { padding: 24, fontFamily: 'Segoe UI,sans-serif' },
    hdr:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    search:    { padding: '8px 12px', width: 300, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 },
    th:        { padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e5e7eb', background: '#f3f4f6' },
    td:        { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle' },
    empty:     { textAlign: 'center', padding: 28, color: '#6b7280' },
    err:       { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, marginBottom: 14, fontSize: 14 },
    btn:       (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500, marginLeft: 5 }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal:      { background: '#fff', padding: 24, borderRadius: 8, width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' },
    formGroup:  { marginBottom: 12 },
    label:      { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#374151' },
    input:      { width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #d1d5db', boxSizing: 'border-box' },
  };

  return (
    <div style={S.container}>
      <div style={S.hdr}>
        <h2 style={{ margin: 0 }}>👥 Vendors</h2>
        <div>
          <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
          <button onClick={openAddModal} style={S.btn('#2563eb')}>+ Add Vendor</button>
        </div>
      </div>

      {error && <div style={S.err}>{error}</div>}

      <input placeholder="Search vendor name, contact, email…" value={search}
        onChange={e => setSearch(e.target.value)} style={S.search} />

      {loading ? <p>Loading…</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#fff' }}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Vendor Name</th>
                <th style={S.th}>Contact Person</th>
                <th style={S.th}>Phone</th>
                <th style={S.th}>Email</th>
                <th style={S.th}>City</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} style={S.empty}>No vendors found.</td></tr>
                : filtered.map((r, i) => (
                  <tr key={r.VendorID ?? i}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{s(r.VendorName) || '—'}</td>
                    <td style={S.td}>{s(r.ContactPerson ?? r.contactPerson) || '—'}</td>
                    <td style={S.td}>{s(r.Phone ?? r.phone) || '—'}</td>
                    <td style={S.td}>{s(r.Email ?? r.email) || '—'}</td>
                    <td style={S.td}>{s(r.City ?? r.city) || '—'}</td>
                    <td style={S.td}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb' }}>
                        {s(r.VendorType ?? r.vendorType) || 'Vendor'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button onClick={() => openEditModal(r.VendorID)} style={{ ...S.btn('#059669'), marginRight: 5 }}>Edit</button>
                      <button onClick={() => handleDelete(r.VendorID)} style={S.btn('#dc2626')}>Delete</button>
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
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop: 0 }}>{isEditing ? 'Edit Vendor' : 'Add New Vendor'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={S.formGroup}>
                <label style={S.label}>Vendor Name *</label>
                <input required name="VendorName" value={formData.VendorName} onChange={handleInputChange} style={S.input} />
              </div>
              
              <div style={{display:'flex', gap:10}}>
                <div style={{...S.formGroup, flex:1}}>
                  <label style={S.label}>Contact Person</label>
                  <input name="ContactPerson" value={formData.ContactPerson} onChange={handleInputChange} style={S.input} />
                </div>
                <div style={{...S.formGroup, flex:1}}>
                  <label style={S.label}>Phone</label>
                  <input name="Phone" value={formData.Phone} onChange={handleInputChange} style={S.input} />
                </div>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Email</label>
                <input type="email" name="Email" value={formData.Email} onChange={handleInputChange} style={S.input} />
              </div>

              <div style={{display:'flex', gap:10}}>
                <div style={{...S.formGroup, flex:1}}>
                  <label style={S.label}>City</label>
                  <input name="City" value={formData.City} onChange={handleInputChange} style={S.input} />
                </div>
                <div style={{...S.formGroup, flex:1}}>
                  <label style={S.label}>Type</label>
                  <select name="VendorType" value={formData.VendorType} onChange={handleInputChange} style={S.input}>
                    <option value="Supplier">Supplier</option>
                    <option value="Customer">Customer</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Address</label>
                <input name="Address" value={formData.Address} onChange={handleInputChange} style={S.input} />
              </div>
              
              <div style={{display:'flex', gap:10, marginTop:20}}>
                <button type="button" onClick={() => setShowModal(false)} style={{...S.btn('#6b7280'), flex:1}}>Cancel</button>
                <button type="submit" style={{...S.btn('#2563eb'), flex:1}}>{isEditing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vendors;
