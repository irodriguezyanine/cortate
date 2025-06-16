const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    registerClient,
    registerBarber,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rate limiting para rutas de autenticación
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos por IP
    message: {
        success: false,
        error: 'Demasiados intentos de autenticación',
        code: 'TOO_MANY_REQUESTS'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por IP para operaciones sensibles
    message: {
        success: false,
        error: 'Demasiados intentos',
        code: 'TOO_MANY_REQUESTS'
    }
});

// ===================================================
// RUTAS PÚBLICAS (Sin autenticación)
// ===================================================

/**
 * @route   POST /api/auth/register/client
 * @desc    Registrar nuevo cliente
 * @access  Public
 */
router.post('/register/client', authLimiter, registerClient);

/**
 * @route   POST /api/auth/register/barber
 * @desc    Registrar nuevo barbero
 * @access  Public
 */
router.post('/register/barber', authLimiter, registerBarber);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión (cliente o barbero)
 * @access  Public
 */
router.post('/login', authLimiter, login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token de acceso
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña
 * @access  Public
 */
router.post('/forgot-password', strictAuthLimiter, forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con token
 * @access  Public
 */
router.post('/reset-password', strictAuthLimiter, resetPassword);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verificar email con token
 * @access  Public
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Reenviar email de verificación
 * @access  Public
 */
router.post('/resend-verification', authLimiter, resendVerification);

// ===================================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ===================================================

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario actual
 * @access  Private
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario actual
 * @access  Private
 */
router.put('/profile', protect, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario actual
 * @access  Private
 */
router.put('/change-password', protect, strictAuthLimiter, changePassword);

/**
 * @route   DELETE /api/auth/account
 * @desc    Eliminar cuenta del usuario actual
 * @access  Private
 */
router.delete('/account', protect, strictAuthLimiter, deleteAccount);

module.exports = router;
