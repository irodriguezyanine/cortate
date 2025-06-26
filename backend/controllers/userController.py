# cortate/backend/controllers/userController.py

from flask import Blueprint, request, jsonify
from bson import ObjectId
from config.database import users_collection

user_controller = Blueprint('user_controller', __name__)

# Crear nuevo usuario
@user_controller.route('/create', methods=['POST'])
def crear_usuario():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos faltantes"}), 400
    resultado = users_collection.insert_one(data)
    data["_id"] = str(resultado.inserted_id)
    return jsonify(data), 201

# Obtener todos los usuarios
@user_controller.route('/all', methods=['GET'])
def listar_usuarios():
    usuarios = []
    for u in users_collection.find():
        u["_id"] = str(u["_id"])
        usuarios.append(u)
    return jsonify(usuarios), 200

# Obtener usuario por ID
@user_controller.route('/<user_id>', methods=['GET'])
def obtener_usuario(user_id):
    usuario = users_collection.find_one({"_id": ObjectId(user_id)})
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    usuario["_id"] = str(usuario["_id"])
    return jsonify(usuario), 200

# Eliminar usuario
@user_controller.route('/delete/<user_id>', methods=['DELETE'])
def eliminar_usuario(user_id):
    resultado = users_collection.delete_one({"_id": ObjectId(user_id)})
    if resultado.deleted_count == 0:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return '', 204
