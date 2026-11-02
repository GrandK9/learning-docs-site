@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Learning Docs Site

rem ASCII-only bat. Reading mode = build + preview (static dist), not docs:dev.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [SETUP] Installing npm dependencies, please wait...
    call npm install --no-audit --no-fund --registry https://registry.npmmirror.com
    if errorlevel 1 (
        echo [RETRY] Mirror failed, trying registry.npmjs.org ...
        call npm install --no-audit --no-fund
    )
    if errorlevel 1 (
        echo [ERROR] npm install failed. Check network and run this script again.
        pause
        exit /b 1
    )
)

set "PORT=5173"
for /f "usebackq delims=" %%p in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\pick-port.ps1"`) do set "PORT=%%p"

echo.
echo [BUILD] Generating static site (about 15-40s) ...
call npm run docs:build
if errorlevel 1 (
    echo [ERROR] docs:build failed. Fix errors above and retry.
    pause
    exit /b 1
)

echo.
echo Local URL: http://127.0.0.1:!PORT!/  (preview, static dist)
echo Edit markdown? Use: npm run docs:dev
echo Stop server: close this window or press Ctrl+C
echo.

start /b powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\wait-and-open.ps1" -Port !PORT!
call npm run docs:preview -- --port !PORT! --host 127.0.0.1

pause
