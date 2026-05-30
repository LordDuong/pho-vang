@echo off
REM run Backend Server
REM 

title Pho Vang - Backend Server
echo ========================================
echo Pho Vang - Backend Server (GO)
echo ========================================
echo.
echo Listening on: http://localhost:8080
echo WebSocket: ws://localhost:8080/ws
echo.
echo  Ctrl+C to stop server
echo ========================================
echo.

go run .
pause
