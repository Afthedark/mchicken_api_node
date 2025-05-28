@echo off
title Backend MChicken API
cd /d "C:\mchicken_api_node"

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js no está instalado.
    exit /b 1
)

:: Iniciar el servidor en modo silencioso
start /min cmd /c "node server.js"