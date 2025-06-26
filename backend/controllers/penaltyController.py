# cortate/backend/controllers/penaltyController.py
from fastapi import APIRouter, HTTPException, status
from models.Penalty import Penalty
from config.database import penalties_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter()

# Crear penalización
@router.post("/penalizaciones")
async def crear_penalizacion(penalty: Penalty):
    nueva_penalizacion = penalty.dict(by_alias=True)
    resultado = await penalties_collection.insert_one(nueva_penalizacion)
    nueva_penalizacion["_id"] = str(resultado.inserted_id)
    return nueva_penalizacion

# Obtener todas las penalizaciones
@router.get("/penalizaciones")
async def listar_penalizaciones():
    penalizaciones = []
    async for p in penalties_collection.find():
        p["_id"] = str(p["_id"])
        penalizaciones.append(p)
    return penalizaciones

# Obtener penalizaciones por usuario
@router.get("/penalizaciones/{usuario_id}")
async def obtener_penalizaciones_usuario(usuario_id: str):
    penalizaciones = []
    async for p in penalties_collection.find({"usuario_id": usuario_id}):
        p["_id"] = str(p["_id"])
        penalizaciones.append(p)
    return penalizaciones

# Eliminar penalización
@router.delete("/penalizaciones/{penalty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_penalizacion(penalty_id: str):
    resultado = await penalties_collection.delete_one({"_id": ObjectId(penalty_id)})
    if resultado.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Penalización no encontrada")
    return
