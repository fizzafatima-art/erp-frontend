import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import Input from '../Common/Input';
import Button from '../Common/Button';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll();
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await productService.delete(id);
      fetchProducts();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Products</h1>
        <Button onClick={() => navigate('/products/new')}>+ Add Product</Button>
      </div>
      {loading ? <div>Loading...</div> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.productID}>
                <td>{p.productName}</td>
                <td>{p.category}</td>
                <td>{p.brand}</td>
                <td>{p.unit}</td>
                <td>
                  <button className="btn-small" onClick={() => navigate(`/products/${p.productID}`)}>Edit</button>
                  <button className="btn-small btn-danger" onClick={() => handleDelete(p.productID)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
