# cortate/backend/middleware/uploadMiddleware.py

import os
from werkzeug.utils import secure_filename
from flask import request, jsonify

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def handle_upload(file_key):
    if file_key not in request.files:
        return None, jsonify({"error": f"Archivo '{file_key}' no encontrado"}), 400
    file = request.files[file_key]
    if file.filename == '':
        return None, jsonify({"error": "Nombre de archivo vacío"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        path = os.path.join(UPLOAD_FOLDER, filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file.save(path)
        return path, None, None
    return None, jsonify({"error": "Formato no permitido"}), 400
