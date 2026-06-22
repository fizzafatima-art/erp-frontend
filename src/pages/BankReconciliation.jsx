import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const n   = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };
const cur = (v) => `Rs.${n(v).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
const fmt = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
};

export default function BankReconciliation() {
  const [accounts, setAccounts]   = useState([]);
  const [selectedAcc, setSelectedAcc] = useState('');
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState('Reconciliation');

  const [showAccModal, setShowAccModal] = useState(false);
  const [accForm, setAccForm] = useState({ BankName:'', AccountTitle:'', AccountNo:'', BranchCode:'', OpeningBalance:0 });

  const [showStmtModal, setShowStmtModal] = useState(false);
  const [stmtForm, setStmtForm] = useState({ TransactionDate:'', Description:'', Debit:0, Credit:0, Balance:0, ReferenceNo:'' });

  useEffect(() => { loadAccounts(); }, []); // eslint-disable-line

  const loadAccounts = async () => {
    try {
      const res = await axios.get(`${API}/bank-reconciliation/accounts`);
      const list = res.data?.data || [];
      setAccounts(list);
      if (list.length > 0 && !selectedAcc) setSelectedAcc(list[0].AccountID);
    } catch (e) { console.error(e); }
  };

  const loadReconciliation = async () => {
    if (!selectedAcc) return;
    try {
      setLoading(true); setError('');
      const params = { accountId: selectedAcc };
      if (from) params.dateFrom = from;
      if (to)   params.dateTo   = to;
      const res = await axios.get(`${API}/bank-reconciliation/reconciliation`, { params });
      setData(res.data?.data || null);
    } catch (e) {
      setError('Failed to load reconciliation data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (selectedAcc) loadReconciliation(); }, [selectedAcc]); // eslint-disable-line

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/bank-reconciliation/accounts`, accForm);
      alert('Bank account added!');
      setShowAccModal(false);
      setAccForm({ BankName:'', AccountTitle:'', AccountNo:'', BranchCode:'', OpeningBalance:0 });
      loadAccounts();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddStatement = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/bank-reconciliation/statements`, { ...stmtForm, AccountID: selectedAcc });
      alert('Statement entry added!');
      setShowStmtModal(false);
      setStmtForm({ TransactionDate:'', Description:'', Debit:0, Credit:0, Balance:0, ReferenceNo:'' });
      loadReconciliation();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMatch = async (statementId, paymentId) => {
    try {
      await axios.post(`${API}/bank-reconciliation/match`, { StatementID: statementId, PaymentID: paymentId });
      loadReconciliation();
    } catch (err) {
      alert('Error matching: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUnmatch = async (statementId, paymentId) => {
    try {
      await axios.post(`${API}/bank-reconciliation/unmatch`, { StatementID: statementId, PaymentID: paymentId });
      loadReconciliation();
    } catch (err) {
      alert('Error unmatching: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteStatement = async (id) => {
    if (!window.confirm('Delete this statement entry?')) return;
    try {
      await axios.delete(`${API}/bank-reconciliation/statements/${id}`);
      loadReconciliation();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // suppress unused warning
  void handleMatch; void handleUnmatch;

  const summary = data?.summary || {};

  return (
    <div style={{ padding:24, fontFamily:'Segoe UI,sans-serif', maxWidth:1300, margin:'0 auto' }}>
      <div style={S.hdr}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:24, fontWeight:700 }}>🏦 Bank Reconciliation</h2>
          <p style={{ margin:0, color:'#6b7280', fontSize:14 }}>Account-wise reconciliation & transaction reporting</p>
        </div>
        <button onClick={()=>setShowAccModal(true)} style={S.btn('#2563eb')}>+ Add Bank Account</button>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div>
          <label style={S.lbl}>Bank Account</label>
          <select value={selectedAcc} onChange={e=>setSelectedAcc(e.target.value)} style={{...S.dInput, width:220}}>
            <option value="">Select Account</option>
            {accounts.map(a => (
              <option key={a.AccountID} value={a.AccountID}>{a.BankName} - {a.AccountNo} ({a.AccountTitle})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.lbl}>From</label>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={S.dInput} />
        </div>
        <div>
          <label style={S.lbl}>To</label>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={S.dInput} />
        </div>
        <button onClick={loadReconciliation} style={S.btn('#2563eb')}>Apply</button>
        <button onClick={()=>setShowStmtModal(true)} style={S.btn('#16a34a')}>+ Add Statement Entry</button>
      </div>

      {error && <div style={S.err}>{error}</div>}

      {!selectedAcc ? (
        <div style={S.center}>Select a bank account to view reconciliation.</div>
      ) : loading ? (
        <div style={S.center}>Loading...</div>
      ) : data ? (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
            <KPI label="Bank Statements" value={summary.totalStatements || 0} color="#2563eb" bg="#eff6ff" bdr="#93c5fd" />
            <KPI label="System Payments" value={summary.totalPayments || 0} color="#7c3aed" bg="#faf5ff" bdr="#c4b5fd" />
            <KPI label="Matched" value={summary.matchedCount || 0} color="#16a34a" bg="#f0fdf4" bdr="#86efac" />
            <KPI label="Unmatched (Bank)" value={summary.unmatchedStatements || 0} color="#dc2626" bg="#fef2f2" bdr="#fca5a5" />
            <KPI label="Unmatched (System)" value={summary.unmatchedPayments || 0} color="#d97706" bg="#fffbeb" bdr="#fcd34d" />
          </div>

          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:16, marginBottom:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, fontSize:13 }}>
              <div>Statement Debit: <b style={{color:'#dc2626'}}>{cur(summary.totalStatementDebit)}</b></div>
              <div>Statement Credit: <b style={{color:'#16a34a'}}>{cur(summary.totalStatementCredit)}</b></div>
              <div>System Debit: <b style={{color:'#dc2626'}}>{cur(summary.totalPaymentDebit)}</b></div>
              <div>System Credit: <b style={{color:'#16a34a'}}>{cur(summary.totalPaymentCredit)}</b></div>
              <div>Difference: <b style={{color: n(summary.difference)===0?'#16a34a':'#dc2626'}}>{cur(summary.difference)}</b></div>
            </div>
          </div>

          <div style={{ display:'flex', gap:4, borderBottom:'2px solid #e5e7eb', marginBottom:16 }}>
            {['Reconciliation','Bank Statements','System Payments'].map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{
                padding:'9px 18px', fontSize:14, fontWeight:500, border:'none', cursor:'pointer',
                borderRadius:'6px 6px 0 0', marginBottom:-2,
                background: tab===t?'#2563eb':'transparent',
                color:      tab===t?'#fff':'#6b7280',
              }}>{t}</button>
            ))}
          </div>

          {tab === 'Reconciliation' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:15}}>
                <h4 style={{margin:'0 0 10px'}}>🏦 Unmatched Bank Statements</h4>
                {(data.unmatched || []).length === 0 ? <p style={{color:'#9ca3af', fontSize:13}}>None - all matched!</p> : (
                  (data.unmatched || []).map(s => (
                    <div key={s.StatementID} style={S.matchRow}>
                      <div>
                        <div style={{fontWeight:600, fontSize:13}}>{s.Description || '-'}</div>
                        <div style={{fontSize:11, color:'#6b7280'}}>{fmt(s.TransactionDate)} | Ref: {s.ReferenceNo || '-'}</div>
                        <div style={{fontSize:12, fontWeight:600, color: n(s.Credit)>0?'#16a34a':'#dc2626'}}>
                          {n(s.Credit)>0 ? `+${cur(s.Credit)}` : `-${cur(s.Debit)}`}
                        </div>
                      </div>
                      <button onClick={()=>handleDeleteStatement(s.StatementID)} style={S.btnSm('#dc2626')}>Delete</button>
                    </div>
                  ))
                )}
              </div>

              <div style={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:15}}>
                <h4 style={{margin:'0 0 10px'}}>💻 Unmatched System Payments</h4>
                {(data.unmatchedPayments || []).length === 0 ? <p style={{color:'#9ca3af', fontSize:13}}>None - all matched!</p> : (
                  (data.unmatchedPayments || []).map(p => (
                    <div key={p.PaymentID} style={S.matchRow}>
                      <div>
                        <div style={{fontWeight:600, fontSize:13}}>{p.Description || p.TransactionType}</div>
                        <div style={{fontSize:11, color:'#6b7280'}}>{fmt(p.TransactionDate)} | {p.ReferenceType}</div>
                        <div style={{fontSize:12, fontWeight:600, color: n(p.Credit)>0?'#16a34a':'#dc2626'}}>
                          {n(p.Credit)>0 ? `+${cur(p.Credit)}` : `-${cur(p.Debit)}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'Bank Statements' && (
            <TxTable rows={data.statements} cols={[
              { label:'Date', fn:r=>fmt(r.TransactionDate) },
              { label:'Description', fn:r=>r.Description || '-' },
              { label:'Reference', fn:r=>r.ReferenceNo || '-' },
              { label:'Debit', fn:r=>n(r.Debit)>0?cur(r.Debit):'-', color:'#dc2626' },
              { label:'Credit', fn:r=>n(r.Credit)>0?cur(r.Credit):'-', color:'#16a34a' },
              { label:'Matched', fn:r=>r.IsMatched ? '✅ Yes' : '⚠️ No' },
              { label:'Action', fn:r=>(
                <button onClick={()=>handleDeleteStatement(r.StatementID)} style={S.btnSm('#dc2626')}>Delete</button>
              )}
            ]} />
          )}

          {tab === 'System Payments' && (
            <TxTable rows={data.payments} cols={[
              { label:'Date', fn:r=>fmt(r.TransactionDate) },
              { label:'Type', fn:r=>r.TransactionType || '-' },
              { label:'Reference', fn:r=>r.ReferenceType || '-' },
              { label:'Description', fn:r=>r.Description || '-' },
              { label:'Debit', fn:r=>n(r.Debit)>0?cur(r.Debit):'-', color:'#dc2626' },
              { label:'Credit', fn:r=>n(r.Credit)>0?cur(r.Credit):'-', color:'#16a34a' },
              { label:'Matched', fn:r=>r.IsMatched ? '✅ Yes' : '⚠️ No' },
            ]} />
          )}
        </>
      ) : null}

      {/* Add Account Modal */}
      {showAccModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{marginTop:0}}>Add Bank Account</h3>
            <form onSubmit={handleAddAccount}>
              <label style={S.label}>Bank Name *</label>
              <input required style={S.input} value={accForm.BankName}
                onChange={e=>setAccForm({...accForm, BankName: e.target.value})} />

              <label style={{...S.label, marginTop:10}}>Account Title</label>
              <input style={S.input} value={accForm.AccountTitle}
                onChange={e=>setAccForm({...accForm, AccountTitle: e.target.value})} />

              <label style={{...S.label, marginTop:10}}>Account No</label>
              <input style={S.input} value={accForm.AccountNo}
                onChange={e=>setAccForm({...accForm, AccountNo: e.target.value})} />

              <label style={{...S.label, marginTop:10}}>Branch Code</label>
              <input style={S.input} value={accForm.BranchCode}
                onChange={e=>setAccForm({...accForm, BranchCode: e.target.value})} />

              <label style={{...S.label, marginTop:10}}>Opening Balance</label>
              <input type="number" style={S.input} value={accForm.OpeningBalance}
                onChange={e=>setAccForm({...accForm, OpeningBalance: e.target.value})} />

              <div style={{display:'flex', gap:10, marginTop:16}}>
                <button type="button" onClick={()=>setShowAccModal(false)} style={{...S.btn('#6b7280'), flex:1}}>Cancel</button>
                <button type="submit" style={{...S.btn('#2563eb'), flex:1}}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Statement Modal */}
      {showStmtModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={{marginTop:0}}>Add Bank Statement Entry</h3>
            <form onSubmit={handleAddStatement}>
              <label style={S.label}>Transaction Date *</label>
              <input required type="date" style={S.input} value={stmtForm.TransactionDate}
                onChange={e=>setStmtForm({...stmtForm, TransactionDate: e.target.value})} />

              <label style={{...S.label, marginTop:10}}>Description</label>
              <input style={S.input} value={stmtForm.Description}
                onChange={e=>setStmtForm({...stmtForm, Description: e.target.value})} />

              <div style={{display:'flex', gap:10, marginTop:10}}>
                <div style={{flex:1}}>
                  <label style={S.label}>Debit</label>
                  <input type="number" style={S.input} value={stmtForm.Debit}
                    onChange={e=>setStmtForm({...stmtForm, Debit: e.target.value})} />
                </div>
                <div style={{flex:1}}>
                  <label style={S.label}>Credit</label>
                  <input type="number" style={S.input} value={stmtForm.Credit}
                    onChange={e=>setStmtForm({...stmtForm, Credit: e.target.value})} />
                </div>
              </div>

              <label style={{...S.label, marginTop:10}}>Balance</label>
              <input type="number" style={S.input} value={stmtForm.Balance}
                onChange={e=>setStmtForm({...stmtForm, Balance: e.target.value})} />

              <label style={{...S.label, marginTop:10}}>Reference No</label>
              <input style={S.input} value={stmtForm.ReferenceNo}
                onChange={e=>setStmtForm({...stmtForm, ReferenceNo: e.target.value})} />

              <div style={{display:'flex', gap:10, marginTop:16}}>
                <button type="button" onClick={()=>setShowStmtModal(false)} style={{...S.btn('#6b7280'), flex:1}}>Cancel</button>
                <button type="submit" style={{...S.btn('#16a34a'), flex:1}}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TxTable({ rows = [], cols }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ color:'#6b7280', fontSize:12, marginBottom:5 }}>{rows.length} record(s)</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead><tr style={{ background:'#f3f4f6' }}>
          <th style={S.th}>#</th>
          {cols.map(c=><th key={c.label} style={S.th}>{c.label}</th>)}
        </tr></thead>
        <tbody>
          {rows.length===0
            ? <tr><td colSpan={cols.length+1} style={{ textAlign:'center', padding:20, color:'#9ca3af' }}>No records found.</td></tr>
            : rows.map((r,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid #f3f4f6', background:i%2===0?'#fff':'#fafafa' }}>
                <td style={S.td}>{i+1}</td>
                {cols.map(c=>(
                  <td key={c.label} style={{ ...S.td, ...(c.color?{fontWeight:600,color:c.color}:{}) }}>
                    {typeof c.fn === 'function' ? c.fn(r) : r[c.fn]}
                  </td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

function KPI({ label, value, color, bg, bdr }) {
  return (
    <div style={{ background:bg, border:`1px solid ${bdr}`, borderRadius:10, padding:'14px 16px' }}>
      <div style={{ fontSize:12, color:'#6b7280', fontWeight:500, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

const S = {
  hdr:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  lbl:    { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:3 },
  dInput: { padding:'7px 10px', borderRadius:6, border:'1px solid #d1d5db', fontSize:13 },
  th:     { padding:'10px 12px', textAlign:'left', fontWeight:600, borderBottom:'2px solid #e5e7eb', whiteSpace:'nowrap' },
  td:     { padding:'10px 12px', verticalAlign:'middle' },
  center: { textAlign:'center', padding:40, color:'#6b7280' },
  err:    { background:'#fef2f2', border:'1px solid #fca5a5', color:'#b91c1c', padding:'10px 14px', borderRadius:6, marginBottom:14, fontSize:13 },
  btn:    (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:6, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:500 }),
  btnSm:  (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:4, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:500 }),
  matchRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f3f4f6' },
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modal:   { background:'#fff', padding:24, borderRadius:8, width:'450px', maxWidth:'95%', maxHeight:'90vh', overflowY:'auto' },
  label:   { display:'block', marginBottom:4, fontSize:13, fontWeight:600, color:'#374151' },
  input:   { padding:'8px', borderRadius:4, border:'1px solid #d1d5db', width:'100%', boxSizing:'border-box', fontSize:13 },
};