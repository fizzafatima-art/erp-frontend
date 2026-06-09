import React from 'react';

export default function KPICard({ title, value, trend, icon }) {
    return (
        <div className="kpi-card">
            <div className="kpi-header">
                <h3>{title}</h3>
                <span className="icon">{icon}</span>
            </div>
            <div className="value">{value}</div>
            {trend && <div className="trend">{trend}</div>}
        </div>
    );
}
