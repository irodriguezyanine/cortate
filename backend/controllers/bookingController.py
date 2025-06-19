from flask import Blueprint, request, jsonify
import uuid

booking_bp = Blueprint('booking', __name__)
reservas = []

@booking_bp.route('/reservas', methods=['POST'])
def crear_reserva():
    data = request.get_json()
    nueva = {
        "id": str(uuid.uuid4()),
        "barbero": data.get("barbero"),
        "cliente": data.get("cliente"),
        "fecha": data.get("fecha"),
        "hora": data.get("hora"),
        "servicio": data.get("servicio"),
        "tipo": data.get("tipo"),
        "estado": "pendiente"
    }
    reservas.append(nueva)
    return jsonify({"mensaje": "Reserva creada", "reserva": nueva})

@booking_bp.route('/reservas/<cliente_id>', methods=['GET'])
def obtener_reservas_cliente(cliente_id):
    resultado = [r for r in reservas if r['cliente'] == cliente_id]
    return jsonify(resultado)
