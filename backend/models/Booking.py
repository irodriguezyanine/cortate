# cortate/backend/models/Booking.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Booking(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    barbero_id: str  # ID del barbero
    cliente_id: str  # ID del cliente
    fecha: str       # Fecha en formato YYYY-MM-DD
    hora: str        # Hora en formato HH:MM
    servicio: str    # Tipo de servicio reservado
    tipo: str        # 'local' o 'domicilio'
    estado: str = "pendiente"  # 'pendiente', 'confirmado', 'cancelado', etc.
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
