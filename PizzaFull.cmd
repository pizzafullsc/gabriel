@echo off
setlocal
set "ROOT=%~dp0"
set "SERVER_SCRIPT=%ROOT%runtime\serve.ps1"
set "PORT_FILE=%ROOT%runtime\port.txt"

del "%PORT_FILE%" >nul 2>&1

start "Gabriel Portable" powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SERVER_SCRIPT%"

timeout /t 2 /nobreak >nul

if not exist "%PORT_FILE%" (
    echo No se pudo iniciar el servidor local.
    pause
    exit /b 1
)

set /p PORT=<"%PORT_FILE%"
set "URL=http://127.0.0.1:%PORT%/launcher.html"

start "" "%URL%"

exit /b 0
