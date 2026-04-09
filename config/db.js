const mysql = require('mysql');

const db = mysql.createConnection({
    host: '172.21.22.248', // Aqui va el ip de la maquina central, la otra computadora o usar localhost si es la misma maquina
    user: 'root', // usuario dos 
    password: 'alfi',
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