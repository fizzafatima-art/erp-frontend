import api from './api';

const stockService = {
    async getAll() {
        return api.get('/stock');
    },

    async getLowStock() {
        return api.get('/stock/low-stock');
    }
};

export default stockService;
