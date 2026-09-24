#!/usr/bin/env python3
"""
COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
Unified Launcher Script (run.py)

One-command runner:
1. Launches Flask REST API Backend on http://127.0.0.1:5000
2. Launches Frontend Web Server on http://localhost:5500
3. Automatically opens Google Chrome to http://localhost:5500
4. Provides clean shutdown with Ctrl+C
"""

import os
import sys
import time
import socket
import subprocess
import threading
import webbrowser
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

BACKEND_PORT = 5000
FRONTEND_PORT = 5500

backend_process = None
frontend_server = None

def is_port_in_use(port):
    """Check if a network port is already occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0

def check_backend_healthy(timeout=6):
    """Wait until backend responds to health endpoint."""
    import urllib.request
    start = time.time()
    url = f"http://127.0.0.1:{BACKEND_PORT}/api/health"
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                if resp.status in (200, 503):
                    return True
        except Exception:
            pass
        time.sleep(0.3)
    return False

def start_backend():
    """Start the Flask API server as a background subprocess."""
    global backend_process
    print(f"[*] Starting Flask REST API Backend on http://127.0.0.1:{BACKEND_PORT}...")
    
    app_py = BACKEND_DIR / "app.py"
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["PORT"] = str(BACKEND_PORT)
    env["FLASK_PORT"] = str(BACKEND_PORT)

    backend_process = subprocess.Popen(
        [sys.executable, str(app_py)],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE
    )

def start_frontend_server():
    """Start static HTTP file server for frontend."""
    global frontend_server

    class CustomHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

        def log_message(self, format, *args):
            # Suppress normal access logs to keep terminal dashboard clean
            pass

        def end_headers(self):
            # Add CORS headers for local static assets
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            super().end_headers()

    frontend_server = HTTPServer(("0.0.0.0", FRONTEND_PORT), CustomHandler)
    server_thread = threading.Thread(target=frontend_server.serve_forever, daemon=True)
    server_thread.start()

def open_in_chrome(target_url):
    """Open the application in Google Chrome browser or system default browser."""
    chrome_candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe")
    ]

    opened = False
    for path in chrome_candidates:
        if os.path.isfile(path):
            try:
                subprocess.Popen([path, target_url])
                opened = True
                print(f"[+] Google Chrome opened successfully: {path}")
                break
            except Exception as e:
                pass

    if not opened:
        print("[+] Opening in default system web browser...")
        webbrowser.open(target_url)

def main():
    print("=" * 70)
    print("      COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)")
    print("      Unified Local Development & Execution Engine")
    print("=" * 70)

    # 1. Start Backend API
    start_backend()

    # 2. Start Frontend Server
    print(f"[*] Starting Frontend Web Server on http://localhost:{FRONTEND_PORT}...")
    start_frontend_server()

    # 3. Wait for Backend initialization
    is_ready = check_backend_healthy(timeout=6)
    target_url = f"http://localhost:{FRONTEND_PORT}/dashboard.html"

    # 4. Open in Chrome
    print("[*] Launching Google Chrome browser...")
    open_in_chrome(target_url)

    # 5. Display Clean Terminal Dashboard
    time.sleep(0.5)
    print("\n" + "=" * 70)
    print(" [OK] CEMS IS NOW RUNNING SUCCESSFULLY!")
    print("=" * 70)
    print(f"  * Frontend Web Portal : http://localhost:{FRONTEND_PORT}/")
    print(f"  * Direct Dashboard    : http://localhost:{FRONTEND_PORT}/dashboard.html")
    print(f"  * Add Evidence Page   : http://localhost:{FRONTEND_PORT}/add-evidence.html")
    print(f"  * Backend REST API    : http://127.0.0.1:{BACKEND_PORT}/api")
    print(f"  * API Health Status   : http://127.0.0.1:{BACKEND_PORT}/api/health ({'Online' if is_ready else 'Initializing'})")
    print("-" * 70)
    print("  * Demo Credentials    : admin@cems.com  /  admin123")
    print("  * System Mode         : Hybrid (Full REST API + Browser Media Vault)")
    print("=" * 70)
    print("  >>> Press Ctrl+C in this terminal to stop both servers <<<")
    print("=" * 70 + "\n")

    # Keep script alive until Ctrl+C
    try:
        while True:
            time.sleep(1)
            # Monitor backend process
            if backend_process and backend_process.poll() is not None:
                err = backend_process.stderr.read().decode('utf-8', errors='ignore') if backend_process.stderr else ''
                print(f"[!] Backend process stopped unexpectedly. Details:\n{err}")
                break
    except KeyboardInterrupt:
        print("\n[*] Shutting down CEMS servers gracefully...")
    finally:
        if backend_process:
            backend_process.terminate()
            try:
                backend_process.wait(timeout=2)
            except Exception:
                backend_process.kill()
        if frontend_server:
            frontend_server.shutdown()
        print("[OK] All CEMS servers stopped cleanly. Goodbye!")

if __name__ == "__main__":
    main()
