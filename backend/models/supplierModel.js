
const { pool } = require('../config/db');

// 1. Register a new supplier.
const createSupplier = async (supplierData) => {
    const {
        business_name,
        contact_person,
        phone,
        province,
        address
    } = supplierData;

    const sql = `
        INSERT INTO suppliers
        (business_name, contact_person, phone, province, address)
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
        business_name,
        contact_person,
        phone,
        province,
        address
    ]);

    return result.insertId;
};

// 2. Retrieve all suppliers.
const getAllSuppliers = async () => {
    const sql = `
        SELECT *
        FROM suppliers
        ORDER BY supplier_id DESC
    `;

    const [rows] = await pool.execute(sql);

    return rows;
};

// 3. Retrieve one supplier using their ID.
const getSupplierById = async (supplierId) => {
    const sql = `
        SELECT *
        FROM suppliers
        WHERE supplier_id = ?
    `;

    const [rows] = await pool.execute(sql, [supplierId]);

    return rows[0];
};

// 4. Update supplier information.
const updateSupplier = async (supplierId, supplierData) => {
    const {
        business_name,
        contact_person,
        phone,
        province,
        address
    } = supplierData;

    const sql = `
        UPDATE suppliers
        SET business_name = ?,
            contact_person = ?,
            phone = ?,
            province = ?,
            address = ?
        WHERE supplier_id = ?
    `;

    const [result] = await pool.execute(sql, [
        business_name,
        contact_person,
        phone,
        province,
        address,
        supplierId
    ]);

    return result.affectedRows;
};

// 5. Delete a supplier.
const deleteSupplier = async (supplierId) => {
    const sql = `
        DELETE FROM suppliers
        WHERE supplier_id = ?
    `;

    const [result] = await pool.execute(sql, [supplierId]);

    return result.affectedRows;
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
