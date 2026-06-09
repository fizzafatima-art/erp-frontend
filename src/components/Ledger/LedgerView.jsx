import React, { useState, useEffect } from 'react';
import ledgerService from '../../services/ledgerService';
import '../../styles/tables.css';

export default function LedgerView() {
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        try {
            const res = await ledgerService.getGeneralLedger();
            setLedger(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>General Ledger</h1>
            </div>

            {loading ? <div>Loading...</div> : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Party Name</th>
                            <th>Type</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledger.map(entry => (
                            <tr key={entry.ledgerID}>
                                <td>{new Date(entry.transactionDate).toLocaleDateString()}</td>
                                <td>{entry.vendorName}</td>
                                <td>{entry.transactionType}</td>
                                <td>{entry.debitAmount > 0 ? `Rs.${entry.debitAmount}` : '-'}</td>
                                <td>{entry.creditAmount > 0 ? `Rs.${entry.creditAmount}` : '-'}</td>
                                <td>Rs.{entry.runningBalance}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
