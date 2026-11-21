
const express = require('express');
const router = express.Router();

const stockController = require('../controllers/stockController');

router.get('/', stockController.getAllStock);

router.get('/fruit/:fruitId', stockController.getStockByFruitId);

router.put('/:id/add', stockController.addStockQuantity);

router.put('/:id/set', stockController.setStockQuantity);

router.get('/:id', stockController.getStockById);

module.exports = router;
