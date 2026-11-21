
const salesModel = require('../models/salesModel');
const { pool } = require('../config/db');

const allowedPackagingSizes = ['SMALL', 'MEDIUM', 'LARGE'];


// Create a new sale.
const createSale = async (req, res) => {
    try {
        const { vendor_id, items } = req.body;

        // Validate vendor ID.
        if (!Number.isInteger(vendor_id) || vendor_id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid vendor ID is required.'
            });
        }

        // Validate sale items.
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one sale item is required.'
            });
        }

        // Check whether vendor exists.
        const [vendors] = await pool.execute(
            'SELECT vendor_id FROM vendors WHERE vendor_id = ?',
            [vendor_id]
        );

        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found.'
            });
        }

        // Validate each item.
        for (const item of items) {
            if (
                !item ||
                !Number.isInteger(item.fruit_id) ||
                item.fruit_id <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have a valid fruit ID.'
                });
            }

            if (
                !Number.isInteger(item.quantity) ||
                item.quantity <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item quantity must be a positive whole number.'
                });
            }

            if (!allowedPackagingSizes.includes(item.packaging_size)) {
                return res.status(400).json({
                    success: false,
                    message: 'Packaging size must be SMALL, MEDIUM or LARGE.'
                });
            }
        }

        // Record the sale.
        const saleId = await salesModel.createSale(
            vendor_id,
            items
        );

        // Retrieve the completed sale.
        const sale = await salesModel.getSaleById(saleId);

        return res.status(201).json({
            success: true,
            message: 'Sale recorded successfully and stock updated.',
            data: sale
        });

    } catch (error) {
        console.error('Create sale error:', error.message);

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.message.includes('Insufficient stock') ||
            error.message.includes('unavailable for sale') ||
            error.message.includes('Selling price not configured') ||
            error.message.includes('Stock deduction failed')
        ) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while recording the sale.'
        });
    }
};


// Retrieve all sales.
const getAllSales = async (req, res) => {
    try {
        const sales = await salesModel.getAllSales();

        return res.status(200).json({
            success: true,
            count: sales.length,
            data: sales
        });

    } catch (error) {
        console.error('Get sales error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving sales.'
        });
    }
};


// Retrieve one sale by ID.
const getSaleById = async (req, res) => {
    try {
        const saleId = Number(req.params.id);

        if (!Number.isInteger(saleId) || saleId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sale ID.'
            });
        }

        const sale = await salesModel.getSaleById(saleId);

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: sale
        });

    } catch (error) {
        console.error('Get sale error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving the sale.'
        });
    }
};


module.exports = {
    createSale,
    getAllSales,
    getSaleById
};
