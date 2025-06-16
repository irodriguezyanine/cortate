const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    applyPenalty,
    getBarberPenalties,
    appealPenalty,
    processAppeal,
    cancelPenalty,
    getPenaltyStats,
    getPendingAppeals,
    checkAutomaticPenalties,
    cleanupExpiredPenalties
} = require('../controllers/penaltyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Rate limiting
const penaltyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 requests por IP
    message: {
        success: false,
        error: 'Demasiadas solicitudes de penalizaciones',
        code: 'TOO_MANY_REQUESTS'
    }
});

const appealLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // 5 apelaciones por hora por IP
    message: {
        success: false,
        error: 'Demasiadas apelaciones en poco tiempo',
        code: 'TOO_MANY_APPEALS'
    }
});

const systemLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 operaciones de sistema por hora
    message: {
        success: false,
        error: 'Demasiadas operaciones de sistema',
        code: 'TOO_MANY_SYSTEM_OPERATIONS'
    }
});

// ===================================================
// RUTAS PARA BARBEROS
// ===================================================

/**
 * @route   GET /api/penalties/barber/:barberId
 * @desc    Obtener penalizaciones de un barbero
 * @access  Private (Barber/Admin)
 */
router.get('/barber/:barberId', protect, penaltyLimiter, getBarberPenalties);

/**
 * @route   POST /api/penalties/:id/appeal
 * @desc    Apelar una penalización
 * @access  Private (Barber)
 */
router.post('/:id/appeal', 
    protect, 
    authorize('barber'), 
    appealLimiter,
    upload.array('evidence', 5),
    appealPenalty
);

// ===================================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin)
// ===================================================

/**
 * @route   POST /api/penalties/apply
 * @desc    Aplicar penalización manual
 * @access  Private (Admin)
 */
router.post('/apply', protect, authorize('admin'), penaltyLimiter, applyPenalty);

/**
 * @route   GET /api/penalties/admin/stats
 * @desc    Obtener estadísticas de penalizaciones del sistema
 * @access  Private (Admin)
 */
router.get('/admin/stats', protect, authorize('admin'), getPenaltyStats);

/**
 * @route   GET /api/penalties/admin/appeals
 * @desc    Obtener apelaciones pendientes
 * @access  Private (Admin)
 */
router.get('/admin/appeals', protect, authorize('admin'), getPendingAppeals);

/**
 * @route   PUT /api/penalties/:id/appeal/process
 * @desc    Procesar apelación (aprobar/rechazar)
 * @access  Private (Admin)
 */
router.put('/:id/appeal/process', protect, authorize('admin'), processAppeal);

/**
 * @route   DELETE /api/penalties/:id
 * @desc    Cancelar penalización
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('admin'), cancelPenalty);

// ===================================================
// RUTAS DE SISTEMA (Cron Jobs / Automatización)
// ===================================================

/**
 * @route   POST /api/penalties/system/check-automatic
 * @desc    Verificar y aplicar penalizaciones automáticas
 * @access  Private (System/Admin)
 */
router.post('/system/check-automatic', systemLimiter, checkAutomaticPenalties);

/**
 * @route   POST /api/penalties/system/cleanup
 * @desc    Limpiar penalizaciones expiradas
 * @access  Private (System/Admin)
 */
router.post('/system/cleanup', systemLimiter, cleanupExpiredPenalties);

module.exports = router;
