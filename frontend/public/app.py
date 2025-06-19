# cortate/backend/app.py
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid

app = Flask(__name__)
CORS(app)

# Configuración
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB

# Simulación de base de datos en memoria
usuarios = []
peluqueros = []
reservas = []
reseñas = []

# Rutas públicas (Frontend)
@app.route('/')
def index():
    return send_from_directory('../frontend/public', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend/public', path)

# Registro de usuario (cliente)
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.form
    user = {
        'id': str(uuid.uuid4()),
        'nombre': data.get('nombre'),
        'email': data.get('email'),
        'telefono': data.get('telefono'),
        'password': data.get('password'),
        'tipo': 'cliente'
    }
    usuarios.append(user)
    return jsonify({'mensaje': 'Usuario registrado con éxito', 'user': user})

# Registro de peluquero
@app.route('/api/registro-barbero', methods=['POST'])
def register_barber():
    data = request.form
    barber = {
        'id': str(uuid.uuid4()),
        'nombre': data.get('nombre'),
        'email': data.get('email'),
        'telefono': data.get('telefono'),
        'servicios': data.getlist('servicios'),
        'precio_corte': data.get('precio_corte'),
        'precio_barba': data.get('precio_barba'),
        'tipo_atencion': data.get('tipo_atencion'),
        'descripcion': data.get('descripcion'),
        'imagenes': [],
        'tipo': 'peluquero'
    }

    if 'imagenes' in request.files:
        files = request.files.getlist('imagenes')
        for file in files:
            if file.filename != '':
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                barber['imagenes'].append(filename)

    peluqueros.append(barber)
    return jsonify({'mensaje': 'Barbero registrado', 'barber': barber})

# Crear reserva
@app.route('/api/reserva', methods=['POST'])
def crear_reserva():
    data = request.form
    reserva = {
        'id': str(uuid.uuid4()),
        'barbero': data.get('barbero'),
        'cliente': data.get('cliente'),
        'fecha': data.get('fecha'),
        'hora': data.get('hora'),
        'servicio': data.get('servicio'),
        'tipo': data.get('tipo'),
        'estado': 'pendiente'
    }
    reservas.append(reserva)
    return jsonify({'mensaje': 'Reserva creada', 'reserva': reserva})

# Enviar reseña
@app.route('/api/reseña', methods=['POST'])
def enviar_resena():
    data = request.form
    review = {
        'id': str(uuid.uuid4()),
        'barbero': data.get('barbero'),
        'cliente': data.get('cliente'),
        'comentario': data.get('comentario'),
        'puntuacion': int(data.get('puntuacion'))
    }
    reseñas.append(review)
    return jsonify({'mensaje': 'Reseña enviada', 'review': review})

# Obtener peluqueros
@app.route('/api/peluqueros', methods=['GET'])
def get_barbers():
    return jsonify(peluqueros)

# Obtener reservas por usuario
@app.route('/api/reservas/<user_id>', methods=['GET'])
def get_reservas_por_usuario(user_id):
    resultado = [r for r in reservas if r['cliente'] == user_id or r['barbero'] == user_id]
    return jsonify(resultado)

# Obtener reseñas de un barbero
@app.route('/api/reseñas/<barbero_id>', methods=['GET'])
def get_reseñas_de_barbero(barbero_id):
    resultado = [r for r in reseñas if r['barbero'] == barbero_id]
    return jsonify(resultado)

# Iniciar la aplicación
if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug=True, port=5000)
