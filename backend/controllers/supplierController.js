
const supplierModel = require('../models/supplierModel');

// Allowed provinces from our MySQL ENUM.
const allowedProvinces = [
    'Gauteng',
    'Free State',
    'KwaZulu-Natal',
    'Western Cape',
    'Eastern Cape',
    'Limpopo',
    'Mpumalanga',
    'North West'
];

// Validate supplier information.
const validateSupplierData = (data) => {
    const requiredFields = [
        'business_name',
        'contact_person',
        'phone',
        'province',
        'address'
    ];

    for (const field of requiredFields) {
        if (
            typeof data[field] !== 'string' ||
            data[field].trim() === ''
        ) {
            return `${field} is required and must be valid text.`;
        }
    }

    if (data.business_name.trim().length > 150) {
        return 'Business name cannot exceed 150 characters.';
    }

    if (data.contact_person.trim().length > 100) {
        return 'Contact person cannot exceed 100 characters.';
    }

    if (data.phone.trim().length > 20) {
        return 'Phone number cannot exceed 20 characters.';
    }

    if (data.address.trim().length > 255) {
        return 'Address cannot exceed 255 characters.';
    }

    if (!allowedProvinces.includes(data.province.trim())) {
        return 'Please provide a valid South African province.';
    }

    return null;
};

// Handle database errors.
const handleDatabaseError = (res, error) => {
    console.error('Supplier database error:', error.message);

    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'This phone number is already registered.'
        });
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
            success: false,
            message: 'This supplier cannot be deleted because existing purchases reference them.'
        });
    }

    return res.status(500).json({
        success: false,
        message: 'A database error occurred while processing the supplier request.'
    });
};

// 1. Register a new supplier.
const createSupplier = async (req, res) => {
    try {
        const validationError = validateSupplierData(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const supplierId = await supplierModel.createSupplier(req.body);

        return res.status(201).json({
            success: true,
            message: 'Supplier registered successfully.',
            supplier_id: supplierId
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

// 2. Retrieve all suppliers.
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await supplierModel.getAllSuppliers();

        return res.status(200).json({
            success: true,
            count: suppliers.length,
            data: suppliers
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

// 3. Retrieve one supplier.
const getSupplierById = async (req, res) => {
    try {
        const supplierId = Number(req.params.id);

        if (!Number.isInteger(supplierId) || supplierId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid supplier ID.'
            });
        }

        const supplier = await supplierModel.getSupplierById(supplierId);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: supplier
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

// 4. Update supplier information.
const updateSupplier = async (req, res) => {
    try {
        const supplierId = Number(req.params.id);

        if (!Number.isInteger(supplierId) || supplierId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid supplier ID.'
            });
        }

        const validationError = validateSupplierData(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const existingSupplier =
            await supplierModel.getSupplierById(supplierId);

        if (!existingSupplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        await supplierModel.updateSupplier(supplierId, req.body);

        return res.status(200).json({
            success: true,
            message: 'Supplier updated successfully.'
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

// 5. Delete a supplier.
const deleteSupplier = async (req, res) => {
    try {
        const supplierId = Number(req.params.id);

        if (!Number.isInteger(supplierId) || supplierId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid supplier ID.'
            });
        }

        const existingSupplier =
            await supplierModel.getSupplierById(supplierId);

        if (!existingSupplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        await supplierModel.deleteSupplier(supplierId);

        return res.status(200).json({
            success: true,
            message: 'Supplier deleted successfully.'
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
