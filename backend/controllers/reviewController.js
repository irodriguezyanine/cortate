// cortate/backend/controllers/reviewController.js

const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Barber = require('../models/Barber');

// Crear reseña (cliente)
const crearResena = async (req, res) => {
	try {
		const { barberoId } = req.params;
		const { estrellas, comentario, fotoCliente } = req.body;

		let puedeComentar = false;

		// Verificar si el usuario reservó con ese barbero
		const reservas = await Booking.find({
			cliente: req.user.id,
			barbero: barberoId,
			estado: 'realizado'
		});

		if (reservas.length > 0) puedeComentar = true;

		// Si el barbero no tiene perfil registrado, permitir igual (caso Google)
		const barbero = await Barber.findById(barberoId);

		if (!barbero && !puedeComentar) {
			// caso barbería sin perfil registrado
			puedeComentar = true;
		}

		if (!puedeComentar) {
			return res.status(403).json({ msg: 'No puedes comentar sin una reserva previa realizada.' });
		}

		const nuevaResena = new Review({
			barbero: barberoId,
			cliente: req.user.id,
			estrellas,
			comentario,
			fotoCliente,
			booking: reservas[0]?._id
		});

		await nuevaResena.save();

		// Vincular reseña al barbero (si tiene perfil)
		if (barbero) {
			barbero.resenas.push(nuevaResena._id);
			await barbero.save();
		}

		res.status(201).json({ msg: 'Reseña creada.', resena: nuevaResena });
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al crear reseña.' });
	}
};

// Obtener reseñas por barbero
const obtenerResenas = async (req, res) => {
	try {
		const { barberoId } = req.params;
		const resenas = await Review.find({ barbero: barberoId })
			.sort({ fecha: -1 })
			.populate('cliente', 'name');

		const formato = resenas.map((r) => ({
			id: r._id,
			estrellas: r.estrellas,
			comentario: r.eliminadoPorBarbero ? 'Comentario eliminado por peluquero :(' : r.comentario,
			fotoCliente: r.fotoCliente,
			fecha: r.fecha,
			cliente: r.cliente?.name || 'Anónimo'
		}));

		res.status(200).json(formato);
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al obtener reseñas.' });
	}
};

// Eliminar reseña (peluquero)
const eliminarResena = async (req, res) => {
	try {
		const resena = await Review.findById(req.params.id);
		if (!resena) return res.status(404).json({ msg: 'Reseña no encontrada.' });

		const barberoId = resena.barbero.toString();
		if (barberoId !== req.user.id)
			return res.status(401).json({ msg: 'No autorizado.' });

		resena.eliminadoPorBarbero = true;
		await resena.save();

		res.status(200).json({ msg: 'Reseña marcada como eliminada por peluquero.' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al eliminar reseña.' });
	}
};

module.exports = {
	crearResena,
	obtenerResenas,
	eliminarResena
};
