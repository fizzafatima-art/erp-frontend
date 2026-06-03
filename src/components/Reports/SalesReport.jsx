import React, { useState, useEffect } from 'react';
import saleService from '../../services/saleService';
import '../../styles/tables.css';

export default function SalesReport() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalSales: 0,
        totalReceived: 0,
        totalOutstanding: 0,
        byStatus: {}
    });

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await saleService.getAll();
            const data = Array.isArray(res) ? res : (res.data || []);
            setSales(data);
            
            // Calculate summary
            calculateSummary(data);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data) => {
        const byStatus = {};
        let totalAmount = 0;
        let totalReceived = 0;
        let totalOutstanding = 0;

        data.forEach(sale => {
            const amount = sale.totalAmount || sale.TotalAmount || 0;
            const received = sale.receivedAmount || sale.ReceivedAmount || 0;
            const balance = sale.balanceAmount || sale.BalanceAmount || 0;
            const status = sale.paymentStatus || sale.PaymentStatus || 'Pending';

            totalAmount += amount;
            totalReceived += received;
            totalOutstanding += balance;

            byStatus[status] = (byStatus[status] || 0) + 1;
        });

        setSummary({
            totalSales: totalAmount,
            totalReceived,
            totalOutstanding,
            byStatus
        });
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading sales report...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Sales Report</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Sales</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>
                        ₹{summary.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Received</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                        ₹{summary.totalReceived.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Outstanding</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }}>
                        ₹{summary.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Orders</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f39c12' }}>
                        {sales.length}
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
                <h3>Sales Details</h3>
                {sales.length === 0 ? (
                    <p style={{ color: '#999' }}>No sales found</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Received</th>
                                <th>Balance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => {
                                const invoiceNo = sale.invoiceNo || sale.InvoiceNo || 'N/A';
                                const customerName = sale.customerName || sale.CustomerName || 'Unknown';
                                const saleDate = sale.saleDate || sale.SaleDate;
                                const totalAmount = sale.totalAmount || sale.TotalAmount || 0;
                                const receivedAmount = sale.receivedAmount || sale.ReceivedAmount || 0;
                                const balanceAmount = sale.balanceAmount || sale.BalanceAmount || 0;
                                const status = sale.paymentStatus || sale.PaymentStatus || 'Pending';

                                return (
                                    <tr key={sale.saleID || sale.SaleID}>
                                        <td>{invoiceNo}</td>
                                        <td>{saleDate ? new Date(saleDate).toLocaleDateString() : 'N/A'}</td>
                                        <td>{customerName}</td>
                                        <td>₹{Number(totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                        <td>₹{Number(receivedAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                        <td>₹{Number(balanceAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
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
