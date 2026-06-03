import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import saleService from '../../services/saleService';
import '../../styles/tables.css';

export default function SalesList() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await saleService.getAll();
            
            // Handle different response formats
            const data = Array.isArray(res) ? res : (res.data || []);
            setSales(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching sales:', error);
            setError(error.message || 'Failed to load sales');
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'pending';
        const statusLower = String(status).toLowerCase();
        if (statusLower === 'paid') return 'paid';
        if (statusLower === 'partial') return 'partial';
        return 'pending';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Sales Orders</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/sales/new')}
                >
                    + New Sale
                </button>
            </div>

            {error && (
                <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#fee', 
                    color: '#c33', 
                    borderRadius: '4px', 
                    marginBottom: '20px' 
                }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Loading sales...
                </div>
            ) : sales.length === 0 ? (
                <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '4px',
                    color: '#666'
                }}>
                    <p>No sales found. Create your first sale order.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/sales/new')}
                    >
                        + Create Sale
                    </button>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Total Amount</th>
                            <th>Received</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale) => {
                            const invoiceNo = sale.invoiceNo || sale.InvoiceNo || 'N/A';
                            const customerName = sale.customerName || sale.CustomerName || 'Unknown';
                            const saleDate = sale.saleDate || sale.SaleDate;
                            const totalAmount = sale.totalAmount || sale.TotalAmount || 0;
                            const receivedAmount = sale.receivedAmount || sale.ReceivedAmount || 0;
                            const balanceAmount = sale.balanceAmount || sale.BalanceAmount || 0;
                            const paymentStatus = sale.paymentStatus || sale.PaymentStatus || 'Pending';

                            return (
                                <tr key={sale.saleID || sale.SaleID}>
                                    <td>{invoiceNo}</td>
                                    <td>
                                        {saleDate 
                                            ? new Date(saleDate).toLocaleDateString() 
                                            : 'N/A'}
                                    </td>
                                    <td>{customerName}</td>
                                    <td>₹{Number(totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    <td>₹{Number(receivedAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    <td>₹{Number(balanceAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    <td>
                                        <span className={`status ${getStatusColor(paymentStatus)}`}>
                                            {paymentStatus || 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-small"
                                            onClick={() => navigate(`/sales/${sale.saleID || sale.SaleID}`)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
