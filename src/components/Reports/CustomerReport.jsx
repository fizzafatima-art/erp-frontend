import React, { useState, useEffect } from 'react';
import vendorService from '../../services/vendorService';
import '../../styles/tables.css';

export default function CustomerReport() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalCustomers: 0,
        totalOutstanding: 0,
        activeCustomers: 0
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await vendorService.getAll({ type: 'Customer' });
            const data = Array.isArray(res) ? res : (res.data || []);
            
            // Filter customers only
            const customersList = data.filter(v => v.vendorType === 'Customer' || v.vendorType === 'Both');
            setCustomers(customersList);
            
            // Calculate summary
            calculateSummary(customersList);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data) => {
        let outstanding = 0;
        const active = data.filter(c => c.isActive).length;

        // This is a simplified calculation; in production you'd fetch sales data
        data.forEach(customer => {
            if (customer.openingBalance) {
                outstanding += customer.openingBalance;
            }
        });

        setSummary({
            totalCustomers: data.length,
            totalOutstanding: outstanding,
            activeCustomers: active
        });
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading customer report...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Customer Report</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Customers</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>
                        {summary.totalCustomers}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Active Customers</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                        {summary.activeCustomers}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Outstanding</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }}>
                        ₹{summary.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3>Customer Details</h3>
                {customers.length === 0 ? (
                    <p style={{ color: '#999' }}>No customers found</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>City</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Opening Balance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(customer => (
                                <tr key={customer.vendorID}>
                                    <td>{customer.vendorName}</td>
                                    <td>{customer.city || '-'}</td>
                                    <td>{customer.phone || '-'}</td>
                                    <td>{customer.email || '-'}</td>
                                    <td>₹{(customer.openingBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: customer.isActive ? '#d4edda' : '#f8d7da',
                                            color: customer.isActive ? '#155724' : '#721c24'
                                        }}>
                                            {customer.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
