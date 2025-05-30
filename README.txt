# Instrucciones para el Proyecto MChicken API

## Requisitos Previos
- Node.js (v16 o superior)
- MySQL (v8.0 o superior)
- Git (opcional)

## Instalación
1. Clonar el repositorio (si aplica)
2. Ejecutar `npm install` para instalar dependencias
3. Configurar la base de datos MySQL con los parámetros en `config/db.js`

## Configuración
1. Editar el archivo `config/db.js` con tus credenciales de MySQL
2. Crear la base de datos `pv_mchicken` e importar el esquema SQL

## Uso
1. Iniciar el servidor manualmente: `node server.js`
2. Para iniciar automáticamente al encender el equipo:
   - Copiar el archivo `start_backend.bat` a la carpeta de inicio de Windows (`C:\Users\[TuUsuario]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`)
   - Al iniciar el equipo, el backend se ejecutará automáticamente

### Acceso Local
- Acceder a la interfaz web en `http://localhost:3000`
- La API estará disponible en `http://localhost:3000/pedidos`

### Acceso desde otras máquinas en la red LAN
1. Obtener la IP de la máquina servidor usando el comando `ipconfig` en la terminal
2. Desde otras máquinas en la misma red, acceder usando:
   - Interfaz web: `http://<IP-DEL-SERVIDOR>:3000`
   - API: `http://<IP-DEL-SERVIDOR>:3000/pedidos`
3. Asegurarse de que:
   - Ambas máquinas estén en la misma red LAN
   - El puerto 3000 no esté bloqueado por el firewall
   - El servidor Node.js esté en ejecución

## Características
- Endpoint GET `/pedidos` para obtener todos los pedidos
- Actualización automática cada 30 segundos
- Paginación de resultados
- Acceso desde múltiples dispositivos en la red local

## Solución de Problemas
- Verificar que MySQL esté corriendo
- Revisar los logs del servidor para errores
- Asegurar que los puertos no estén en uso
- Si no se puede acceder desde otra máquina:
  1. Verificar conexión con `ping <IP-DEL-SERVIDOR>`
  2. Comprobar que el firewall permita conexiones al puerto 3000
  3. Confirmar que ambos dispositivos estén en la misma red