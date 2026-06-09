import React, { useState, useEffect } from 'react';
import purchaseService from '../../services/purchaseService';
import '../../styles/tables.css';

export default function PurchaseReport() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalPurchases: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        byStatus: {}
    });

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const res = await purchaseService.getAll();
            const data = Array.isArray(res) ? res : (res.data || []);
            setPurchases(data);
            
            // Calculate summary
            calculateSummary(data);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data) => {
        const byStatus = {};
        let totalAmount = 0;
        let totalPaid = 0;
        let totalOutstanding = 0;

        data.forEach(purchase => {
            const amount = purchase.totalAmount || purchase.TotalAmount || 0;
            const paid = purchase.paidAmount || purchase.PaidAmount || 0;
            const balance = purchase.balanceAmount || purchase.BalanceAmount || 0;
            const status = purchase.paymentStatus || purchase.PaymentStatus || 'Pending';

            totalAmount += amount;
            totalPaid += paid;
            totalOutstanding += balance;

            byStatus[status] = (byStatus[status] || 0) + 1;
        });

        setSummary({
            totalPurchases: totalAmount,
            totalPaid,
            totalOutstanding,
            byStatus
        });
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading purchase report...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Purchase Report</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Purchase</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>
                        Rs.{summary.totalPurchases.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Paid</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                        Rs.{summary.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Outstanding</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }}>
                        Rs.{summary.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Orders</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f39c12' }}>
                        {purchases.length}
                    </div>
                </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3>Payment Status Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                    {Object.entries(summary.byStatus).map(([status, count]) => (
                        <div key={status} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{status}</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{count}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3>Purchase Details</h3>
                {purchases.length === 0 ? (
                    <p style={{ color: '#999' }}>No purchases found</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Date</th>
                                <th>Vendor</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Balance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map(purchase => {
                                const invoiceNo = purchase.invoiceNo || purchase.InvoiceNo || 'N/A';
                                const vendorName = purchase.vendorName || purchase.VendorName || 'Unknown';
                                const purchaseDate = purchase.purchaseDate || purchase.PurchaseDate;
                                const totalAmount = purchase.totalAmount || purchase.TotalAmount || 0;
                                const paidAmount = purchase.paidAmount || purchase.PaidAmount || 0;
                                const balanceAmount = purchase.balanceAmount || purchase.BalanceAmount || 0;
                                const status = purchase.paymentStatus || purchase.PaymentStatus || 'Pending';

                                return (
                                    <tr key={purchase.purchaseID || purchase.PurchaseID}>
                                        <td>{invoiceNo}</td>
                                        <td>{purchaseDate ? new Date(purchaseDate).toLocaleDateString() : 'N/A'}</td>
                                        <td>{vendorName}</td>
                                        <td>Rs.{Number(totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                        <td>Rs.{Number(paidAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                        <td>Rs.{Number(balanceAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: status?.toLowerCase() === 'paid' ? '#d4edda' : 
                                                               status?.toLowerCase() === 'partial' ? '#fff3cd' : '#f8d7da',
                                                color: status?.toLowerCase() === 'paid' ? '#155724' : 
                                                      status?.toLowerCase() === 'partial' ? '#856404' : '#721c24'
                                            }}>
                                                {status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

