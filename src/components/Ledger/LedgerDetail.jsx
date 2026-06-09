import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import vendorService from '../../services/vendorService';

export default function LedgerDetail() {
  const { id } = useParams();
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await vendorService.getLedger(id);
        setLedger(res.data || []);
      } catch (error) {
        console.error("Error fetching ledger details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page-container">
      <h2>Ledger Details</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Invoice</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((entry) => (
            <tr key={entry.ledgerID}>
              <td>{new Date(entry.transactionDate).toLocaleDateString()}</td>
              <td>{entry.transactionType}</td>
              <td>{entry.invoiceNo || '-'}</td>
              <td>{entry.debitAmount > 0 ? `Rs.${entry.debitAmount}` : '-'}</td>
              <td>{entry.creditAmount > 0 ? `Rs.${entry.creditAmount}` : '-'}</td>
              <td>Rs.{entry.runningBalance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
