@echo off
title Detener Backend MChicken API

cd /d "C:\mchicken_api_node"

:: Verificar si PM2 está instalado
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: PM2 no está instalado.
    pause
    exit /b 1
)

:: Detener el proceso de PM2 por nombre o por archivo ecosystem
echo Deteniendo MChicken API en PM2...
pm2 stop ecosystem.config.js

:: Opcional: eliminar el proceso de PM2 para evitar duplicados
pm2 delete ecosystem.config.js

echo Proceso detenido correctamente.
timeout /t 3
