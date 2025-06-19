from flask import Blueprint, request, jsonify
import requests

google_bp = Blueprint('google_places', __name__)
API_KEY = "AIzaSyDj7gIzf_lDToiZQbMN5_XSfZCxDp_rGjg"

@google_bp.route('/buscar-peluquerias', methods=['GET'])
def buscar_peluquerias():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    radius = request.args.get('radius', 2000)

    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": "hair_care",
        "key": API_KEY
    }

    response = requests.get(url, params=params)
    return jsonify(response.json())
