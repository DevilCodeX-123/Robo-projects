@echo off
title Robotics Club System Launcher
echo ========================================================
echo   Robotics Club Component Management System
echo ========================================================
echo.
echo [1/2] Starting Backend API Server (Port 5000)...
start "Robo Backend" cmd /k "cd /d \"%~dp0backend\" && npm start"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting Frontend UI Server (Port 5173)...
start "Robo Frontend" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

echo Waiting for frontend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Opening browser at http://localhost:5173 ...
start http://localhost:5173
echo.
echo System started successfully! You can keep this window open or close it.
