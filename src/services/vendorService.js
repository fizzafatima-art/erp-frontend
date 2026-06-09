import api from './api';

const vendorService = {
    // Get all vendors
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.city) params.append('city', filters.city);
        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);
        
        return api.get(`/vendors?${params.toString()}`);
    },

    // Get vendor by ID
    async getById(id) {
        return api.get(`/vendors/${id}`);
    },

    // Create vendor
    async create(vendorData) {
        return api.post('/vendors', vendorData);
    },

    // Update vendor
    async update(id, vendorData) {
        return api.put(`/vendors/${id}`, vendorData);
    },

    // Delete vendor
    async delete(id) {
        return api.delete(`/vendors/${id}`);
    },

    // Get vendor ledger
    async getLedger(id) {
        return api.get(`/vendors/${id}/ledger`);
    }
};

export default vendorService;
