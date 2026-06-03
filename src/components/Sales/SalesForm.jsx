// Similar to PurchaseForm, but for Customers
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import saleService from '../../services/saleService';
import vendorService from '../../services/vendorService';
import productService from '../../services/productService';
import Input from '../Common/Input';
import Button from '../Common/Button';
export default function SalesForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    items: [{ productId: '', quantity: 1, rate: 0 }]
  });

  React.useEffect(() => {
    const initData = async () => {
      const vRes = await vendorService.getAll({ type: 'Customer' }); // Filter for customers
      const pRes = await productService.getAll();
      setCustomers(vRes.data);
      setProducts(pRes.data);
    };
    initData();
  }, []);

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1, rate: 0 }] });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saleService.create(formData);
      navigate('/sales');
    } catch (err) {
      alert('Error creating sale');
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <h2>New Sale</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Customer</label>
          <select name="customerId" className="form-control" value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} required>
            <option value="">Select Customer</option>
            {customers.map(c => <option key={c.vendorID} value={c.vendorID}>{c.vendorName}</option>)}
          </select>
        </div>

        <h3>Items</h3>
        {formData.items.map((item, idx) => (
          <div key={idx} className="form-row" style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <div className="form-group">
              <label>Product</label>
              <select className="form-control" value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} required>
                <option value="">Select Product</option>
                {products.map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Qty</label>
              <input type="number" className="form-control" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Rate</label>
              <input type="number" className="form-control" value={item.rate} onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value))} />
            </div>
          </div>
        ))}
        
        <Button type="button" variant="secondary" onClick={addItem}>+ Add Item</Button>

        <div className="form-actions">
          <Button type="submit">Create Sale</Button>
        </div>
      </form>
    </div>
  );
}