import api from './api';

const saleService = {
    async getAll() {
        return api.get('/sales');
    },

    async getById(id) {
        return api.get(`/sales/${id}`);
    },

    async create(data) {
        return api.post('/sales', data);
    },

    async addPayment(id, paymentData) {
        return api.post(`/sales/${id}/payment`, paymentData);
    }
};

export default saleService;
