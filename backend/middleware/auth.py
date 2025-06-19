from flask import jsonify

def handle_error(e):
    response = {
        "error": str(e),
        "mensaje": "Ha ocurrido un error inesperado."
    }
    return jsonify(response), 500
