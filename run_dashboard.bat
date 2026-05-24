@echo off
SETLOCAL
title CoDev Dashboard Starter

echo [1/3] Checking dependencies...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js to run the local server.
    pause
    exit /b 1
)

echo [2/3] Starting local server on port 3000...
echo.
echo Dashboard will be available at: http://localhost:3000/codev_dashboard.html
echo.
:: Start the server in a new window so this script can continue
start "CoDev Dashboard Server" cmd /c "npx serve -l 3000 ."

echo [3/3] Waiting for server to initialize (3s)...
timeout /t 3 /nobreak > nul

echo Opening UI in default browser...
start http://localhost:3000/codev_dashboard.html

echo.
echo ------------------------------------------------------------
echo Dashboard is now running.
echo To stop the server, close the "CoDev Dashboard Server" window.
echo ------------------------------------------------------------
echo.
pause
ENDLOCAL