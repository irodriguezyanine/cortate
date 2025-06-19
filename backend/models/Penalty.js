// cortate/backend/models/Penalty.js

const mongoose = require('mongoose');

const PenaltySchema = new mongoose.Schema({
	usuario: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	tipoUsuario: {
		type: String,
		enum: ['cliente', 'barbero'],
		required: true
	},
	razon: {
		type: String,
		enum: ['noAsistencia', 'retraso', 'rechazo', 'cancelacionTardia'],
		required: true
	},
	booking: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Booking',
		required: false
	},
	fecha: {
		type: Date,
		default: Date.now
	},
	resuelto: {
		type: Boolean,
		default: false
	}
});

module.exports = mongoose.model('Penalty', PenaltySchema);
