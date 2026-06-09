import api from './api';

const ledgerService = {
    async getGeneralLedger() {
        return api.get('/ledger');
    }
};

export default ledgerService;
