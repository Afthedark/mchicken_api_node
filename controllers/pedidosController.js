const db = require('../config/db');

const pedidosController = {
    obtenerPedidos: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const fechaInicio = req.query.fechaInicio;
        const fechaFin = req.query.fechaFin;
        
        // Construir la cláusula WHERE con los filtros de fecha
        let whereClauses = ["p.estado = 'CONCLUIDO'"];
        let params = [];
        
        if (fechaInicio && fechaFin) {
            whereClauses.push("DATE(p.fecha) BETWEEN ? AND ?");
            params.push(fechaInicio, fechaFin);
        } else if (fechaInicio) {
            whereClauses.push("DATE(p.fecha) >= ?");
            params.push(fechaInicio);
        } else if (fechaFin) {
            whereClauses.push("DATE(p.fecha) <= ?");
            params.push(fechaFin);
        }
        
        const whereClause = whereClauses.join(" AND ");
        
        // Consulta para obtener los pedidos paginados
        const sqlQuery = `
        SELECT 
            c.nombre_razon_social AS cliente,
            GROUP_CONCAT(i.descripcion SEPARATOR ', ') AS producto,
            p.fecha,
            GROUP_CONCAT(lpf.cantidad SEPARATOR ', ') AS cantidad,
            f.factura_id AS 'Factura ID',
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
            ${whereClause}
        GROUP BY
            f.factura_id, c.nombre_razon_social, p.fecha, p.estado
        ORDER BY
            p.fecha DESC
        LIMIT ? OFFSET ?;
        `;
        
        // Agregar los parámetros de limit y offset
        params.push(limit, offset);
        
        // Consulta para contar el total de pedidos
        const countQuery = `
        SELECT COUNT(DISTINCT f.factura_id) as total 
        FROM pv_mchicken.pedidos p
        JOIN pv_mchicken.facturas f ON p.pedido_id = f.pedido_id
        WHERE ${whereClause};
        `;

        db.query(countQuery, params.slice(0, -2), (err, countResult) => {
            if (err) {
                console.error('Error al contar pedidos:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            
            const totalItems = countResult[0].total;
            const totalPages = Math.ceil(totalItems / limit);
            
            db.query(sqlQuery, params, (err, results) => {
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