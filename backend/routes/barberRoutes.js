// cortate/backend/routes/barberRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
	crearActualizarPerfil,
	obtenerBarberos,
	obtenerBarberoPorId,
	toggleDisponibleAhora,
	obtenerEstadisticas
} = require('../controllers/barberController');

// Crear o actualizar perfil de barbero
router.post('/perfil', auth, crearActualizarPerfil);

// Obtener todos los barberos (público)
router.get('/', obtenerBarberos);

// Obtener un barbero específico
router.get('/:id', obtenerBarberoPorId);

// Cambiar disponibilidad (tipo Uber)
router.patch('/toggle-disponibilidad', auth, toggleDisponibleAhora);

// Obtener estadísticas (dashboard)
router.get('/dashboard/stats', auth, obtenerEstadisticas);

module.exports = router;
