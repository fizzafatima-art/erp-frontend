export const validateVendor = (vendor) => {
    const errors = {};
    if (!vendor.vendorName) errors.vendorName = 'Vendor Name is required';
    if (!vendor.city) errors.city = 'City is required';
    if (!vendor.vendorType) errors.vendorType = 'Type is required';
    return errors;
};

export const validateProduct = (product) => {
    const errors = {};
    if (!product.productName) errors.productName = 'Product Name is required';
    if (!product.category) errors.category = 'Category is required';
    if (!product.unit) errors.unit = 'Unit is required';
    return errors;
};

export const validateSale = (sale) => {
    const errors = {};
    if (!sale.customerId) errors.customerId = 'Customer is required';
    if (!sale.items || sale.items.length === 0) errors.items = 'At least one item is required';
    return errors;
};
