// cortate/backend/models/Booking.js

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
	cliente: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	barbero: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Barber',
		required: true
	},
	servicio: {
		type: String,
		enum: ['corteHombre', 'corteBarba', 'corte+barba', 'ninos', 'express', 'diseno', 'padreHijo'],
		required: true
	},
	monto: {
		type: Number,
		required: true
	},
	fechaReserva: {
		type: Date,
		required: true
	},
	horaReserva: {
		type: String,
		required: true
	},
	estado: {
		type: String,
		enum: ['pendiente', 'confirmado', 'realizado', 'cancelado', 'rechazado'],
		default: 'pendiente'
	},
	creadoEn: {
		type: Date,
		default: Date.now
	},
	confirmadoManual: {
		type: Boolean,
		default: false
	},
	canceladoPor: {
		type: String,
		enum: ['cliente', 'barbero', null],
		default: null
	},
	tipoAtencion: {
		type: String,
		enum: ['local', 'domicilio'],
		required: true
	},
	penalizacion: {
		type: Boolean,
		default: false
	}
});

module.exports = mongoose.model('Booking', BookingSchema);
