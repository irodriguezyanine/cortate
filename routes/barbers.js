const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    getAllBarbers,
    getBarberById,
    getNearbyBarbers,
    searchBarbers,
    getBarberProfile,
    updateBarberProfile,
    updateBarberServices,
    updateBarberAvailability,
    toggleBarberStatus,
    uploadBarberPhotos,
    deleteBarberPhoto,
    getBarberBookings,
    getBarberStats,
    getBarberDashboard,
    getBarberEarnings,
    setImmediateAvailability,
    updateBarberLocation,
    verifyBarberProfile,
    suspendBarber,
    getTopBarbers,
    getBarberAnalytics
} = require('../controllers/barberController');
const { protect, authorize } = require('../middleware/auth');
const { validateBarber } = require('../middleware/validateBarber');
const upload = require('../middleware/uploadMiddleware');

// Rate limiting
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // 200 requests por IP para rutas públicas
    message: {
        success: false,
        error: 'Demasiadas solicitudes',
        code: 'TOO_MANY_REQUESTS'
    }
});

const barberLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP para barberos
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
 * @route   GET /api/barbers
 * @desc    Obtener todos los barberos activos (con filtros)
 * @access  Public
 */
router.get('/', publicLimiter, getAllBarbers);

/**
 * @route   GET /api/barbers/nearby
 * @desc    Obtener barberos cercanos a una ubicación
 * @access  Public
 */
router.get('/nearby', publicLimiter, getNearbyBarbers);

/**
 * @route   GET /api/barbers/search
 * @desc    Buscar barberos por texto
 * @access  Public
 */
router.get('/search', publicLimiter, searchBarbers);

/**
 * @route   GET /api/barbers/top
 * @desc    Obtener top barberos por rating/popularidad
 * @access  Public
 */
router.get('/top', publicLimiter, getTopBarbers);

/**
 * @route   GET /api/barbers/:id
 * @desc    Obtener perfil público de barbero por ID
 * @access  Public
 */
router.get('/:id', publicLimiter, getBarberById);

/**
 * @route   GET /api/barbers/:id/profile
 * @desc    Obtener perfil completo de barbero
 * @access  Public
 */
router.get('/:id/profile', publicLimiter, getBarberProfile);

// ===================================================
// RUTAS PARA BARBEROS (Autenticados)
// ===================================================

/**
 * @route   GET /api/barbers/me/dashboard
 * @desc    Obtener dashboard del barbero actual
 * @access  Private (Barber)
 */
router.get('/me/dashboard', protect, authorize('barber'), barberLimiter, getBarberDashboard);

/**
 * @route   GET /api/barbers/me/stats
 * @desc    Obtener estadísticas del barbero actual
 * @access  Private (Barber)
 */
router.get('/me/stats', protect, authorize('barber'), barberLimiter, getBarberStats);

/**
 * @route   GET /api/barbers/me/analytics
 * @desc    Obtener analytics avanzados del barbero
 * @access  Private (Barber)
 */
router.get('/me/analytics', protect, authorize('barber'), barberLimiter, getBarberAnalytics);

/**
 * @route   GET /api/barbers/me/bookings
 * @desc    Obtener reservas del barbero actual
 * @access  Private (Barber)
 */
router.get('/me/bookings', protect, authorize('barber'), barberLimiter, getBarberBookings);

/**
 * @route   GET /api/barbers/me/earnings
 * @desc    Obtener ingresos del barbero actual
 * @access  Private (Barber)
 */
router.get('/me/earnings', protect, authorize('barber'), barberLimiter, getBarberEarnings);

/**
 * @route   PUT /api/barbers/me/profile
 * @desc    Actualizar perfil del barbero actual
 * @access  Private (Barber)
 */
router.put('/me/profile', protect, authorize('barber'), validateBarber, updateBarberProfile);

/**
 * @route   PUT /api/barbers/me/services
 * @desc    Actualizar servicios del barbero actual
 * @access  Private (Barber)
 */
router.put('/me/services', protect, authorize('barber'), validateBarber, updateBarberServices);

/**
 * @route   PUT /api/barbers/me/availability
 * @desc    Actualizar disponibilidad del barbero actual
 * @access  Private (Barber)
 */
router.put('/me/availability', protect, authorize('barber'), updateBarberAvailability);

/**
 * @route   PUT /api/barbers/me/location
 * @desc    Actualizar ubicación del barbero actual
 * @access  Private (Barber)
 */
router.put('/me/location', protect, authorize('barber'), updateBarberLocation);

/**
 * @route   PUT /api/barbers/me/status
 * @desc    Cambiar estado del barbero (disponible/ocupado)
 * @access  Private (Barber)
 */
router.put('/me/status', protect, authorize('barber'), toggleBarberStatus);

/**
 * @route   PUT /api/barbers/me/immediate
 * @desc    Activar/desactivar disponibilidad inmediata
 * @access  Private (Barber)
 */
router.put('/me/immediate', protect, authorize('barber'), setImmediateAvailability);

/**
 * @route   POST /api/barbers/me/photos
 * @desc    Subir fotos al perfil del barbero
 * @access  Private (Barber)
 */
router.post('/me/photos', 
    protect, 
    authorize('barber'), 
    upload.array('photos', 10), 
    uploadBarberPhotos
);

/**
 * @route   DELETE /api/barbers/me/photos/:photoId
 * @desc    Eliminar foto del perfil del barbero
 * @access  Private (Barber)
 */
router.delete('/me/photos/:photoId', protect, authorize('barber'), deleteBarberPhoto);

// ===================================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin)
// ===================================================

/**
 * @route   PUT /api/barbers/:id/verify
 * @desc    Verificar perfil de barbero
 * @access  Private (Admin)
 */
router.put('/:id/verify', protect, authorize('admin'), verifyBarberProfile);

/**
 * @route   PUT /api/barbers/:id/suspend
 * @desc    Suspender barbero
 * @access  Private (Admin)
 */
router.put('/:id/suspend', protect, authorize('admin'), suspendBarber);

/**
 * @route   GET /api/barbers/:id/stats
 * @desc    Obtener estadísticas detalladas de barbero (admin)
 * @access  Private (Admin)
 */
router.get('/:id/stats', protect, authorize('admin'), getBarberStats);

module.exports = router;
