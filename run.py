#!/usr/bin/env python3
"""
======================================================================
 COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
 Unified One-Command Runner (Frontend + Backend + Auto-Open Chrome)
======================================================================
"""

import os
import sys
import time
import socket
import shutil
import threading
import subprocess
import webbrowser
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

BACKEND_PORT = 5000
FRONTEND_PORT = 5500

backend_process = None
frontend_server = None

def check_port_open(port, host="127.0.0.1"):
    """Check if a port is actively accepting connections."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex((host, port)) == 0

def wait_until_ready(port, host="127.0.0.1", timeout=12):
    """Wait until port becomes active."""
    start = time.time()
    while time.time() - start < timeout:
        if check_port_open(port, host):
            return True
        time.sleep(0.2)
    return False

def check_and_install_dependencies():
    """Verify core packages and auto-install from requirements if missing."""
    needed = ["flask", "flask_cors", "pymysql", "jwt", "dotenv", "werkzeug", "cryptography"]
    missing = []
    for pkg in needed:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"[*] Missing packages detected: {missing}")
        print("[*] Installing requirements from backend/requirements.txt...")
        req = BACKEND_DIR / "requirements.txt"
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(req)])
        print("[+] Packages installed successfully.\n")

def start_backend():
    """Start Flask API Backend process."""
    global backend_process
    print(f" [1/3] Starting Backend REST API Server (Flask on port {BACKEND_PORT})...")

    if check_port_open(BACKEND_PORT):
        print(f" [i] Backend is already active on port {BACKEND_PORT}.")
        return

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["PORT"] = str(BACKEND_PORT)
    env["FLASK_PORT"] = str(BACKEND_PORT)

    app_file = BACKEND_DIR / "app.py"
    backend_process = subprocess.Popen(
        [sys.executable, str(app_file)],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE
    )

def start_frontend():
    """Start static file server for frontend."""
    global frontend_server
    print(f" [2/3] Starting Frontend Web Server on port {FRONTEND_PORT}...")

    if check_port_open(FRONTEND_PORT):
        print(f" [i] Frontend server already active on port {FRONTEND_PORT}.")
        return

    class SilentHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

        def log_message(self, format, *args):
            pass

        def end_headers(self):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            super().end_headers()

    frontend_server = HTTPServer(("0.0.0.0", FRONTEND_PORT), SilentHandler)
    t = threading.Thread(target=frontend_server.serve_forever, daemon=True)
    t.start()

def launch_chrome(url):
    """Launch Google Chrome or system browser to target URL."""
    print(f" [3/3] Opening Google Chrome to {url}...")
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe"),
    ]

    try:
        w = shutil.which("chrome")
        if w:
            chrome_paths.insert(0, w)
    except Exception:
        pass

    for path in chrome_paths:
        if path and os.path.isfile(path):
            try:
                subprocess.Popen([path, url])
                print(f" [+] Launched Google Chrome successfully.")
                return
            except Exception:
                pass

    if sys.platform == "win32":
        try:
            subprocess.Popen(f'start chrome "{url}"', shell=True)
            print(" [+] Launched Chrome via Windows start command.")
            return
        except Exception:
            pass

    print(" [+] Opening in default web browser...")
    webbrowser.open(url)

def main():
    print("\n" + "=" * 70)
    print("      ⚖️  COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)")
    print("      Unified One-Command Runner (Full-Stack Engine)")
    print("=" * 70)

    # Step 0: Ensure dependencies
    check_and_install_dependencies()

    # Step 1: Start Backend API
    start_backend()

    # Step 2: Start Frontend Web Server
    start_frontend()

    # Step 3: Wait for both ports to be online before launching browser
    print(" [*] Waiting for services to initialize...")
    backend_ready = wait_until_ready(BACKEND_PORT, timeout=10)
    frontend_ready = wait_until_ready(FRONTEND_PORT, timeout=5)

    target_url = f"http://localhost:{FRONTEND_PORT}/dashboard.html"

    # Step 4: Open in Chrome
    launch_chrome(target_url)

    # Step 5: Print live URLs & Status
    time.sleep(0.5)
    print("\n" + "=" * 70)
    print("  🟢 SUCCESS! CEMS IS RUNNING LOCALLY")
    print("=" * 70)
    print(f"   🌐 Frontend Portal URL   : http://localhost:{FRONTEND_PORT}/")
    print(f"   📊 Direct Dashboard URL  : http://localhost:{FRONTEND_PORT}/dashboard.html")
    print(f"   ➕ Add Evidence URL      : http://localhost:{FRONTEND_PORT}/add-evidence.html")
    print(f"   ⚙️  Backend REST API URL   : http://127.0.0.1:{BACKEND_PORT}/api")
    print(f"   ❤️  Backend Health Check   : http://127.0.0.1:{BACKEND_PORT}/api/health ({'Online' if backend_ready else 'Initializing'})")
    print("-" * 70)
    print("   🔑 Demo Credentials      : admin@cems.com  /  admin123")
    print("   🚀 Browser               : Google Chrome")
    print("=" * 70)
    print("   🛑 Press Ctrl+C in this terminal to stop both servers.")
    print("=" * 70 + "\n")

    try:
        while True:
            time.sleep(1)
            if backend_process and backend_process.poll() is not None:
                err = backend_process.stderr.read().decode('utf-8', errors='ignore') if backend_process.stderr else ''
                print(f"[!] Backend stopped unexpectedly:\n{err}")
                break
    except KeyboardInterrupt:
        print("\n[*] Stopping CEMS servers gracefully...")
    finally:
        if backend_process:
            backend_process.terminate()
            try:
                backend_process.wait(timeout=2)
            except Exception:
                backend_process.kill()
        if frontend_server:
            frontend_server.shutdown()
        print("[OK] Both Frontend and Backend stopped. Goodbye!\n")

if __name__ == "__main__":
    main()
