# cortate/backend/controllers/googlePlacesController.py

import os
import requests
from flask import Blueprint, request, jsonify

google_places_controller = Blueprint('google_places_controller', __name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

@google_places_controller.route('/barberias', methods=['GET'])
def buscar_barberias():
    location = request.args.get('location')  # Ej: "-33.4372,-70.6506"
    radius = request.args.get('radius', default=1500)
    keyword = request.args.get('keyword', default='barbería')

    if not location:
        return jsonify({"error": "Parámetro 'location' requerido"}), 400

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": location,
        "radius": radius,
        "keyword": keyword,
        "key": GOOGLE_API_KEY
    }

    response = requests.get(url, params=params)

    if response.status_code != 200:
        return jsonify({"error": "Error consultando Google Places"}), 500

    return jsonify(response.json()), 200
