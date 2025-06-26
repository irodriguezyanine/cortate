## Estructura de archivos agregados

# cortate/backend/middleware/auth.py
import jwt
from flask import request, jsonify
from functools import wraps
import os

def token_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[-1]

        if not token:
            return jsonify({'mensaje': 'Token faltante'}), 401

        try:
            data = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=["HS256"])
            request.user_id = data['user_id']
        except:
            return jsonify({'mensaje': 'Token inválido'}), 401

        return f(*args, **kwargs)
    return decorador

# cortate/backend/middleware/errorHandler.py
from flask import jsonify

def manejar_errores(app):
    @app.errorhandler(404)
    def no_encontrado(error):
        return jsonify({'error': 'No encontrado'}), 404

    @app.errorhandler(500)
    def error_interno(error):
        return jsonify({'error': 'Error interno del servidor'}), 500

# cortate/backend/middleware/uploadMiddleware.py
import os
from werkzeug.utils import secure_filename

def guardar_archivo(file, carpeta_destino):
    if file:
        filename = secure_filename(file.filename)
        path = os.path.join(carpeta_destino, filename)
        file.save(path)
        return path
    return None


# cortate/backend/utils/geo.py
from geopy.distance import geodesic

def calcular_distancia(coord1, coord2):
    return geodesic(coord1, coord2).km

# cortate/backend/utils/helpers.py
from datetime import datetime

def formatear_fecha(fecha):
    return fecha.strftime('%d-%m-%Y')

def es_fecha_valida(cadena):
    try:
        datetime.strptime(cadena, '%Y-%m-%d')
        return True
    except ValueError:
        return False
