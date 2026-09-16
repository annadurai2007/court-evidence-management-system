"""
Standardized JSON API Response Helpers
"""

from flask import jsonify

def success_response(data=None, message=None, status_code=200):
    """Formats a standard successful JSON response."""
    payload = {"success": True}
    if message:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code

def error_response(message="An error occurred", status_code=400, errors=None):
    """Formats a standard error JSON response."""
    payload = {
        "success": False,
        "error": message
    }
    if errors:
        payload["errors"] = errors
    return jsonify(payload), status_code
