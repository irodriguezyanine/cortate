# cortate/backend/app.py

from flask import Flask
from flask_cors import CORS
import os

# Importa tu base de datos Mongo (ya inicializada)
from config import database

# Importación de rutas organizadas (Blueprints)
from routes.authRoutes import auth_bp
from routes.userRoutes import user_bp
from routes.barberRoutes import barber_bp
from routes.bookingRoutes import booking_bp
from routes.reviewRoutes import review_bp
from routes.penaltyRoutes import penalty_bp

# Middleware para manejo de errores globales
from middleware.errorHandler import register_error_handlers

# Configuración del entorno
app = Flask(__name__, static_folder="../frontend/static", template_folder="../frontend/templates")
CORS(app)

# Registrar rutas
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(barber_bp, url_prefix="/api/barbers")
app.register_blueprint(booking_bp, url_prefix="/api/bookings")
app.register_blueprint(review_bp, url_prefix="/api/reviews")
app.register_blueprint(penalty_bp, url_prefix="/api/penalties")

# Middleware de errores
register_error_handlers(app)

# Ruta raíz
@app.route('/')
def index():
    return {"mensaje": "¡Bienvenido a la API de Córtate.cl con MongoDB!"}

# Ruta para servir la app
@app.route('/<path:path>')
def static_proxy(path):
    return app.send_static_file(path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
