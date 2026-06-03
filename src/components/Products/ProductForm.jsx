import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import productService from '../../services/productService';

const VALID_UNITS      = ['KG', 'Liter', 'Piece', 'Bundle', 'Box'];
const VALID_CATEGORIES = ['Raw Material', 'Finished Goods', 'Packing'];

// Initial State
const INIT = {
  productName: '',
  category:    'Raw Material',
  brand:       '',
  unit:        'Piece',
  description: '',
  price:       '',
  minimumQuantity: '',
};

export default function ProductForm() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [formData, setFormData] = useState(INIT);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (id) loadProduct(id);
  }, [id]);

  const loadProduct = async (pid) => {
    try {
      const res = await productService.getById(pid);
      const d   = res.data;
      
      // Data load karte waqt console check karein
      console.log("Loaded Product Data:", d);

      setFormData({
        productName: d.ProductName ?? d.productName ?? '',
        category:    d.Category    ?? d.category    ?? 'Raw Material',
        brand:       d.Brand       ?? d.brand       ?? '',
        unit:        d.Unit        ?? d.unit        ?? 'Piece',
        description: d.Description ?? d.description ?? '',
        price:       d.Price       ?? d.price       || 0,
        minimumQuantity: d.MinimumQuantity ?? d.minimumQuantity || 10,
      });
    } catch (err) {
      console.error("Load Error:", err);
      setError('Failed to load product.');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.productName.trim()) { setError('Product name is required.'); return; }
    if (!VALID_UNITS.includes(formData.unit)) {
      setError(`Invalid unit "${formData.unit}". Must be one of: ${VALID_UNITS.join(', ')}`);
      return;
    }

    // IMPROVEMENT: String ko Number mein convert kiya
    const payload = {
      productName: formData.productName.trim(),
      category:    formData.category    || 'Raw Material',
      brand:       formData.brand.trim(),
      unit:        formData.unit,
      description: formData.description.trim(),
      price:       parseFloat(formData.price) || 0,           // <--- Float for Price
      minimumQuantity: parseInt(formData.minimumQuantity) || 0, // <--- Integer for Qty
    };

    // Debug: Check karo backend mein kya ja raha hai
    console.log("Submitting Payload:", payload);

    try {
      setSaving(true);
      if (id) {
        await productService.update(id, payload);
      } else {
        await productService.create(payload);
      }
      navigate('/products');
    } catch (err) {
      const msg = err?.response?.data?.message
        || (typeof err?.response?.data === 'string' ? err.response.data : '')
        || err?.message
        || 'Failed to save product.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <h2 style={{ marginTop: 0 }}>{id ? 'Edit Product' : 'New Product'}</h2>

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* Product Name */}
          <div style={S.group}>
            <label style={S.label}>Product Name *</label>
            <input
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              placeholder="e.g. Basmati Rice"
              style={S.input}
              required
            />
          </div>

          {/* Price Field */}
          <div style={S.group}>
            <label style={S.label}>Price (Per Unit) *</label>
            <input
              type="number"
              step="0.01" // Decimal values ke liye (e.g. 10.50)
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 1500"
              style={S.input}
              required
            />
          </div>

          {/* Category + Unit row */}
          <div style={S.row}>
            <div style={S.group}>
              <label style={S.label}>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} style={S.input}>
                {VALID_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={S.group}>
              <label style={S.label}>Unit *</label>
              <select name="unit" value={formData.unit} onChange={handleChange} style={S.input} required>
                {VALID_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand */}
          <div style={S.group}>
            <label style={S.label}>Brand</label>
            <input
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g. Sunridge"
              style={S.input}
            />
          </div>

          {/* Min Qty Field */}
          <div style={S.group}>
            <label style={S.label}>Minimum Quantity (Alert Level)</label>
            <input
              type="number"
              name="minimumQuantity"
              value={formData.minimumQuantity}
              onChange={handleChange}
              placeholder="e.g. 10"
              style={S.input}
            />
            <small style={{ color: '#666' }}>Jab stock is se kam hoga, toh system alert dega.</small>
          </div>

          {/* Description */}
          <div style={S.group}>
            <label style={S.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              style={{ ...S.input, resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={S.actions}>
            <button
              type="button"
              onClick={() => navigate('/products')}
              style={S.btn('#6b7280')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={S.btn('#2563eb')}
            >
              {saving ? 'Saving…' : (id ? 'Update Product' : 'Add Product')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

const S = {
  container: { padding: 24, maxWidth: 640, margin: '0 auto' },
  card:      { background: '#fff', borderRadius: 10, padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  group:     { marginBottom: 16 },
  row:       { display: 'flex', gap: 16, marginBottom: 0 },
  label:     { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input:     { width: '100%', padding: '9px 11px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  actions:   { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 },
  err:       { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 14 },
  btn: (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }),
};