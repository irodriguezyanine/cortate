# cortate/backend/utils/geo.py

from geopy.distance import geodesic

def calcular_distancia_km(coord1, coord2):
    """
    Calcula la distancia en kilómetros entre dos coordenadas GPS.
    coord1 y coord2 deben ser tuplas: (latitud, longitud)
    """
    try:
        return round(geodesic(coord1, coord2).km, 2)
    except Exception as e:
        print(f"Error al calcular distancia: {e}")
        return None
