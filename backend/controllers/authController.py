from flask import Blueprint, request, jsonify
import uuid

auth_bp = Blueprint('auth', __name__)
usuarios = []

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    nuevo_usuario = {
        "id": str(uuid.uuid4()),
        "nombre": data.get("nombre"),
        "email": data.get("email"),
        "telefono": data.get("telefono"),
        "password": data.get("password"),
        "tipo": "cliente"
    }
    usuarios.append(nuevo_usuario)
    return jsonify({"mensaje": "Usuario registrado", "usuario": nuevo_usuario})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    for user in usuarios:
        if user['email'] == data.get("email") and user['password'] == data.get("password"):
            return jsonify({"mensaje": "Login exitoso", "usuario": user})
    return jsonify({"mensaje": "Credenciales inválidas"}), 401
