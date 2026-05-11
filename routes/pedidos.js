const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');


// Endpoint para obtener todos los pedidos
router.get('/', pedidosController.obtenerPedidos);

// Endpoint para obtener solo los pedidos del día de hoy
router.get('/hoy', pedidosController.obtenerPedidosHoy);

module.exports = router;