
const { pool } = require('../config/db');

// Register a new fruit and automatically create its stock records.
const createFruit = async (fruitData) => {
    const { fruit_name, description, status } = fruitData;

    const connection = await pool.getConnection();

    try {
        // Start a database transaction.
        await connection.beginTransaction();

        // Insert the new fruit.
        const [result] = await connection.execute(
            `INSERT INTO fruits (fruit_name, description, status)
             VALUES (?, ?, ?)`,
            [fruit_name, description || null, status || 'AVAILABLE']
        );

        const fruitId = result.insertId;

        // Create stock records for all three packaging sizes.
        const stockSql = `
            INSERT INTO stock (fruit_id, packaging_size, available_quantity)
            VALUES
                (?, 'SMALL', 0),
                (?, 'MEDIUM', 0),
                (?, 'LARGE', 0)
        `;

        await connection.execute(stockSql, [
            fruitId,
            fruitId,
            fruitId
        ]);

        // Save both the fruit and its stock records.
        await connection.commit();

        return fruitId;

    } catch (error) {
        // Undo changes if any operation fails.
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};


// Retrieve all fruits.
const getAllFruits = async () => {
    const [rows] = await pool.execute(
        'SELECT * FROM fruits ORDER BY fruit_id DESC'
    );

    return rows;
};


// Retrieve one fruit by ID.
const getFruitById = async (id) => {
    const [rows] = await pool.execute(
        'SELECT * FROM fruits WHERE fruit_id = ?',
        [id]
    );

    return rows[0];
};


// Update an existing fruit.
const updateFruit = async (id, fruitData) => {
    const { fruit_name, description, status } = fruitData;

    const [result] = await pool.execute(
        `UPDATE fruits
         SET fruit_name = ?, description = ?, status = ?
         WHERE fruit_id = ?`,
        [fruit_name, description || null, status, id]
    );

    return result.affectedRows;
};


// Delete a fruit.
const deleteFruit = async (id) => {
    const [result] = await pool.execute(
        'DELETE FROM fruits WHERE fruit_id = ?',
        [id]
    );

    return result.affectedRows;
};


module.exports = {
    createFruit,
    getAllFruits,
    getFruitById,
    updateFruit,
    deleteFruit
};
