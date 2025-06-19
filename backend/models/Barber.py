# cortate/backend/models/Barber.py

class Barber:
    def __init__(self, nombre, email, telefono, servicios, precio_corte, precio_barba, tipo_atencion, descripcion):
        self.id = None
        self.nombre = nombre
        self.email = email
        self.telefono = telefono
        self.servicios = servicios
        self.precio_corte = precio_corte
        self.precio_barba = precio_barba
        self.tipo_atencion = tipo_atencion
        self.descripcion = descripcion
        self.imagenes = []
        self.tipo = "peluquero"
        self.reseñas = []
        self.estadisticas = {
            "total_cortes": 0,
            "total_ingresos": 0
        }
