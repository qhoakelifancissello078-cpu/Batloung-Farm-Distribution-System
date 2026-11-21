
const purchaseModel = require('../models/purchaseModel');
const { pool } = require('../config/db');

const allowedPackagingSizes = ['SMALL', 'MEDIUM', 'LARGE'];

// Create a new purchase
const createPurchase = async (req, res) => {
    try {
        const { supplier_id, items } = req.body;

        // Validate supplier ID
        if (!Number.isInteger(supplier_id) || supplier_id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid supplier ID is required.'
            });
        }

        // Validate purchase items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one purchase item is required.'
            });
        }

        // Check whether supplier exists
        const [suppliers] = await pool.execute(
            'SELECT supplier_id FROM suppliers WHERE supplier_id = ?',
            [supplier_id]
        );

        if (suppliers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found.'
            });
        }

        // Validate each purchase item
        for (const item of items) {

            if (
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

            if (
                typeof item.unit_cost !== 'number' ||
                !Number.isFinite(item.unit_cost) ||
                item.unit_cost < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have a valid non-negative unit cost.'
                });
            }

            if (!allowedPackagingSizes.includes(item.packaging_size)) {
                return res.status(400).json({
                    success: false,
                    message: 'Packaging size must be SMALL, MEDIUM or LARGE.'
                });
            }

            // Check whether fruit exists and is available
            const [fruits] = await pool.execute(
                'SELECT fruit_id, status FROM fruits WHERE fruit_id = ?',
                [item.fruit_id]
            );

            if (fruits.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Fruit with ID ${item.fruit_id} not found.`
                });
            }

            if (fruits[0].status !== 'AVAILABLE') {
                return res.status(409).json({
                    success: false,
                    message: `Fruit with ID ${item.fruit_id} is currently unavailable for purchase.`
                });
            }
        }

        // Record the purchase
        const purchaseId = await purchaseModel.createPurchase(
            supplier_id,
            items
        );

        // Retrieve the completed purchase
        const purchase = await purchaseModel.getPurchaseById(purchaseId);

        return res.status(201).json({
            success: true,
            message: 'Purchase recorded successfully and stock updated.',
            data: purchase
        });

    } catch (error) {
        console.error('Create purchase error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while recording the purchase.'
        });
    }
};


// Get all purchases
const getAllPurchases = async (req, res) => {
    try {
        const purchases = await purchaseModel.getAllPurchases();

        return res.status(200).json({
            success: true,
            count: purchases.length,
            data: purchases
        });

    } catch (error) {
        console.error('Get purchases error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving purchases.'
        });
    }
};


// Get one purchase by ID
const getPurchaseById = async (req, res) => {
    try {
        const purchaseId = Number(req.params.id);

        if (!Number.isInteger(purchaseId) || purchaseId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid purchase ID.'
            });
        }

        const purchase = await purchaseModel.getPurchaseById(purchaseId);

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: purchase
        });

    } catch (error) {
        console.error('Get purchase error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving the purchase.'
        });
    }
};


module.exports = {
    createPurchase,
    getAllPurchases,
    getPurchaseById
};
