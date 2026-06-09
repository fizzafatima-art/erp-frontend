export const VENDOR_TYPES = ['Vendor', 'Customer', 'Both'];
export const PAYMENT_MODES = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'Bank Transfer', 'Online'];
export const UNITS = ['KG', 'Piece', 'Bundle', 'Liter', 'Box', 'Meter'];
export const EXPENSE_CATEGORIES = ['Operational', 'Utilities', 'Office Supplies', 'Transport', 'Miscellaneous'];
export const PAYMENT_STATUS = ['Pending', 'Partial', 'Paid'];

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
