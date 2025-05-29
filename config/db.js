const mysql = require('mysql');

const db = mysql.createConnection({
    host: '192.168.10.217', // Aqui va el ip de la maquina central, la otra computadora
    user: 'rootdos', // usuario dos 
    password: 'rootdos',
    database: 'pv_mchicken',
    port: 3308
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conexión exitosa a la base de datos, porfavor no cierre esta ventana solo minimice.');
});

module.exports = db;