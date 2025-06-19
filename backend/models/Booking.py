# cortate/backend/models/Booking.py

class Booking:
    def __init__(self, barbero_id, cliente_id, fecha, hora, servicio, tipo):
        self.id = None
        self.barbero = barbero_id
        self.cliente = cliente_id
        self.fecha = fecha
        self.hora = hora
        self.servicio = servicio
        self.tipo = tipo
        self.estado = "pendiente"
