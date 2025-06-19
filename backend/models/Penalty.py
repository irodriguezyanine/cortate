# cortate/backend/models/Penalty.py

class Penalty:
    def __init__(self, user_id, motivo, monto, fecha):
        self.id = None
        self.user_id = user_id
        self.motivo = motivo
        self.monto = monto
        self.fecha = fecha
