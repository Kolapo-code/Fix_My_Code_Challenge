#!/usr/bin/python3
""" Index view
"""
from flask import jsonify
from api.v1.views import app_views
from flask import Blueprint

index_bp = Blueprint("index", __name__, url_prefix="/api/v1")

@index_bp.route('/status', methods=['GET'], strict_slashes=False)
def status():
    """ Status of the web server
    """
    return jsonify({"status": "OK"})
