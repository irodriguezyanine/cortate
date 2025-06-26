# cortate/backend/controllers/reviewController.py

from flask import Blueprint, request, jsonify
from bson import ObjectId
from config.database import reviews_collection
from datetime import datetime

review_controller = Blueprint('review_controller', __name__)

# Crear nueva reseña
@review_controller.route('/create', methods=['POST'])
def crear_review():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos faltantes"}), 400
    
    data["fecha"] = datetime.utcnow().isoformat()
    resultado = reviews_collection.insert_one(data)
    data["_id"] = str(resultado.inserted_id)
    return jsonify(data), 201

# Obtener todas las reseñas
@review_controller.route('/all', methods=['GET'])
def listar_reviews():
    reviews = []
    for r in reviews_collection.find():
        r["_id"] = str(r["_id"])
        reviews.append(r)
    return jsonify(reviews), 200

# Obtener reseñas por barbero
@review_controller.route('/barber/<barber_id>', methods=['GET'])
def reviews_por_barbero(barber_id):
    reviews = []
    for r in reviews_collection.find({"barber_id": barber_id}):
        r["_id"] = str(r["_id"])
        reviews.append(r)
    return jsonify(reviews), 200

# Eliminar reseña
@review_controller.route('/delete/<review_id>', methods=['DELETE'])
def eliminar_review(review_id):
    resultado = reviews_collection.delete_one({"_id": ObjectId(review_id)})
    if resultado.deleted_count == 0:
        return jsonify({"error": "Reseña no encontrada"}), 404
    return '', 204
