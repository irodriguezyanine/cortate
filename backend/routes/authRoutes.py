# cortate/backend/routes/authRoutes.py

from flask import Blueprint

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    return {"message": "Login route works"}
