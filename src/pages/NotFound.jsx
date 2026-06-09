import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            <div style={{
                textAlign: 'center',
                backgroundColor: 'white',
                padding: '60px 40px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                maxWidth: '500px'
            }}>
                <div style={{ fontSize: '120px', fontWeight: 'bold', color: '#ddd', margin: '0' }}>
                    404
                </div>
                
                <h1 style={{ fontSize: '32px', color: '#333', margin: '20px 0 10px 0' }}>
                    Page Not Found
                </h1>
                
                <p style={{ fontSize: '16px', color: '#666', margin: '0 0 30px 0' }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => navigate('/')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                        Go to Dashboard
                    </button>
                    
                    <button 
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#545b62'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}

