
const { pool } = require('../config/db');

// Record a sale and deduct stock within one database transaction.
const createSale = async (vendorId, items) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let totalAmountInCents = 0;
        const processedItems = [];

        // Validate availability, retrieve prices and lock stock records.
        for (const item of items) {
            const [fruits] = await connection.execute(
                `SELECT fruit_id, fruit_name, status
                 FROM fruits
                 WHERE fruit_id = ?
                 FOR UPDATE`,
                [item.fruit_id]
            );

            if (fruits.length === 0) {
                throw new Error(
                    `Fruit with ID ${item.fruit_id} not found.`
                );
            }

            if (fruits[0].status !== 'AVAILABLE') {
                throw new Error(
                    `${fruits[0].fruit_name} is currently unavailable for sale.`
                );
            }

            const [prices] = await connection.execute(
                `SELECT selling_price
                 FROM selling_prices
                 WHERE fruit_id = ? AND packaging_size = ?`,
                [item.fruit_id, item.packaging_size]
            );

            if (prices.length === 0) {
                throw new Error(
                    `Selling price not configured for ${fruits[0].fruit_name} (${item.packaging_size}).`
                );
            }

            const [stockRows] = await connection.execute(
                `SELECT stock_id, available_quantity
                 FROM stock
                 WHERE fruit_id = ? AND packaging_size = ?
                 FOR UPDATE`,
                [item.fruit_id, item.packaging_size]
            );

            if (stockRows.length === 0) {
                throw new Error(
                    `Stock record not found for ${fruits[0].fruit_name} (${item.packaging_size}).`
                );
            }

            if (stockRows[0].available_quantity < item.quantity) {
                throw new Error(
                    `Insufficient stock for ${fruits[0].fruit_name} (${item.packaging_size}). Available: ${stockRows[0].available_quantity}, requested: ${item.quantity}.`
                );
            }

            const unitPriceInCents = Math.round(
                Number(prices[0].selling_price) * 100
            );

            totalAmountInCents += unitPriceInCents * item.quantity;

            processedItems.push({
                fruit_id: item.fruit_id,
                fruit_name: fruits[0].fruit_name,
                packaging_size: item.packaging_size,
                quantity: item.quantity,
                unit_price: unitPriceInCents / 100,
                stock_id: stockRows[0].stock_id
            });
        }

        const totalAmount = totalAmountInCents / 100;

        // Create the main sale record.
        const [saleResult] = await connection.execute(
            `INSERT INTO sales (vendor_id, total_amount)
             VALUES (?, ?)`,
            [vendorId, totalAmount]
        );

        const saleId = saleResult.insertId;

        // Save sale details and deduct stock.
        for (const item of processedItems) {
            await connection.execute(
                `INSERT INTO sales_details
                 (sale_id, fruit_id, packaging_size, quantity, unit_price)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    saleId,
                    item.fruit_id,
                    item.packaging_size,
                    item.quantity,
                    item.unit_price
                ]
            );

            const [stockResult] = await connection.execute(
                `UPDATE stock
                 SET available_quantity = available_quantity - ?
                 WHERE stock_id = ?
                 AND available_quantity >= ?`,
                [
                    item.quantity,
                    item.stock_id,
                    item.quantity
                ]
            );

            if (stockResult.affectedRows === 0) {
                throw new Error(
                    `Stock deduction failed for ${item.fruit_name}.`
                );
            }
        }

        await connection.commit();

        return saleId;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};


// Retrieve all sales.
const getAllSales = async () => {
    const [rows] = await pool.execute(
        `SELECT
            s.sale_id,
            s.vendor_id,
            v.vendor_name,
            s.sale_date,
            s.payment_status,
            s.total_amount,
            (
                SELECT COUNT(*)
                FROM sales_details sd
                WHERE sd.sale_id = s.sale_id
            ) AS total_items
         FROM sales s
         INNER JOIN vendors v ON s.vendor_id = v.vendor_id
         ORDER BY s.sale_date DESC`
    );

    return rows;
};


// Retrieve one sale with all its items.
const getSaleById = async (saleId) => {
    const [saleRows] = await pool.execute(
        `SELECT
            s.sale_id,
            s.vendor_id,
            v.vendor_name,
            s.sale_date,
            s.payment_status,
            s.total_amount
         FROM sales s
         INNER JOIN vendors v ON s.vendor_id = v.vendor_id
         WHERE s.sale_id = ?`,
        [saleId]
    );

    if (saleRows.length === 0) {
        return null;
    }

    const [detailRows] = await pool.execute(
        `SELECT
            sd.sales_detail_id,
            sd.fruit_id,
            f.fruit_name,
            sd.packaging_size,
            sd.quantity,
            sd.unit_price,
            (sd.quantity * sd.unit_price) AS subtotal
         FROM sales_details sd
         INNER JOIN fruits f ON sd.fruit_id = f.fruit_id
         WHERE sd.sale_id = ?`,
        [saleId]
    );

    return {
        ...saleRows[0],
        items: detailRows
    };
};


module.exports = {
    createSale,
    getAllSales,
    getSaleById
};
