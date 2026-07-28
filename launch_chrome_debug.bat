@echo off
title Falcon Strategy - Deriv Chart In-Browser Analysis Engine
echo ===================================================================
echo   FALCON STRATEGY - LIVE DERIV CHART AUTOMATION & IN-BROWSER HUD
echo ===================================================================
echo.
echo 1. Launching Google Chrome with remote debugging on port 9222...
echo    Target: https://charts.deriv.com/deriv
echo.

set CHROME_PATH=""
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

if %CHROME_PATH%=="" (
    echo [ERROR] Chrome executable not found in default installation paths.
    echo Please start Chrome manually with:
    echo chrome.exe --remote-debugging-port=9222 --user-data-dir="%%USERPROFILE%%\chrome-debug-profile" https://charts.deriv.com/deriv
    pause
    exit /b 1
)

start "" %CHROME_PATH% --remote-debugging-port=9222 --user-data-dir="%USERPROFILE%\chrome-debug-profile" --no-first-run --no-default-browser-check https://charts.deriv.com/deriv

echo 2. Starting Falcon Strategy Backend Engine...
echo.
cd /d "%~dp0backend"
python -m uvicorn main:app --port 8000 --host 127.0.0.1

pause
