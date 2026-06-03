// src/styles/pageStyles.js
// Import this in every page: import styles from '../../styles/pageStyles';

const styles = {
  page: { padding: '24px' },
  title: { fontSize: '22px', fontWeight: '700', marginBottom: '20px', color: '#1e293b' },
  loading: { padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '16px' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  thead: { backgroundColor: '#1e40af', color: '#fff' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
  td: { padding: '11px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9' },
  trEven: { backgroundColor: '#fff' },
  trOdd: { backgroundColor: '#f8fafc' },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: '600' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
  card: (color) => ({
    backgroundColor: { blue: '#3b82f6', green: '#10b981', red: '#ef4444', orange: '#f59e0b', purple: '#8b5cf6', teal: '#14b8a6' }[color],
    borderRadius: '12px', padding: '20px', color: '#fff',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }),
  cardLabel: { fontSize: '13px', opacity: 0.85, marginBottom: '8px' },
  cardValue: { fontSize: '24px', fontWeight: '700' },
};

export default styles;