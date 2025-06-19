# cortate/backend/models/Revenue.py

class Revenue:
    def __init__(self, barbero_id, monto, servicio, fecha):
        self.id = None
        self.barbero_id = barbero_id
        self.monto = monto
        self.servicio = servicio
        self.fecha = fecha
