
const sellingPriceModel = require('../models/sellingPriceModel');
const { pool } = require('../config/db');

const allowedPackagingSizes = ['SMALL', 'MEDIUM', 'LARGE'];


// Create a selling price.
const createSellingPrice = async (req, res) => {
    try {
        const { fruit_id, packaging_size, selling_price } = req.body;

        // Validate fruit ID.
        if (!Number.isInteger(fruit_id) || fruit_id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid fruit ID is required.'
            });
        }

        // Validate packaging size.
        if (!allowedPackagingSizes.includes(packaging_size)) {
            return res.status(400).json({
                success: false,
                message: 'Packaging size must be SMALL, MEDIUM or LARGE.'
            });
        }

        // Validate selling price.
        if (
            typeof selling_price !== 'number' ||
            !Number.isFinite(selling_price) ||
            selling_price <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Selling price must be a positive number.'
            });
        }

        // Check whether fruit exists.
        const [fruits] = await pool.execute(
            'SELECT fruit_id FROM fruits WHERE fruit_id = ?',
            [fruit_id]
        );

        if (fruits.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fruit not found.'
            });
        }

        const priceId = await sellingPriceModel.createSellingPrice({
            fruit_id,
            packaging_size,
            selling_price
        });

        const price = await sellingPriceModel.getSellingPriceById(priceId);

        return res.status(201).json({
            success: true,
            message: 'Selling price created successfully.',
            data: price
        });

    } catch (error) {
        console.error('Create selling price error:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'A selling price already exists for this fruit and packaging size.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the selling price.'
        });
    }
};


// Retrieve all selling prices.
const getAllSellingPrices = async (req, res) => {
    try {
        const prices = await sellingPriceModel.getAllSellingPrices();

        return res.status(200).json({
            success: true,
            count: prices.length,
            data: prices
        });

    } catch (error) {
        console.error('Get selling prices error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving selling prices.'
        });
    }
};


// Retrieve selling prices for one fruit.
const getSellingPricesByFruit = async (req, res) => {
    try {
        const fruitId = Number(req.params.fruitId);

        if (!Number.isInteger(fruitId) || fruitId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fruit ID.'
            });
        }

        const [fruits] = await pool.execute(
            'SELECT fruit_id FROM fruits WHERE fruit_id = ?',
            [fruitId]
        );

        if (fruits.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fruit not found.'
            });
        }

        const prices = await sellingPriceModel.getSellingPricesByFruit(fruitId);

        return res.status(200).json({
            success: true,
            count: prices.length,
            data: prices
        });

    } catch (error) {
        console.error('Get fruit selling prices error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving fruit selling prices.'
        });
    }
};


// Update an existing selling price.
const updateSellingPrice = async (req, res) => {
    try {
        const priceId = Number(req.params.id);
        const { selling_price } = req.body;

        if (!Number.isInteger(priceId) || priceId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid selling price ID.'
            });
        }

        if (
            typeof selling_price !== 'number' ||
            !Number.isFinite(selling_price) ||
            selling_price <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Selling price must be a positive number.'
            });
        }

        const existingPrice = await sellingPriceModel.getSellingPriceById(priceId);

        if (!existingPrice) {
            return res.status(404).json({
                success: false,
                message: 'Selling price not found.'
            });
        }

        await sellingPriceModel.updateSellingPrice(priceId, selling_price);

        const updatedPrice = await sellingPriceModel.getSellingPriceById(priceId);

        return res.status(200).json({
            success: true,
            message: 'Selling price updated successfully.',
            data: updatedPrice
        });

    } catch (error) {
        console.error('Update selling price error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating the selling price.'
        });
    }
};


module.exports = {
    createSellingPrice,
    getAllSellingPrices,
    getSellingPricesByFruit,
    updateSellingPrice
};
