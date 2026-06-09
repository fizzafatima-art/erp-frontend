import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API Base URL
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

// Helper: Number converter (Safe)
const n = (v) => {
  const x = Number(v);
  return isNaN(x) ? 0 : x;
};

// Currency formatter
const cur = (v) => `Rs.${n(v).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const [kpi, setKpi] = useState(null);
  const [cityProductData, setCityProductData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    loadCityProductData();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await axios.get(`${API}/reports/dashboard`);
      const row = res.data?.data ?? res.data ?? {};

    setKpi({
    totalPurchases: n(row.totalPurchases),
    totalSales: n(row.totalSales),
    totalExpenses: n(row.totalExpenses),
    outstandingPayables: n(row.payables),        // ✅ payables
    outstandingReivables: n(row.receivables),    // ✅ receivables
    lowStockCount: n(row.lowStockCount),
});
    } catch (e) {
      setError('Failed to load dashboard.');
      console.error('Frontend Error:', e);

      setKpi({
        totalPurchases: 0,
        totalSales: 0,
        totalExpenses: 0,
        outstandingPayables: 0,
        outstandingReivables: 0,
        lowStockCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCityProductData = async () => {
    try {
      const res = await axios.get(`${API}/reports/city-analytics`);

      if (res.data?.success) {
        setCityProductData(res.data.data);
      }
    } catch (e) {
      console.error('City Data Error:', e);
    }
  };

  const cards = kpi
    ? [
        {
          label: 'Total Sales',
          value: cur(kpi.totalSales),
          icon: '💳',
          color: '#16a34a',
          bg: '#f0fdf4',
          bdr: '#86efac',
        },
        {
          label: 'Total Purchases',
          value: cur(kpi.totalPurchases),
          icon: '🛒',
          color: '#2563eb',
          bg: '#eff6ff',
          bdr: '#93c5fd',
        },
        {
          label: 'Total Expenses',
          value: cur(kpi.totalExpenses),
          icon: '💸',
          color: '#dc2626',
          bg: '#fef2f2',
          bdr: '#fca5a5',
        },
        {
          label: 'Outstanding Receivables',
          value: cur(kpi.outstandingReivables),
          icon: '📥',
          color: '#d97706',
          bg: '#fffbeb',
          bdr: '#fcd34d',
        },
        {
          label: 'Outstanding Payables',
          value: cur(kpi.outstandingPayables),
          icon: '📤',
          color: '#7c3aed',
          bg: '#faf5ff',
          bdr: '#c4b5fd',
        },
        {
          label: 'Low Stock Items',
          value: kpi.lowStockCount,
          icon: '📦',
          color: kpi.lowStockCount > 0 ? '#dc2626' : '#16a34a',
          bg: kpi.lowStockCount > 0 ? '#fef2f2' : '#f0fdf4',
          bdr: kpi.lowStockCount > 0 ? '#fca5a5' : '#86efac',
        },
      ]
    : [];

  const net = kpi
    ? n(kpi.totalSales) -
      n(kpi.totalPurchases) -
      n(kpi.totalExpenses)
    : 0;

  return (
    <div
      style={{
        padding: 24,
        fontFamily: 'Segoe UI, sans-serif',
        maxWidth: 1200,
      }}
    >
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>
        📊 Dashboard
      </h2>

      <p
        style={{
          margin: '0 0 24px',
          color: '#6b7280',
          fontSize: 14,
        }}
      >
        Business overview
      </p>

      {error && (
        <div style={S.err}>
          {error}
          <button onClick={load} style={S.retry}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={S.center}>Loading dashboard...</div>
      ) : (
        <>
          <div style={S.grid}>
            {cards.map((c) => (
              <div
                key={c.label}
                style={{
                  background: c.bg,
                  border: `1px solid ${c.bdr}`,
                  borderRadius: 12,
                  padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 8 }}>
                  {c.icon}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  {c.label}
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: c.color,
                  }}
                >
                  {c.value}
                </div>
              </div>
            ))}
          </div>

          {cityProductData.length > 0 && (
            <div
              style={{
                marginTop: 30,
                background: '#fff',
                padding: 24,
                borderRadius: 12,
                border: '1px solid #e5e7eb',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px',
                  fontSize: 18,
                  color: '#374151',
                }}
              >
                🏙️ Sales by City (Product Wise)
              </h3>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    <th style={S.th}>City</th>
                    <th style={S.th}>Product Name</th>
                    <th style={S.th}>Qty Sold</th>
                    <th style={S.th}>Revenue (Rs.)</th>
                  </tr>
                </thead>

                <tbody>
                  {cityProductData.map((item, i) => (
                    <tr
                      key={`${item.City}-${item.ProductName}-${i}`}
                    >
                      <td style={S.td}>
                        {item.City || 'Unknown'}
                      </td>

                      <td style={S.td}>
                        {item.ProductName || '-'}
                      </td>

                      <td
                        style={{
                          ...S.td,
                          textAlign: 'center',
                        }}
                      >
                        {n(item.TotalQuantity)}
                      </td>

                      <td
                        style={{
                          ...S.td,
                          textAlign: 'right',
                          fontWeight: 600,
                        }}
                      >
                        Rs.
                        {n(item.TotalRevenue).toLocaleString(
                          'en-IN'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              background:
                net >= 0 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${
                net >= 0 ? '#86efac' : '#fca5a5'
              }`,
              borderRadius: 12,
              padding: '18px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                fontWeight: 500,
              }}
            >
              Estimated Net Profit
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color:
                  net >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {cur(net)}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
              }}
            >
              Sales − Purchases − Expenses
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))',
    gap: 16,
  },

  center: {
    textAlign: 'center',
    padding: 60,
    color: '#6b7280',
  },

  err: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    padding: '10px 16px',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  retry: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: 13,
  },

  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #e5e7eb',
    background: '#f3f4f6',
  },

  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle',
  },
};
