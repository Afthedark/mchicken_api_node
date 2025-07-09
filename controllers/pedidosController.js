const db = require('../config/db');

const pedidosController = {
    obtenerPedidos: (req, res) => {
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
        
        // Nueva consulta SQL con subconsultas para productos, cantidades, llevar y observaciones por pedido
        const sqlQuery = `
        SELECT 
            c.nombre_razon_social AS cliente,
            lf.producto,
            p.fecha,
            lf.cantidad,
            lf.llevar,
            f.factura_id AS 'Factura ID',
            p.estado,
            p.observaciones AS 'observacion general',
            lp.observaciones_por_pedido
        FROM 
            pv_mchicken.pedidos p
        JOIN 
            pv_mchicken.clientes c ON p.cliente_id = c.cliente_id
        LEFT JOIN 
            pv_mchicken.facturas f ON p.pedido_id = f.pedido_id
        LEFT JOIN (
            SELECT 
                factura_id,
                GROUP_CONCAT(i.descripcion SEPARATOR ', ') AS producto,
                GROUP_CONCAT(lpf.cantidad SEPARATOR ', ') AS cantidad,
                MAX(lpf.llevar) AS llevar
            FROM 
                pv_mchicken.lin_facturas lpf
            LEFT JOIN 
                pv_mchicken.items i ON lpf.item_id = i.item_id
            GROUP BY 
                lpf.factura_id
        ) lf ON f.factura_id = lf.factura_id
        LEFT JOIN (
            SELECT 
                pedido_id,
                NULLIF(TRIM(BOTH FROM GROUP_CONCAT(DISTINCT observaciones SEPARATOR ' | ')), '') AS observaciones_por_pedido
            FROM 
                pv_mchicken.lin_pedidos
            GROUP BY 
                pedido_id
        ) lp ON p.pedido_id = lp.pedido_id
        WHERE 
            ${whereClause}
        ORDER BY
            p.fecha ASC;`;
        
        db.query(sqlQuery, params, (err, results) => {
            if (err) {
                console.error('Error al obtener pedidos:', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            res.json({ pedidos: results });
        });
    }
};

module.exports = pedidosController;