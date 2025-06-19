# cortate/backend/middleware/auth.py

from functools import wraps
from flask import request, jsonify

# Simulación de autenticación simple
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token or token != "Bearer supertoken":
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return decorated_function
