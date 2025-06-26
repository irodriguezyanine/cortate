# cortate/backend/routes/googlePlacesRoutes.py

from flask import Blueprint
from controllers.googlePlacesController import google_places_controller

google_places_bp = Blueprint('google_places_bp', __name__)

google_places_bp.register_blueprint(google_places_controller, url_prefix="/")
