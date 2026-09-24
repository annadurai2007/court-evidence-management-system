#!/usr/bin/env python3
"""
COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
Unified Runner Script (run.py)
Delegates to server.py to start the Python Flask backend and open Chrome.
"""
import sys
import server

if __name__ == "__main__":
    server.main()
