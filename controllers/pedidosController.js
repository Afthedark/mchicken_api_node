const db = require('../config/db');

const pedidosController = {
    obtenerPedidos: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        
        // Consulta para obtener los pedidos paginados
        const sqlQuery = `
        SELECT 
            c.nombre_razon_social AS cliente,
            i.descripcion AS producto,
            p.fecha,
            lpf.cantidad AS cantidad,
            lpf.precio_unitario AS precio,
            lpf.total AS total,
            p.estado
        FROM 
            pv_mchicken.pedidos p
        JOIN 
            pv_mchicken.clientes c ON p.cliente_id = c.cliente_id
        LEFT JOIN 
            pv_mchicken.facturas f ON p.pedido_id = f.pedido_id
        LEFT JOIN 
            pv_mchicken.lin_facturas lpf ON f.factura_id = lpf.factura_id
        LEFT JOIN 
            pv_mchicken.items i ON lpf.item_id = i.item_id
        WHERE 
            p.estado = 'CONCLUIDO'
        ORDER BY
            p.fecha DESC
        LIMIT ${limit} OFFSET ${offset};
        `;
        
        // Consulta para contar el total de pedidos
        const countQuery = `
        SELECT COUNT(*) as total 
        FROM pv_mchicken.pedidos p
        WHERE p.estado = 'CONCLUIDO';
        `;

        db.query(countQuery, (err, countResult) => {
            if (err) {
                console.error('Error al contar pedidos:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            const totalItems = countResult[0].total;
            const totalPages = Math.ceil(totalItems / limit);
            
            db.query(sqlQuery, (err, results) => {
                if (err) {
                    console.error('Error al obtener pedidos:', err);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }
                res.json({
                    pedidos: results,
                    totalPages: totalPages
                });
            });
        });
    }
};

module.exports = pedidosController;