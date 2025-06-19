// cortate/backend/models/Review.js

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
	barbero: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Barber',
		required: true
	},
	cliente: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: false
	},
	booking: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Booking',
		required: false
	},
	estrellas: {
		type: Number,
		min: 1,
		max: 5,
		required: true
	},
	comentario: {
		type: String,
		required: false
	},
	fotoCliente: {
		type: String // URL o ruta de la imagen
	},
	eliminadoPorBarbero: {
		type: Boolean,
		default: false
	},
	fecha: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Review', ReviewSchema);
