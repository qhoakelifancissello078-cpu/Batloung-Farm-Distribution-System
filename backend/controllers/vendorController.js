
const vendorModel = require('../models/vendorModel');

const handleDatabaseError = (error, res) => {
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'This phone number is already registered.'
        });
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
            success: false,
            message: 'This vendor cannot be deleted because it has existing records.'
        });
    }

    console.error('Vendor database error:', error);

    return res.status(500).json({
        success: false,
        message: 'A database error occurred.'
    });
};

// Validate vendor information.
const validateVendorData = (data) => {
    const { vendor_name, phone_number, location, registration_date } = data;

    if (
        typeof vendor_name !== 'string' ||
        !vendor_name.trim() ||
        vendor_name.trim().length > 150
    ) {
        return 'Vendor name is required and must not exceed 150 characters.';
    }

    if (
        typeof phone_number !== 'string' ||
        !phone_number.trim() ||
        phone_number.trim().length > 20
    ) {
        return 'A valid phone number is required (maximum 20 characters).';
    }

    if (
        typeof location !== 'string' ||
        !location.trim() ||
        location.trim().length > 255
    ) {
        return 'Vendor location is required and must not exceed 255 characters.';
    }

    if (
        typeof registration_date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(registration_date) ||
        !isValidDate(registration_date)
    ) {
        return 'A valid registration date is required in YYYY-MM-DD format.';
    }

    return null;
};

// Check whether a date actually exists.
const isValidDate = (date) => {
    const [year, month, day] = date.split('-').map(Number);

    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
};

// Validate vendor ID.
const validateVendorId = (id) => {
    return /^\d+$/.test(id) && Number(id) > 0;
};

// Register a new vendor.
const createVendor = async (req, res) => {
    const validationError = validateVendorData(req.body);

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError
        });
    }

    try {
        const vendorData = {
            ...req.body,
            vendor_name: req.body.vendor_name.trim(),
            phone_number: req.body.phone_number.trim(),
            location: req.body.location.trim()
        };

        const vendorId = await vendorModel.createVendor(vendorData);

        return res.status(201).json({
            success: true,
            message: 'Vendor registered successfully.',
            vendor_id: vendorId
        });
    } catch (error) {
        return handleDatabaseError(error, res);
    }
};

// Retrieve all vendors.
const getAllVendors = async (req, res) => {
    try {
        const vendors = await vendorModel.getAllVendors();

        return res.status(200).json({
            success: true,
            count: vendors.length,
            data: vendors
        });
    } catch (error) {
        return handleDatabaseError(error, res);
    }
};

// Retrieve one vendor.
const getVendorById = async (req, res) => {
    const { id } = req.params;

    if (!validateVendorId(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid vendor ID.'
        });
    }

    try {
        const vendor = await vendorModel.getVendorById(id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: vendor
        });
    } catch (error) {
        return handleDatabaseError(error, res);
    }
};

// Update an existing vendor.
const updateVendor = async (req, res) => {
    const { id } = req.params;

    if (!validateVendorId(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid vendor ID.'
        });
    }

    const validationError = validateVendorData(req.body);

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError
        });
    }

    try {
        const existingVendor = await vendorModel.getVendorById(id);

        if (!existingVendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found.'
            });
        }

        const vendorData = {
            ...req.body,
            vendor_name: req.body.vendor_name.trim(),
            phone_number: req.body.phone_number.trim(),
            location: req.body.location.trim()
        };

        await vendorModel.updateVendor(id, vendorData);

        return res.status(200).json({
            success: true,
            message: 'Vendor updated successfully.'
        });
    } catch (error) {
        return handleDatabaseError(error, res);
    }
};

// Delete a vendor.
const deleteVendor = async (req, res) => {
    const { id } = req.params;

    if (!validateVendorId(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid vendor ID.'
        });
    }

    try {
        const existingVendor = await vendorModel.getVendorById(id);

        if (!existingVendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found.'
            });
        }

        await vendorModel.deleteVendor(id);

        return res.status(200).json({
            success: true,
            message: 'Vendor deleted successfully.'
        });
    } catch (error) {
        return handleDatabaseError(error, res);
    }
};

module.exports = {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    deleteVendor
};
