import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
const s = (v) => (v == null ? '' : String(v));
const n = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const fmt = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
};

export function WarehouseReport() {
  const [tab, setTab] = useState('summary');
  const [warehouses, setWarehouses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [stock, setStock] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const loadWarehouses = async () => {
    try {
      const res = await axios.get(`${API}/warehouse/warehouses`);
      setWarehouses(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { console.error(e); }
  };

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API}/warehouse/warehouse-summary`);
      setSummary(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { setError('Failed to load summary.'); }
    finally { setLoading(false); }
  }, []);

  const loadStock = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const params = filterWarehouse ? `?warehouseId=${filterWarehouse}` : '';
      const res = await axios.get(`${API}/warehouse/warehouse-stock${params}`);
      setStock(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { setError('Failed to load stock.'); }
    finally { setLoading(false); }
  }, [filterWarehouse]);

  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const p = new URLSearchParams();
      if (filterFrom) p.append('fromId', filterFrom);
      if (filterTo) p.append('toId', filterTo);
      if (filterDateFrom) p.append('dateFrom', filterDateFrom);
      if (filterDateTo) p.append('dateTo', filterDateTo);
      const res = await axios.get(`${API}/warehouse/warehouse-transfers?${p.toString()}`);
      setTransfers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { setError('Failed to load transfers.'); }
    finally { setLoading(false); }
  }, [filterFrom, filterTo, filterDateFrom, filterDateTo]);

  useEffect(() => { loadWarehouses(); }, []);

  useEffect(() => {
    if (tab === 'summary') loadSummary();
    else if (tab === 'stock') loadStock();
    else if (tab === 'transfers') loadTransfers();
  }, [tab, loadSummary, loadStock, loadTransfers]);

  const openDetail = async (id) => {
    try {
      const res = await axios.get(`${API}/warehouse/warehouse-transfers/${id}`);
      setDetailData(res.data?.data || null);
      setShowDetail(true);
    } catch (e) { alert('Failed to load detail'); }
  };

  const totalValue = summary.reduce((sum, r) => sum + n(r.TotalValue), 0);
  const totalProducts = summary.reduce((sum, r) => sum + n(r.ProductCount), 0);
  const totalQty = summary.reduce((sum, r) => sum + n(r.TotalQty), 0);

  return (
    <div style={{ padding: 24, fontFamily: 'Segoe UI, sans-serif' }}>
      <h2 style={{ margin: '0 0 20px 0' }}>📦 Warehouse Reports</h2>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {[
          { key: 'summary', label: '📊 Summary' },
          { key: 'stock', label: '📋 Warehouse Stock' },
          { key: 'transfers', label: '🚚 Transfer History' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '10px 24px', border: 'none', background: 'transparent',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              color: tab === t.key ? '#2563eb' : '#6b7280',
              borderBottom: tab === t.key ? '3px solid #2563eb' : '3px solid transparent',
              marginBottom: -2
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: 10, borderRadius: 6, marginBottom: 14 }}>{error}</div>}

      {tab === 'summary' && (
        <>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <Card label="Total Warehouses" value={summary.length} color="#2563eb" />
            <Card label="Total Products" value={totalProducts} color="#16a34a" />
            <Card label="Total Quantity" value={totalQty.toLocaleString('en-IN')} color="#f59e0b" />
            <Card label="Total Value" value={`Rs.${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} color="#dc2626" />
          </div>

          {loading ? <p>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#fff' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  {['Warehouse', 'City', 'Products', 'Total Qty', 'Total Value'].map(h => (
                    <th key={h} style={ST.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.length === 0
                  ? <tr><td colSpan={5} style={ST.empty}>No warehouses found.</td></tr>
                  : summary.map(r => (
                    <tr key={r.WarehouseID} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ ...ST.td, fontWeight: 600 }}>{s(r.WarehouseName)}</td>
                      <td style={ST.td}>{s(r.City) || '-'}</td>
                      <td style={ST.td}>{n(r.ProductCount)}</td>
                      <td style={ST.td}>{n(r.TotalQty).toLocaleString('en-IN')}</td>
                      <td style={{ ...ST.td, fontWeight: 600 }}>Rs.{n(r.TotalValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                }
                {summary.length > 0 && (
                  <tr style={{ background: '#f0f9ff', fontWeight: 700 }}>
                    <td style={ST.td} colSpan={2}>TOTAL</td>
                    <td style={ST.td}>{totalProducts}</td>
                    <td style={ST.td}>{totalQty.toLocaleString('en-IN')}</td>
                    <td style={ST.td}>Rs.{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'stock' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Filter by Warehouse:</label>
            <select value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)} style={ST.select}>
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.WarehouseID} value={w.WarehouseID}>{w.WarehouseName}</option>)}
            </select>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{stock.length} items</span>
          </div>

          {loading ? <p>Loading...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#fff' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    {['#', 'Warehouse', 'Product', 'Unit', 'Quantity', 'Last Updated'].map(h => (
                      <th key={h} style={ST.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stock.length === 0
                    ? <tr><td colSpan={6} style={ST.empty}>No stock found.</td></tr>
                    : stock.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={ST.td}>{i + 1}</td>
                        <td style={ST.td}>{s(r.WarehouseName)}</td>
                        <td style={{ ...ST.td, fontWeight: 500 }}>{s(r.ProductName)}</td>
                        <td style={ST.td}>{s(r.Unit)}</td>
                        <td style={{ ...ST.td, fontWeight: 600, color: n(r.CurrentQuantity) <= 0 ? '#dc2626' : '#16a34a' }}>
                          {n(r.CurrentQuantity).toFixed(0)}
                        </td>
                        <td style={{ ...ST.td, fontSize: 12, color: '#6b7280' }}>{fmt(r.LastUpdated)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'transfers' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={ST.select}>
              <option value="">From: Any</option>
              {warehouses.map(w => <option key={w.WarehouseID} value={w.WarehouseID}>{w.WarehouseName}</option>)}
            </select>
            <select value={filterTo} onChange={e => setFilterTo(e.target.value)} style={ST.select}>
              <option value="">To: Any</option>
              {warehouses.map(w => <option key={w.WarehouseID} value={w.WarehouseID}>{w.WarehouseName}</option>)}
            </select>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={ST.select} />
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={ST.select} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{transfers.length} records</span>
          </div>

          {loading ? <p>Loading...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#fff' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    {['#', 'Transfer #', 'Date', 'From', 'To', 'Items', 'Status', 'Action'].map(h => (
                      <th key={h} style={ST.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0
                    ? <tr><td colSpan={8} style={ST.empty}>No transfers found.</td></tr>
                    : transfers.map((r, i) => (
                      <tr key={r.TransferID} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={ST.td}>{i + 1}</td>
                        <td style={{ ...ST.td, fontWeight: 500 }}>{s(r.TransferNo) || '-'}</td>
                        <td style={ST.td}>{fmt(r.TransferDate)}</td>
                        <td style={ST.td}>{s(r.FromWarehouse) || '-'}</td>
                        <td style={ST.td}>{s(r.ToWarehouse) || '-'}</td>
                        <td style={ST.td}>{n(r.ItemCount)}</td>
                        <td style={ST.td}>
                          <span style={{
                            padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                            background: (r.Status || '').toLowerCase() === 'completed' ? '#f0fdf4' : '#fef3c7',
                            color: (r.Status || '').toLowerCase() === 'completed' ? '#16a34a' : '#d97706'
                          }}>{s(r.Status) || 'Pending'}</span>
                        </td>
                        <td style={ST.td}>
                          <button onClick={() => openDetail(r.TransferID)} style={ST.btnSm('#2563eb')}>View</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showDetail && detailData && (
        <div style={ST.overlay} onClick={() => setShowDetail(false)}>
          <div style={ST.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Transfer Detail — {detailData.TransferNo || detailData.TransferID}</h3>
            <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 13, color: '#374151' }}>
              <div><strong>Date:</strong> {fmt(detailData.TransferDate)}</div>
              <div><strong>From:</strong> {s(detailData.FromWarehouse) || '-'}</div>
              <div><strong>To:</strong> {s(detailData.ToWarehouse) || '-'}</div>
              <div><strong>Status:</strong> {s(detailData.Status)}</div>
            </div>
            {detailData.Notes && (
              <div style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}><strong>Notes:</strong> {s(detailData.Notes)}</div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={ST.th}>#</th>
                  <th style={ST.th}>Product</th>
                  <th style={ST.th}>Unit</th>
                  <th style={ST.th}>Quantity</th>
                  <th style={ST.th}>Rate</th>
                  <th style={ST.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(detailData.Items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={ST.td}>{i + 1}</td>
                    <td style={{ ...ST.td, fontWeight: 500 }}>{s(item.ProductName)}</td>
                    <td style={ST.td}>{s(item.Unit)}</td>
                    <td style={ST.td}>{n(item.Quantity).toFixed(0)}</td>
                    <td style={ST.td}>Rs.{n(item.Rate).toFixed(2)}</td>
                    <td style={{ ...ST.td, fontWeight: 600 }}>Rs.{(n(item.Quantity) * n(item.Rate)).toFixed(2)}</td>
                  </tr>
                ))}
                {(detailData.Items || []).length === 0 && (
                  <tr><td colSpan={6} style={ST.empty}>No items in this transfer.</td></tr>
                )}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button onClick={() => setShowDetail(false)} style={{ ...ST.btn('#6b7280'), padding: '8px 24px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WarehouseReport;

function Card({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 20px', minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

const ST = {
  th: { padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e5e7eb' },
  td: { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle' },
  empty: { textAlign: 'center', padding: 28, color: '#6b7280' },
  select: { padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#fff' },
  btnSm: (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 4, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }),
  btn: (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }),
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: 24, borderRadius: 8, width: 640, maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' },
};