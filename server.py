#!/usr/bin/env python3
"""
======================================================================
 COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 Python Flask Backend & Full-Stack Application Server
======================================================================
"""

import os
import sys
import time
import socket
import threading
import webbrowser
import subprocess
from pathlib import Path

# Add backend directory to sys.path
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

def check_dependencies():
    """Verify core dependencies and install if missing."""
    needed = ["flask", "flask_cors", "pymysql", "jwt", "dotenv", "werkzeug", "cryptography"]
    missing = []
    for mod in needed:
        try:
            __import__(mod)
        except ImportError:
            missing.append(mod)

    if missing:
        print(f"[*] Missing dependencies detected: {missing}")
        print("[*] Automatically installing required packages from backend/requirements.txt...")
        req_file = BACKEND_DIR / "requirements.txt"
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(req_file)])
        print("[+] All dependencies installed successfully.\n")

check_dependencies()

from app import create_app
from config import Config

app = create_app()

def open_chrome_browser(target_url):
    """Launch Google Chrome or system default browser."""
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe")
    ]

    for path in chrome_paths:
        if os.path.isfile(path):
            try:
                subprocess.Popen([path, target_url])
                return
            except Exception:
                pass

    webbrowser.open(target_url)

def main():
    port = Config.PORT or 5000

    print("\n" + "=" * 70)
    print("      ⚖️  COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)")
    print("      Python Flask REST API Backend & Portal Server")
    print("=" * 70)
    print(f"  🟢 Backend REST API    : http://127.0.0.1:{port}/api")
    print(f"  🟢 Health Check URL    : http://127.0.0.1:{port}/api/health")
    print(f"  🌐 Web Dashboard       : http://127.0.0.1:{port}/dashboard.html")
    print(f"  📋 Evidence Registry   : http://127.0.0.1:{port}/evidence.html")
    print(f"  ➕ Add Evidence Form   : http://127.0.0.1:{port}/add-evidence.html")
    print("-" * 70)
    print("  🔑 Demo Login Account  : admin@cems.com  /  admin123")
    print("  🗄️ Database Engine     : Automatic Hybrid (MySQL / SQLite Fallback)")
    print("  🚀 Launching Browser   : Google Chrome")
    print("=" * 70)
    print("  >>> Press Ctrl+C in this terminal to stop the Python server <<<")
    print("=" * 70 + "\n")

    # Launch Chrome after 1 second
    target_url = f"http://127.0.0.1:{port}/dashboard.html"
    threading.Timer(1.2, open_chrome_browser, args=[target_url]).start()

    try:
        app.run(host="0.0.0.0", port=port, debug=False)
    except KeyboardInterrupt:
        print("\n[OK] Python CEMS Backend stopped gracefully. Goodbye!")

if __name__ == "__main__":
    main()
