@echo off
title Backend MChicken API
cd /d "%~dp0"
echo Iniciando servidor backend...
node server.js
echo.
echo El servidor se ha detenido. Presiona cualquier tecla para cerrar.
pause >nul