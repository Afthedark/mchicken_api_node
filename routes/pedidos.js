const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');

// Endpoint para obtener los pedidos
router.get('/', pedidosController.obtenerPedidos);

module.exports = router;