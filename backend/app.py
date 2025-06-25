# cortate/backend/app.py

from flask import Flask
from flask_cors import CORS
from config.database import init_db
from routes.authRoutes import auth_bp
from routes.userRoutes import user_bp
from routes.barberRoutes import barber_bp
from routes.bookingRoutes import booking_bp
from routes.reviewRoutes import review_bp

app = Flask(__name__)
CORS(app)

# Inicializar conexión a la base de datos
init_db(app)

# Registrar Blueprints (rutas organizadas)
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/users")
app.register_blueprint(barber_bp, url_prefix="/api/barbers")
app.register_blueprint(booking_bp, url_prefix="/api/bookings")
app.register_blueprint(review_bp, url_prefix="/api/reviews")

# Ruta raíz para verificar que el backend está corriendo
@app.route('/')
def index():
    return {"mensaje": "¡Bienvenido a la API de Córtate.cl!"}

if __name__ == '__main__':
    app.run(debug=True, port=5000)
