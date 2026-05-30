@echo off
REM run Frontend Server (listen from all interfaces)
REM Cwd: frontend folder

title Pho Vang - Frontend Server
echo ========================================
echo Pho Vang - Frontend Server (Python)
echo ========================================
echo.
echo Listening on: http://0.0.0.0:5500 (tất cả interfaces)
echo.
echo to access from other devices on the same network, use:
echo   http://YOUR_MACHINE_IP:5500
echo.
echo  Ctrl+C to stop server
echo ========================================
echo.

py -m http.server 5500
pause
