// cortate/backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// Registro de nuevo usuario
router.post('/registro', async (req, res) => {
	try {
		const { name, email, password, role } = req.body;

		let user = await User.findOne({ email });
		if (user) return res.status(400).json({ msg: 'El correo ya está registrado.' });

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		user = new User({
			name,
			email,
			password: hashedPassword,
			role: role || 'cliente'
		});

		await user.save();

		const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
			expiresIn: '7d'
		});

		res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role } });
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al registrar usuario.' });
	}
});

// Login
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ msg: 'Credenciales inválidas.' });

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) return res.status(400).json({ msg: 'Credenciales inválidas.' });

		const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
			expiresIn: '7d'
		});

		res.status(200).json({ token, user: { id: user._id, name: user.name, role: user.role } });
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al iniciar sesión.' });
	}
});

// Verificar token
router.get('/verificar', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.status(200).json(user);
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al verificar usuario.' });
	}
});

module.exports = router;
