const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    createReview,
    getBarberReviews,
    getReviewDetails,
    editReview,
    deleteReview,
    respondToReview,
    toggleReviewLike,
    reportReview,
    toggleFeatureReview,
    getFlaggedReviews,
    moderateReview,
    getBarberReviewStats,
    getMyReviews,
    createGooglePlaceReview,
    getGooglePlaceReviews
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Rate limiting
const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 reseñas por hora por IP
    message: {
        success: false,
        error: 'Demasiadas reseñas en poco tiempo',
        code: 'TOO_MANY_REVIEWS'
    }
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
        success: false,
        error: 'Demasiadas solicitudes',
        code: 'TOO_MANY_REQUESTS'
    }
});

const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // 5 reportes por hora por IP
    message: {
        success: false,
        error: 'Demasiados reportes en poco tiempo',
        code: 'TOO_MANY_REPORTS'
    }
});

// ===================================================
// RUTAS PÚBLICAS
// ===================================================

/**
 * @route   GET /api/reviews/barber/:barberId
 * @desc    Obtener reseñas de un barbero
 * @access  Public
 */
router.get('/barber/:barberId', generalLimiter, getBarberReviews);

/**
 * @route   GET /api/reviews/barber/:barberId/stats
 * @desc    Obtener estadísticas de reseñas de un barbero
 * @access  Public
 */
router.get('/barber/:barberId/stats', generalLimiter, getBarberReviewStats);

/**
 * @route   GET /api/reviews/google-place/:placeId
 * @desc    Obtener reseñas de un lugar de Google
 * @access  Public
 */
router.get('/google-place/:placeId', generalLimiter, getGooglePlaceReviews);

/**
 * @route   GET /api/reviews/:id
 * @desc    Obtener detalles de una reseña
 * @access  Public
 */
router.get('/:id', generalLimiter, getReviewDetails);

// ===================================================
// RUTAS PARA CLIENTES
// ===================================================

/**
 * @route   POST /api/reviews
 * @desc    Crear nueva reseña para barbero
 * @access  Private (Client)
 */
router.post('/', 
    protect, 
    authorize('client'), 
    reviewLimiter,
    upload.array('photos', 3),
    createReview
);

/**
 * @route   POST /api/reviews/google-place
 * @desc    Crear reseña para lugar de Google (sin perfil)
 * @access  Private (Client)
 */
router.post('/google-place', 
    protect, 
    authorize('client'), 
    reviewLimiter,
    upload.array('photos', 3),
    createGooglePlaceReview
);

/**
 * @route   GET /api/reviews/client/mine
 * @desc    Obtener reseñas del cliente actual
 * @access  Private (Client)
 */
router.get('/client/mine', protect, authorize('client'), generalLimiter, getMyReviews);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Editar reseña propia
 * @access  Private (Client)
 */
router.put('/:id', protect, authorize('client'), editReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Eliminar reseña propia
 * @access  Private (Client)
 */
router.delete('/:id', protect, authorize('client'), deleteReview);

/**
 * @route   POST /api/reviews/:id/like
 * @desc    Dar/quitar like a reseña
 * @access  Private
 */
router.post('/:id/like', protect, toggleReviewLike);

/**
 * @route   POST /api/reviews/:id/report
 * @desc    Reportar reseña como inapropiada
 * @access  Private
 */
router.post('/:id/report', protect, reportLimiter, reportReview);

// ===================================================
// RUTAS PARA BARBEROS
// ===================================================

/**
 * @route   POST /api/reviews/:id/respond
 * @desc    Responder a reseña (solo barbero dueño)
 * @access  Private (Barber)
 */
router.post('/:id/respond', protect, authorize('barber'), respondToReview);

/**
 * @route   PUT /api/reviews/:id/feature
 * @desc    Destacar/no destacar reseña (solo barbero dueño)
 * @access  Private (Barber)
 */
router.put('/:id/feature', protect, authorize('barber'), toggleFeatureReview);

/**
 * @route   DELETE /api/reviews/:id/barber
 * @desc    Eliminar reseña (barbero puede eliminar las suyas)
 * @access  Private (Barber)
 */
router.delete('/:id/barber', protect, authorize('barber'), deleteReview);

// ===================================================
// RUTAS DE MODERACIÓN (Solo Admin)
// ===================================================

/**
 * @route   GET /api/reviews/moderation/flagged
 * @desc    Obtener reseñas reportadas/flagged
 * @access  Private (Admin)
 */
router.get('/moderation/flagged', protect, authorize('admin'), getFlaggedReviews);

/**
 * @route   PUT /api/reviews/:id/moderate
 * @desc    Moderar reseña (aprobar/ocultar/eliminar)
 * @access  Private (Admin)
 */
router.put('/:id/moderate', protect, authorize('admin'), moderateReview);

/**
 * @route   DELETE /api/reviews/:id/admin
 * @desc    Eliminar reseña (admin)
 * @access  Private (Admin)
 */
router.delete('/:id/admin', protect, authorize('admin'), deleteReview);

module.exports = router;
