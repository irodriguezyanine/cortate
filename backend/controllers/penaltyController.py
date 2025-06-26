# cortate/backend/controllers/penaltyController.py

from flask import Blueprint, request, jsonify
from bson import ObjectId
from config.database import penalties_collection

penalty_controller = Blueprint('penalty_controller', __name__)

# Crear penalización
@penalty_controller.route('/create', methods=['POST'])
def crear_penalizacion():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos faltantes"}), 400
    resultado = penalties_collection.insert_one(data)
    data["_id"] = str(resultado.inserted_id)
    return jsonify(data), 201

# Obtener todas las penalizaciones
@penalty_controller.route('/all', methods=['GET'])
def listar_penalizaciones():
    penalizaciones = []
    for p in penalties_collection.find():
        p["_id"] = str(p["_id"])
        penalizaciones.append(p)
    return jsonify(penalizaciones), 200

# Obtener penalizaciones por ID de usuario
@penalty_controller.route('/user/<usuario_id>', methods=['GET'])
def obtener_penalizaciones_usuario(usuario_id):
    penalizaciones = []
    for p in penalties_collection.find({"usuario_id": usuario_id}):
        p["_id"] = str(p["_id"])
        penalizaciones.append(p)
    return jsonify(penalizaciones), 200

# Eliminar penalización
@penalty_controller.route('/delete/<penalty_id>', methods=['DELETE'])
def eliminar_penalizacion(penalty_id):
    resultado = penalties_collection.delete_one({"_id": ObjectId(penalty_id)})
    if resultado.deleted_count == 0:
        return jsonify({"error": "Penalización no encontrada"}), 404
    return '', 204
