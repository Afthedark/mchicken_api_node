@echo off
cd /d "C:\mchicken_api_node"

:: Registro de logs
set LOGFILE=backend_start.log

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [%date% %time%] Error: Node.js no está instalado. >> "%LOGFILE%"
    echo Asegúrate de tener Node.js instalado y en el PATH.
    pause
    exit /b 1
)

:: Iniciar servidor y guardar salida en log
echo [%date% %time%] Iniciando servidor... >> "%LOGFILE%"
start "" /b node server.js >> "%LOGFILE%" 2>&1
exit