
const fruitModel = require('../models/fruitModel');

// Permitted fruit statuses.
const allowedStatuses = ['AVAILABLE', 'UNAVAILABLE'];

// Validate fruit information.
const validateFruitData = (data, isUpdate = false) => {

    if (!data.fruit_name || typeof data.fruit_name !== 'string' || !data.fruit_name.trim()) {
        return 'Fruit name is required and must be valid text.';
    }

    if (data.fruit_name.trim().length > 50) {
        return 'Fruit name cannot exceed 50 characters.';
    }

    if (
        data.description !== undefined &&
        data.description !== null &&
        typeof data.description !== 'string'
    ) {
        return 'Description must be valid text.';
    }

    if (data.status !== undefined && !allowedStatuses.includes(data.status)) {
        return 'Status must be AVAILABLE or UNAVAILABLE.';
    }

    if (isUpdate && !data.status) {
        return 'Status is required when updating a fruit.';
    }

    return null;
};

// Handle database errors.
const handleDatabaseError = (res, error) => {
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'This fruit name is already registered.'
        });
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
            success: false,
            message: 'This fruit cannot be deleted because it is referenced by existing records.'
        });
    }

    console.error('Fruit database error:', error.message);

    return res.status(500).json({
        success: false,
        message: 'An internal server error occurred.'
    });
};

// Register a new fruit.
const createFruit = async (req, res) => {
    try {
        const validationError = validateFruitData(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const fruitId = await fruitModel.createFruit({
            ...req.body,
            fruit_name: req.body.fruit_name.trim()
        });

        return res.status(201).json({
            success: true,
            message: 'Fruit registered successfully.',
            fruit_id: fruitId
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

// Retrieve all fruits.
const getAllFruits = async (req, res) => {
    try {
        const fruits = await fruitModel.getAllFruits();

        return res.status(200).json({
            success: true,
            count: fruits.length,
            data: fruits
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

// Retrieve one fruit.
const getFruitById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fruit ID.'
            });
        }

        const fruit = await fruitModel.getFruitById(id);

        if (!fruit) {
            return res.status(404).json({
                success: false,
                message: 'Fruit not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: fruit
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

// Update a fruit.
const updateFruit = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fruit ID.'
            });
        }

        const validationError = validateFruitData(req.body, true);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const existingFruit = await fruitModel.getFruitById(id);

        if (!existingFruit) {
            return res.status(404).json({
                success: false,
                message: 'Fruit not found.'
            });
        }

        await fruitModel.updateFruit(id, {
            ...req.body,
            fruit_name: req.body.fruit_name.trim()
        });

        return res.status(200).json({
            success: true,
            message: 'Fruit updated successfully.'
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

// Delete a fruit.
const deleteFruit = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fruit ID.'
            });
        }

        const existingFruit = await fruitModel.getFruitById(id);

        if (!existingFruit) {
            return res.status(404).json({
                success: false,
                message: 'Fruit not found.'
            });
        }

        await fruitModel.deleteFruit(id);

        return res.status(200).json({
            success: true,
            message: 'Fruit deleted successfully.'
        });

    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

module.exports = {
    createFruit,
    getAllFruits,
    getFruitById,
    updateFruit,
    deleteFruit
};
