import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const s = (v) => (v == null ? '' : String(v));

export function Vendors() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const emptyForm = {
    VendorName: '', ContactPerson: '', Phone: '', Email: '',
    City: '', Address: '', VendorType: 'CUSTOMER', NTN: '', STRN: '',
    OpeningBalance: 0, IsActive: true
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { load(); }, [showInactive]);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const url = showInactive ? `${API}/vendors?includeInactive=true` : `${API}/vendors`;
      const res = await axios.get(url);
      const raw = res.data;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setRows(arr);
    } catch (e) {
      setError('Failed to load vendors.');
      console.error(e);
    } finally { setLoading(false); }
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return s(r.VendorName).toLowerCase().includes(q)
      || s(r.ContactPerson ?? r.contactPerson).toLowerCase().includes(q)
      || s(r.Email ?? r.email).toLowerCase().includes(q);
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = async (id) => {
    try {
      const res = await axios.get(`${API}/vendors/${id}`);
      const data = res.data.data || res.data;
      if (data) {
        // Normalize VendorType to one of the valid dropdown values
        let vType = s(data.VendorType ?? data.vendorType).toUpperCase();
        if (!['SUPPLIER', 'CUSTOMER', 'BOTH'].includes(vType)) {
          vType = 'CUSTOMER';
        }
        setFormData({
          ...emptyForm,
          ...data,
          VendorType: vType,
          IsActive: data.IsActive !== false, // default true if undefined
        });
        setEditId(id);
        setIsEditing(true);
        setShowModal(true);
      }
    } catch (err) {
      alert("Failed to fetch vendor details");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && editId) {
        await axios.put(`${API}/vendors/${editId}`, formData);
        alert('Vendor updated successfully');
      } else {
        await axios.post(`${API}/vendors`, formData);
        alert('Vendor added successfully');
      }
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
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
        // Backend blocks delete if vendor has linked transactions
        const msg = err.response?.data?.message || 'Error deleting vendor';
        alert(msg);
      }
    }
  };

  const toggleStatus = async (vendor) => {
    const newStatus = !(vendor.IsActive !== false);
    const action = newStatus ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} this vendor?`)) return;
    try {
      await axios.patch(`${API}/vendors/${vendor.VendorID}/status`, { IsActive: newStatus });
      load();
    } catch (err) {
      alert('Error updating vendor status: ' + (err.response?.data?.message || err.message));
    }
  };

  const S = {
    container: { padding: 24, fontFamily: 'Segoe UI,sans-serif' },
    hdr:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    search:    { padding: '8px 12px', width: 300, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 },
    th:        { padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e5e7eb', background: '#f3f4f6' },
    td:        { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle' },
    empty:     { textAlign: 'center', padding: 28, color: '#6b7280' },
    err:       { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, marginBottom: 14, fontSize: 14 },
    btn:       (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500, marginLeft: 5 }),
    btnSm:     (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 500, marginLeft: 5 }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal:      { background: '#fff', padding: 24, borderRadius: 8, width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' },
    formGroup:  { marginBottom: 12 },
    label:      { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#374151' },
    input:      { width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #d1d5db', boxSizing: 'border-box', textTransform: 'uppercase' },
    inputNormal:{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #d1d5db', boxSizing: 'border-box' },
  };

  return (
    <div style={S.container}>
      <div style={S.hdr}>
        <h2 style={{ margin: 0 }}>👥 VENDORS</h2>
        <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151', marginRight: 10, cursor:'pointer' }}>
            <input type="checkbox" checked={showInactive} onChange={e=>setShowInactive(e.target.checked)} />
            Show Inactive
          </label>
          <button onClick={load} style={S.btn('#6b7280')}>↻ Refresh</button>
          <button onClick={openAddModal} style={S.btn('#2563eb')}>+ Add Vendor</button>
        </div>
      </div>

      {error && <div style={S.err}>{error}</div>}

      <input placeholder="Search vendor name, contact, email..." value={search}
        onChange={e => setSearch(e.target.value)} style={S.search} />

      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#fff' }}>
            <thead>
              <tr>
                <th style={S.th}>ID</th>
                <th style={S.th}>VENDOR NAME</th>
                <th style={S.th}>CONTACT PERSON</th>
                <th style={S.th}>PHONE</th>
                <th style={S.th}>EMAIL</th>
                <th style={S.th}>CITY</th>
                <th style={S.th}>TYPE</th>
                <th style={S.th}>STATUS</th>
                <th style={S.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9} style={S.empty}>No vendors found.</td></tr>
                : filtered.map((r, i) => {
                  const isActive = r.IsActive !== false;
                  return (
                    <tr key={r.VendorID ?? i} style={{ opacity: isActive ? 1 : 0.55 }}>
                      <td style={{ ...S.td, color:'#6b7280', fontSize:12 }}>#{r.VendorID ?? i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{s(r.VendorName) || '-'}</td>
                      <td style={S.td}>{s(r.ContactPerson ?? r.contactPerson) || '-'}</td>
                      <td style={S.td}>{s(r.Phone ?? r.phone) || '-'}</td>
                      <td style={S.td}>{s(r.Email ?? r.email) || '-'}</td>
                      <td style={S.td}>{s(r.City ?? r.city) || '-'}</td>
                      <td style={S.td}>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb' }}>
                          {s(r.VendorType ?? r.vendorType).toUpperCase() || 'CUSTOMER'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                          background: isActive ? '#f0fdf4' : '#fef2f2',
                          color:      isActive ? '#16a34a' : '#dc2626'
                        }}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button onClick={() => openEditModal(r.VendorID)} style={S.btnSm('#059669')}>Edit</button>
                        <button onClick={() => toggleStatus(r)} style={S.btnSm(isActive ? '#f59e0b' : '#16a34a')}>
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(r.VendorID)} style={S.btnSm('#dc2626')}>Delete</button>
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
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={{ marginTop: 0 }}>{isEditing ? `Edit Vendor #${editId}` : 'Add New Vendor'}</h3>
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
                  <input name="Phone" value={formData.Phone} onChange={handleInputChange} style={S.inputNormal} />
                </div>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Email</label>
                <input type="email" name="Email" value={formData.Email} onChange={handleInputChange} style={S.inputNormal} />
              </div>

              <div style={{display:'flex', gap:10}}>
                <div style={{...S.formGroup, flex:1}}>
                  <label style={S.label}>City</label>
                  <input name="City" value={formData.City} onChange={handleInputChange} style={S.input} />
                </div>
                <div style={{...S.formGroup, flex:1}}>
                  <label style={S.label}>Type</label>
                  <select name="VendorType" value={formData.VendorType} onChange={handleInputChange} style={S.inputNormal}>
                    <option value="SUPPLIER">SUPPLIER</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="BOTH">BOTH</option>
                  </select>
                </div>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Address</label>
                <input name="Address" value={formData.Address} onChange={handleInputChange} style={S.input} />
              </div>

              {isEditing && (
                <div style={S.formGroup}>
                  <label style={{ ...S.label, display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                    <input
                      type="checkbox"
                      name="IsActive"
                      checked={formData.IsActive !== false}
                      onChange={handleInputChange}
                    />
                    Active (uncheck to deactivate this vendor)
                  </label>
                </div>
              )}

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