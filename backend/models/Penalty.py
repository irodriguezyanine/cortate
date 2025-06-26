# cortate/backend/models/Penalty.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Penalty(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    usuario_id: str  # Puede ser barbero o cliente
    tipo: str  # 'atraso', 'rechazo_reserva', 'ausencia', etc.
    descripcion: Optional[str] = None
    puntos: int  # puntos asociados a la penalización (por ejemplo, 1 a 5)
    generado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
