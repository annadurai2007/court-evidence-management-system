"""
COURT EVIDENCE MANAGEMENT SYSTEM (CEMS)
Flask REST API Backend Application Entrypoint
"""

import os
from pathlib import Path
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import Config
from database.db import check_db_health
from utils.response import error_response, success_response

# Import Blueprints
from routes import (
    auth_bp,
    cases_bp,
    evidence_bp,
    custody_bp,
    hearings_bp,
    documents_bp,
    submissions_bp,
    dashboard_bp,
    activity_bp,
    notifications_bp,
    users_bp,
    settings_bp
)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable Cross-Origin Resource Sharing (CORS) for Netlify & local frontend
    CORS(
        app,
        resources={r"/api/*": {"origins": Config.CORS_ORIGINS}, r"/uploads/*": {"origins": Config.CORS_ORIGINS}},
        supports_credentials=True
    )

    # Register all Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(cases_bp)
    app.register_blueprint(evidence_bp)
    app.register_blueprint(custody_bp)
    app.register_blueprint(hearings_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(submissions_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(activity_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(settings_bp)

    # Health Check Endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_ok, db_msg = check_db_health()
        status_code = 200 if db_ok else 503
        return jsonify({
            "status": "online" if db_ok else "degraded",
            "service": "Court Evidence Management System (CEMS) REST API",
            "version": "2.0.0",
            "database": "connected" if db_ok else "disconnected",
            "databaseMessage": db_msg
        }), status_code

    # Static file serving for uploaded evidence and documents
    @app.route("/uploads/<subfolder>/<filename>", methods=["GET"])
    def serve_upload(subfolder, filename):
        target_dir = Config.UPLOAD_FOLDER / subfolder
        if not target_dir.exists():
            return error_response("File directory not found.", 404)
        return send_from_directory(str(target_dir), filename)

    # Root route
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "name": "Court Evidence Management System (CEMS) API",
            "documentation": "/api/health",
            "status": "running"
        })

    # Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return error_response("Bad request.", 400)

    @app.errorhandler(404)
    def not_found(e):
        return error_response("Requested API endpoint or resource was not found.", 404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response("HTTP method not allowed for this endpoint.", 405)

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return error_response("File size exceeds the 100MB upload limit.", 413)

    @app.errorhandler(500)
    def internal_server_error(e):
        return error_response(f"Internal server error: {str(e)}", 500)

    return app

app = create_app()

if __name__ == "__main__":
    port = Config.PORT
    debug = Config.DEBUG
    if Config.IS_PRODUCTION:
        print(f"Starting CEMS Production WSGI Server on port {port}...")
        try:
            from waitress import serve
            serve(app, host="0.0.0.0", port=port)
        except ImportError:
            app.run(host="0.0.0.0", port=port, debug=False)
    else:
        print("=" * 60)
        print(f" CEMS REST API Backend starting on http://127.0.0.1:{port}")
        print(f" CORS Allowed Origins: {Config.CORS_ORIGINS}")
        print("=" * 60)
        app.run(host="0.0.0.0", port=port, debug=debug)
