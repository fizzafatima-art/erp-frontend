import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import vendorService from '../../services/vendorService';
import '../../styles/tables.css';

export default function VendorList() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchVendors();
    }, []);

       const fetchVendors = async () => {
        try {
            setLoading(true);
            const response = await vendorService.getAll();
            // Ensure we set an array
            setVendors(Array.isArray(response) ? response : []);
            setError(null);
        } catch (err) {
            console.error("Vendor Fetch Error:", err);
            
            let errorMessage = "Failed to load vendors.";
            if (err && typeof err === 'object') {
                errorMessage = err.message || JSON.stringify(err);
            } else if (typeof err === 'string') {
                errorMessage = err;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await vendorService.delete(id);
                setVendors(vendors.filter(v => v.vendorID !== id));
            } catch (err) {
                alert('Delete failed');
            }
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error" style={{padding:'20px'}}>{error}</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Vendors & Customers</h1>
                <button className="btn btn-primary" onClick={() => window.location.href = '/vendors/new'}>
                    + New Vendor
                </button>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>City</th>
                        <th>Phone</th>
                        <th>Balance</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {vendors.length > 0 ? (
                        vendors.map(vendor => (
                            <tr key={vendor.vendorID}>
                                <td>{vendor.vendorName}</td>
                                <td>{vendor.vendorType}</td>
                                <td>{vendor.city}</td>
                                <td>{vendor.phone || '-'}</td>
                                <td>Rs.{(vendor.openingBalance || 0).toLocaleString()}</td>
                                <td>
                                    <button 
                                        className="btn-small"
                                        onClick={() => window.location.href = `/vendors/${vendor.vendorID}`}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn-small btn-danger"
                                        onClick={() => handleDelete(vendor.vendorID)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{textAlign:'center', padding:'20px'}}>
                                No vendors found. (Ensure Database is populated)
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
