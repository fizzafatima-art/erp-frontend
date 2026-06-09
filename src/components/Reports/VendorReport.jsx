import React from 'react';

export default function VendorReport() {
    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Vendor Reports</h1>
            </div>
            <div className="report-placeholder">
                <p>Report generation features will be implemented here.</p>
                <div style={{marginTop: '20px', padding: '20px', background: '#f9f9f9', borderRadius: '8px'}}>
                    <h3>Summary</h3>
                    <p>Total Outstanding: Rs.0.00</p>
                    <p>Active Vendors: 0</p>
                </div>
            </div>
        </div>
    );
}
