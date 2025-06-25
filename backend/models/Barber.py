# cortate/backend/models/Barber.py
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

class Barber(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    nombre: str
    email: EmailStr
    telefono: str
    servicios: List[str]
    precio_corte: float
    precio_barba: float
    tipo_atencion: str  # 'local', 'domicilio' o 'mixto'
    descripcion: Optional[str] = None
    imagenes: List[str] = []
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
