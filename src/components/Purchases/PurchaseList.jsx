import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import '../../styles/tables.css';

export default function PurchaseList() {
    const [purchases, setPurchases] = useState([]);
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
            const res = await purchaseService.getAll();
            
            // Handle different response formats
            const data = Array.isArray(res) ? res : (res.data || []);
            setPurchases(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            setError(error.message || 'Failed to load purchases');
            setPurchases([]);
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
                <h1>Purchase Orders</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/purchases/new')}
                >
                    + New Purchase
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
                    Loading purchases...
                </div>
            ) : purchases.length === 0 ? (
                <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '4px',
                    color: '#666'
                }}>
                    <p>No purchases found. Create your first purchase order.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/purchases/new')}
                    >
                        + Create Purchase
                    </button>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Vendor</th>
                            <th>Total Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.map((purchase) => {
                            const invoiceNo = purchase.invoiceNo || purchase.InvoiceNo || 'N/A';
                            const vendorName = purchase.vendorName || purchase.VendorName || 'Unknown';
                            const purchaseDate = purchase.purchaseDate || purchase.PurchaseDate;
                            const totalAmount = purchase.totalAmount || purchase.TotalAmount || 0;
                            const paidAmount = purchase.paidAmount || purchase.PaidAmount || 0;
                            const balanceAmount = purchase.balanceAmount || purchase.BalanceAmount || 0;
                            const paymentStatus = purchase.paymentStatus || purchase.PaymentStatus || 'Pending';

                            return (
                                <tr key={purchase.purchaseID || purchase.PurchaseID}>
                                    <td>{invoiceNo}</td>
                                    <td>
                                        {purchaseDate 
                                            ? new Date(purchaseDate).toLocaleDateString() 
                                            : 'N/A'}
                                    </td>
                                    <td>{vendorName}</td>
                                    <td>Rs.{Number(totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    <td>Rs.{Number(paidAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    <td>Rs.{Number(balanceAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    <td>
                                        <span className={`status ${getStatusColor(paymentStatus)}`}>
                                            {paymentStatus || 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-small"
                                            onClick={() => navigate(`/purchases/${purchase.purchaseID || purchase.PurchaseID}`)}
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

