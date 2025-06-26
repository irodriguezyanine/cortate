# cortate/backend/middleware/errorHandler.py

from flask import jsonify

def register_error_handlers(app):
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Solicitud incorrecta', 'detalle': str(error)}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'No autorizado', 'detalle': str(error)}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Prohibido', 'detalle': str(error)}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Recurso no encontrado', 'detalle': str(error)}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({'error': 'Error interno del servidor', 'detalle': str(error)}), 500
