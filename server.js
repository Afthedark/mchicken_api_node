const express = require('express');
const cors = require('cors');
const pedidosRouter = require('./routes/pedidos');
const app = express();
const port = 3000;

// Configuración del servidor
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rutas
app.use('/pedidos', pedidosRouter);



// Servir archivos estáticos
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});