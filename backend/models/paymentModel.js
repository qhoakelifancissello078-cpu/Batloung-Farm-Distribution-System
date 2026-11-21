
const { pool } = require('../config/db');

// Record a payment and update the sale's payment status.
const createPayment = async (
    saleId,
    paymentMethod,
    amountPaid,
    referenceNumber
) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Lock the sale to prevent simultaneous payments
        // from exceeding its outstanding balance.
        const [sales] = await connection.execute(
            `SELECT sale_id, total_amount
             FROM sales
             WHERE sale_id = ?
             FOR UPDATE`,
            [saleId]
        );

        if (sales.length === 0) {
            throw new Error('Sale not found.');
        }

        // Calculate the amount already paid.
        const [paymentRows] = await connection.execute(
            `SELECT COALESCE(SUM(amount_paid), 0) AS total_paid
             FROM payments
             WHERE sale_id = ?`,
            [saleId]
        );

        // Convert monetary values into cents to avoid
        // floating-point calculation errors.
        const totalAmountInCents = Math.round(
            Number(sales[0].total_amount) * 100
        );

        const totalPaidInCents = Math.round(
            Number(paymentRows[0].total_paid) * 100
        );

        const newPaymentInCents = Math.round(
            Number(amountPaid) * 100
        );

        const outstandingInCents =
            totalAmountInCents - totalPaidInCents;

        // Prevent overpayment.
        if (newPaymentInCents > outstandingInCents) {
            throw new Error(
                `Payment exceeds the outstanding balance. Outstanding: M${(outstandingInCents / 100).toFixed(2)}.`
            );
        }

        // Record the payment.
        const [paymentResult] = await connection.execute(
            `INSERT INTO payments
             (sale_id, payment_method, amount_paid, reference_number)
             VALUES (?, ?, ?, ?)`,
            [
                saleId,
                paymentMethod,
                newPaymentInCents / 100,
                referenceNumber || null
            ]
        );

        // Calculate the updated payment status.
        const updatedTotalPaidInCents =
            totalPaidInCents + newPaymentInCents;

        let paymentStatus = 'UNPAID';

        if (updatedTotalPaidInCents >= totalAmountInCents) {
            paymentStatus = 'PAID';
        } else if (updatedTotalPaidInCents > 0) {
            paymentStatus = 'PARTIALLY_PAID';
        }

        // Update the sale.
        await connection.execute(
            `UPDATE sales
             SET payment_status = ?
             WHERE sale_id = ?`,
            [paymentStatus, saleId]
        );

        await connection.commit();

        return paymentResult.insertId;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
};


// Retrieve all payment records.
const getAllPayments = async () => {
    const [rows] = await pool.execute(
        `SELECT
            p.payment_id,
            p.sale_id,
            p.payment_method,
            p.amount_paid,
            p.payment_date,
            p.reference_number,
            s.total_amount AS sale_total,
            s.payment_status
         FROM payments p
         INNER JOIN sales s ON p.sale_id = s.sale_id
         ORDER BY p.payment_date DESC`
    );

    return rows;
};


// Retrieve payments belonging to one sale.
const getPaymentsBySale = async (saleId) => {
    const [rows] = await pool.execute(
        `SELECT
            payment_id,
            sale_id,
            payment_method,
            amount_paid,
            payment_date,
            reference_number
         FROM payments
         WHERE sale_id = ?
         ORDER BY payment_date DESC`,
        [saleId]
    );

    return rows;
};


// Retrieve one payment by its ID.
const getPaymentById = async (paymentId) => {
    const [rows] = await pool.execute(
        `SELECT
            p.payment_id,
            p.sale_id,
            p.payment_method,
            p.amount_paid,
            p.payment_date,
            p.reference_number,
            s.total_amount AS sale_total,
            s.payment_status
         FROM payments p
         INNER JOIN sales s ON p.sale_id = s.sale_id
         WHERE p.payment_id = ?`,
        [paymentId]
    );

    return rows[0];
};


module.exports = {
    createPayment,
    getAllPayments,
    getPaymentsBySale,
    getPaymentById
};
