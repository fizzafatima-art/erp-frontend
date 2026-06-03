// Format currency (e.g., 1000 -> ₹1,000.00)
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount || 0);
};

// Format date (e.g., 2023-10-25 -> 25 Oct 2023)
export const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

// Get status color class
export const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'paid': return 'success';
        case 'pending': return 'danger';
        case 'partial': return 'warning';
        default: return 'secondary';
    }
};