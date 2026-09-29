@echo off
echo Iniciando el servidor de datos (Python)...
start python app.py

echo Iniciando la interfaz visual...
start python -m http.server 8000

echo Abriendo el panel de control en el navegador...
timeout 2 > nul
start http://localhost:8000