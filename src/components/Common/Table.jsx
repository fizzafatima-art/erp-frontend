import React from 'react';

const Table = ({ columns, data, renderRow }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col, index) => (
            <th key={index}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((item, index) => renderRow(item, index))
        ) : (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px' }}>
              No data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default Table;