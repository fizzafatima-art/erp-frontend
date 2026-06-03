import api from './api';

const reportService = {
    async getDashboard() {
        // Calls the backend dashboard endpoint
        return api.get('/reports/dashboard');
    },

    async getOutstanding() {
        return api.get('/reports/outstanding');
    },

    async getVendorSummary() {
        return api.get('/reports/vendor-summary');
    },

    async getSalesSummary() {
        return api.get('/reports/sales-summary');
    }
};

export default reportService;