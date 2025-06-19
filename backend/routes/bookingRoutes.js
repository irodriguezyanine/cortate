// cortate/backend/routes/bookingRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
	createBooking,
	confirmarReserva,
	cancelarReserva,
	getUserBookings,
	getBarberBookings
} = require('../controllers/bookingController');

// Crear nueva reserva (cliente)
router.post('/', auth, createBooking);

// Confirmar reserva manualmente (barbero)
router.patch('/confirmar/:id', auth, confirmarReserva);

// Cancelar reserva (cliente o barbero)
router.patch('/cancelar/:id', auth, cancelarReserva);

// Ver reservas del cliente autenticado
router.get('/mias', auth, getUserBookings);

// Ver reservas del barbero autenticado
router.get('/barbero', auth, getBarberBookings);

module.exports = router;
