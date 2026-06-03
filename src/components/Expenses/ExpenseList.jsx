import React, { useState, useEffect } from 'react';
import expenseService from '../../services/expenseService';
import '../../styles/tables.css';

export default function ExpenseList() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await expenseService.getAll();
            setExpenses(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Expenses</h1>
                <button className="btn btn-primary">+ Add Expense</button>
            </div>

            {loading ? <div>Loading...</div> : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(ex => (
                            <tr key={ex.expenseID}>
                                <td>{new Date(ex.expenseDate).toLocaleDateString()}</td>
                                <td>{ex.category}</td>
                                <td>{ex.description}</td>
                                <td>₹{ex.amount}</td>
                                <td>{ex.paymentMethod}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}