# cortate/backend/controllers/bookingController.py

from flask import Blueprint, request, jsonify
from bson import ObjectId
from config.database import bookings_collection

booking_controller = Blueprint('booking_controller', __name__)

# Crear reserva
@booking_controller.route('/create', methods=['POST'])
def crear_reserva():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos incompletos"}), 400
    resultado = bookings_collection.insert_one(data)
    data["_id"] = str(resultado.inserted_id)
    return jsonify(data), 201

# Obtener todas las reservas
@booking_controller.route('/all', methods=['GET'])
def listar_reservas():
    reservas = []
    for r in bookings_collection.find():
        r["_id"] = str(r["_id"])
        reservas.append(r)
    return jsonify(reservas), 200

# Obtener reservas de un cliente
@booking_controller.route('/cliente/<cliente_id>', methods=['GET'])
def reservas_cliente(cliente_id):
    reservas = []
    for r in bookings_collection.find({"cliente_id": cliente_id}):
        r["_id"] = str(r["_id"])
        reservas.append(r)
    return jsonify(reservas), 200

# Obtener reservas de un barbero
@booking_controller.route('/barbero/<barbero_id>', methods=['GET'])
def reservas_barbero(barbero_id):
    reservas = []
    for r in bookings_collection.find({"barbero_id": barbero_id}):
        r["_id"] = str(r["_id"])
        reservas.append(r)
    return jsonify(reservas), 200

# Cancelar reserva
@booking_controller.route('/delete/<reserva_id>', methods=['DELETE'])
def cancelar_reserva(reserva_id):
    resultado = bookings_collection.delete_one({"_id": ObjectId(reserva_id)})
    if resultado.deleted_count == 0:
        return jsonify({"error": "Reserva no encontrada"}), 404
    return '', 204
