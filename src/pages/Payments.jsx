// ── src/pages/Payments.jsx ─────────────────────────────────
import React, { useEffect, useState } from 'react';
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
export default function Payments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/payments`)
      .then(r => r.json())
      .then(d => { setData(d.data || d || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading payments...</div>;

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Payments</h2>
      <table style={styles.table}>
        <thead><tr style={styles.thead}>
          <th style={styles.th}>ID</th><th style={styles.th}>Type</th>
          <th style={styles.th}>Amount</th><th style={styles.th}>Date</th>
          <th style={styles.th}>Mode</th><th style={styles.th}>Ref No</th>
        </tr></thead>
        <tbody>{data.map((p, i) => (
          <tr key={p.PaymentID} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
            <td style={styles.td}>{p.PaymentID}</td>
            <td style={styles.td}>{p.TransactionType}</td>
            <td style={styles.td}>Rs {Number(p.Amount).toLocaleString()}</td>
            <td style={styles.td}>{new Date(p.PaymentDate).toLocaleDateString()}</td>
            <td style={styles.td}>{p.PaymentMode}</td>
            <td style={styles.td}>{p.ReferenceNo || '-'}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

