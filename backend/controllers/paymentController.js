
const paymentModel = require('../models/paymentModel');
const { pool } = require('../config/db');

const allowedPaymentMethods = [
    'CASH',
    'MOBILE_MONEY',
    'CREDIT'
];


// Record a payment.
const createPayment = async (req, res) => {
    try {
        const {
            sale_id,
            payment_method,
            amount_paid,
            reference_number
        } = req.body;

        // Validate sale ID.
        if (!Number.isInteger(sale_id) || sale_id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid sale ID is required.'
            });
        }

        // Validate payment method.
        if (!allowedPaymentMethods.includes(payment_method)) {
            return res.status(400).json({
                success: false,
                message: 'Payment method must be CASH, MOBILE_MONEY or CREDIT.'
            });
        }

        // Validate payment amount.
        if (
            typeof amount_paid !== 'number' ||
            !Number.isFinite(amount_paid) ||
            amount_paid <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Payment amount must be a positive number.'
            });
        }

        // Validate optional reference number.
        if (
            reference_number !== undefined &&
            reference_number !== null &&
            (
                typeof reference_number !== 'string' ||
                reference_number.trim() === '' ||
                reference_number.length > 100
            )
        ) {
            return res.status(400).json({
                success: false,
                message: 'Reference number must be a non-empty string of up to 100 characters.'
            });
        }

        // Check whether the sale exists.
        const [sales] = await pool.execute(
            'SELECT sale_id FROM sales WHERE sale_id = ?',
            [sale_id]
        );

        if (sales.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found.'
            });
        }

        // Record the payment.
        const paymentId = await paymentModel.createPayment(
            sale_id,
            payment_method,
            amount_paid,
            reference_number
        );

        // Retrieve the saved payment.
        const payment = await paymentModel.getPaymentById(paymentId);

        return res.status(201).json({
            success: true,
            message: 'Payment recorded successfully.',
            data: payment
        });

    } catch (error) {
        console.error('Create payment error:', error.message);

        if (error.message === 'Sale not found.') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('exceeds the outstanding balance')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while recording the payment.'
        });
    }
};


// Retrieve all payments.
const getAllPayments = async (req, res) => {
    try {
        const payments = await paymentModel.getAllPayments();

        return res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });

    } catch (error) {
        console.error('Get payments error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving payments.'
        });
    }
};


// Retrieve payments for a particular sale.
const getPaymentsBySale = async (req, res) => {
    try {
        const saleId = Number(req.params.saleId);

        if (!Number.isInteger(saleId) || saleId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale ID.'
            });
        }

        const [sales] = await pool.execute(
            'SELECT sale_id FROM sales WHERE sale_id = ?',
            [saleId]
        );

        if (sales.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found.'
            });
        }

        const payments = await paymentModel.getPaymentsBySale(saleId);

        return res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });

    } catch (error) {
        console.error('Get sale payments error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving sale payments.'
        });
    }
};


// Retrieve one payment by ID.
const getPaymentById = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);

        if (!Number.isInteger(paymentId) || paymentId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment ID.'
            });
        }

        const payment = await paymentModel.getPaymentById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: payment
        });

    } catch (error) {
        console.error('Get payment error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving the payment.'
        });
    }
};


module.exports = {
    createPayment,
    getAllPayments,
    getPaymentsBySale,
    getPaymentById
};
