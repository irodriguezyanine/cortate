# cortate/backend/controllers/barberController.py

from flask import Blueprint, request, jsonify
from bson import ObjectId
from config.database import barbers_collection

barber_controller = Blueprint('barber_controller', __name__)

# Registrar un barbero
@barber_controller.route('/create', methods=['POST'])
def crear_barbero():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos incompletos"}), 400
    resultado = barbers_collection.insert_one(data)
    data["_id"] = str(resultado.inserted_id)
    return jsonify(data), 201

# Obtener todos los barberos
@barber_controller.route('/all', methods=['GET'])
def listar_barberos():
    barberos = []
    for b in barbers_collection.find():
        b["_id"] = str(b["_id"])
        barberos.append(b)
    return jsonify(barberos), 200

# Obtener barbero por ID
@barber_controller.route('/<barber_id>', methods=['GET'])
def obtener_barbero(barber_id):
    barbero = barbers_collection.find_one({"_id": ObjectId(barber_id)})
    if not barbero:
        return jsonify({"error": "Barbero no encontrado"}), 404
    barbero["_id"] = str(barbero["_id"])
    return jsonify(barbero), 200

# Actualizar perfil de barbero
@barber_controller.route('/update/<barber_id>', methods=['PUT'])
def actualizar_barbero(barber_id):
    data = request.get_json()
    resultado = barbers_collection.update_one({"_id": ObjectId(barber_id)}, {"$set": data})
    if resultado.matched_count == 0:
        return jsonify({"error": "Barbero no encontrado"}), 404
    return jsonify({"mensaje": "Perfil actualizado correctamente"}), 200

# Eliminar barbero
@barber_controller.route('/delete/<barber_id>', methods=['DELETE'])
def eliminar_barbero(barber_id):
    resultado = barbers_collection.delete_one({"_id": ObjectId(barber_id)})
    if resultado.deleted_count == 0:
        return jsonify({"error": "Barbero no encontrado"}), 404
    return '', 204
