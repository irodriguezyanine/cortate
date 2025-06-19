// cortate/backend/controllers/barberController.js

const Barber = require('../models/Barber');
const Review = require('../models/Review');

// Crear o actualizar perfil profesional del barbero
const crearActualizarPerfil = async (req, res) => {
	try {
		const userId = req.user.id;

		const {
			nombreBarberia,
			direccion,
			ubicacion,
			telefono,
			whatsapp,
			tipoAtencion,
			servicios,
			imagenes,
			descripcion,
			horarios
		} = req.body;

		let perfil = await Barber.findOne({ user: userId });

		if (perfil) {
			// Actualiza perfil existente
			Object.assign(perfil, {
				nombreBarberia,
				direccion,
				ubicacion,
				telefono,
				whatsapp,
				tipoAtencion,
				servicios,
				imagenes,
				descripcion,
				horarios
			});
			await perfil.save();
			return res.status(200).json({ msg: 'Perfil actualizado.', perfil });
		} else {
			// Crea nuevo perfil
			const nuevo = new Barber({
				user: userId,
				nombreBarberia,
				direccion,
				ubicacion,
				telefono,
				whatsapp,
				tipoAtencion,
				servicios,
				imagenes,
				descripcion,
				horarios
			});
			await nuevo.save();
			return res.status(201).json({ msg: 'Perfil creado.', perfil: nuevo });
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al guardar perfil.' });
	}
};

// Obtener todos los perfiles de barberos
const obtenerBarberos = async (req, res) => {
	try {
		const barberos = await Barber.find()
			.populate('user', 'name email')
			.sort({ fechaRegistro: -1 });

		res.status(200).json(barberos);
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al obtener barberos.' });
	}
};

// Obtener un perfil de barbero
const obtenerBarberoPorId = async (req, res) => {
	try {
		const barbero = await Barber.findById(req.params.id)
			.populate('user', 'name email');

		if (!barbero) return res.status(404).json({ msg: 'Barbero no encontrado.' });

		res.status(200).json(barbero);
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al obtener barbero.' });
	}
};

// Activar o desactivar "libre ahora"
const toggleDisponibleAhora = async (req, res) => {
	try {
		const barbero = await Barber.findOne({ user: req.user.id });
		if (!barbero) return res.status(404).json({ msg: 'Barbero no encontrado.' });

		barbero.disponibleAhora = !barbero.disponibleAhora;
		await barbero.save();

		res.status(200).json({ disponibleAhora: barbero.disponibleAhora });
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al actualizar estado.' });
	}
};

// Obtener estadísticas del barbero (para dashboard)
const obtenerEstadisticas = async (req, res) => {
	try {
		const barbero = await Barber.findOne({ user: req.user.id });
		if (!barbero) return res.status(404).json({ msg: 'Barbero no encontrado.' });

		const numCortes = barbero.numeroDeCortes || 0;
		const ingresos = barbero.ingresosTotales || 0;

		res.status(200).json({ cortes: numCortes, ingresos });
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al obtener estadísticas.' });
	}
};

module.exports = {
	crearActualizarPerfil,
	obtenerBarberos,
	obtenerBarberoPorId,
	toggleDisponibleAhora,
	obtenerEstadisticas
};
