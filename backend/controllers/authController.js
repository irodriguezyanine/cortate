// cortate/backend/controllers/authController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Crear token JWT
const generateToken = (user) => {
	return jwt.sign(
		{ id: user._id, role: user.role },
		process.env.JWT_SECRET,
		{ expiresIn: '7d' }
	);
};

// POST /api/auth/register
const registerUser = async (req, res) => {
	try {
		const { name, email, password, role } = req.body;

		const existing = await User.findOne({ email });
		if (existing) return res.status(400).json({ msg: 'Ya existe una cuenta con este correo.' });

		const user = new User({ name, email, password, role });
		await user.save();

		res.status(201).json({
			token: generateToken(user),
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role
			}
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al registrar usuario.' });
	}
};

// POST /api/auth/login
const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ msg: 'Credenciales inválidas.' });

		const isMatch = await user.comparePassword(password);
		if (!isMatch) return res.status(400).json({ msg: 'Contraseña incorrecta.' });

		res.status(200).json({
			token: generateToken(user),
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role
			}
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al iniciar sesión.' });
	}
};

// GET /api/auth/me
const getCurrentUser = async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.status(200).json(user);
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al obtener usuario.' });
	}
};

module.exports = {
	registerUser,
	loginUser,
	getCurrentUser
};
