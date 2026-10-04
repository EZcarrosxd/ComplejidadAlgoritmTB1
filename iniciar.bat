@echo off
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (
    echo Primero ejecute: python -m venv .venv
    echo Luego: .venv\Scripts\python -m pip install -r requirements.txt
    pause
    exit /b 1
)
echo Abra http://127.0.0.1:5000 en su navegador.
echo Documentacion de la API: http://127.0.0.1:5000/docs
.venv\Scripts\python.exe app.py
if errorlevel 1 pause
