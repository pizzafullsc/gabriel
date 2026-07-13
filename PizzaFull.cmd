@echo off
setlocal
set "ROOT=%~dp0"
set "SERVER_SCRIPT=%ROOT%runtime\serve.py"
set "PORT_FILE=%ROOT%runtime\port.txt"
set "HOST_FILE=%ROOT%runtime\host.txt"

del "%PORT_FILE%" >nul 2>&1
del "%HOST_FILE%" >nul 2>&1

start "Gabriel Portable" python "%SERVER_SCRIPT%"

set "READY=0"
for /L %%i in (1,1,20) do (
    if exist "%PORT_FILE%" (
        set /p PORT=<"%PORT_FILE%"
        if exist "%HOST_FILE%" (
            set /p HOST=<"%HOST_FILE%"
        ) else (
            set "HOST=127.0.0.1"
        )
        powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:%PORT%/launcher.html' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } } catch {} exit 1" >nul 2>&1
        if not errorlevel 1 (
            set "READY=1"
            goto ready
        )
    )
    timeout /t 1 /nobreak >nul
)

:ready
if not "%READY%"=="1" (
    echo No se pudo iniciar el servidor local.
    pause
    exit /b 1
)

if not defined HOST set "HOST=127.0.0.1"
netsh advfirewall firewall add rule name="PizzaFull" dir=in action=allow protocol=TCP localport=%PORT% profile=private >nul 2>&1
netsh advfirewall firewall add rule name="PizzaFull" dir=in action=allow protocol=TCP localport=%PORT% profile=public >nul 2>&1
set "URL=http://127.0.0.1:%PORT%/launcher.html?ip=%HOST%&port=%PORT%"
echo Abriendo PizzaFull...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$url='%URL%'; try { Start-Process -FilePath $url -ErrorAction Stop } catch { try { Start-Process -FilePath 'explorer.exe' -ArgumentList $url -ErrorAction Stop } catch { Write-Host 'No se pudo abrir el navegador automaticamente.'; Write-Host 'Abra esta URL manualmente:'; Write-Host $url; exit 1 } }"
if errorlevel 1 (
    pause
    exit /b 1
)

exit /b 0
