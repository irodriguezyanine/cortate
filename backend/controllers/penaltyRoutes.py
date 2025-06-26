# cortate/backend/routes/penaltyRoutes.py
from fastapi import APIRouter
from controllers import penaltyController

router = APIRouter()

# Incluye todas las rutas del controlador de penalizaciones
router.include_router(penaltyController.router, tags=["Penalizaciones"])
