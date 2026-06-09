import React, { useState } from 'react';
import stockService from '../../services/stockService';
import productService from '../../services/productService';
import Input from '../Common/Input';
import Button from '../Common/Button';

export default function StockAdjustment() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 0,
    type: 'Addition' // or Deduction
  });

  React.useEffect(() => {
    const load = async () => {
      const res = await productService.getAll();
      setProducts(res.data);
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // This would require a backend endpoint for adjustment. 
    // Assuming stockService handles it or using a generic update.
    alert("Stock Adjustment feature requires specific backend endpoint (sp_UpdateStock).");
    // Example: await stockService.adjustStock(formData);
  };

  return (
    <div className="form-container">
      <h2>Adjust Stock</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product</label>
          <select className="form-control" value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})}>
            {products.map(p => <option key={p.productID} value={p.productID}>{p.productName}</option>)}
          </select>
        </div>
        <Input type="number" label="Quantity" name="quantity" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
        <div className="form-actions">
          <Button type="submit">Update Stock</Button>
        </div>
      </form>
    </div>
  );
}
