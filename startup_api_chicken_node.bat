@echo off
title Backend MChicken API

cd /d "C:\mchicken_api_node"

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js no está instalado.
    echo Asegúrate de tener Node.js instalado y en el PATH.
    pause
    exit /b 1
)

:: Verificar si PM2 está instalado
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: PM2 no está instalado.
    echo Instalando PM2 globalmente...
    npm install -g pm2
)

:: Iniciar la aplicación con PM2
echo Iniciando MChicken API con PM2...
pm2 start ecosystem.config.js

:: Mantener la ventana abierta para ver el estado
echo.
echo La aplicación se ha iniciado correctamente.
echo Para ver los logs, ejecuta: pm2 logs mchicken-api
timeout /t 5
