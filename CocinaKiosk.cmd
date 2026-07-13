@echo off
setlocal enabledelayedexpansion
set "ROOT=%~dp0"
set "PORT_FILE=%ROOT%runtime\port.txt"
set "HOST_FILE=%ROOT%runtime\host.txt"

echo Esperando a que el servidor de PizzaFull este activo...
echo (Asegurate de haber ejecutado PizzaFull.cmd antes, o en la misma PC)
echo.

set "READY=0"
for /L %%i in (1,1,30) do (
    if exist "!PORT_FILE!" if exist "!HOST_FILE!" (
        set /p PORT=<"!PORT_FILE!"
        set /p HOST=<"!HOST_FILE!"
        set "READY=1"
        goto found
    )
    timeout /t 1 /nobreak >nul
)

:found
if not "!READY!"=="1" (
    echo No se detecto el servidor. Verifica que PizzaFull.cmd este corriendo
    echo en la PC de mostrador, y que esta pantalla este en la misma red.
    pause
    exit /b 1
)

set "URL=http://!HOST!:!PORT!/cocina.html"
echo Abriendo cocina en modo kiosco: !URL!

set "CHROME1=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME2=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "EDGE1=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE2=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if exist "!CHROME1!" (
    start "" "!CHROME1!" --kiosk "!URL!" --edge-kiosk-type=fullscreen --noerrdialogs --disable-session-crashed-bubble
    goto end
)
if exist "!CHROME2!" (
    start "" "!CHROME2!" --kiosk "!URL!" --edge-kiosk-type=fullscreen --noerrdialogs --disable-session-crashed-bubble
    goto end
)
if exist "!EDGE1!" (
    start "" "!EDGE1!" --kiosk "!URL!" --edge-kiosk-type=fullscreen --noerrdialogs --disable-session-crashed-bubble
    goto end
)
if exist "!EDGE2!" (
    start "" "!EDGE2!" --kiosk "!URL!" --edge-kiosk-type=fullscreen --noerrdialogs --disable-session-crashed-bubble
    goto end
)

echo No se encontro Chrome ni Edge instalado. Abriendo con el navegador
echo predeterminado (sin modo kiosco).
start "" "!URL!"

:end
exit /b 0
