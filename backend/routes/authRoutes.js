// cortate/backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	getCurrentUser
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Registro
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Perfil actual (autenticado)
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;
