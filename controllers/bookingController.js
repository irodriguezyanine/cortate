const Booking = require('../models/Booking');
const Barber = require('../models/Barber');
const User = require('../models/User');
const Penalty = require('../models/Penalty');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/config');

/**
 * @desc    Crear nueva reserva
 * @route   POST /api/bookings
 * @access  Private (Client)
 */
const createBooking = asyncHandler(async (req, res) => {
    const {
        barberId,
        serviceType,
        additionalServices = [],
        type, // 'scheduled' o 'immediate'
        scheduledFor,
        location,
        specialInstructions,
        paymentMethod = 'cash'
    } = req.body;

    // Verificar que el barbero existe y está disponible
    const barber = await Barber.findById(barberId)
        .populate('userId', 'profile.firstName profile.lastName');

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    if (!barber.isActive || !barber.verification.isVerified) {
        return res.status(400).json({
            success: false,
            error: 'Barbero no disponible',
            code: 'BARBER_NOT_AVAILABLE',
            message: 'El barbero no está activo o verificado'
        });
    }

    // Verificar que el barbero no esté suspendido
    if (barber.penalties.status === 'suspended') {
        return res.status(400).json({
            success: false,
            error: 'Barbero suspendido',
            code: 'BARBER_SUSPENDED',
            message: 'El barbero está temporalmente suspendido'
        });
    }

    // Verificar tipo de servicio
    if (!['corteHombre', 'corteBarba'].includes(serviceType)) {
        return res.status(400).json({
            success: false,
            error: 'Tipo de servicio inválido',
            code: 'INVALID_SERVICE_TYPE'
        });
    }

    // Verificar que el servicio esté disponible
    const selectedService = barber.services[serviceType];
    if (!selectedService.available || selectedService.price <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Servicio no disponible',
            code: 'SERVICE_NOT_AVAILABLE'
        });
    }

    // Validar fecha para reservas programadas
    const now = new Date();
    let reservationDate = new Date(scheduledFor);

    if (type === 'scheduled') {
        if (reservationDate <= now) {
            return res.status(400).json({
                success: false,
                error: 'Fecha inválida',
                code: 'INVALID_DATE',
                message: 'La fecha debe ser en el futuro'
            });
        }

        // Verificar tiempo mínimo de anticipación
        const minAdvanceTime = barber.availability.bookingSettings?.minimumAdvanceTime || 60;
        const timeDiff = (reservationDate.getTime() - now.getTime()) / (1000 * 60);

        if (timeDiff < minAdvanceTime) {
            return res.status(400).json({
                success: false,
                error: 'Tiempo insuficiente',
                code: 'INSUFFICIENT_ADVANCE_TIME',
                message: `Debe reservar con al menos ${minAdvanceTime} minutos de anticipación`
            });
        }

        // Verificar que el barbero esté disponible en esa fecha/hora
        if (!barber.isAvailableAt(reservationDate)) {
            return res.status(400).json({
                success: false,
                error: 'Barbero no disponible',
                code: 'BARBER_NOT_AVAILABLE_AT_TIME',
                message: 'El barbero no está disponible en la fecha/hora seleccionada'
            });
        }

    } else if (type === 'immediate') {
        // Para reservas inmediatas, verificar que el barbero acepte inmediatos
        if (!barber.availability.acceptsImmediate || barber.availability.currentStatus !== 'available') {
            return res.status(400).json({
                success: false,
                error: 'No acepta reservas inmediatas',
                code: 'NO_IMMEDIATE_BOOKINGS',
                message: 'El barbero no acepta reservas inmediatas en este momento'
            });
        }

        // Para inmediatos, programar para "ahora" + tiempo de preparación
        reservationDate = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos
    }

    // Verificar conflictos de horario
    const conflictingBooking = await Booking.findOne({
        barberId: barber._id,
        status: { $in: ['pending', 'accepted', 'confirmed', 'in_progress'] },
        scheduledFor: {
            $gte: new Date(reservationDate.getTime() - selectedService.duration * 60 * 1000),
            $lte: new Date(reservationDate.getTime() + selectedService.duration * 60 * 1000)
        }
    });

    if (conflictingBooking) {
        return res.status(409).json({
            success: false,
            error: 'Horario no disponible',
            code: 'TIME_CONFLICT',
            message: 'El barbero ya tiene una reserva en ese horario'
        });
    }

    // Calcular precio total
    let totalPrice = selectedService.price;
    let additionalPrice = 0;

    // Agregar costo de servicios adicionales (si aplica)
    if (additionalServices.length > 0) {
        additionalServices.forEach(service => {
            if (barber.services.adicionales.includes(service)) {
                additionalPrice += 2000; // $2000 por servicio adicional
            }
        });
        totalPrice += additionalPrice;
    }

    // Agregar costo de transporte para domicilio
    let transportFee = 0;
    if (location.type === 'domicilio' && barber.serviceType !== 'domicilio') {
        if (barber.serviceType === 'local') {
            return res.status(400).json({
                success: false,
                error: 'Servicio a domicilio no disponible',
                code: 'NO_HOME_SERVICE'
            });
        }
        transportFee = 3000; // $3000 de transporte
        totalPrice += transportFee;
    }

    // Crear la reserva
    const booking = await Booking.create({
        clientId: req.user.id,
        barberId: barber._id,
        service: {
            type: serviceType,
            additionalServices,
            price: totalPrice,
            duration: selectedService.duration,
            notes: specialInstructions
        },
        type,
        scheduledFor: reservationDate,
        location: {
            type: location.type,
            address: location.address,
            coordinates: location.coordinates,
            details: location.details || {}
        },
        payment: {
            amount: totalPrice,
            breakdown: {
                servicePrice: selectedService.price,
                additionalServicesPrice: additionalPrice,
                transportFee,
                appCommission: 0, // Se aplica al barbero, no al cliente
                taxes: 0,
                discount: 0
            },
            method: paymentMethod,
            status: 'pending'
        },
        specialInstructions,
        contactInfo: {
            clientPhone: req.user.profile?.phone,
            barberPhone: barber.whatsapp
        },
        metadata: {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            source: 'web'
        },
        // Configurar expiración según tipo
        expiresAt: new Date(Date.now() + (type === 'immediate' ? 
            config.BOOKING_CONFIG.immediateExpirationMinutes : 
            config.BOOKING_CONFIG.pendingExpirationMinutes) * 60 * 1000)
    });

    // Agregar evento inicial al timeline
    booking.timeline.push({
        status: 'created',
        timestamp: new Date(),
        actor: req.user.id,
        note: `Reserva creada para ${type === 'immediate' ? 'ahora' : reservationDate.toLocaleString('es-CL')}`
    });

    await booking.save();

    // Actualizar estadísticas del barbero
    await Barber.findByIdAndUpdate(barber._id, {
        $inc: { 'stats.bookingStats.totalBookings': 1 }
    });

    // TODO: Enviar notificación al barbero
    // await sendBookingNotification(barber, booking);

    console.log(`📅 Nueva reserva: ${booking.bookingNumber} - ${barber.businessName} - ${type}`);

    res.status(201).json({
        success: true,
        message: 'Reserva creada exitosamente',
        data: {
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                type: booking.type,
                status: booking.status,
                scheduledFor: booking.scheduledFor,
                expiresAt: booking.expiresAt,
                timeToExpiration: booking.getTimeToExpiration(),
                service: booking.service,
                location: booking.location,
                payment: booking.payment,
                barber: {
                    id: barber._id,
                    businessName: barber.businessName,
                    whatsapp: barber.whatsapp,
                    location: barber.location
                }
            },
            whatsappMessage: booking.generateWhatsAppMessage('acceptance'),
            nextSteps: type === 'immediate' ? 
                ['El barbero tiene 5 minutos para aceptar', 'Recibirá notificación cuando acepte'] :
                ['El barbero tiene 15 minutos para aceptar', 'Recibirá confirmación por WhatsApp']
        }
    });
});

/**
 * @desc    Aceptar reserva (solo barberos)
 * @route   PUT /api/bookings/:id/accept
 * @access  Private (Barber)
 */
const acceptBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { estimatedArrival, notes } = req.body;

    const booking = await Booking.findById(id)
        .populate('clientId', 'profile.firstName profile.lastName profile.phone')
        .populate('barberId', 'businessName whatsapp');

    if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Reserva no encontrada',
            code: 'BOOKING_NOT_FOUND'
        });
    }

    // Verificar que es el barbero correcto
    const barber = await Barber.findOne({ userId: req.user.id });
    if (!barber || booking.barberId._id.toString() !== barber._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED',
            message: 'Solo el barbero asignado puede aceptar esta reserva'
        });
    }

    // Verificar que la reserva se puede aceptar
    if (booking.status !== 'pending') {
        return res.status(400).json({
            success: false,
            error: 'Estado inválido',
            code: 'INVALID_STATUS',
            message: `No se puede aceptar una reserva con estado: ${booking.status}`
        });
    }

    // Verificar que no haya expirado
    if (booking.isExpired()) {
        booking.status = 'expired';
        await booking.save();

        return res.status(400).json({
            success: false,
            error: 'Reserva expirada',
            code: 'BOOKING_EXPIRED',
            message: 'La reserva ha expirado por falta de respuesta'
        });
    }

    // Aceptar la reserva
    await booking.accept(req.user.id);

    // Agregar notas del barbero si las hay
    if (notes) {
        booking.timeline.push({
            status: 'accepted',
            timestamp: new Date(),
            actor: req.user.id,
            note: `Barbero agregó: ${notes}`
        });
        await booking.save();
    }

    // Actualizar estadísticas del barbero
    await Barber.findByIdAndUpdate(barber._id, {
        $inc: { 'stats.bookingStats.acceptedBookings': 1 }
    });

    // TODO: Enviar notificación al cliente
    // await sendAcceptanceNotification(booking);

    console.log(`✅ Reserva aceptada: ${booking.bookingNumber} por ${barber.businessName}`);

    res.status(200).json({
        success: true,
        message: 'Reserva aceptada exitosamente',
        data: {
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                status: booking.status,
                responseTime: booking.responseTime,
                scheduledFor: booking.scheduledFor,
                client: {
                    name: `${booking.clientId.profile.firstName} ${booking.clientId.profile.lastName}`,
                    phone: booking.clientId.profile.phone
                }
            },
            whatsappMessage: booking.generateWhatsAppMessage('acceptance'),
            estimatedArrival,
            nextSteps: [
                'Coordinar con el cliente por WhatsApp',
                'Confirmar llegada 10 minutos antes',
                'Marcar como completado al finalizar'
            ]
        }
    });
});

/**
 * @desc    Rechazar reserva (solo barberos)
 * @route   PUT /api/bookings/:id/reject
 * @access  Private (Barber)
 */
const rejectBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason = 'No disponible' } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Reserva no encontrada',
            code: 'BOOKING_NOT_FOUND'
        });
    }

    // Verificar que es el barbero correcto
    const barber = await Barber.findOne({ userId: req.user.id });
    if (!barber || booking.barberId.toString() !== barber._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED'
        });
    }

    if (booking.status !== 'pending') {
        return res.status(400).json({
            success: false,
            error: 'Estado inválido',
            code: 'INVALID_STATUS',
            message: 'Solo se pueden rechazar reservas pendientes'
        });
    }

    // Rechazar la reserva
    await booking.reject(req.user.id, reason);

    // Verificar si necesita penalización por rechazos frecuentes
    const recentRejections = await Booking.countDocuments({
        barberId: barber._id,
        status: 'rejected',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
    });

    if (recentRejections >= config.PENALTY_CONFIG.limits.maxRejectionsPerDay) {
        // Crear penalización automática
        await Penalty.createAutomatic({
            userId: req.user.id,
            type: 'rejection_abuse',
            severity: 'moderate',
            bookingId: booking._id,
            details: {
                description: `Rechazo excesivo: ${recentRejections} rechazos en 24 horas`,
                consecutiveRejections: recentRejections,
                clientImpact: 'medium',
                isRepeatOffense: recentRejections > config.PENALTY_CONFIG.limits.maxRejectionsPerDay
            }
        });

        console.log(`⚠️  Penalización por rechazos: ${barber.businessName} (${recentRejections} rechazos)`);
    }

    console.log(`❌ Reserva rechazada: ${booking.bookingNumber} - ${reason}`);

    res.status(200).json({
        success: true,
        message: 'Reserva rechazada',
        data: {
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                status: booking.status,
                rejectionReason: reason
            },
            warning: recentRejections >= config.PENALTY_CONFIG.limits.maxRejectionsPerDay - 1 ?
                'Atención: Rechazar demasiadas reservas puede resultar en penalizaciones' : null
        }
    });
});

/**
 * @desc    Cancelar reserva
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason = 'client_request', description } = req.body;

    const booking = await Booking.findById(id)
        .populate('clientId', 'profile.firstName profile.lastName')
        .populate('barberId', 'businessName userId');

    if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Reserva no encontrada',
            code: 'BOOKING_NOT_FOUND'
        });
    }

    // Verificar autorización
    const isClient = req.user.id === booking.clientId._id.toString();
    const isBarber = req.user.role === 'barber' && booking.barberId.userId.toString() === req.user.id;

    if (!isClient && !isBarber) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED',
            message: 'Solo el cliente o barbero pueden cancelar esta reserva'
        });
    }

    // Verificar que se puede cancelar
    if (!['pending', 'accepted', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({
            success: false,
            error: 'Estado inválido',
            code: 'INVALID_STATUS',
            message: 'No se puede cancelar una reserva en este estado'
        });
    }

    // Calcular información de penalización
    const penaltyInfo = booking.canCancelWithoutPenalty();
    const userRole = isClient ? 'client' : 'barber';

    // Cancelar la reserva
    await booking.cancel(req.user.id, userRole, reason);

    // Crear penalización si aplica
    if (penaltyInfo.penalty > 0) {
        await Penalty.createAutomatic({
            userId: req.user.id,
            type: userRole === 'client' ? 'late_cancellation_client' : 'late_cancellation_barber',
            severity: 'minor',
            bookingId: booking._id,
            details: {
                description: `Cancelación tardía: ${description || reason}`,
                clientImpact: 'medium'
            },
            factors: {
                isPeakTime: isWeekendOrPeakTime(booking.scheduledFor)
            }
        });
    }

    console.log(`🚫 Reserva cancelada: ${booking.bookingNumber} por ${userRole} - ${reason}`);

    res.status(200).json({
        success: true,
        message: 'Reserva cancelada exitosamente',
        data: {
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                status: booking.status,
                cancellation: booking.cancellation
            },
            penalty: {
                amount: penaltyInfo.penalty,
                reason: penaltyInfo.reason,
                willBeCharged: penaltyInfo.penalty > 0
            },
            refund: booking.cancellation.refund
        }
    });
});

/**
 * @desc    Marcar reserva como completada
 * @route   PUT /api/bookings/:id/complete
 * @access  Private (Barber)
 */
const completeBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes, serviceDelivered, actualDuration } = req.body;

    const booking = await Booking.findById(id)
        .populate('clientId', 'profile.firstName profile.lastName')
        .populate('barberId', 'businessName userId');

    if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Reserva no encontrada',
            code: 'BOOKING_NOT_FOUND'
        });
    }

    // Verificar que es el barbero correcto
    const barber = await Barber.findOne({ userId: req.user.id });
    if (!barber || booking.barberId._id.toString() !== barber._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED'
        });
    }

    if (!['accepted', 'confirmed', 'in_progress'].includes(booking.status)) {
        return res.status(400).json({
            success: false,
            error: 'Estado inválido',
            code: 'INVALID_STATUS',
            message: 'Solo se pueden completar reservas confirmadas o en progreso'
        });
    }

    // Completar la reserva
    await booking.complete(req.user.id);

    // Agregar notas del servicio si las hay
    if (notes || serviceDelivered || actualDuration) {
        const serviceNotes = [];
        if (serviceDelivered) serviceNotes.push(`Servicio: ${serviceDelivered}`);
        if (actualDuration) serviceNotes.push(`Duración real: ${actualDuration} min`);
        if (notes) serviceNotes.push(`Notas: ${notes}`);

        booking.timeline.push({
            status: 'completed',
            timestamp: new Date(),
            actor: req.user.id,
            note: serviceNotes.join('. ')
        });
        await booking.save();
    }

    // Actualizar estadísticas del barbero
    barber.updateStatsAfterBooking(booking);
    await barber.save();

    // Actualizar estadísticas del cliente
    await User.findByIdAndUpdate(booking.clientId._id, {
        $inc: {
            'stats.completedBookings': 1,
            'stats.totalSpent': booking.payment.amount
        },
        $set: {
            'stats.lastBooking': new Date(),
            'stats.favoriteBarber': barber._id
        }
    });

    console.log(`✅ Reserva completada: ${booking.bookingNumber} - ${barber.businessName}`);

    res.status(200).json({
        success: true,
        message: 'Reserva completada exitosamente',
        data: {
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                status: booking.status,
                completedAt: new Date(),
                payment: booking.payment,
                client: {
                    name: `${booking.clientId.profile.firstName} ${booking.clientId.profile.lastName}`
                }
            },
            earnings: {
                gross: booking.payment.amount,
                commission: Math.round(booking.payment.amount * config.PAYMENT_CONFIG.commission),
                net: Math.round(booking.payment.amount * (1 - config.PAYMENT_CONFIG.commission))
            },
            nextSteps: [
                'El cliente puede dejar una reseña',
                'Los ingresos se reflejarán en sus estadísticas',
                'Puede responder a la reseña del cliente'
            ]
        }
    });
});

/**
 * @desc    Obtener detalles de reserva
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const booking = await Booking.findById(id)
        .populate('clientId', 'profile.firstName profile.lastName profile.phone profile.avatar')
        .populate('barberId', 'businessName location whatsapp stats.rating userId');

    if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Reserva no encontrada',
            code: 'BOOKING_NOT_FOUND'
        });
    }

    // Verificar autorización
    const isClient = req.user.id === booking.clientId._id.toString();
    const isBarber = req.user.role === 'barber' && booking.barberId.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isBarber && !isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED'
        });
    }

    // Obtener reseña si existe
    let review = null;
    if (booking.status === 'completed') {
        const Review = require('../models/Review');
        review = await Review.findOne({
            bookingId: booking._id,
            'deletion.isDeleted': false
        });
    }

    res.status(200).json({
        success: true,
        data: {
            booking: {
                ...booking.toJSON(),
                canCancel: ['pending', 'accepted', 'confirmed'].includes(booking.status),
                canComplete: isBarber && ['accepted', 'confirmed', 'in_progress'].includes(booking.status),
                canReview: isClient && booking.status === 'completed' && !review,
                timeToExpiration: booking.getTimeToExpiration(),
                isExpired: booking.isExpired(),
                summary: booking.getSummary()
            },
            review,
            whatsappLinks: {
                client: booking.contactInfo.clientPhone ? 
                    `https://wa.me/${booking.contactInfo.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, sobre mi reserva ' + booking.bookingNumber)}` : null,
                barber: booking.contactInfo.barberPhone ?
                    `https://wa.me/${booking.contactInfo.barberPhone.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, sobre la reserva ' + booking.bookingNumber)}` : null
            }
        }
    });
});

/**
 * @desc    Buscar reservas
 * @route   GET /api/bookings
 * @access  Private
 */
const searchBookings = asyncHandler(async (req, res) => {
    const {
        status,
        type,
        fromDate,
        toDate,
        barberId,
        clientId,
        bookingNumber,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const filters = {};

    // Filtros por rol
    if (req.user.role === 'client') {
        filters.clientId = req.user.id;
    } else if (req.user.role === 'barber') {
        const barber = await Barber.findOne({ userId: req.user.id });
        if (barber) {
            filters.barberId = barber._id;
        }
    } else if (req.user.role === 'admin') {
        // Admin puede ver todas las reservas
        if (clientId) filters.clientId = clientId;
        if (barberId) filters.barberId = barberId;
    }

    // Otros filtros
    if (status) {
        if (status.includes(',')) {
            filters.status = { $in: status.split(',') };
        } else {
            filters.status = status;
        }
    }

    if (type) filters.type = type;

    if (bookingNumber) {
        filters.bookingNumber = new RegExp(bookingNumber, 'i');
    }

    if (fromDate || toDate) {
        filters.scheduledFor = {};
        if (fromDate) filters.scheduledFor.$gte = new Date(fromDate);
        if (toDate) filters.scheduledFor.$lte = new Date(toDate);
    }

    // Ejecutar búsqueda
    const bookings = await Booking.find(filters)
        .populate('clientId', 'profile.firstName profile.lastName profile.avatar')
        .populate('barberId', 'businessName location stats.rating')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Booking.countDocuments(filters);

    // Estadísticas rápidas
    const stats = await Booking.aggregate([
        { $match: filters },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$payment.amount' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            bookings,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1
            },
            stats,
            filters: {
                status,
                type,
                fromDate,
                toDate,
                barberId,
                clientId
            }
        }
    });
});

/**
 * @desc    Obtener reservas próximas a expirar (tarea automática)
 * @route   GET /api/bookings/expiring
 * @access  Private (Admin/System)
 */
const getExpiringBookings = asyncHandler(async (req, res) => {
    const { minutes = 5 } = req.query;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acceso solo para administradores',
            code: 'ADMIN_ONLY'
        });
    }

    const expiringBookings = await Booking.findExpiringBookings(parseInt(minutes));

    res.status(200).json({
        success: true,
        data: {
            expiring: expiringBookings,
            count: expiringBookings.length,
            minutesAhead: parseInt(minutes)
        }
    });
});

/**
 * @desc    Expirar reservas automáticamente (tarea automática)
 * @route   POST /api/bookings/expire-pending
 * @access  Private (System)
 */
const autoExpireBookings = asyncHandler(async (req, res) => {
    if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acceso solo para administradores',
            code: 'ADMIN_ONLY'
        });
    }

    const expiredCount = await Booking.expirePendingBookings();

    // Si hay reservas expiradas, crear penalizaciones para barberos que no respondieron a inmediatos
    if (expiredCount > 0) {
        const expiredImmediate = await Booking.find({
            status: 'expired',
            type: 'immediate',
            updatedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Últimos 5 minutos
        }).populate('barberId', 'userId businessName');

        for (const booking of expiredImmediate) {
            await Penalty.createAutomatic({
                userId: booking.barberId.userId,
                type: 'rejection_abuse',
                subtype: 'no_response_immediate',
                severity: 'minor',
                bookingId: booking._id,
                details: {
                    description: 'No respondió a reserva inmediata en tiempo',
                    clientImpact: 'medium'
                }
            });
        }

        console.log(`⏰ ${expiredCount} reservas expiradas, ${expiredImmediate.length} penalizaciones creadas`);
    }

    if (res) {
        res.status(200).json({
            success: true,
            message: `${expiredCount} reservas expiradas`,
            data: {
                expiredCount,
                timestamp: new Date()
            }
        });
    }

    return expiredCount;
});

/**
 * @desc    Marcar como no-show (cliente no se presentó)
 * @route   PUT /api/bookings/:id/no-show-client
 * @access  Private (Barber)
 */
const markClientNoShow = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes, waitedMinutes = 15 } = req.body;

    const booking = await Booking.findById(id)
        .populate('clientId', 'profile.firstName profile.lastName')
        .populate('barberId', 'businessName userId');

    if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Reserva no encontrada',
            code: 'BOOKING_NOT_FOUND'
        });
    }

    // Verificar que es el barbero correcto
    const barber = await Barber.findOne({ userId: req.user.id });
    if (!barber || booking.barberId._id.toString() !== barber._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED'
        });
    }

    if (!['accepted', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({
            success: false,
            error: 'Estado inválido',
            code: 'INVALID_STATUS'
        });
    }

    // Verificar que la hora de la cita ya pasó
    if (new Date() < booking.scheduledFor) {
        return res.status(400).json({
            success: false,
            error: 'La hora de la cita aún no ha llegado',
            code: 'TOO_EARLY'
        });
    }

    // Marcar como no-show del cliente
    booking.status = 'no_show_client';
    booking.timeline.push({
        status: 'no_show_client',
        timestamp: new Date(),
        actor: req.user.id,
        note: `Cliente no se presentó. Esperó ${waitedMinutes} minutos. ${notes || ''}`
    });

    await booking.save();

    // Crear penalización para el cliente
    await Penalty.createAutomatic({
        userId: booking.clientId._id,
        type: 'no_show_client',
        severity: 'major',
        bookingId: booking._id,
        details: {
            description: `No se presentó a la cita programada para ${booking.scheduledFor.toLocaleString('es-CL')}`,
            clientImpact: 'high',
            recentSimilarOffenses: await countRecentNoShows(booking.clientId._id)
        }
    });

    // Compensar al barbero (crédito por tiempo perdido)
    const compensation = Math.round(booking.payment.amount * 0.5); // 50% del valor

    console.log(`👻 No-show cliente: ${booking.bookingNumber} - Compensación: ${compensation}`);

    res.status(200).json({
        success: true,
        message: 'No-show registrado exitosamente',
        data: {
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                status: booking.status
            },
            compensation: {
                amount: compensation,
                reason: 'Compensación por no-show del cliente'
            },
            penalty: {
                applied: true,
                clientId: booking.clientId._id,
                amount: Math.round(booking.payment.amount * config.BOOKING_CONFIG.cancellationPolicy.noShowPenalty)
            }
        }
    });
});

/**
 * @desc    Marcar como no-show (barbero no se presentó)
 * @route   PUT /api/bookings/:id/no-show-barber
 * @access  Private (Client)
 */
const markBarberNoShow = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes, waitedMinutes = 15 } = req.body;

    const booking = await Booking.findById(id)
        .populate('clientId', 'profile.firstName profile.lastName')
        .populate('barberId', 'businessName userId');

    if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Reserva no encontrada',
            code: 'BOOKING_NOT_FOUND'
        });
    }

    // Verificar que es el cliente correcto
    if (req.user.id !== booking.clientId._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED'
        });
    }

    if (!['accepted', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({
            success: false,
            error: 'Estado inválido',
            code: 'INVALID_STATUS'
        });
    }

    // Verificar que ya pasó tiempo suficiente desde la hora programada
    const minutesSinceScheduled = (new Date() - booking.scheduledFor) / (1000 * 60);
    if (minutesSinceScheduled < 15) {
        return res.status(400).json({
            success: false,
            error: 'Debe esperar al menos 15 minutos después de la hora programada',
            code: 'TOO_EARLY'
        });
    }

    // Marcar como no-show del barbero
    booking.status = 'no_show_barber';
    booking.timeline.push({
        status: 'no_show_barber',
        timestamp: new Date(),
        actor: req.user.id,
        note: `Barbero no se presentó. Cliente esperó ${waitedMinutes} minutos. ${notes || ''}`
    });

    // Reembolso completo al cliente
    booking.payment.status = 'refunded';
    booking.payment.refundedAt = new Date();

    await booking.save();

    // Crear penalización severa para el barbero
    await Penalty.createAutomatic({
        userId: booking.barberId.userId,
        type: 'no_show_barber',
        severity: 'critical',
        bookingId: booking._id,
        details: {
            description: `No se presentó a la cita programada para ${booking.scheduledFor.toLocaleString('es-CL')}`,
            clientImpact: 'critical',
            recentSimilarOffenses: await countRecentNoShows(booking.barberId.userId, 'barber')
        }
    });

    console.log(`👻 No-show barbero: ${booking.bookingNumber} - Reembolso completo`);

    res.status(200).json({
        success: true,
        message: 'No-show registrado exitosamente',
        data: {
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                status: booking.status
            },
            refund: {
                amount: booking.payment.amount,
                status: 'processed',
                reason: 'Reembolso por no-show del barbero'
            },
            compensation: {
                voucher: Math.round(booking.payment.amount * 0.2), // 20% extra como voucher
                message: 'Recibirá un voucher adicional por las molestias'
            }
        }
    });
});

/**
 * @desc    Obtener estadísticas de reservas
 * @route   GET /api/bookings/stats
 * @access  Private
 */
const getBookingStats = asyncHandler(async (req, res) => {
    const { period = '30days', barberId, clientId } = req.query;

    // Calcular fecha de inicio
    let startDate = new Date();
    switch (period) {
        case '7days':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30days':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90days':
            startDate.setDate(startDate.getDate() - 90);
            break;
        case '1year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
    }

    const filters = { createdAt: { $gte: startDate } };

    // Aplicar filtros según rol y parámetros
    if (req.user.role === 'client') {
        filters.clientId = req.user.id;
    } else if (req.user.role === 'barber') {
        const barber = await Barber.findOne({ userId: req.user.id });
        if (barber) filters.barberId = barber._id;
    } else if (req.user.role === 'admin') {
        if (barberId) filters.barberId = barberId;
        if (clientId) filters.clientId = clientId;
    }

    const stats = await Booking.getBookingStats(filters);

    res.status(200).json({
        success: true,
        data: {
            period,
            startDate,
            stats
        }
    });
});

/**
 * @desc    Obtener reservas para recordatorios
 * @route   GET /api/bookings/reminders
 * @access  Private (Admin/System)
 */
const getBookingsForReminders = asyncHandler(async (req, res) => {
    const { hours = 24 } = req.query;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acceso solo para administradores',
            code: 'ADMIN_ONLY'
        });
    }

    const bookingsForReminders = await Booking.findBookingsForReminders(parseInt(hours));

    res.status(200).json({
        success: true,
        data: {
            bookings: bookingsForReminders,
            count: bookingsForReminders.length,
            hoursAhead: parseInt(hours)
        }
    });
});

/**
 * Verificar si es horario peak o fin de semana
 */
const isWeekendOrPeakTime = (date) => {
    const day = date.getDay();
    const hour = date.getHours();
    
    // Fin de semana
    if (day === 0 || day === 6) return true;
    
    // Horarios peak: 18:00-21:00 de lunes a viernes
    if (day >= 1 && day <= 5 && hour >= 18 && hour <= 21) return true;
    
    return false;
};

/**
 * Contar no-shows recientes de un usuario
 */
const countRecentNoShows = async (userId, role = 'client') => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const statusField = role === 'client' ? 'no_show_client' : 'no_show_barber';
    const userField = role === 'client' ? 'clientId' : 'barberId';
    
    return await Booking.countDocuments({
        [userField]: userId,
        status: statusField,
        createdAt: { $gte: thirtyDaysAgo }
    });
};

/**
 * @desc    Cambiar estado de reserva (solo admin)
 * @route   PUT /api/bookings/:id/status
 * @access  Private (Admin)
 */
const changeBookingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason, notifyUsers = true } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acceso solo para administradores',
            code: 'ADMIN_ONLY'
        });
    }

    const booking = await Booking.findById(id)
        .populate('clientId', 'profile.firstName profile.lastName')
        .populate('barberId', 'businessName userId');

    if (!booking) {
        return res.status(404).json({
            success: false,
            error: 'Reserva no encontrada',
            code: 'BOOKING_NOT_FOUND'
        });
    }

    const oldStatus = booking.status;
    booking.status = status;
    booking._updatedBy = req.user.id;
    booking._statusNote = `Admin cambió estado: ${reason || 'Sin motivo especificado'}`;

    await booking.save();

    console.log(`🔧 Admin cambió estado: ${booking.bookingNumber} de ${oldStatus} a ${status}`);

    res.status(200).json({
        success: true,
        message: 'Estado de reserva actualizado',
        data: {
            booking: {
                id: booking._id,
                bookingNumber: booking.bookingNumber,
                oldStatus,
                newStatus: status,
                reason
            }
        }
    });
});

/**
 * @desc    Obtener métricas de rendimiento del sistema
 * @route   GET /api/bookings/metrics
 * @access  Private (Admin)
 */
const getSystemMetrics = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acceso solo para administradores',
            code: 'ADMIN_ONLY'
        });
    }

    const { period = '30days' } = req.query;

    let startDate = new Date();
    switch (period) {
        case '7days':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30days':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90days':
            startDate.setDate(startDate.getDate() - 90);
            break;
    }

    // Métricas generales
    const generalMetrics = await Booking.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                totalRevenue: { $sum: '$payment.amount' },
                averageBookingValue: { $avg: '$payment.amount' },
                averageResponseTime: { $avg: '$responseTime' },
                immediateBookings: {
                    $sum: { $cond: [{ $eq: ['$type', 'immediate'] }, 1, 0] }
                },
                scheduledBookings: {
                    $sum: { $cond: [{ $eq: ['$type', 'scheduled'] }, 1, 0] }
                }
            }
        }
    ]);

    // Métricas por estado
    const statusMetrics = await Booking.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                percentage: { $sum: 1 }
            }
        }
    ]);

    // Horarios más populares
    const popularHours = await Booking.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: { $in: ['completed', 'confirmed', 'accepted'] }
            }
        },
        {
            $group: {
                _id: { $hour: '$scheduledFor' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    // Días más populares
    const popularDays = await Booking.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: { $in: ['completed', 'confirmed', 'accepted'] }
            }
        },
        {
            $group: {
                _id: { $dayOfWeek: '$scheduledFor' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    // Tiempo promedio entre creación y aceptación
    const responseTimeMetrics = await Booking.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                responseTime: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$type',
                avgResponseTime: { $avg: '$responseTime' },
                maxResponseTime: { $max: '$responseTime' },
                minResponseTime: { $min: '$responseTime' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            period,
            startDate,
            general: generalMetrics[0] || {},
            byStatus: statusMetrics,
            popularHours,
            popularDays: popularDays.map(day => ({
                day: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day._id - 1],
                count: day.count
            })),
            responseTime: responseTimeMetrics,
            calculatedAt: new Date()
        }
    });
});

module.exports = {
    createBooking,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeBooking,
    getBookingDetails,
    searchBookings,
    getExpiringBookings,
    autoExpireBookings,
    markClientNoShow,
    markBarberNoShow,
    getBookingStats,
    getBookingsForReminders,
    changeBookingStatus,
    getSystemMetrics
};
