// cortate/backend/routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
	crearResena,
	obtenerResenas,
	eliminarResena
} = require('../controllers/reviewController');

// Crear reseña (cliente)
router.post('/:barberoId', auth, crearResena);

// Obtener reseñas de un barbero
router.get('/:barberoId', obtenerResenas);

// Eliminar reseña (barbero)
router.delete('/eliminar/:id', auth, eliminarResena);

module.exports = router;
