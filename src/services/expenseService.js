import api from './api';

const expenseService = {
    async getAll() {
        return api.get('/expenses');
    },

    async create(data) {
        return api.post('/expenses', data);
    }
};

export default expenseService;
