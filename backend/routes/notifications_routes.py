"""
Notifications Routes Blueprint (/api/notifications)
"""

from flask import Blueprint
from database.db import query_db, execute_db
from models.notification import NotificationModel
from utils.response import success_response, error_response

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@notifications_bp.route("", methods=["GET"])
def get_notifications():
    """List system notifications."""
    rows = query_db("SELECT * FROM `notifications` ORDER BY `id` DESC LIMIT 20;")
    items = [NotificationModel.to_dict(r) for r in rows]
    return success_response(items)

@notifications_bp.route("/<notif_id>/read", methods=["PUT"])
def mark_read(notif_id):
    """Mark a notification as read."""
    execute_db("UPDATE `notifications` SET `is_unread` = 0 WHERE `notification_id` = %s OR `id` = %s;", (notif_id, notif_id))
    return success_response(None, message="Notification marked as read.")

@notifications_bp.route("/read-all", methods=["PUT"])
def mark_all_read():
    """Mark all notifications as read."""
    execute_db("UPDATE `notifications` SET `is_unread` = 0;")
    return success_response(None, message="All notifications marked as read.")
