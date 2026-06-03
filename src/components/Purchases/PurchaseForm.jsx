import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import vendorService from '../../services/vendorService';
import productService from '../../services/productService';
import Input from '../Common/Input';
import Button from '../Common/Button';
import '../../styles/forms.css';

export default function PurchaseForm() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    vendorId: '',
    items: [{ productId: '', quantity: 1, rate: 0 }]
  });

  React.useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const vRes = await vendorService.getAll();
        const pRes = await productService.getAll();
        
        setVendors(Array.isArray(vRes) ? vRes : vRes.data || []);
        setProducts(Array.isArray(pRes) ? pRes : pRes.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load vendors and products');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1, rate: 0 }] });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.vendorId) {
        setError('Please select a vendor');
        return;
      }
      
      if (formData.items.length === 0 || formData.items.some(item => !item.productId || item.quantity <= 0)) {
        setError('Please fill all item details');
        return;
      }

      setLoading(true);
      await purchaseService.create(formData);
      navigate('/purchases');
    } catch (err) {
      console.error('Error creating purchase:', err);
      setError(err.message || 'Error creating purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '900px' }}>
      <h2>New Purchase Order</h2>
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Vendor *</label>
          <select 
            className="form-control" 
            value={formData.vendorId} 
            onChange={(e) => setFormData({...formData, vendorId: e.target.value})} 
            required
            disabled={loading}
          >
            <option value="">Select Vendor</option>
            {vendors.map(v => (
              <option key={v.vendorID} value={v.vendorID}>
                {v.vendorName} - {v.city}
              </option>
            ))}
          </select>
        </div>

        <h3>Purchase Items</h3>
        
        {formData.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
            <div className="form-row">
              <div className="form-group">
                <label>Product *</label>
                <select 
                  className="form-control" 
                  value={item.productId} 
                  onChange={(e) => updateItem(idx, 'productId', e.target.value)} 
                  required
                  disabled={loading}
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.productID} value={p.productID}>
                      {p.productName} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Quantity *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={item.quantity} 
                  onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} 
                  step="0.01"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Rate *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={item.rate} 
                  onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} 
                  step="0.01"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={(item.quantity * item.rate).toFixed(2)}
                  disabled
                />
              </div>

              {formData.items.length > 1 && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button 
                    type="button" 
                    variant="danger"
                    onClick={() => removeItem(idx)}
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px', textAlign: 'right' }}>
          <h4>Total Amount: ₹{calculateTotal().toFixed(2)}</h4>
        </div>
        
        <Button type="button" variant="secondary" onClick={addItem} disabled={loading}>
          + Add Item
        </Button>

        <div className="form-actions">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigate('/purchases')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Purchase'}
          </Button>
        </div>
      </form>
    </div>
  );
}
