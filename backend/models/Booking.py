# cortate/backend/models/Booking.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Booking(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    barbero_id: str  # ID del barbero
    cliente_id: str  # ID del cliente
    fecha: str  # formato esperado: 'YYYY-MM-DD'
    hora: str  # formato esperado: 'HH:MM'
    servicio: str  # tipo de servicio: corte, barba, etc.
    tipo: str  # 'domicilio' o 'local'
    estado: str = "pendiente"  # otros posibles: confirmado, cancelado, finalizado
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
