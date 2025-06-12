# Instrucciones para el Proyecto MChicken API

## Requisitos Previos
- Node.js (v16 o superior)
- MySQL (v8.0 o superior)
- Git (opcional)

## Instalación
1. El proyecto debe estar ubicado en `C:\mchicken_api_node`
2. Ejecutar `npm install` para instalar dependencias
3. Configurar la base de datos MySQL con los parámetros en `config/db.js`

## Configuración
1. Editar el archivo `config/db.js` con tus credenciales de MySQL
2. Crear la base de datos `pv_mchicken` e importar el esquema SQL
3. Verificar que Node.js esté instalado y en el PATH del sistema
4. El archivo `startup_api_chicken_node.bat` debe estar en la carpeta de inicio de Windows

## Uso con PM2
1. Asegúrate de tener PM2 instalado globalmente:
   ```
   npm install -g pm2
   ```

2. Comandos disponibles:
   - `npm run start` - Inicia la aplicación con PM2
   - `npm run stop` - Detiene la aplicación
   - `npm run restart` - Reinicia la aplicación
   - `npm run logs` - Muestra los logs de la aplicación
   - `npm run status` - Muestra el estado actual de la aplicación
   - `npm run delete` - Elimina la aplicación de PM2

3. Inicio Automático:
   - Se ha incluido un archivo `startup_api_chicken_node.bat` que se instala automáticamente en la carpeta de inicio de Windows
   - El archivo se encuentra en la ruta: `C:\Users\[Usuario]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`
   - Este script verifica automáticamente:
     * La instalación de Node.js
     * La instalación de PM2 (lo instala si falta)
     * Inicia la aplicación usando la configuración de PM2
   - No es necesario hacer nada más para el inicio automático, el sistema se iniciará solo al arrancar Windows

4. Monitoreo:
   - PM2 proporciona monitoreo de memoria y CPU
   - Los logs se almacenan en la carpeta `logs/`
   - `app.log` contiene los logs generales
   - `error.log` contiene los errores

5. Configuración:
   - La configuración de PM2 se encuentra en `ecosystem.config.js`
   - El servidor se ejecuta en modo `fork`
   - Reinicio automático en caso de fallos
   - Límite de memoria: 1GB

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
   - PM2 esté ejecutando el servidor (verificar con `pm2 status`)
4. Para verificar que el servicio está funcionando:
   - Abrir el Administrador de Tareas
   - Buscar procesos de Node.js y PM2
   - Verificar que exista conexión a la base de datos en los logs

## Características
- Endpoint GET `/pedidos` para obtener todos los pedidos
- Actualización automática cada 30 segundos
- Paginación de resultados
- Acceso desde múltiples dispositivos en la red local

## Solución de Problemas
- Verificar que MySQL esté corriendo
- Revisar los logs del servidor en la carpeta `C:\mchicken_api_node\logs\`
- Asegurar que los puertos no estén en uso
- Si la aplicación no inicia automáticamente:
  1. Verificar que `startup_api_chicken_node.bat` esté en la carpeta de inicio
  2. Ejecutar el archivo manualmente para ver posibles errores
  3. Comprobar que la ruta `C:\mchicken_api_node` existe y contiene todos los archivos
- Si la aplicación se reinicia constantemente:
  1. Verificar los logs de error en `logs/error.log`
  2. Comprobar el uso de memoria con `npm run status`
  3. Revisar la conexión a la base de datos
- Si no se puede acceder desde otra máquina:
  1. Verificar conexión con `ping <IP-DEL-SERVIDOR>`
  2. Comprobar que el firewall permita conexiones al puerto 3000
  3. Confirmar que ambos dispositivos estén en la misma red
- Para problemas con PM2:
  1. Usar `npm run status` para ver el estado de la aplicación
  2. Verificar los logs con `npm run logs`
  3. Intentar reiniciar con `npm run restart`
  4. En caso necesario, eliminar y volver a crear el proceso con `npm run delete` seguido de `npm run start`