@echo off
REM Iniciar el backend
start cmd /k "cd /d %~dp0 && node server.js"
REM Esperar unos segundos para asegurar que el backend esté arriba
ping 127.0.0.1 -n 3 > nul
REM Abrir el frontend en Chrome Canary
start "" "C:\Users\Sistemas\AppData\Local\Google\Chrome SxS\Application\chrome.exe" --new-window http://localhost:3000/