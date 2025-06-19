from flask import Blueprint, request, jsonify
import uuid

review_bp = Blueprint('review', __name__)
reseñas = []

@review_bp.route('/reseñas', methods=['POST'])
def agregar_reseña():
    data = request.get_json()
    nueva = {
        "id": str(uuid.uuid4()),
        "barbero": data.get("barbero"),
        "cliente": data.get("cliente"),
        "comentario": data.get("comentario"),
        "puntuacion": data.get("puntuacion"),
        "visible": True
    }
    reseñas.append(nueva)
    return jsonify({"mensaje": "Reseña agregada", "reseña": nueva})

@review_bp.route('/reseñas/<barbero_id>', methods=['GET'])
def obtener_reseñas_barbero(barbero_id):
    return jsonify([r for r in reseñas if r["barbero"] == barbero_id])
