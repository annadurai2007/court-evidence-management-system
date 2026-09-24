@echo off
title Court Evidence Management System (CEMS)
cd /d "%~dp0"

echo =======================================================
echo    COURT EVIDENCE MANAGEMENT SYSTEM (CEMS) LAUNCHER
echo =======================================================
echo.
python run.py
if %errorlevel% neq 0 (
    echo.
    echo [!] 'python' command not found or exited with error. Trying 'py run.py'...
    py run.py
)
pause
