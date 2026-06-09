import api from './api';

const productService = {
    async getAll() {
        return api.get('/products');
    },

    async getById(id) {
        return api.get(`/products/${id}`);
    },

    async create(data) {
        return api.post('/products', data);
    },

    async update(id, data) {
        return api.put(`/products/${id}`, data);
    },

    async delete(id) {
        return api.delete(`/products/${id}`);
    }
};

export default productService;
