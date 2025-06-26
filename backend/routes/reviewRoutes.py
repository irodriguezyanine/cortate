# cortate/backend/routes/reviewRoutes.py

from flask import Blueprint
from controllers.reviewController import review_controller

# Creamos el Blueprint de rutas para reseñas
review_bp = Blueprint('review_bp', __name__)

# Registramos las rutas del controlador dentro del blueprint de rutas
review_bp.register_blueprint(review_controller, url_prefix="/reviews")
