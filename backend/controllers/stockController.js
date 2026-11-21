
const stockModel = require('../models/stockModel');

// Get all stock records
const getAllStock = async (req, res) => {
    try {
        const stock = await stockModel.getAllStock();

        res.status(200).json({
            success: true,
            count: stock.length,
            data: stock
        });
    } catch (error) {
        console.error('Error retrieving stock:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve stock.'
        });
    }
};

// Get stock records for a specific fruit
const getStockByFruitId = async (req, res) => {
    try {
        const fruitId = Number(req.params.fruitId);

        if (!Number.isInteger(fruitId) || fruitId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fruit ID.'
            });
        }

        const stock = await stockModel.getStockByFruitId(fruitId);

        if (stock.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No stock records found for this fruit.'
            });
        }

        res.status(200).json({
            success: true,
            count: stock.length,
            data: stock
        });
    } catch (error) {
        console.error('Error retrieving fruit stock:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fruit stock.'
        });
    }
};

// Get one stock record by stock ID
const getStockById = async (req, res) => {
    try {
        const stockId = Number(req.params.id);

        if (!Number.isInteger(stockId) || stockId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid stock ID.'
            });
        }

        const stock = await stockModel.getStockById(stockId);

        if (!stock) {
            return res.status(404).json({
                success: false,
                message: 'Stock record not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: stock
        });
    } catch (error) {
        console.error('Error retrieving stock record:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve stock record.'
        });
    }
};


 // Add incoming stock quantity
const addStockQuantity = async (req, res) => {
    try {
        const stockId = Number(req.params.id);
        const { quantity } = req.body;

        if (!Number.isInteger(stockId) || stockId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid stock ID.'
            });
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be a positive whole number.'
            });
        }

        const existingStock = await stockModel.getStockById(stockId);

        if (!existingStock) {
            return res.status(404).json({
                success: false,
                message: 'Stock record not found.'
            });
        }

        await stockModel.addStockQuantity(stockId, quantity);

        const updatedStock = await stockModel.getStockById(stockId);

        res.status(200).json({
            success: true,
            message: 'Incoming stock added successfully.',
            data: updatedStock
        });

    } catch (error) {
        console.error('Error adding incoming stock:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to add incoming stock.'
        });
    }
};

const setStockQuantity = async (req, res) => {
    try {
        const stockId = Number(req.params.id);
        const { quantity } = req.body;

        if (!Number.isInteger(stockId) || stockId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid stock ID.'
            });
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be a non-negative whole number.'
            });
        }

        const existingStock = await stockModel.getStockById(stockId);

        if (!existingStock) {
            return res.status(404).json({
                success: false,
                message: 'Stock record not found.'
            });
        }

        await stockModel.setStockQuantity(stockId, quantity);

        const updatedStock = await stockModel.getStockById(stockId);

        res.status(200).json({
            success: true,
            message: 'Stock quantity updated successfully.',
            data: updatedStock
        });

    } catch (error) {
        console.error('Error setting stock quantity:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update stock quantity.'
        });
    }
};

module.exports = {
    getAllStock,
    getStockByFruitId,
    getStockById,
    addStockQuantity,
    setStockQuantity
};
