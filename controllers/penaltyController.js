const Penalty = require('../models/Penalty');
const Barber = require('../models/Barber');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/config');

/**
 * @desc    Aplicar penalización automática
 * @route   POST /api/penalties/apply
 * @access  Private (System/Admin)
 */
const applyPenalty = asyncHandler(async (req, res) => {
    const {
        barberId,
        bookingId,
        type,
        reason,
        amount,
        description = '',
        applyImmediate = true
    } = req.body;

    // Verificar que el barbero existe
    const barber = await Barber.findById(barberId)
        .populate('userId', 'profile.firstName profile.lastName email');
    
    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Verificar que la reserva existe si se proporciona
    let booking = null;
    if (bookingId) {
        booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Reserva no encontrada',
                code: 'BOOKING_NOT_FOUND'
            });
        }
    }

    // Validar tipo de penalización
    const validTypes = ['no_show', 'late_cancellation', 'rejection', 'poor_service', 'policy_violation', 'custom'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({
            success: false,
            error: 'Tipo de penalización inválido',
            code: 'INVALID_PENALTY_TYPE',
            validTypes
        });
    }

    // Verificar que no haya penalización previa para esta reserva
    if (bookingId) {
        const existingPenalty = await Penalty.findOne({
            barberId,
            bookingId,
            status: { $ne: 'cancelled' }
        });

        if (existingPenalty) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una penalización para esta reserva',
                code: 'PENALTY_EXISTS'
            });
        }
    }

    // Calcular severidad y duración basado en historial
    const recentPenalties = await Penalty.find({
        barberId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Últimos 30 días
        status: 'active'
    });

    let severity = 'minor';
    let suspensionDays = 0;
    let monetaryAmount = amount || 0;

    // Calcular severidad basada en historial
    const penaltyCount = recentPenalties.length;
    const noShowCount = recentPenalties.filter(p => p.type === 'no_show').length;
    const rejectionCount = recentPenalties.filter(p => p.type === 'rejection').length;

    switch (type) {
        case 'no_show':
            if (noShowCount >= 2) {
                severity = 'severe';
                suspensionDays = 7;
            } else if (noShowCount >= 1) {
                severity = 'moderate';
                suspensionDays = 3;
            }
            monetaryAmount = monetaryAmount || (booking?.payment?.amount * 0.5) || 0;
            break;

        case 'late_cancellation':
            severity = 'minor';
            monetaryAmount = monetaryAmount || (booking?.payment?.amount * 0.1) || 0;
            break;

        case 'rejection':
            if (rejectionCount >= 5) {
                severity = 'severe';
                suspensionDays = 14;
            } else if (rejectionCount >= 3) {
                severity = 'moderate';
                suspensionDays = 7;
            }
            break;

        case 'poor_service':
            severity = 'moderate';
            suspensionDays = 1;
            break;

        case 'policy_violation':
            severity = 'severe';
            suspensionDays = 30;
            break;

        case 'custom':
            // Mantener valores proporcionados
            break;
    }

    // Crear la penalización
    const penaltyData = {
        barberId,
        bookingId: booking?._id,
        type,
        reason,
        description,
        severity,
        status: applyImmediate ? 'active' : 'pending',
        monetary: {
            amount: monetaryAmount,
            currency: 'CLP',
            status: monetaryAmount > 0 ? 'pending' : 'none'
        },
        suspension: {
            days: suspensionDays,
            startDate: applyImmediate && suspensionDays > 0 ? new Date() : null,
            endDate: applyImmediate && suspensionDays > 0 ? 
                new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000) : null
        },
        appliedBy: req.user?.id || 'system',
        appliedByType: req.user?.role || 'system',
        autoApplied: !req.user,
        metadata: {
            previousPenalties: penaltyCount,
            bookingAmount: booking?.payment?.amount || 0,
            appliedFrom: req.ip || 'system'
        }
    };

    const penalty = await Penalty.create(penaltyData);

    // Aplicar efectos inmediatos si corresponde
    if (applyImmediate) {
        await applyPenaltyEffects(barber, penalty);
    }

    // Registrar en el historial del barbero
    barber.penaltyHistory.push({
        penaltyId: penalty._id,
        type: penalty.type,
        severity: penalty.severity,
        appliedAt: penalty.createdAt,
        amount: penalty.monetary.amount
    });

    await barber.save();

    console.log(`⚠️  Penalización aplicada: ${type} (${severity}) a ${barber.businessName} - Suspensión: ${suspensionDays} días`);

    res.status(201).json({
        success: true,
        message: 'Penalización aplicada exitosamente',
        data: {
            penalty: {
                id: penalty._id,
                type: penalty.type,
                severity: penalty.severity,
                status: penalty.status,
                suspensionDays: penalty.suspension.days,
                monetaryAmount: penalty.monetary.amount,
                effectiveDate: penalty.suspension.startDate,
                expirationDate: penalty.suspension.endDate
            },
            barber: {
                id: barber._id,
                businessName: barber.businessName,
                newStatus: barber.accountStatus.status,
                totalPenalties: barber.penaltyHistory.length
            }
        }
    });
});

/**
 * @desc    Aplicar efectos de la penalización al barbero
 */
const applyPenaltyEffects = async (barber, penalty) => {
    // Suspender si corresponde
    if (penalty.suspension.days > 0) {
        barber.accountStatus.status = 'suspended';
        barber.accountStatus.suspendedUntil = penalty.suspension.endDate;
        barber.accountStatus.suspensionReason = `Penalización: ${penalty.reason}`;
        
        // Cancelar reservas futuras automáticamente
        await Booking.updateMany(
            {
                barberId: barber._id,
                status: { $in: ['pending', 'confirmed'] },
                scheduledFor: { $gt: new Date() }
            },
            {
                $set: {
                    status: 'cancelled_by_system',
                    cancellationReason: 'Barbero suspendido por penalización',
                    cancelledAt: new Date()
                }
            }
        );
    }

    // Actualizar rating de confiabilidad
    const totalPenalties = await Penalty.countDocuments({
        barberId: barber._id,
        status: 'active'
    });

    const baseReliability = 5.0;
    const penaltyImpact = Math.min(totalPenalties * 0.3, 2.0);
    barber.stats.reliabilityScore = Math.max(baseReliability - penaltyImpact, 1.0);

    await barber.save();
};

/**
 * @desc    Obtener penalizaciones de un barbero
 * @route   GET /api/penalties/barber/:barberId
 * @access  Private (Barber/Admin)
 */
const getBarberPenalties = asyncHandler(async (req, res) => {
    const { barberId } = req.params;
    const {
        page = 1,
        limit = 10,
        status,
        type,
        severity
    } = req.query;

    // Verificar autorización
    const requestingUser = req.user;
    const barber = await Barber.findById(barberId);
    
    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Solo el barbero mismo o un admin pueden ver las penalizaciones
    const isOwner = barber.userId.toString() === requestingUser.id;
    const isAdmin = requestingUser.role === 'admin';

    if (!isOwner && !isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED'
        });
    }

    // Construir filtros
    const filters = { barberId };
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (severity) filters.severity = severity;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const penalties = await Penalty.find(filters)
        .populate('bookingId', 'bookingNumber scheduledFor service client')
        .populate('appliedBy', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Penalty.countDocuments(filters);

    // Calcular estadísticas
    const stats = await Penalty.aggregate([
        { $match: { barberId: barber._id } },
        {
            $group: {
                _id: null,
                totalPenalties: { $sum: 1 },
                activePenalties: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                totalMonetaryAmount: { $sum: '$monetary.amount' },
                suspensionDays: { $sum: '$suspension.days' }
            }
        }
    ]);

    const penaltyStats = stats[0] || {
        totalPenalties: 0,
        activePenalties: 0,
        totalMonetaryAmount: 0,
        suspensionDays: 0
    };

    res.status(200).json({
        success: true,
        data: {
            penalties,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            },
            stats: penaltyStats,
            barber: {
                id: barber._id,
                businessName: barber.businessName,
                currentStatus: barber.accountStatus.status,
                reliabilityScore: barber.stats.reliabilityScore
            }
        }
    });
});

/**
 * @desc    Apelar una penalización
 * @route   POST /api/penalties/:id/appeal
 * @access  Private (Barber)
 */
const appealPenalty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, evidence = [], statement } = req.body;

    if (!reason || !statement) {
        return res.status(400).json({
            success: false,
            error: 'Motivo y declaración requeridos',
            code: 'MISSING_REQUIRED_FIELDS'
        });
    }

    const penalty = await Penalty.findById(id)
        .populate('barberId', 'userId businessName');

    if (!penalty) {
        return res.status(404).json({
            success: false,
            error: 'Penalización no encontrada',
            code: 'PENALTY_NOT_FOUND'
        });
    }

    // Verificar que es el barbero correcto
    if (penalty.barberId.userId.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED'
        });
    }

    // Verificar que se puede apelar
    if (penalty.status === 'cancelled') {
        return res.status(400).json({
            success: false,
            error: 'Penalización ya cancelada',
            code: 'PENALTY_CANCELLED'
        });
    }

    if (penalty.appeal.status !== 'none') {
        return res.status(400).json({
            success: false,
            error: 'Ya existe una apelación para esta penalización',
            code: 'APPEAL_EXISTS'
        });
    }

    // Verificar tiempo límite para apelar (7 días)
    const daysSinceCreated = (new Date() - penalty.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated > 7) {
        return res.status(400).json({
            success: false,
            error: 'Tiempo límite para apelar expirado',
            code: 'APPEAL_TIME_EXPIRED',
            message: 'Solo puede apelar dentro de los primeros 7 días'
        });
    }

    // Crear la apelación
    penalty.appeal = {
        status: 'pending',
        reason,
        statement,
        evidence,
        submittedAt: new Date(),
        submittedBy: req.user.id
    };

    await penalty.save();

    console.log(`📝 Apelación enviada: Penalización ${penalty._id} por ${penalty.barberId.businessName}`);

    res.status(200).json({
        success: true,
        message: 'Apelación enviada exitosamente',
        data: {
            penalty: {
                id: penalty._id,
                type: penalty.type,
                appealStatus: penalty.appeal.status,
                submittedAt: penalty.appeal.submittedAt
            }
        }
    });
});

/**
 * @desc    Procesar apelación (solo admin)
 * @route   PUT /api/penalties/:id/appeal/process
 * @access  Private (Admin)
 */
const processAppeal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { decision, adminNotes, partialRefund = 0 } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Solo administradores pueden procesar apelaciones',
            code: 'ADMIN_ONLY'
        });
    }

    const validDecisions = ['approved', 'rejected'];
    if (!validDecisions.includes(decision)) {
        return res.status(400).json({
            success: false,
            error: 'Decisión inválida',
            code: 'INVALID_DECISION',
            validDecisions
        });
    }

    const penalty = await Penalty.findById(id)
        .populate('barberId', 'userId businessName accountStatus');

    if (!penalty) {
        return res.status(404).json({
            success: false,
            error: 'Penalización no encontrada',
            code: 'PENALTY_NOT_FOUND'
        });
    }

    if (penalty.appeal.status !== 'pending') {
        return res.status(400).json({
            success: false,
            error: 'No hay apelación pendiente',
            code: 'NO_PENDING_APPEAL'
        });
    }

    // Procesar decisión
    penalty.appeal.status = decision;
    penalty.appeal.processedAt = new Date();
    penalty.appeal.processedBy = req.user.id;
    penalty.appeal.adminNotes = adminNotes || '';

    if (decision === 'approved') {
        // Cancelar penalización
        penalty.status = 'cancelled';
        penalty.cancelledAt = new Date();
        penalty.cancellationReason = 'Apelación aprobada';

        // Restaurar estado del barbero si estaba suspendido por esta penalización
        const barber = penalty.barberId;
        if (barber.accountStatus.status === 'suspended') {
            const activePenalties = await Penalty.countDocuments({
                barberId: barber._id,
                status: 'active',
                'suspension.days': { $gt: 0 },
                _id: { $ne: penalty._id }
            });

            if (activePenalties === 0) {
                barber.accountStatus.status = 'active';
                barber.accountStatus.suspendedUntil = null;
                barber.accountStatus.suspensionReason = null;
                await barber.save();
            }
        }

        // Procesar reembolso parcial si aplica
        if (partialRefund > 0 && partialRefund <= penalty.monetary.amount) {
            penalty.monetary.refundAmount = partialRefund;
            penalty.monetary.refundProcessed = true;
            penalty.monetary.refundedAt = new Date();
        }
    }

    await penalty.save();

    console.log(`⚖️  Apelación ${decision}: Penalización ${penalty._id} - ${adminNotes}`);

    res.status(200).json({
        success: true,
        message: `Apelación ${decision === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`,
        data: {
            penalty: {
                id: penalty._id,
                status: penalty.status,
                appealStatus: penalty.appeal.status,
                refundAmount: penalty.monetary.refundAmount || 0,
                processedAt: penalty.appeal.processedAt
            }
        }
    });
});

/**
 * @desc    Cancelar penalización (solo admin)
 * @route   DELETE /api/penalties/:id
 * @access  Private (Admin)
 */
const cancelPenalty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason = 'Cancelado por administrador' } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Solo administradores pueden cancelar penalizaciones',
            code: 'ADMIN_ONLY'
        });
    }

    const penalty = await Penalty.findById(id)
        .populate('barberId', 'userId businessName accountStatus');

    if (!penalty) {
        return res.status(404).json({
            success: false,
            error: 'Penalización no encontrada',
            code: 'PENALTY_NOT_FOUND'
        });
    }

    if (penalty.status === 'cancelled') {
        return res.status(400).json({
            success: false,
            error: 'Penalización ya cancelada',
            code: 'ALREADY_CANCELLED'
        });
    }

    // Cancelar penalización
    penalty.status = 'cancelled';
    penalty.cancelledAt = new Date();
    penalty.cancellationReason = reason;
    penalty.cancelledBy = req.user.id;

    await penalty.save();

    // Restaurar estado del barbero si era la única penalización activa
    const barber = penalty.barberId;
    const activePenalties = await Penalty.countDocuments({
        barberId: barber._id,
        status: 'active',
        'suspension.days': { $gt: 0 },
        _id: { $ne: penalty._id }
    });

    if (activePenalties === 0 && barber.accountStatus.status === 'suspended') {
        barber.accountStatus.status = 'active';
        barber.accountStatus.suspendedUntil = null;
        barber.accountStatus.suspensionReason = null;
        await barber.save();
    }

    console.log(`❌ Penalización cancelada: ${penalty._id} - ${reason}`);

    res.status(200).json({
        success: true,
        message: 'Penalización cancelada exitosamente',
        data: {
            penalty: {
                id: penalty._id,
                status: penalty.status,
                cancelledAt: penalty.cancelledAt,
                reason: penalty.cancellationReason
            },
            barber: {
                id: barber._id,
                newStatus: barber.accountStatus.status
            }
        }
    });
});

/**
 * @desc    Obtener estadísticas de penalizaciones del sistema
 * @route   GET /api/penalties/admin/stats
 * @access  Private (Admin)
 */
const getPenaltyStats = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Solo administradores pueden ver estadísticas',
            code: 'ADMIN_ONLY'
        });
    }

    const { period = '30d' } = req.query;

    // Calcular fechas según período
    let startDate;
    switch (period) {
        case '7d':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1y':
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Estadísticas generales
    const generalStats = await Penalty.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalPenalties: { $sum: 1 },
                activePenalties: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                cancelledPenalties: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                },
                totalMonetaryAmount: { $sum: '$monetary.amount' },
                totalSuspensionDays: { $sum: '$suspension.days' },
                pendingAppeals: {
                    $sum: { $cond: [{ $eq: ['$appeal.status', 'pending'] }, 1, 0] }
                }
            }
        }
    ]);

    // Estadísticas por tipo
    const typeStats = await Penalty.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                averageAmount: { $avg: '$monetary.amount' },
                totalSuspensionDays: { $sum: '$suspension.days' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    // Estadísticas por severidad
    const severityStats = await Penalty.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$severity',
                count: { $sum: 1 },
                averageAmount: { $avg: '$monetary.amount' }
            }
        }
    ]);

    // Tendencia temporal (por día)
    const timeline = await Penalty.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$createdAt'
                    }
                },
                count: { $sum: 1 },
                monetaryAmount: { $sum: '$monetary.amount' }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Top barberos con más penalizaciones
    const topPenalizedBarbers = await Penalty.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$barberId',
                penaltyCount: { $sum: 1 },
                totalAmount: { $sum: '$monetary.amount' },
                suspensionDays: { $sum: '$suspension.days' }
            }
        },
        {
            $sort: { penaltyCount: -1 }
        },
        {
            $limit: 10
        },
        {
            $lookup: {
                from: 'barbers',
                localField: '_id',
                foreignField: '_id',
                as: 'barber'
            }
        },
        {
            $unwind: '$barber'
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            period,
            dateRange: {
                from: startDate,
                to: new Date()
            },
            general: generalStats[0] || {
                totalPenalties: 0,
                activePenalties: 0,
                cancelledPenalties: 0,
                totalMonetaryAmount: 0,
                totalSuspensionDays: 0,
                pendingAppeals: 0
            },
            byType: typeStats,
            bySeverity: severityStats,
            timeline,
            topPenalized: topPenalizedBarbers.map(item => ({
                barberId: item._id,
                businessName: item.barber.businessName,
                penaltyCount: item.penaltyCount,
                totalAmount: item.totalAmount,
                suspensionDays: item.suspensionDays
            }))
        }
    });
});

/**
 * @desc    Obtener apelaciones pendientes (solo admin)
 * @route   GET /api/penalties/admin/appeals
 * @access  Private (Admin)
 */
const getPendingAppeals = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Solo administradores pueden ver apelaciones',
            code: 'ADMIN_ONLY'
        });
    }

    const {
        page = 1,
        limit = 10,
        sortBy = 'oldest'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let sortOption = { 'appeal.submittedAt': 1 }; // Más antiguos primero
    if (sortBy === 'newest') sortOption = { 'appeal.submittedAt': -1 };
    if (sortBy === 'severity') sortOption = { severity: -1, 'appeal.submittedAt': 1 };

    const appeals = await Penalty.find({
        'appeal.status': 'pending'
    })
    .populate('barberId', 'businessName userId profile')
    .populate('bookingId', 'bookingNumber scheduledFor service')
    .populate('appeal.submittedBy', 'profile.firstName profile.lastName')
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

    const total = await Penalty.countDocuments({
        'appeal.status': 'pending'
    });

    res.status(200).json({
        success: true,
        data: {
            appeals: appeals.map(penalty => ({
                id: penalty._id,
                type: penalty.type,
                severity: penalty.severity,
                monetaryAmount: penalty.monetary.amount,
                suspensionDays: penalty.suspension.days,
                barber: {
                    id: penalty.barberId._id,
                    businessName: penalty.barberId.businessName
                },
                appeal: {
                    reason: penalty.appeal.reason,
                    statement: penalty.appeal.statement,
                    evidence: penalty.appeal.evidence,
                    submittedAt: penalty.appeal.submittedAt,
                    daysSinceSubmitted: Math.floor(
                        (new Date() - penalty.appeal.submittedAt) / (1000 * 60 * 60 * 24)
                    )
                },
                booking: penalty.bookingId ? {
                    number: penalty.bookingId.bookingNumber,
                    scheduledFor: penalty.bookingId.scheduledFor
                } : null
            })),
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            },
            stats: {
                totalPending: total,
                urgentAppeals: appeals.filter(p => 
                    (new Date() - p.appeal.submittedAt) / (1000 * 60 * 60 * 24) > 3
                ).length
            }
        }
    });
});

/**
 * @desc    Verificar penalizaciones automáticas (cron job)
 * @route   POST /api/penalties/system/check-automatic
 * @access  Private (System)
 */
const checkAutomaticPenalties = asyncHandler(async (req, res) => {
    // Esta función sería llamada por un cron job para revisar penalizaciones automáticas
    
    const now = new Date();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);

    // Buscar reservas con no-show
    const noShowBookings = await Booking.find({
        status: 'no_show',
        scheduledFor: { $gte: yesterday, $lt: now },
        penaltyApplied: { $ne: true }
    }).populate('barberId');

    // Buscar cancelaciones tardías
    const lateCancellations = await Booking.find({
        status: 'cancelled_by_barber',
        cancelledAt: { $gte: yesterday, $lt: now },
        penaltyApplied: { $ne: true },
        $expr: {
            $lt: [
                { $subtract: ['$scheduledFor', '$cancelledAt'] },
                2 * 60 * 60 * 1000 // Menos de 2 horas de anticipación
            ]
        }
    }).populate('barberId');

    const results = {
        noShowPenalties: [],
        lateCancellationPenalties: [],
        errors: []
    };

    // Procesar no-shows
    for (const booking of noShowBookings) {
        try {
            const penaltyData = {
                barberId: booking.barberId._id,
                bookingId: booking._id,
                type: 'no_show',
                reason: 'No presentarse a la cita programada',
                description: `Reserva ${booking.bookingNumber} - Cliente no se presentó`,
                applyImmediate: true
            };

            // Simular request para aplicar penalización
            const mockReq = {
                body: penaltyData,
                ip: 'system',
                user: null
            };

            const mockRes = {
                status: () => ({ json: () => {} })
            };

            await applyPenalty(mockReq, mockRes);
            
            booking.penaltyApplied = true;
            await booking.save();

            results.noShowPenalties.push({
                bookingId: booking._id,
                barberId: booking.barberId._id,
                businessName: booking.barberId.businessName
            });
        } catch (error) {
            results.errors.push({
                bookingId: booking._id,
                error: error.message
            });
        }
    }

    // Procesar cancelaciones tardías
    for (const booking of lateCancellations) {
        try {
            const penaltyData = {
                barberId: booking.barberId._id,
                bookingId: booking._id,
                type: 'late_cancellation',
                reason: 'Cancelación tardía',
                description: `Reserva ${booking.bookingNumber} - Cancelada con menos de 2 horas de anticipación`,
                applyImmediate: true
            };

            const mockReq = {
                body: penaltyData,
                ip: 'system',
                user: null
            };

            const mockRes = {
                status: () => ({ json: () => {} })
            };

            await applyPenalty(mockReq, mockRes);
            
            booking.penaltyApplied = true;
            await booking.save();

            results.lateCancellationPenalties.push({
                bookingId: booking._id,
                barberId: booking.barberId._id,
                businessName: booking.barberId.businessName
            });
        } catch (error) {
            results.errors.push({
                bookingId: booking._id,
                error: error.message
            });
        }
    }

    console.log(`🔄 Penalizaciones automáticas procesadas: ${results.noShowPenalties.length} no-shows, ${results.lateCancellationPenalties.length} cancelaciones tardías`);

    res.status(200).json({
        success: true,
        message: 'Penalizaciones automáticas procesadas',
        data: results
    });
});

/**
 * @desc    Limpiar penalizaciones expiradas
 * @route   POST /api/penalties/system/cleanup
 * @access  Private (System)
 */
const cleanupExpiredPenalties = asyncHandler(async (req, res) => {
    const now = new Date();

    // Encontrar penalizaciones con suspensión expirada
    const expiredSuspensions = await Penalty.find({
        status: 'active',
        'suspension.endDate': { $lt: now },
        'suspension.days': { $gt: 0 }
    }).populate('barberId');

    let restoredBarbers = 0;

    for (const penalty of expiredSuspensions) {
        // Verificar si es la única penalización activa con suspensión
        const otherActiveSuspensions = await Penalty.countDocuments({
            barberId: penalty.barberId._id,
            status: 'active',
            'suspension.endDate': { $gt: now },
            _id: { $ne: penalty._id }
        });

        if (otherActiveSuspensions === 0) {
            // Restaurar barbero
            const barber = penalty.barberId;
            barber.accountStatus.status = 'active';
            barber.accountStatus.suspendedUntil = null;
            barber.accountStatus.suspensionReason = null;
            await barber.save();
            restoredBarbers++;
        }

        // Marcar penalización como expirada
        penalty.status = 'expired';
        penalty.expiredAt = now;
        await penalty.save();
    }

    console.log(`🧹 Limpieza de penalizaciones: ${expiredSuspensions.length} penalizaciones expiradas, ${restoredBarbers} barberos restaurados`);

    res.status(200).json({
        success: true,
        message: 'Limpieza de penalizaciones completada',
        data: {
            expiredPenalties: expiredSuspensions.length,
            restoredBarbers
        }
    });
});

module.exports = {
    applyPenalty,
    getBarberPenalties,
    appealPenalty,
    processAppeal,
    cancelPenalty,
    getPenaltyStats,
    getPendingAppeals,
    checkAutomaticPenalties,
    cleanupExpiredPenalties
};
