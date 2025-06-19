// cortate/backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true
	},
	password: {
		type: String,
		required: true,
		minlength: 6
	},
	phone: {
		type: String,
		required: false
	},
	role: {
		type: String,
		enum: ['cliente', 'barbero'],
		default: 'cliente'
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

// Encriptar contraseña antes de guardar
UserSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

// Comparar contraseña para login
UserSchema.methods.comparePassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
