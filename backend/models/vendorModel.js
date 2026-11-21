
const { pool } = require('../config/db');

// Register a new vendor.
const createVendor = async (vendorData) => {
    const { vendor_name, phone_number, location, registration_date } = vendorData;

    const [result] = await pool.execute(
        `INSERT INTO vendors
         (vendor_name, phone_number, location, registration_date)
         VALUES (?, ?, ?, ?)`,
        [vendor_name, phone_number, location, registration_date]
    );

    return result.insertId;
};

// Retrieve all vendors.
const getAllVendors = async () => {
    const [rows] = await pool.execute(
        'SELECT * FROM vendors ORDER BY vendor_id DESC'
    );

    return rows;
};

// Retrieve one vendor by ID.
const getVendorById = async (id) => {
    const [rows] = await pool.execute(
        'SELECT * FROM vendors WHERE vendor_id = ?',
        [id]
    );

    return rows[0];
};

// Update an existing vendor.
const updateVendor = async (id, vendorData) => {
    const { vendor_name, phone_number, location, registration_date } = vendorData;

    const [result] = await pool.execute(
        `UPDATE vendors
         SET vendor_name = ?, phone_number = ?, location = ?, registration_date = ?
         WHERE vendor_id = ?`,
        [vendor_name, phone_number, location, registration_date, id]
    );

    return result.affectedRows;
};

// Delete a vendor.
const deleteVendor = async (id) => {
    const [result] = await pool.execute(
        'DELETE FROM vendors WHERE vendor_id = ?',
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    deleteVendor
};
