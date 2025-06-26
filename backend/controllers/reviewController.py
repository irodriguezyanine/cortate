# cortate/backend/controllers/reviewController.py

from flask import Blueprint, request, jsonify
from bson import ObjectId
from config.database import reviews_collection

review_controller = Blueprint('review_controller', __name__)

# Crear reseña
@review_controller.route('/create', methods=['POST'])
def crear_resena():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Faltan datos"}), 400
    resultado = reviews_collection.insert_one(data)
    data["_id"] = str(resultado.inserted_id)
    return jsonify(data), 201

# Obtener todas las reseñas
@review_controller.route('/all', methods=['GET'])
def listar_resenas():
    resenas = []
    for r in reviews_collection.find():
        r["_id"] = str(r["_id"])
        resenas.append(r)
    return jsonify(resenas), 200

# Obtener reseñas por barbero
@review_controller.route('/barbero/<barbero_id>', methods=['GET'])
def resenas_barbero(barbero_id):
    resenas = []
    for r in reviews_collection.find({"barbero_id": barbero_id}):
        r["_id"] = str(r["_id"])
        resenas.append(r)
    return jsonify(resenas), 200

# Eliminar reseña
@review_controller.route('/delete/<resena_id>', methods=['DELETE'])
def eliminar_resena(resena_id):
    resultado = reviews_collection.delete_one({"_id": ObjectId(resena_id)})
    if resultado.deleted_count == 0:
        return jsonify({"error": "Reseña no encontrada"}), 404
    return '', 204
