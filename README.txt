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
3. Acceder a la interfaz web en `http://localhost:3000`
4. La API estará disponible en `http://localhost:3000/pedidos`

## Características
- Endpoint GET `/pedidos` para obtener todos los pedidos
- Actualización automática cada 30 segundos
- Paginación de resultados

## Solución de Problemas
- Verificar que MySQL esté corriendo
- Revisar los logs del servidor para errores
- Asegurar que los puertos no estén en uso