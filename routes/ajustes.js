const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');

const filtroFilePath = path.join(__dirname, '../data/filtro_productos.json');

// Endpoint para obtener la IP local del servidor
router.get('/ip', (req, res) => {
    const interfaces = os.networkInterfaces();
    let localIp = '127.0.0.1';
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                localIp = alias.address;
                break;
            }
        }
    }
    res.json({ ip: localIp });
});


// Endpoint para obtener los productos a filtrar
router.get('/filtros', (req, res) => {
    fs.readFile(filtroFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo de filtros:', err);
            // Si el archivo no existe, devolver un arreglo vacío
            if (err.code === 'ENOENT') {
                return res.json([]);
            }
            return res.status(500).json({ error: 'Error interno del servidor al leer los filtros' });
        }
        res.json(JSON.parse(data));
    });
});

// Endpoint para guardar/modificar los filtros
router.post('/filtros', (req, res) => {
    const filtros = req.body.filtros; // Debe ser un arreglo de strings
    
    if (!Array.isArray(filtros)) {
        return res.status(400).json({ error: 'El formato proporcionado no es un arreglo válido' });
    }

    fs.writeFile(filtroFilePath, JSON.stringify(filtros, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error al guardar el archivo de filtros:', err);
            return res.status(500).json({ error: 'Error interno del servidor al guardar los filtros' });
        }
        res.json({ success: true, message: 'Filtros guardados correctamente.' });
    });
});

module.exports = router;
