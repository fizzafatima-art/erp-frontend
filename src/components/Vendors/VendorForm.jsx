import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios for API call
import stockService from '../../services/stockService';
import productService from '../../services/productService';
import Input from '../Common/Input';
import Button from '../Common/Button';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function StockAdjustment() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    adjustmentType: 'Addition', // 'Addition' ya 'Deduction'
    reason: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await productService.getAll();
        // API se data agar nested hai toh res.data.data, warna res.data
        // Hum standard ERP structure assume kar rahe hain
        setProducts(res.data.data || res.data || []);
      } catch (error) {
        console.error("Error loading products", error);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.quantity) {
        alert("Please select product and enter quantity.");
        return;
    }

    setLoading(true);
    try {
      // Backend Call: POST /api/v1/stock/:id/adjust
      const payload = {
        adjustmentType: formData.adjustmentType, // Backend: 'Addition' handled as positive
        quantity: Number(formData.quantity),
        reason: formData.reason
      };

      // Note: Backend controller humne pehle banaya tha wahn 'Add' ya 'Subtract' logic check karta tha
      // Yahan hum 'Addition' bhejenge toh backend positive treat karega
      
      await axios.post(`${API}/stock/${formData.productId}/adjust`, payload);
      
      alert("✅ Stock Adjusted Successfully!");
      
      // Reset Form
      setFormData({
        ...formData,
        quantity: '',
        reason: ''
      });

    } catch (error) {
      console.error("Adjustment Error:", error);
      alert("❌ Failed to adjust stock: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        📦 Adjust Stock
      </h2>
      
      <form onSubmit={handleSubmit}>
        
        {/* Product Selection */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Product</label>
          <select 
            className="form-control" 
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            value={formData.productId} 
            onChange={e => setFormData({...formData, productId: e.target.value})}
            required
          >
            <option value="">-- Select Product --</option>
            {products.map(p => (
                // Database key 'ProductID' ho sakta hai, check karein agar nahi chala to
                <option key={p.ProductID || p.productID} value={p.ProductID || p.productID}>
                    {p.ProductName || p.productName}
                </option>
            ))}
          </select>
        </div>

        {/* Adjustment Type */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Adjustment Type</label>
            <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ cursor: 'pointer' }}>
                    <input 
                        type="radio" 
                        name="type" 
                        value="Addition"
                        checked={formData.adjustmentType === 'Addition'}
                        onChange={e => setFormData({...formData, adjustmentType: e.target.value})}
                    /> Addition (Jodna)
                </label>
                <label style={{ cursor: 'pointer' }}>
                    <input 
                        type="radio" 
                        name="type" 
                        value="Deduction"
                        checked={formData.adjustmentType === 'Deduction'}
                        onChange={e => setFormData({...formData, adjustmentType: e.target.value})}
                    /> Deduction (Ghatana)
                </label>
            </div>
        </div>

        {/* Quantity */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Quantity</label>
            <Input 
                type="number" 
                placeholder="Enter quantity" 
                value={formData.quantity} 
                onChange={e => setFormData({...formData, quantity: e.target.value})} 
                style={{ width: '100%' }}
                required
            />
        </div>

        {/* Reason */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Reason (Optional)</label>
            <textarea
                className="form-control"
                rows="3"
                placeholder="e.g. Damaged stock, Physical count, etc."
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            ></textarea>
        </div>

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <Button 
            type="submit" 
            disabled={loading}
            style={{ 
                background: loading ? '#ccc' : '#2563eb', 
                color: '#fff', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: loading ? 'not-allowed' : 'pointer',
                width: '100%'
            }}
          >
            {loading ? 'Updating...' : 'Update Stock'}
          </Button>
        </div>
      </form>
    </div>
  );
}