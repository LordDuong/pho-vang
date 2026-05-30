@echo off
REM 

title Pho Vang - Startup
echo ========================================
echo Pho Vang - Starting All Servers
echo ========================================
echo.
echo Start Backend (Go)...
start "Pho Vang - Backend" cmd /k "cd backend && go run ."
timeout /t 2

echo Start Frontend (Python)...
start "Pho Vang - Frontend" cmd /k "cd frontend && py -m http.server 5500"
timeout /t 2

echo.
echo ========================================
echo  Both servers are running!
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5500
echo.
echo Guest Access:
echo   http://192.168.229.1:5500
echo.
echo Press any key to close...
pause > nul
