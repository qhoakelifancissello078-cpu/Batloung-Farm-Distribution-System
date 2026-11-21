
const { pool } = require('../config/db');

// Add a selling price.
const createSellingPrice = async (priceData) => {
    const { fruit_id, packaging_size, selling_price } = priceData;

    const [result] = await pool.execute(
        `INSERT INTO selling_prices
         (fruit_id, packaging_size, selling_price)
         VALUES (?, ?, ?)`,
        [fruit_id, packaging_size, selling_price]
    );

    return result.insertId;
};


// Retrieve all selling prices.
const getAllSellingPrices = async () => {
    const [rows] = await pool.execute(
        `SELECT
            sp.price_id,
            sp.fruit_id,
            f.fruit_name,
            sp.packaging_size,
            sp.selling_price
         FROM selling_prices sp
         INNER JOIN fruits f ON sp.fruit_id = f.fruit_id
         ORDER BY f.fruit_name, sp.packaging_size`
    );

    return rows;
};


// Retrieve selling prices for one fruit.
const getSellingPricesByFruit = async (fruitId) => {
    const [rows] = await pool.execute(
        `SELECT
            sp.price_id,
            sp.fruit_id,
            f.fruit_name,
            sp.packaging_size,
            sp.selling_price
         FROM selling_prices sp
         INNER JOIN fruits f ON sp.fruit_id = f.fruit_id
         WHERE sp.fruit_id = ?
         ORDER BY sp.packaging_size`,
        [fruitId]
    );

    return rows;
};


// Retrieve one selling price by ID.
const getSellingPriceById = async (priceId) => {
    const [rows] = await pool.execute(
        `SELECT
            sp.price_id,
            sp.fruit_id,
            f.fruit_name,
            sp.packaging_size,
            sp.selling_price
         FROM selling_prices sp
         INNER JOIN fruits f ON sp.fruit_id = f.fruit_id
         WHERE sp.price_id = ?`,
        [priceId]
    );

    return rows[0];
};


// Update a selling price.
const updateSellingPrice = async (priceId, sellingPrice) => {
    const [result] = await pool.execute(
        `UPDATE selling_prices
         SET selling_price = ?
         WHERE price_id = ?`,
        [sellingPrice, priceId]
    );

    return result.affectedRows;
};


module.exports = {
    createSellingPrice,
    getAllSellingPrices,
    getSellingPricesByFruit,
    getSellingPriceById,
    updateSellingPrice
};
