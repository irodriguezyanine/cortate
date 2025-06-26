# cortate/backend/routes/penaltyRoutes.py

from flask import Blueprint
from controllers.penaltyController import penalty_controller

# Crear un Blueprint para las rutas de penalizaciones
penalty_bp = Blueprint('penalty_bp', __name__, url_prefix='/api/penalties')

# Registrar las rutas del controlador
penalty_bp.add_url_rule('/create', view_func=penalty_controller.view_functions['crear_penalizacion'], methods=['POST'])
penalty_bp.add_url_rule('/all', view_func=penalty_controller.view_functions['listar_penalizaciones'], methods=['GET'])
penalty_bp.add_url_rule('/user/<usuario_id>', view_func=penalty_controller.view_functions['obtener_penalizaciones_usuario'], methods=['GET'])
penalty_bp.add_url_rule('/delete/<penalty_id>', view_func=penalty_controller.view_functions['eliminar_penalizacion'], methods=['DELETE'])
