const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    searchNearbyBarbershops,
    getPlaceFullDetails,
    claimGooglePlace,
    approveClaimRequest,
    rejectClaimRequest,
    getPendingClaims,
    getPlacesStats
} = require('../controllers/googlePlacesController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Rate limiting
const searchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 búsquedas por IP
    message: {
        success: false,
        error: 'Demasiadas búsquedas en poco tiempo',
        code: 'TOO_MANY_SEARCHES'
    }
});

const claimLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 reclamaciones por hora por IP
    message: {
        success: false,
        error: 'Demasiadas reclamaciones en poco tiempo',
        code: 'TOO_MANY_CLAIMS'
    }
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // 50 requests por IP
    message: {
        success: false,
        error: 'Demasiadas solicitudes',
        code: 'TOO_MANY_REQUESTS'
    }
});

// ===================================================
// RUTAS PÚBLICAS
// ===================================================

/**
 * @route   GET /api/places/search
 * @desc    Buscar barberías cercanas usando Google Places
 * @access  Public
 */
router.get('/search', searchLimiter, searchNearbyBarbershops);

/**
 * @route   GET /api/places/:placeId/details
 * @desc    Obtener detalles completos de un lugar
 * @access  Public
 */
router.get('/:placeId/details', generalLimiter, getPlaceFullDetails);

// ===================================================
// RUTAS PARA BARBEROS
// ===================================================

/**
 * @route   POST /api/places/:placeId/claim
 * @desc    Reclamar lugar de Google (asociar con barbero)
 * @access  Private (Barber)
 */
router.post('/:placeId/claim', 
    protect, 
    authorize('barber'), 
    claimLimiter,
    upload.array('verification', 3),
    claimGooglePlace
);

// ===================================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin)
// ===================================================

/**
 * @route   GET /api/places/admin/claims
 * @desc    Obtener solicitudes de reclamación pendientes
 * @access  Private (Admin)
 */
router.get('/admin/claims', protect, authorize('admin'), getPendingClaims);

/**
 * @route   GET /api/places/admin/stats
 * @desc    Obtener estadísticas de lugares
 * @access  Private (Admin)
 */
router.get('/admin/stats', protect, authorize('admin'), getPlacesStats);

/**
 * @route   PUT /api/places/:placeId/claim/approve
 * @desc    Aprobar reclamación de lugar
 * @access  Private (Admin)
 */
router.put('/:placeId/claim/approve', protect, authorize('admin'), approveClaimRequest);

/**
 * @route   PUT /api/places/:placeId/claim/reject
 * @desc    Rechazar reclamación de lugar
 * @access  Private (Admin)
 */
router.put('/:placeId/claim/reject', protect, authorize('admin'), rejectClaimRequest);

module.exports = router;
