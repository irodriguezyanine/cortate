// cortate/backend/models/Barber.js

const mongoose = require('mongoose');

const BarberSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		unique: true
	},
	nombreBarberia: {
		type: String,
		required: true
	},
	direccion: {
		type: String,
		required: true
	},
	ubicacion: {
		lat: Number,
		lng: Number
	},
	telefono: {
		type: String,
		required: true
	},
	whatsapp: {
		type: String,
		required: true
	},
	tipoAtencion: {
		type: String,
		enum: ['local', 'domicilio', 'mixto'],
		required: true
	},
	servicios: {
		corteHombre: { type: Number, required: true },
		corteBarba: { type: Number, required: true },
		ninos: Number,
		express: Number,
		diseno: Number,
		padreHijo: Number
	},
	imagenes: [String], // URLs o rutas locales
	numeroDeCortes: {
		type: Number,
		default: 0
	},
	calificacionPromedio: {
		type: Number,
		default: 0
	},
	resenas: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Review'
		}
	],
	descripcion: {
		type: String
	},
	disponibleAhora: {
		type: Boolean,
		default: false
	},
	horarios: {
		lunes: String,
		martes: String,
		miercoles: String,
		jueves: String,
		viernes: String,
		sabado: String,
		domingo: String
	},
	ingresosTotales: {
		type: Number,
		default: 0
	},
	fechaRegistro: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Barber', BarberSchema);
