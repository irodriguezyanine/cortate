# cortate/backend/routes/reviewRoutes.py

from flask import Blueprint
from controllers.reviewController import review_controller

# Blueprint general para reviews
review_bp = Blueprint('review_bp', __name__)

# Enlazar rutas
review_bp.register_blueprint(review_controller, url_prefix="/")
