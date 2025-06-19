// cortate/backend/routes/penaltyRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Penalty = require('../models/Penalty');

// Obtener penalizaciones del usuario autenticado
router.get('/mias', auth, async (req, res) => {
	try {
		const penalties = await Penalty.find({ usuario: req.user.id }).sort({ fecha: -1 });
		res.status(200).json(penalties);
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al obtener penalizaciones.' });
	}
});

module.exports = router;
