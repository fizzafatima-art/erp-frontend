import React, { useState, useEffect } from 'react';
import expenseService from '../../services/expenseService';
import '../../styles/tables.css';

export default function ExpenseReport() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalExpenses: 0,
        byCategory: {},
        byMethod: {}
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const res = await expenseService.getAll();
            const data = res.data || [];
            setExpenses(data);
            
            // Calculate summary
            calculateSummary(data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data) => {
        const byCategory = {};
        const byMethod = {};
        let total = 0;

        data.forEach(expense => {
            total += expense.amount || 0;
            
            byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
            byMethod[expense.paymentMethod] = (byMethod[expense.paymentMethod] || 0) + expense.amount;
        });

        setSummary({
            totalExpenses: total,
            byCategory,
            byMethod
        });
    };

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading expense report...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Expense Report</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Expenses</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }}>
                        Rs.{summary.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Total Items</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>
                        {expenses.length}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#666' }}>Categories</h3>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27ae60' }}>
                        {Object.keys(summary.byCategory).length}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3>Expenses by Category</h3>
                    {Object.keys(summary.byCategory).length === 0 ? (
                        <p style={{ color: '#999' }}>No expense data</p>
                    ) : (
                        Object.entries(summary.byCategory).map(([category, amount]) => (
                            <div key={category} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                <span>{category}</span>
                                <strong>Rs.{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3>Expenses by Payment Method</h3>
                    {Object.keys(summary.byMethod).length === 0 ? (
                        <p style={{ color: '#999' }}>No payment data</p>
                    ) : (
                        Object.entries(summary.byMethod).map(([method, amount]) => (
                            <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                <span>{method}</span>
                                <strong>Rs.{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3>Expense Details</h3>
                {expenses.length === 0 ? (
                    <p style={{ color: '#999' }}>No expenses found</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(expense => (
                                <tr key={expense.expenseID}>
                                    <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                                    <td>{expense.category}</td>
                                    <td>{expense.description}</td>
                                    <td>Rs.{(expense.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    <td>{expense.paymentMethod}</td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '4px',
                                            backgroundColor: expense.isApproved ? '#d4edda' : '#fff3cd',
                                            color: expense.isApproved ? '#155724' : '#856404'
                                        }}>
                                            {expense.isApproved ? '✓ Approved' : 'Pending'}
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

