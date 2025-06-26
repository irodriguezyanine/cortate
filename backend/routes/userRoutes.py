# cortate/backend/routes/userRoutes.py

from flask import Blueprint
from controllers.userController import user_controller

# Registrar blueprint para rutas de usuarios
user_bp = Blueprint('user_bp', __name__)

# Enlazar rutas del controller
user_bp.register_blueprint(user_controller, url_prefix="/")
