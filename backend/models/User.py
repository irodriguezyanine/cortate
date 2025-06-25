# cortate/backend/models/User.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    nombre: str
    email: EmailStr
    telefono: str
    password: str
    tipo: str = "cliente"  # puede ser 'cliente' o 'barbero'
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
