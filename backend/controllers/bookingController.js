// cortate/backend/controllers/bookingController.js

const Booking = require('../models/Booking');
const Barber = require('../models/Barber');
const Penalty = require('../models/Penalty');

// Crear nueva reserva
const createBooking = async (req, res) => {
	try {
		const {
			barbero,
			servicio,
			monto,
			fechaReserva,
			horaReserva,
			tipoAtencion
		} = req.body;

		const nuevaReserva = new Booking({
			cliente: req.user.id,
			barbero,
			servicio,
			monto,
			fechaReserva,
			horaReserva,
			tipoAtencion
		});

		await nuevaReserva.save();

		res.status(201).json({ msg: 'Reserva creada. A la espera de confirmación.', reserva: nuevaReserva });
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al crear la reserva.' });
	}
};

// Confirmar manualmente (barbero)
const confirmarReserva = async (req, res) => {
	try {
		const reserva = await Booking.findById(req.params.id);
		if (!reserva) return res.status(404).json({ msg: 'Reserva no encontrada.' });

		if (reserva.barbero.toString() !== req.user.id)
			return res.status(401).json({ msg: 'No autorizado.' });

		reserva.estado = 'confirmado';
		reserva.confirmadoManual = true;

		await reserva.save();

		res.status(200).json({ msg: 'Reserva confirmada.' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al confirmar reserva.' });
	}
};

// Cancelar reserva
const cancelarReserva = async (req, res) => {
	try {
		const reserva = await Booking.findById(req.params.id);
		if (!reserva) return res.status(404).json({ msg: 'Reserva no encontrada.' });

		const esCliente = reserva.cliente.toString() === req.user.id;
		const esBarbero = reserva.barbero.toString() === req.user.id;

		if (!esCliente && !esBarbero)
			return res.status(401).json({ msg: 'No autorizado.' });

		reserva.estado = 'cancelado';
		reserva.canceladoPor = esCliente ? 'cliente' : 'barbero';
		await reserva.save();

		// Penalización si se cancela tarde o se rechaza
		if (reserva.estado === 'pendiente' || reserva.confirmadoManual) {
			await new Penalty({
				usuario: req.user.id,
				tipoUsuario: req.user.role,
				razon: 'cancelacionTardia',
				booking: reserva._id
			}).save();
		}

		res.status(200).json({ msg: 'Reserva cancelada.' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al cancelar reserva.' });
	}
};

// Ver reservas de usuario (cliente)
const getUserBookings = async (req, res) => {
	try {
		const reservas = await Booking.find({ cliente: req.user.id })
			.populate('barbero')
			.sort({ fechaReserva: -1 });

		res.status(200).json(reservas);
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al obtener reservas.' });
	}
};

// Ver reservas para barbero
const getBarberBookings = async (req, res) => {
	try {
		const reservas = await Booking.find({ barbero: req.user.id })
			.populate('cliente')
			.sort({ fechaReserva: -1 });

		res.status(200).json(reservas);
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al obtener reservas del barbero.' });
	}
};

module.exports = {
	createBooking,
	confirmarReserva,
	cancelarReserva,
	getUserBookings,
	getBarberBookings
};
