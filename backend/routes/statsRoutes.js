// cortate/backend/routes/statsRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/statsController');

// Obtener estadísticas generales (requiere autenticación)
router.get('/global', auth, getDashboardStats);

module.exports = router;
