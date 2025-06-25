# cortate/backend/config/database.py

from pymongo import MongoClient
import os

# Carga la URL de conexión desde variables de entorno o usa un valor por defecto
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

# Nombre de la base de datos
DB_NAME = "cortate_db"

# Inicializa el cliente de Mongo
client = MongoClient(MONGO_URI)

# Base de datos principal
db = client[DB_NAME]

# Colecciones
usuarios_collection = db["usuarios"]
barberos_collection = db["barberos"]
reservas_collection = db["reservas"]
reseñas_collection = db["reseñas"]
penalizaciones_collection = db["penalizaciones"]
