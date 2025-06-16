const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    getAllUsers,
    getUserById,
    updateUser,
    deactivateUser,
    reactivateUser,
    getUserStats,
    getUserBookings,
    getUserReviews,
    getUserFavorites,
    addFavorite,
    removeFavorite,
    updatePreferences,
    getNotifications,
    markNotificationRead,
    clearAllNotifications
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Rate limiting general
const userLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
        success: false,
        error: 'Demasiadas solicitudes',
        code: 'TOO_MANY_REQUESTS'
    }
});

// ===================================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin)
// ===================================================

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (con filtros)
 * @access  Private (Admin)
 */
router.get('/', protect, authorize('admin'), getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener usuario por ID
 * @access  Private (Admin/Owner)
 */
router.get('/:id', protect, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar usuario por ID
 * @access  Private (Admin/Owner)
 */
router.put('/:id', protect, updateUser);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Desactivar usuario
 * @access  Private (Admin)
 */
router.put('/:id/deactivate', protect, authorize('admin'), deactivateUser);

/**
 * @route   PUT /api/users/:id/reactivate
 * @desc    Reactivar usuario
 * @access  Private (Admin)
 */
router.put('/:id/reactivate', protect, authorize('admin'), reactivateUser);

/**
 * @route   GET /api/users/:id/stats
 * @desc    Obtener estadísticas del usuario
 * @access  Private (Admin/Owner)
 */
router.get('/:id/stats', protect, getUserStats);

// ===================================================
// RUTAS PERSONALES DEL USUARIO
// ===================================================

/**
 * @route   GET /api/users/me/bookings
 * @desc    Obtener reservas del usuario actual
 * @access  Private (Client)
 */
router.get('/me/bookings', protect, userLimiter, getUserBookings);

/**
 * @route   GET /api/users/me/reviews
 * @desc    Obtener reseñas del usuario actual
 * @access  Private (Client)
 */
router.get('/me/reviews', protect, userLimiter, getUserReviews);

/**
 * @route   GET /api/users/me/favorites
 * @desc    Obtener barberos favoritos del usuario
 * @access  Private (Client)
 */
router.get('/me/favorites', protect, userLimiter, getUserFavorites);

/**
 * @route   POST /api/users/me/favorites/:barberId
 * @desc    Agregar barbero a favoritos
 * @access  Private (Client)
 */
router.post('/me/favorites/:barberId', protect, addFavorite);

/**
 * @route   DELETE /api/users/me/favorites/:barberId
 * @desc    Remover barbero de favoritos
 * @access  Private (Client)
 */
router.delete('/me/favorites/:barberId', protect, removeFavorite);

/**
 * @route   PUT /api/users/me/preferences
 * @desc    Actualizar preferencias del usuario
 * @access  Private
 */
router.put('/me/preferences', protect, updatePreferences);

/**
 * @route   GET /api/users/me/notifications
 * @desc    Obtener notificaciones del usuario
 * @access  Private
 */
router.get('/me/notifications', protect, userLimiter, getNotifications);

/**
 * @route   PUT /api/users/me/notifications/:id/read
 * @desc    Marcar notificación como leída
 * @access  Private
 */
router.put('/me/notifications/:id/read', protect, markNotificationRead);

/**
 * @route   DELETE /api/users/me/notifications
 * @desc    Limpiar todas las notificaciones
 * @access  Private
 */
router.delete('/me/notifications', protect, clearAllNotifications);

module.exports = router;
