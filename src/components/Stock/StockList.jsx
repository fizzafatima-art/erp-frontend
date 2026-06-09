import React, { useState, useEffect } from 'react';
import stockService from '../../services/stockService';
import '../../styles/tables.css';

export default function StockList() {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            const res = await stockService.getAll();
            setStock(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Current Stock</h1>
                <button className="btn btn-warning">Adjust Stock</button>
            </div>

            {loading ? <div>Loading...</div> : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Current Qty</th>
                            <th>Min Level</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.map(item => (
                            <tr key={item.stockID}>
                                <td>{item.productName}</td>
                                <td>{item.category}</td>
                                <td>{item.currentQuantity}</td>
                                <td>{item.minimumQuantity}</td>
                                <td>
                                    {item.currentQuantity <= item.minimumQuantity ? 
                                        <span className="badge badge-danger">Low Stock</span> : 
                                        <span className="badge badge-success">OK</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>    
            )}
        </div>
    );
}
