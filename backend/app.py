from flask import Flask, jsonify
from config.config import Config
from middleware.errorHandler import handle_error
from controllers.authController import auth_bp
from controllers.userController import user_bp
from controllers.barberController import barber_bp
from controllers.bookingController import booking_bp
from controllers.reviewController import review_bp
from controllers.penaltyController import penalty_bp
from controllers.googlePlacesController import google_bp
from controllers.dashboardController import dashboard_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/usuarios')
    app.register_blueprint(barber_bp, url_prefix='/api/barberos')
    app.register_blueprint(booking_bp, url_prefix='/api')
    app.register_blueprint(review_bp, url_prefix='/api')
    app.register_blueprint(penalty_bp, url_prefix='/api')
    app.register_blueprint(google_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')

    # Error handler
    app.register_error_handler(Exception, handle_error)

    @app.route('/')
    def index():
        return jsonify({"mensaje": "Bienvenido a la API de Córtate.cl"}), 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
