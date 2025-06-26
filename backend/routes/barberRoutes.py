# cortate/backend/routes/barberRoutes.py

from flask import Blueprint
from controllers.barberController import barber_controller

# Registrar blueprint para rutas de barberos
barber_bp = Blueprint('barber_bp', __name__)

# Enlazar rutas del controller
barber_bp.register_blueprint(barber_controller, url_prefix="/")
