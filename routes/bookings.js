const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    createBooking,
    getBookingById,
    getUserBookings,
    getBarberBookings,
    updateBookingStatus,
    cancelBooking,
    acceptBooking,
    rejectBooking,
    completeBooking,
    markNoShow,
    rescheduleBooking,
    getAvailableSlots,
    checkBarberAvailability,
    processPayment,
    refundBooking,
    getBookingStats,
    getAllBookings,
    sendWhatsAppConfirmation,
    createImmediateBooking,
    getBookingHistory,
    updateBookingNotes,
    uploadBookingProof
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Rate limiting
const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // 50 reservas por IP
    message: {
        success: false,
        error: 'Demasiadas reservas en poco tiempo',
        code: 'TOO_MANY_BOOKINGS'
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

// ===================================================
// RUTAS PÚBLICAS / CONSULTA
// ===================================================

/**
 * @route   GET /api/bookings/barber/:barberId/availability
 * @desc    Verificar disponibilidad de barbero
 * @access  Public
 */
router.get('/barber/:barberId/availability', checkBarberAvailability);

/**
 * @route   GET /api/bookings/barber/:barberId/slots
 * @desc    Obtener horarios disponibles de barbero
 * @access  Public
 */
router.get('/barber/:barberId/slots', getAvailableSlots);

// ===================================================
// RUTAS PARA CLIENTES
// ===================================================

/**
 * @route   POST /api/bookings
 * @desc    Crear nueva reserva
 * @access  Private (Client)
 */
router.post('/', protect, authorize('client'), bookingLimiter, createBooking);

/**
 * @route   POST /api/bookings/immediate
 * @desc    Crear reserva inmediata
 * @access  Private (Client)
 */
router.post('/immediate', protect, authorize('client'), bookingLimiter, createImmediateBooking);

/**
 * @route   GET /api/bookings/me
 * @desc    Obtener reservas del cliente actual
 * @access  Private (Client)
 */
router.get('/me', protect, authorize('client'), generalLimiter, getUserBookings);

/**
 * @route   GET /api/bookings/me/history
 * @desc    Obtener historial completo de reservas del cliente
 * @access  Private (Client)
 */
router.get('/me/history', protect, authorize('client'), generalLimiter, getBookingHistory);

/**
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Cancelar reserva (cliente)
 * @access  Private (Client)
 */
router.put('/:id/cancel', protect, authorize('client'), cancelBooking);

/**
 * @route   PUT /api/bookings/:id/reschedule
 * @desc    Reprogramar reserva
 * @access  Private (Client)
 */
router.put('/:id/reschedule', protect, authorize('client'), rescheduleBooking);

/**
 * @route   POST /api/bookings/:id/payment
 * @desc    Procesar pago de reserva
 * @access  Private (Client)
 */
router.post('/:id/payment', protect, authorize('client'), processPayment);

/**
 * @route   POST /api/bookings/:id/whatsapp
 * @desc    Enviar confirmación por WhatsApp
 * @access  Private (Client)
 */
router.post('/:id/whatsapp', protect, authorize('client'), sendWhatsAppConfirmation);

// ===================================================
// RUTAS PARA BARBEROS
// ===================================================

/**
 * @route   GET /api/bookings/barber/me
 * @desc    Obtener reservas del barbero actual
 * @access  Private (Barber)
 */
router.get('/barber/me', protect, authorize('barber'), generalLimiter, getBarberBookings);

/**
 * @route   PUT /api/bookings/:id/accept
 * @desc    Aceptar reserva (barbero)
 * @access  Private (Barber)
 */
router.put('/:id/accept', protect, authorize('barber'), acceptBooking);

/**
 * @route   PUT /api/bookings/:id/reject
 * @desc    Rechazar reserva (barbero)
 * @access  Private (Barber)
 */
router.put('/:id/reject', protect, authorize('barber'), rejectBooking);

/**
 * @route   PUT /api/bookings/:id/complete
 * @desc    Marcar reserva como completada (barbero)
 * @access  Private (Barber)
 */
router.put('/:id/complete', protect, authorize('barber'), completeBooking);

/**
 * @route   PUT /api/bookings/:id/no-show
 * @desc    Marcar cliente como no presentado (barbero)
 * @access  Private (Barber)
 */
router.put('/:id/no-show', protect, authorize('barber'), markNoShow);

/**
 * @route   PUT /api/bookings/:id/notes
 * @desc    Actualizar notas de la reserva (barbero)
 * @access  Private (Barber)
 */
router.put('/:id/notes', protect, authorize('barber'), updateBookingNotes);

/**
 * @route   POST /api/bookings/:id/proof
 * @desc    Subir comprobante de servicio (barbero)
 * @access  Private (Barber)
 */
router.post('/:id/proof', 
    protect, 
    authorize('barber'), 
    upload.array('proof', 3), 
    uploadBookingProof
);

// ===================================================
// RUTAS COMPARTIDAS (Cliente o Barbero)
// ===================================================

/**
 * @route   GET /api/bookings/:id
 * @desc    Obtener detalles de reserva por ID
 * @access  Private (Client/Barber)
 */
router.get('/:id', protect, getBookingById);

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Actualizar estado de reserva
 * @access  Private (Client/Barber)
 */
router.put('/:id/status', protect, updateBookingStatus);

// ===================================================
// RUTAS DE ADMINISTRACIÓN (Solo Admin)
// ===================================================

/**
 * @route   GET /api/bookings
 * @desc    Obtener todas las reservas (admin)
 * @access  Private (Admin)
 */
router.get('/', protect, authorize('admin'), getAllBookings);

/**
 * @route   GET /api/bookings/stats/global
 * @desc    Obtener estadísticas globales de reservas
 * @access  Private (Admin)
 */
router.get('/stats/global', protect, authorize('admin'), getBookingStats);

/**
 * @route   POST /api/bookings/:id/refund
 * @desc    Procesar reembolso de reserva
 * @access  Private (Admin)
 */
router.post('/:id/refund', protect, authorize('admin'), refundBooking);

module.exports = router;
