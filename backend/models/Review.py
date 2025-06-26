# cortate/backend/models/Review.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Review(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    barbero_id: str
    cliente_id: str
    comentario: Optional[str] = None
    puntuacion: int = Field(..., ge=1, le=5)
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }

