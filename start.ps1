# Court Evidence Management System (CEMS) PowerShell Launcher
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   COURT EVIDENCE MANAGEMENT SYSTEM (CEMS) LAUNCHER" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan

if (Get-Command python -ErrorAction SilentlyContinue) {
    python run.py
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    py run.py
} else {
    Write-Host "[ERROR] Python 3 was not detected in PATH. Please install Python 3." -ForegroundColor Red
    Pause
}
