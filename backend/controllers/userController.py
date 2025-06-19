from flask import Blueprint, jsonify
usuarios = []

user_bp = Blueprint('user', __name__)

@user_bp.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    return jsonify(usuarios)
