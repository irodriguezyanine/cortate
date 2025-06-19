# cortate/backend/models/User.py

class User:
    def __init__(self, nombre, email, telefono, password):
        self.id = None
        self.nombre = nombre
        self.email = email
        self.telefono = telefono
        self.password = password
        self.tipo = "cliente"
