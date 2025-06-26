# cortate/backend/utils/helpers.py

from datetime import datetime
from bson import ObjectId

def formatear_objeto_bson(documento):
    """
    Convierte el ObjectId a string para serializar documentos de MongoDB.
    """
    documento["_id"] = str(documento["_id"])
    return documento

def formatear_fecha(fecha):
    """
    Convierte un string de fecha a objeto datetime o None si falla.
    """
    try:
        return datetime.strptime(fecha, "%Y-%m-%d")
    except:
        return None

def es_id_valido(id_str):
    """
    Verifica si un string es un ObjectId válido de MongoDB.
    """
    return ObjectId.is_valid(id_str)
