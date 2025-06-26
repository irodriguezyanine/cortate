# cortate/backend/routes/bookingRoutes.py

from flask import Blueprint
from controllers.bookingController import booking_controller

# Blueprint general para bookings
booking_bp = Blueprint('booking_bp', __name__)

# Enlazar rutas
booking_bp.register_blueprint(booking_controller, url_prefix="/")
