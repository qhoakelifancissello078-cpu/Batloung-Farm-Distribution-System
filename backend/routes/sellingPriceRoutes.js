
const express = require('express');
const router = express.Router();

const sellingPriceController = require('../controllers/sellingPriceController');

router.post('/', sellingPriceController.createSellingPrice);

router.get('/', sellingPriceController.getAllSellingPrices);

router.get('/fruit/:fruitId', sellingPriceController.getSellingPricesByFruit);

router.put('/:id', sellingPriceController.updateSellingPrice);

module.exports = router;
