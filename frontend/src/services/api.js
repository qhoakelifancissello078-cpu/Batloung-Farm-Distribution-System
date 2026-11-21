
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiRequest = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message || 'Something went wrong with the API request.'
            );
        }

        return result;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(
                'Unable to connect to Batloung Farm server. Please check that the backend is running.'
            );
        }

        throw error;
    }
};

export const getBusinessReports = async () => apiRequest('/reports');

export const getStock = async () => apiRequest('/stock');

export const getFruits = async () => apiRequest('/fruits');

export const createFruit = async (fruitData) => apiRequest('/fruits', {
    method: 'POST',
    body: JSON.stringify(fruitData)
});

export const updateFruit = async (id, fruitData) => apiRequest(`/fruits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fruitData)
});

export const deleteFruit = async (id) => apiRequest(`/fruits/${id}`, {
    method: 'DELETE'
});

export const getSuppliers = async () => apiRequest('/suppliers');

export const createSupplier = async (supplierData) => apiRequest('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplierData)
});

export const updateSupplier = async (id, supplierData) => apiRequest(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplierData)
});

export const deleteSupplier = async (id) => apiRequest(`/suppliers/${id}`, {
    method: 'DELETE'
});

export const getVendors = async () => apiRequest('/vendors');

export const createVendor = async (vendorData) => apiRequest('/vendors', {
    method: 'POST',
    body: JSON.stringify(vendorData)
});

export const updateVendor = async (id, vendorData) => apiRequest(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vendorData)
});

export const deleteVendor = async (id) => apiRequest(`/vendors/${id}`, {
    method: 'DELETE'
});

export const getPurchases = async () => apiRequest('/purchases');

export const getPurchaseById = async (id) => apiRequest(`/purchases/${id}`);

export const createPurchase = async (purchaseData) => apiRequest('/purchases', {
    method: 'POST',
    body: JSON.stringify(purchaseData)
});

export const getSales = async () => apiRequest('/sales');

export const getSaleById = async (id) => apiRequest(`/sales/${id}`);

export const createSale = async (saleData) => apiRequest('/sales', {
    method: 'POST',
    body: JSON.stringify(saleData)
});

export const getPayments = async () => apiRequest('/payments');

export const getPaymentsBySale = async (saleId) =>
    apiRequest(`/payments/sale/${saleId}`);

export const getPaymentById = async (id) =>
    apiRequest(`/payments/${id}`);

export const createPayment = async (paymentData) =>
    apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
    });

export const getSellingPrices = async () =>
    apiRequest('/selling-prices');

export const createSellingPrice = async (priceData) =>
    apiRequest('/selling-prices', {
        method: 'POST',
        body: JSON.stringify(priceData)
    });

export const updateSellingPrice = async (id, priceData) =>
    apiRequest(`/selling-prices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(priceData)
    });

export const checkServerHealth = async () => apiRequest('/health');

export const getReports = async () => apiRequest('/reports');

export default apiRequest;
