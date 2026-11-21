
const express = require('express');
const router = express.Router();

const fruitController = require('../controllers/fruitController');

router.post('/', fruitController.createFruit);

router.get('/', fruitController.getAllFruits);

router.get('/:id', fruitController.getFruitById);

router.put('/:id', fruitController.updateFruit);

router.delete('/:id', fruitController.deleteFruit);

module.exports = router;
