from flask import Blueprint, jsonify, request
import uuid

barber_bp = Blueprint('barber', __name__)
peluqueros = []

@barber_bp.route('/barberos', methods=['GET'])
def obtener_barberos():
    return jsonify(peluqueros)

@barber_bp.route('/barberos', methods=['POST'])
def registrar_barbero():
    data = request.get_json()
    nuevo = {
        "id": str(uuid.uuid4()),
        "nombre": data.get("nombre"),
        "email": data.get("email"),
        "telefono": data.get("telefono"),
        "descripcion": data.get("descripcion"),
        "servicios": data.get("servicios"),
        "precio_corte": data.get("precio_corte"),
        "precio_barba": data.get("precio_barba"),
        "tipo_atencion": data.get("tipo_atencion"),
        "reseñas": [],
        "imagenes": []
    }
    peluqueros.append(nuevo)
    return jsonify({"mensaje": "Barbero registrado", "barbero": nuevo})
