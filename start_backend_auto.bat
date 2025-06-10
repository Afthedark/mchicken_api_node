@echo off
cd /c "%~dp0"
pm2 start server.js --name mchicken_api_node