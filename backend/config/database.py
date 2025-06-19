from pymongo import MongoClient
import os

# Conexión a MongoDB Atlas usando la variable de entorno
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)

# Selección de base de datos y colecciones
db = client["cortate"]
usuarios_collection = db["usuarios"]
peluqueros_collection = db["peluqueros"]
reservas_collection = db["reservas"]
resenas_collection = db["resenas"]
penalizaciones_collection = db["penalizaciones"]
ingresos_collection = db["ingresos"]
