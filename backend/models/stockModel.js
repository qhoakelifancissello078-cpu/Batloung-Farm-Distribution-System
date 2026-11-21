
const { pool } = require('../config/db');

const getAllStock = async () => {
    const [rows] = await pool.execute(`
        SELECT
            s.stock_id,
            s.fruit_id,
            f.fruit_name,
            s.packaging_size,
            s.available_quantity
        FROM stock s
        INNER JOIN fruits f ON s.fruit_id = f.fruit_id
        ORDER BY f.fruit_name, s.packaging_size
    `);

    return rows;
};

const getStockByFruitId = async (fruitId) => {
    const [rows] = await pool.execute(`
        SELECT
            s.stock_id,
            s.fruit_id,
            f.fruit_name,
            s.packaging_size,
            s.available_quantity
        FROM stock s
        INNER JOIN fruits f ON s.fruit_id = f.fruit_id
        WHERE s.fruit_id = ?
        ORDER BY s.packaging_size
    `, [fruitId]);

    return rows;
};

const getStockById = async (stockId) => {
    const [rows] = await pool.execute(`
        SELECT
            s.stock_id,
            s.fruit_id,
            f.fruit_name,
            s.packaging_size,
            s.available_quantity
        FROM stock s
        INNER JOIN fruits f ON s.fruit_id = f.fruit_id
        WHERE s.stock_id = ?
    `, [stockId]);

    return rows[0];
};

const addStockQuantity = async (stockId, quantity) => {
    const sql = `
        UPDATE stock
        SET available_quantity = available_quantity + ?
        WHERE stock_id = ?
    `;

    const [result] = await pool.execute(sql, [quantity, stockId]);

    return result.affectedRows;
};

const setStockQuantity = async (stockId, quantity) => {
    const sql = `
        UPDATE stock
        SET available_quantity = ?
        WHERE stock_id = ?
    `;

    const [result] = await pool.execute(sql, [quantity, stockId]);

    return result.affectedRows;
};


module.exports = {
    getAllStock,
    getStockByFruitId,
    getStockById,
    addStockQuantity,
    setStockQuantity
};