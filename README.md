# 🍗 MChicken API - Sistema de Gestión

## 📋 Requisitos Previos
- 📦 Node.js (v16+ o superior)
- 🗄️ MySQL (v5.0 necesario)
- 🔄 Git (opcional)

## 🚀 Instalación
1. 📁 El proyecto debe estar ubicado en `C:\mchicken_api_node`
2. ⚙️ Ejecutar `npm install` para instalar dependencias
3. 🔧 Configurar la base de datos MySQL con los parámetros en `config/db.js`

## ⚙️ Configuración
1. 🔑 Editar el archivo `config/db.js` con tus credenciales de MySQL
2. 📊 Crear la base de datos `pv_mchicken` e importar el esquema SQL
3. ✅ Verificar que Node.js esté instalado y en el PATH del sistema
4. 🚀 El archivo `startup_api_chicken_node.bat` debe estar en la carpeta de inicio de Windows

## 🚦 Uso con PM2
1. 📥 Asegúrate de tener PM2 instalado globalmente:
   ```
   npm install -g pm2
   ```

2. 🛠️ Comandos disponibles:
   - 🟢 `npm run start` - Inicia la aplicación en modo producción con PM2
   - 🟢 `npm run start:dev` - Inicia la aplicación en modo desarrollo con PM2
   - 🔴 `npm run stop` - Detiene la aplicación
   - 🔄 `npm run restart` - Reinicia completamente la aplicación
   - 🔄 `npm run reload` - Recarga la aplicación sin tiempo de inactividad
   - 📋 `npm run logs` - Muestra los logs en tiempo real de la aplicación
   - 📊 `npm run status` - Muestra el estado actual de la aplicación
   - 📈 `npm run monit` - Abre el monitor de recursos de PM2
   - 🗑️ `npm run delete` - Elimina la aplicación de PM2

3. 🔍 Monitoreo y Diagnóstico:
   - 📊 Ver el estado de la aplicación:
     ```
     npm run status
     ```
   - 📈 Monitorear recursos en tiempo real:
     ```
     npm run monit
     ```
   - 📋 Ver logs en tiempo real:
     ```
     npm run logs
     ```
   - 🔄 Recargar sin downtime:
     ```
     npm run reload
     ```

4. 📂 Estructura de Logs:
   - 📝 Los logs generales se encuentran en: `logs/app-1.log`
   - ⚠️ Los errores se registran en: `logs/error-1.log`
   - 🔄 Los logs se rotan automáticamente para mantener el espacio en disco

5. ⚙️ Configuración:
   - 📄 La configuración de PM2 se encuentra en `ecosystem.config.js`
   - 👀 El modo watch está activado para detectar cambios automáticamente
   - 🔄 El servidor se ejecuta en modo `fork`
   - 🔒 La aplicación se reinicia automáticamente en caso de errores
   - 💾 Límite de memoria configurado a 1GB

6. 🚀 Inicio Automático:
   - Se debe incluir el archivo `startup_api_chicken_node.bat` en la carpeta de inicio de Windows
   - Ruta: `C:\Users\[Usuario]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`
   - El script verifica e inicia automáticamente:
     * La instalación de Node.js
     * La instalación de PM2
     * La aplicación usando la configuración de PM2

### 🏠 Acceso Local
- 🌐 Acceder a la interfaz web en `http://localhost:3000`
- 🔌 La API estará disponible en `http://localhost:3000/pedidos`

### 🌍 Acceso desde otras máquinas en la red LAN
1. 🔍 Obtener la IP de la máquina servidor usando el comando `ipconfig` en la terminal
2. 🖥️ Desde otras máquinas en la misma red, acceder usando:
   - 🌐 Interfaz web: `http://<IP-DEL-SERVIDOR>:3000`
   - 🔌 API: `http://<IP-DEL-SERVIDOR>:3000/pedidos`
3. Asegurarse de que:
   - Ambas máquinas estén en la misma red LAN
   - El puerto 3000 no esté bloqueado por el firewall
   - PM2 esté ejecutando el servidor (verificar con `pm2 status`)
4. Para verificar que el servicio está funcionando:
   - Abrir el Administrador de Tareas
   - Buscar procesos de Node.js y PM2
   - Verificar que exista conexión a la base de datos en los logs

## ✨ Características
- 🏠 **Portal Administrativo Central**: Acceso unificado en la raíz (`/`) para navegar entre las distintas pantallas de cocina y configurar el sistema.
- 🎯 **Filtro Inteligente de Productos (`pedidos3.html`)**: Pantalla secundaria configurada para mostrar *única y exclusivamente* las órdenes que contengan productos específicos, recortando los elementos irrelevantes de las facturas para no saturar al cocinero.
- 🛠️ **Gestión Dinámica de Filtros**: Administración en tiempo real de la lista de productos válidos desde el Portal Central de manera sencilla (almacenamiento persistente en JSON).
- 🧹 **Mantenimiento de Caché**: Botón dedicado para vaciar la memoria de facturas completadas y reiniciar el estado de la aplicación.
- 🔄 Endpoint GET `/pedidos` para obtener todos los pedidos.
- ⚡ Actualización automática cada 10 segundos (incremental).
- 🎨 **Identificación Visual de Pedidos**:
  - 🟢 **Verde**: Pedidos estándar (Mesa/Para Llevar).
  - 🟡 **Amarillo**: Pedidos de **Call Center** (detectados automáticamente por palabras clave "callcenter").
  - 🔵 **Celeste**: Pedidos de **Autopollo** (detectados automáticamente por palabras clave "autopollo").
- 🚨 **Alerta de Atraso**: Los pedidos con más de **10 minutos** de antigüedad muestran un **borde rojo parpadeante** (efecto "pulso") muy notorio.
- 📡 **Indicador de Estado**: Punto de conexión en tiempo real (Conectado/Desconectado).
- 📄 Paginación de resultados optimizada.
- 🔊 Alertas sonoras configurables para nuevos pedidos.
- 🌐 Acceso desde múltiples dispositivos en la red local.
## 🔧 Solución de Problemas
- 🔍 Verificar que MySQL esté corriendo
- 📋 Revisar los logs del servidor en la carpeta `C:\mchicken_api_node\logs\`
- 🔌 Asegurar que los puertos no estén en uso

🚫 Si la aplicación no inicia automáticamente:
  1. ✅ Verificar que `startup_api_chicken_node.bat` esté en la carpeta de inicio
  2. 🔍 Ejecutar el archivo manualmente para ver posibles errores
  3. 📁 Comprobar que la ruta `C:\mchicken_api_node` existe y contiene todos los archivos

🔄 Si la aplicación se reinicia constantemente:
  1. ❌ Verificar los logs de error en `logs/error.log`
  2. 📊 Comprobar el uso de memoria con `npm run status`
  3. 🔌 Revisar la conexión a la base de datos
- Si no se puede acceder desde otra máquina:
  1. Verificar conexión con `ping <IP-DEL-SERVIDOR>`
  2. Comprobar que el firewall permita conexiones al puerto 3000
  3. Confirmar que ambos dispositivos estén en la misma red
- Para problemas con PM2:
  1. Usar `npm run status` para ver el estado de la aplicación
  2. Verificar los logs con `npm run logs`
  3. Intentar reiniciar con `npm run restart`
  4. En caso necesario, eliminar y volver a crear el proceso con `npm run delete` seguido de `npm run start`

## 🔧 Solución de Problemas Comunes

### 🔄 Cambios de Desarrollo no Funcionan en Producción
Si los cambios que funcionan con `node server.js` no se reflejan en producción con PM2, sigue estos pasos:

1. 🛑 Detener completamente PM2:
   ```powershell
   pm2 delete all
   ```

2. 🧹 Limpiar los logs:
   ```powershell
   pm2 flush
   ```

3. 🗑️ Eliminar archivos de logs antiguos:
   ```powershell
   del logs\*.log
   ```

4. 🚀 Reiniciar la aplicación en modo producción:
   ```powershell
   npm run start
   ```

5. 📋 Verificar el estado:
   ```powershell
   npm run status
   ```

6. 👀 Monitorear logs en tiempo real:
   ```powershell
   npm run logs
   ```

### 📝 Verificación Adicional
Si los problemas persisten:

1. 🔍 Revisar los logs de error:
   ```powershell
   type logs\error-1.log
   ```

2. 📊 Monitorear el uso de recursos:
   ```powershell
   npm run monit
   ```

3. 🔄 Intentar un reload en lugar de restart:
   ```powershell
   npm run reload
   ```

### ⚠️ Notas Importantes
- Asegúrate de que PM2 esté usando la configuración correcta del `ecosystem.config.js`
- El modo watch debe estar activo para detectar cambios automáticamente
- Los archivos ignorados en `ignore_watch` no triggearán reinicios
- Los cambios en archivos estáticos pueden requerir un `reload` manual
- En caso de problemas de memoria, revisa `max_memory_restart` en `ecosystem.config.js`