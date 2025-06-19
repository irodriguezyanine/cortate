from flask import Blueprint, request, jsonify
import uuid

penalty_bp = Blueprint('penalty', __name__)
penalizaciones = []

@penalty_bp.route('/penalizaciones', methods=['POST'])
def registrar_penalizacion():
    data = request.get_json()
    nueva = {
        "id": str(uuid.uuid4()),
        "user_id": data.get("user_id"),
        "motivo": data.get("motivo"),
        "monto": data.get("monto"),
        "fecha": data.get("fecha")
    }
    penalizaciones.append(nueva)
    return jsonify({"mensaje": "Penalización registrada", "penalizacion": nueva})
