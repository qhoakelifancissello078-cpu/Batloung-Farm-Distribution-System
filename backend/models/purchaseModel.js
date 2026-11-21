
const { pool } = require('../config/db');

const createPurchase = async (supplierId, items) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let totalAmount = 0;

        items.forEach(item => {
            totalAmount += item.quantity * item.unit_cost;
        });

        const purchaseSql = `
            INSERT INTO purchases (supplier_id, total_amount)
            VALUES (?, ?)
        `;

        const [purchaseResult] = await connection.execute(
            purchaseSql,
            [supplierId, totalAmount]
        );

        const purchaseId = purchaseResult.insertId;

        for (const item of items) {

            const detailSql = `
                INSERT INTO purchase_details
                (purchase_id, fruit_id, quantity, unit_cost, packaging_size)
                VALUES (?, ?, ?, ?, ?)
            `;

            await connection.execute(detailSql, [
                purchaseId,
                item.fruit_id,
                item.quantity,
                item.unit_cost,
                item.packaging_size
            ]);

            const stockSql = `
                UPDATE stock
                SET available_quantity = available_quantity + ?
                WHERE fruit_id = ? AND packaging_size = ?
            `;

            const [stockResult] = await connection.execute(stockSql, [
                item.quantity,
                item.fruit_id,
                item.packaging_size
            ]);

            if (stockResult.affectedRows === 0) {
                throw new Error(
                    `Stock record not found for fruit ID ${item.fruit_id} and packaging size ${item.packaging_size}.`
                );
            }
        }

        await connection.commit();

        return purchaseId;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};

const getAllPurchases = async () => {
    const sql = `
        SELECT
            p.purchase_id,
            p.supplier_id,
            s.business_name AS supplier_name,
            p.purchase_date,
            p.total_amount,
            (
                SELECT COUNT(*)
                FROM purchase_details pd
                WHERE pd.purchase_id = p.purchase_id
            ) AS total_items
        FROM purchases p
        INNER JOIN suppliers s
            ON p.supplier_id = s.supplier_id
        ORDER BY p.purchase_date DESC
    `;

    const [rows] = await pool.execute(sql);
    return rows;
};

const getPurchaseById = async (purchaseId) => {

    // Retrieve the main purchase information
    const purchaseSql = `
        SELECT
            p.purchase_id,
            p.supplier_id,
            s.business_name AS supplier_name,
            p.purchase_date,
            p.total_amount
        FROM purchases p
        INNER JOIN suppliers s
            ON p.supplier_id = s.supplier_id
        WHERE p.purchase_id = ?
    `;

    const [purchaseRows] = await pool.execute(
        purchaseSql,
        [purchaseId]
    );

    if (purchaseRows.length === 0) {
        return null;
    }

    // Retrieve all items belonging to this purchase
    const detailsSql = `
        SELECT
            pd.purchase_detail_id,
            pd.fruit_id,
            f.fruit_name,
            pd.quantity,
            pd.unit_cost,
            pd.packaging_size
        FROM purchase_details pd
        INNER JOIN fruits f
            ON pd.fruit_id = f.fruit_id
        WHERE pd.purchase_id = ?
    `;

    const [detailsRows] = await pool.execute(
        detailsSql,
        [purchaseId]
    );

    return {
        ...purchaseRows[0],
        items: detailsRows
    };
};

module.exports = {
    createPurchase,
    getAllPurchases,
    getPurchaseById
};