# cortate/backend/config/database.py

import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Carga las variables de entorno desde .env si estás en local
load_dotenv()

# URI de conexión a MongoDB (Render o local)
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "cortate_cl")

# Inicializa el cliente de Mongo
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Exporta todas las colecciones necesarias
usuarios_collection = db["usuarios"]
barberos_collection = db["barberos"]
reservas_collection = db["reservas"]
reseñas_collection = db["reseñas"]
penalizaciones_collection = db["penalizaciones"]

# Puedes también definir JWT_SECRET aquí si lo necesitas en otras partes
JWT_SECRET = os.getenv("JWT_SECRET", "default_secret")
