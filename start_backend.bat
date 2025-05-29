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

:: Iniciar servidor Node.js en modo silencioso
node server.js