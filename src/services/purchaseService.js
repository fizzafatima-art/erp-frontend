import api from './api';

const purchaseService = {
    async getAll() {
        return api.get('/purchases');
    },

    async getById(id) {
        return api.get(`/purchases/${id}`);
    },

    async create(data) {
        return api.post('/purchases', data);
    },

    async addPayment(id, paymentData) {
        return api.post(`/purchases/${id}/payment`, paymentData);
    }
};

export default purchaseService;
