const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Barber = require('../models/Barber');
const User = require('../models/User');
const GooglePlace = require('../models/GooglePlace');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/config');

/**
 * @desc    Crear nueva reseña
 * @route   POST /api/reviews
 * @access  Private (Client)
 */
const createReview = asyncHandler(async (req, res) => {
    const {
        barberId,
        bookingId,
        rating,
        comment,
        photos = [],
        aspectRatings,
        isAnonymous = false
    } = req.body;

    // Verificar que el barbero existe
    const barber = await Barber.findById(barberId)
        .populate('userId', 'profile.firstName profile.lastName');
    
    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Verificar que la reserva existe y pertenece al cliente
    let booking = null;
    if (config.REVIEW_CONFIG.requireBookingToReview) {
        booking = await Booking.findOne({
            _id: bookingId,
            clientId: req.user.id,
            barberId: barberId,
            status: 'completed'
        });

        if (!booking) {
            return res.status(400).json({
                success: false,
                error: 'Reserva no válida',
                code: 'INVALID_BOOKING',
                message: 'Solo puede reseñar barberos con los que ha completado una reserva'
            });
        }

        // Verificar que no haya reseña previa para esta reserva
        const existingReview = await Review.findOne({
            bookingId: booking._id,
            'deletion.isDeleted': false
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: 'Ya reseñó esta reserva',
                code: 'ALREADY_REVIEWED',
                message: 'Solo puede hacer una reseña por reserva'
            });
        }
    }

    // Validar que no haya reseña previa del cliente al barbero (si no requiere booking)
    if (!config.REVIEW_CONFIG.requireBookingToReview) {
        const existingReview = await Review.findOne({
            clientId: req.user.id,
            barberId: barberId,
            'deletion.isDeleted': false
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: 'Ya reseñó a este barbero',
                code: 'ALREADY_REVIEWED',
                message: 'Solo puede hacer una reseña por barbero'
            });
        }
    }

    // Validar fotos si se incluyen
    if (photos.length > config.REVIEW_CONFIG.maxPhotos) {
        return res.status(400).json({
            success: false,
            error: 'Demasiadas fotos',
            code: 'TOO_MANY_PHOTOS',
            message: `Máximo ${config.REVIEW_CONFIG.maxPhotos} fotos permitidas`
        });
    }

    // Crear la reseña
    const reviewData = {
        clientId: req.user.id,
        barberId: barberId,
        rating: parseInt(rating),
        comment: comment.trim(),
        isAnonymous,
        serviceInfo: {
            type: booking?.service?.type || 'corteHombre',
            price: booking?.payment?.amount || 0,
            location: booking?.location?.type || 'local'
        },
        deviceInfo: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            device: 'web'
        }
    };

    // Agregar booking si es requerido
    if (booking) {
        reviewData.bookingId = booking._id;
        reviewData.serviceInfo.duration = booking.service.duration;
    }

    // Agregar fotos si las hay
    if (photos.length > 0) {
        reviewData.photos = photos.map((photo, index) => ({
            url: photo.url,
            caption: photo.caption || '',
            order: index,
            uploadedAt: new Date()
        }));
    }

    // Agregar calificaciones por aspecto si las hay
    if (aspectRatings) {
        reviewData.aspectRatings = aspectRatings;
    }

    const review = await Review.create(reviewData);

    // Actualizar rating del barbero
    barber.updateRating(rating);
    await barber.save();

    // Actualizar estadísticas del cliente
    await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'stats.totalReviews': 1 },
        $set: { 'stats.averageRatingGiven': rating }
    });

    console.log(`⭐ Nueva reseña: ${rating} estrellas para ${barber.businessName} por ${isAnonymous ? 'usuario anónimo' : req.user.email}`);

    res.status(201).json({
        success: true,
        message: 'Reseña creada exitosamente',
        data: {
            review: {
                id: review._id,
                rating: review.rating,
                comment: review.comment,
                photos: review.photos,
                aspectRatings: review.aspectRatings,
                isAnonymous: review.isAnonymous,
                createdAt: review.createdAt,
                autoTags: review.autoTags
            },
            barber: {
                id: barber._id,
                businessName: barber.businessName,
                newRating: barber.stats.rating,
                totalReviews: barber.stats.totalReviews
            }
        }
    });
});

/**
 * @desc    Obtener reseñas de un barbero
 * @route   GET /api/reviews/barber/:barberId
 * @access  Public
 */
const getBarberReviews = asyncHandler(async (req, res) => {
    const { barberId } = req.params;
    const {
        page = 1,
        limit = 10,
        sortBy = 'newest',
        minRating,
        withPhotos,
        featured
    } = req.query;

    // Verificar que el barbero existe
    const barber = await Barber.findById(barberId);
    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    const options = {
        limit: parseInt(limit),
        sortBy: sortBy,
        minRating: minRating ? parseInt(minRating) : null,
        withPhotos: withPhotos === 'true',
        featured: featured === 'true'
    };

    const reviews = await Review.findByBarber(barberId, options);

    // Obtener estadísticas de reseñas
    const reviewStats = await Review.getBarberReviewStats(barberId);

    // Incrementar vistas de reseñas para el barbero
    if (req.user && req.user.role === 'client') {
        await Barber.findByIdAndUpdate(barberId, {
            $inc: { 'stats.reviewViews': 1 }
        });
    }

    // Calcular paginación
    const totalReviews = reviewStats.totalReviews || 0;
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    res.status(200).json({
        success: true,
        data: {
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: totalReviews,
                itemsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            },
            stats: reviewStats,
            filters: {
                sortBy,
                minRating: minRating ? parseInt(minRating) : null,
                withPhotos: withPhotos === 'true',
                featured: featured === 'true'
            }
        }
    });
});

/**
 * @desc    Obtener detalles de una reseña
 * @route   GET /api/reviews/:id
 * @access  Public
 */
const getReviewDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const review = await Review.findById(id)
        .populate('clientId', 'profile.firstName profile.lastName profile.avatar')
        .populate('barberId', 'businessName location stats.rating')
        .populate('bookingId', 'bookingNumber scheduledFor service');

    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    // Verificar si está eliminada
    if (review.deletion.isDeleted) {
        return res.status(200).json({
            success: true,
            data: {
                review: {
                    id: review._id,
                    isDeleted: true,
                    deletionMessage: review.deletion.deletionMessage,
                    deletedAt: review.deletion.deletedAt
                }
            }
        });
    }

    // Incrementar vistas
    await review.incrementViews();

    res.status(200).json({
        success: true,
        data: {
            review: {
                ...review.toJSON(),
                clientName: review.isAnonymous ? 'Usuario anónimo' : review.clientName,
                formattedDate: review.formattedDate,
                canEdit: review.canEdit,
                aspectRatingSummary: review.aspectRatingSummary
            }
        }
    });
});

/**
 * @desc    Editar reseña (solo cliente autor)
 * @route   PUT /api/reviews/:id
 * @access  Private (Client)
 */
const editReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment, aspectRatings, editReason } = req.body;

    const review = await Review.findById(id);
    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    // Verificar que es el autor
    if (review.clientId.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED',
            message: 'Solo puede editar sus propias reseñas'
        });
    }

    // Verificar que no está eliminada
    if (review.deletion.isDeleted) {
        return res.status(400).json({
            success: false,
            error: 'Reseña eliminada',
            code: 'REVIEW_DELETED',
            message: 'No puede editar una reseña eliminada'
        });
    }

    // Verificar que puede editarse (dentro de 24 horas)
    if (!review.canEdit) {
        return res.status(400).json({
            success: false,
            error: 'Tiempo de edición expirado',
            code: 'EDIT_TIME_EXPIRED',
            message: 'Solo puede editar reseñas dentro de las primeras 24 horas'
        });
    }

    // Guardar estado original para historial
    review._original = {
        rating: review.rating,
        comment: review.comment,
        aspectRatings: review.aspectRatings
    };
    review._editReason = editReason || 'Edición del usuario';

    // Actualizar campos
    if (rating !== undefined) {
        review.rating = parseInt(rating);
    }
    if (comment !== undefined) {
        review.comment = comment.trim();
    }
    if (aspectRatings !== undefined) {
        review.aspectRatings = aspectRatings;
    }

    await review.save();

    // Recalcular rating del barbero
    const barber = await Barber.findById(review.barberId);
    if (barber) {
        const reviews = await Review.find({
            barberId: barber._id,
            'deletion.isDeleted': false
        });
        
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        barber.stats.rating = totalRating / reviews.length;
        barber.stats.totalReviews = reviews.length;
        
        await barber.save();
    }

    console.log(`✏️  Reseña editada: ${review._id} - Nueva calificación: ${review.rating}`);

    res.status(200).json({
        success: true,
        message: 'Reseña actualizada exitosamente',
        data: {
            review: {
                id: review._id,
                rating: review.rating,
                comment: review.comment,
                aspectRatings: review.aspectRatings,
                isEdited: review.isEdited,
                updatedAt: review.updatedAt
            }
        }
    });
});

/**
 * @desc    Eliminar reseña (soft delete por cliente)
 * @route   DELETE /api/reviews/:id
 * @access  Private (Client)
 */
const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason = 'Eliminado por el usuario' } = req.body;

    const review = await Review.findById(id);
    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    // Verificar autorización
    const isAuthor = review.clientId.toString() === req.user.id;
    const isBarber = req.user.role === 'barber';
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isBarber && !isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED'
        });
    }

    // Verificar que no esté ya eliminada
    if (review.deletion.isDeleted) {
        return res.status(400).json({
            success: false,
            error: 'Reseña ya eliminada',
            code: 'ALREADY_DELETED'
        });
    }

    // Si es barbero, verificar que es su reseña
    if (isBarber) {
        const barber = await Barber.findOne({ userId: req.user.id });
        if (!barber || review.barberId.toString() !== barber._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'No autorizado',
                code: 'NOT_YOUR_REVIEW'
            });
        }
    }

    // Determinar tipo de eliminación y mensaje
    let deletionType, deletionMessage;
    
    if (isAuthor) {
        deletionType = 'client_request';
        deletionMessage = 'Comentario eliminado por el cliente';
    } else if (isBarber) {
        deletionType = 'barber_request';
        deletionMessage = 'Comentario de cliente eliminado por peluquero :(';
    } else if (isAdmin) {
        deletionType = 'admin_action';
        deletionMessage = 'Comentario eliminado por moderación';
    }

    // Eliminar reseña (soft delete)
    review.softDelete(req.user.id, req.user.role, deletionType, deletionMessage);
    await review.save();

    // Recalcular estadísticas del barbero si la reseña afectaba el rating
    const barber = await Barber.findById(review.barberId);
    if (barber) {
        const activeReviews = await Review.find({
            barberId: barber._id,
            'deletion.isDeleted': false
        });
        
        if (activeReviews.length > 0) {
            const totalRating = activeReviews.reduce((sum, r) => sum + r.rating, 0);
            barber.stats.rating = totalRating / activeReviews.length;
            barber.stats.totalReviews = activeReviews.length;
        } else {
            barber.stats.rating = 0;
            barber.stats.totalReviews = 0;
        }
        
        await barber.save();
    }

    console.log(`🗑️  Reseña eliminada: ${review._id} por ${req.user.role} - ${reason}`);

    res.status(200).json({
        success: true,
        message: 'Reseña eliminada exitosamente',
        data: {
            review: {
                id: review._id,
                isDeleted: true,
                deletionMessage: review.deletion.deletionMessage,
                deletedBy: req.user.role
            }
        }
    });
});

/**
 * @desc    Responder a reseña (solo barbero)
 * @route   POST /api/reviews/:id/respond
 * @access  Private (Barber)
 */
const respondToReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length < 10) {
        return res.status(400).json({
            success: false,
            error: 'Respuesta inválida',
            code: 'INVALID_RESPONSE',
            message: 'La respuesta debe tener al menos 10 caracteres'
        });
    }

    const review = await Review.findById(id)
        .populate('clientId', 'profile.firstName profile.lastName');

    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    // Verificar que es el barbero correcto
    const barber = await Barber.findOne({ userId: req.user.id });
    if (!barber || review.barberId.toString() !== barber._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED',
            message: 'Solo puede responder a sus propias reseñas'
        });
    }

    // Verificar que la reseña no esté eliminada
    if (review.deletion.isDeleted) {
        return res.status(400).json({
            success: false,
            error: 'Reseña eliminada',
            code: 'REVIEW_DELETED',
            message: 'No puede responder a una reseña eliminada'
        });
    }

    // Agregar o editar respuesta
    review.addBarberResponse(response.trim());
    await review.save();

    console.log(`💬 Respuesta agregada: ${barber.businessName} respondió a reseña ${review._id}`);

    res.status(200).json({
        success: true,
        message: 'Respuesta agregada exitosamente',
        data: {
            review: {
                id: review._id,
                barberResponse: review.barberResponse,
                client: review.isAnonymous ? 'Usuario anónimo' : 
                    `${review.clientId.profile.firstName} ${review.clientId.profile.lastName}`
            }
        }
    });
});

/**
 * @desc    Dar "me gusta" a reseña
 * @route   POST /api/reviews/:id/like
 * @access  Private
 */
const toggleReviewLike = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    // Verificar que no esté eliminada
    if (review.deletion.isDeleted) {
        return res.status(400).json({
            success: false,
            error: 'Reseña eliminada',
            code: 'REVIEW_DELETED'
        });
    }

    // Verificar que no es el autor de la reseña
    if (review.clientId.toString() === req.user.id) {
        return res.status(400).json({
            success: false,
            error: 'No puede dar like a su propia reseña',
            code: 'CANNOT_LIKE_OWN_REVIEW'
        });
    }

    // Toggle like
    const wasLiked = review.toggleLike(req.user.id);
    await review.save();

    res.status(200).json({
        success: true,
        message: wasLiked ? 'Like agregado' : 'Like removido',
        data: {
            review: {
                id: review._id,
                likes: review.metrics.likes,
                isLiked: wasLiked
            }
        }
    });
});

/**
 * @desc    Reportar reseña como inapropiada
 * @route   POST /api/reviews/:id/report
 * @access  Private
 */
const reportReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, description = '' } = req.body;

    if (!reason) {
        return res.status(400).json({
            success: false,
            error: 'Motivo requerido',
            code: 'MISSING_REASON'
        });
    }

    const validReasons = ['spam', 'offensive', 'fake', 'inappropriate', 'other'];
    if (!validReasons.includes(reason)) {
        return res.status(400).json({
            success: false,
            error: 'Motivo inválido',
            code: 'INVALID_REASON',
            validReasons
        });
    }

    const review = await Review.findById(id);
    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    // Verificar que no esté eliminada
    if (review.deletion.isDeleted) {
        return res.status(400).json({
            success: false,
            error: 'Reseña eliminada',
            code: 'REVIEW_DELETED'
        });
    }

    // Verificar que no es el autor
    if (review.clientId.toString() === req.user.id) {
        return res.status(400).json({
            success: false,
            error: 'No puede reportar su propia reseña',
            code: 'CANNOT_REPORT_OWN_REVIEW'
        });
    }

    try {
        // Agregar reporte
        review.addReport(req.user.id, reason, description);
        await review.save();

        console.log(`🚩 Reseña reportada: ${review._id} por ${req.user.email} - ${reason}`);

        res.status(200).json({
            success: true,
            message: 'Reporte enviado exitosamente',
            data: {
                review: {
                    id: review._id,
                    reportCount: review.moderation.reportCount,
                    moderationStatus: review.moderation.status
                }
            }
        });
    } catch (error) {
        if (error.message.includes('Ya has reportado')) {
            return res.status(400).json({
                success: false,
                error: 'Ya reportó esta reseña',
                code: 'ALREADY_REPORTED'
            });
        }
        throw error;
    }
});

/**
 * @desc    Destacar/no destacar reseña (solo barbero)
 * @route   PUT /api/reviews/:id/feature
 * @access  Private (Barber)
 */
const toggleFeatureReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { featured = true } = req.body;

    const review = await Review.findById(id);
    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    // Verificar que es el barbero correcto
    const barber = await Barber.findOne({ userId: req.user.id });
    if (!barber || review.barberId.toString() !== barber._id.toString()) {
        return res.status(403).json({
            success: false,
            error: 'No autorizado',
            code: 'NOT_AUTHORIZED'
        });
    }

    // Verificar que no esté eliminada
    if (review.deletion.isDeleted) {
        return res.status(400).json({
            success: false,
            error: 'Reseña eliminada',
            code: 'REVIEW_DELETED'
        });
    }

    // Solo destacar reseñas de 4+ estrellas
    if (featured && review.rating < 4) {
        return res.status(400).json({
            success: false,
            error: 'Solo puede destacar reseñas de 4+ estrellas',
            code: 'RATING_TOO_LOW'
        });
    }

    // Verificar límite de reseñas destacadas (máximo 5)
    if (featured) {
        const featuredCount = await Review.countDocuments({
            barberId: barber._id,
            'metrics.isFeatured': true,
            'deletion.isDeleted': false
        });

        if (featuredCount >= 5) {
            return res.status(400).json({
                success: false,
                error: 'Máximo 5 reseñas destacadas',
                code: 'TOO_MANY_FEATURED',
                message: 'Debe quitar el destacado de otra reseña primero'
            });
        }
    }

    // Destacar/no destacar
    review.setFeatured(featured);
    await review.save();

    console.log(`⭐ Reseña ${featured ? 'destacada' : 'no destacada'}: ${review._id}`);

    res.status(200).json({
        success: true,
        message: `Reseña ${featured ? 'destacada' : 'no destacada'} exitosamente`,
        data: {
            review: {
                id: review._id,
                isFeatured: review.metrics.isFeatured,
                featuredAt: review.metrics.featuredAt
            }
        }
    });
});

/**
 * @desc    Obtener reseñas reportadas (solo admin)
 * @route   GET /api/reviews/moderation/flagged
 * @access  Private (Admin)
 */
const getFlaggedReviews = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acceso solo para administradores',
            code: 'ADMIN_ONLY'
        });
    }

    const {
        page = 1,
        limit = 20,
        reportReason,
        minReports = 1
    } = req.query;

    const filters = {
        'moderation.status': 'flagged',
        'moderation.reportCount': { $gte: parseInt(minReports) }
    };

    if (reportReason) {
        filters['moderation.reports.reason'] = reportReason;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const flaggedReviews = await Review.find(filters)
        .populate('clientId', 'profile.firstName profile.lastName email')
        .populate('barberId', 'businessName userId')
        .sort({ 'moderation.reportCount': -1, updatedAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Review.countDocuments(filters);

    res.status(200).json({
        success: true,
        data: {
            reviews: flaggedReviews,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            },
            filters: {
                reportReason,
                minReports: parseInt(minReports)
            }
        }
    });
});

/**
 * @desc    Moderar reseña (solo admin)
 * @route   PUT /api/reviews/:id/moderate
 * @access  Private (Admin)
 */
const moderateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acceso solo para administradores',
            code: 'ADMIN_ONLY'
        });
    }

    const validActions = ['approve', 'hide', 'delete'];
    if (!validActions.includes(action)) {
        return res.status(400).json({
            success: false,
            error: 'Acción inválida',
            code: 'INVALID_ACTION',
            validActions
        });
    }

    const review = await Review.findById(id);
    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    let message = '';
    switch (action) {
        case 'approve':
            review.moderation.status = 'approved';
            review.moderation.moderatedBy = req.user.id;
            review.moderation.moderatedAt = new Date();
            review.moderation.reason = reason || 'Aprobado por moderación';
            message = 'Reseña aprobada';
            break;
        case 'hide':
            review.moderation.status = 'hidden';
            review.moderation.moderatedBy = req.user.id;
            review.moderation.moderatedAt = new Date();
            review.moderation.reason = reason || 'Oculto por moderación';
            message = 'Reseña ocultada';
            break;
        case 'delete':
            review.softDelete(req.user.id, 'admin', 'admin_action', reason || 'Eliminado por moderación');
            message = 'Reseña eliminada';
            break;
    }

    await review.save();

    console.log(`🛡️  Reseña moderada: ${review._id} - ${action} por admin ${req.user.email}`);

    res.status(200).json({
        success: true,
        message,
        data: {
            review: {
                id: review._id,
                moderationStatus: review.moderation.status,
                isDeleted: review.deletion.isDeleted,
                moderatedAt: review.moderation.moderatedAt
            }
        }
    });
});

/**
 * @desc    Obtener estadísticas de reseñas para un barbero
 * @route   GET /api/reviews/barber/:barberId/stats
 * @access  Public
 */
const getBarberReviewStats = asyncHandler(async (req, res) => {
    const { barberId } = req.params;

    // Verificar que el barbero existe
    const barber = await Barber.findById(barberId);
    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    const stats = await Review.getBarberReviewStats(barberId);

    res.status(200).json({
        success: true,
        data: {
            barber: {
                id: barber._id,
                businessName: barber.businessName
            },
            stats
        }
    });
});

/**
 * @desc    Obtener reseñas de un cliente
 * @route   GET /api/reviews/client/mine
 * @access  Private (Client)
 */
const getMyReviews = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        includeDeleted = false
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = { clientId: req.user.id };
    if (!includeDeleted) {
        filter['deletion.isDeleted'] = false;
    }

    const reviews = await Review.find(filter)
        .populate('barberId', 'businessName location.address profile.avatar stats.rating')
        .populate('bookingId', 'bookingNumber scheduledFor service')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Review.countDocuments(filter);

    const reviewsWithDetails = reviews.map(review => ({
        ...review.toJSON(),
        canEdit: review.canEdit,
        formattedDate: review.formattedDate,
        serviceType: review.serviceInfo?.type || 'corteHombre'
    }));

    res.status(200).json({
        success: true,
        data: {
            reviews: reviewsWithDetails,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1
            },
            stats: {
                totalReviews: total,
                averageRating: reviews.length > 0 ? 
                    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
            }
        }
    });
});

/**
 * @desc    Crear reseña para lugar de Google (sin perfil)
 * @route   POST /api/reviews/google-place
 * @access  Private (Client)
 */
const createGooglePlaceReview = asyncHandler(async (req, res) => {
    const {
        placeId,
        rating,
        comment,
        photos = [],
        isAnonymous = false
    } = req.body;

    // Verificar que el lugar existe en Google Places
    const place = await GooglePlace.findOne({ placeId });
    if (!place) {
        return res.status(404).json({
            success: false,
            error: 'Lugar no encontrado',
            code: 'PLACE_NOT_FOUND'
        });
    }

    // Verificar que no haya reseña previa del cliente a este lugar
    const existingReview = await Review.findOne({
        clientId: req.user.id,
        googlePlaceId: place._id,
        'deletion.isDeleted': false
    });

    if (existingReview) {
        return res.status(400).json({
            success: false,
            error: 'Ya reseñó este lugar',
            code: 'ALREADY_REVIEWED',
            message: 'Solo puede hacer una reseña por lugar'
        });
    }

    // Crear la reseña para lugar de Google
    const reviewData = {
        clientId: req.user.id,
        googlePlaceId: place._id,
        rating: parseInt(rating),
        comment: comment.trim(),
        isAnonymous,
        serviceInfo: {
            type: 'lugar_google',
            price: 0,
            location: 'local'
        },
        deviceInfo: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            device: 'web'
        }
    };

    // Agregar fotos si las hay
    if (photos.length > 0) {
        reviewData.photos = photos.map((photo, index) => ({
            url: photo.url,
            caption: photo.caption || '',
            order: index,
            uploadedAt: new Date()
        }));
    }

    const review = await Review.create(reviewData);

    // Actualizar estadísticas del lugar
    await GooglePlace.findByIdAndUpdate(place._id, {
        $inc: { 'stats.totalReviews': 1 },
        $push: { 'reviews': review._id }
    });

    console.log(`⭐ Nueva reseña lugar Google: ${rating} estrellas para ${place.name} por ${isAnonymous ? 'usuario anónimo' : req.user.email}`);

    res.status(201).json({
        success: true,
        message: 'Reseña creada exitosamente',
        data: {
            review: {
                id: review._id,
                rating: review.rating,
                comment: review.comment,
                photos: review.photos,
                isAnonymous: review.isAnonymous,
                createdAt: review.createdAt
            },
            place: {
                id: place._id,
                name: place.name,
                placeId: place.placeId
            }
        }
    });
});

/**
 * @desc    Obtener reseñas de un lugar de Google
 * @route   GET /api/reviews/google-place/:placeId
 * @access  Public
 */
const getGooglePlaceReviews = asyncHandler(async (req, res) => {
    const { placeId } = req.params;
    const {
        page = 1,
        limit = 10,
        sortBy = 'newest'
    } = req.query;

    const place = await GooglePlace.findOne({ placeId });
    if (!place) {
        return res.status(404).json({
            success: false,
            error: 'Lugar no encontrado',
            code: 'PLACE_NOT_FOUND'
        });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let sortOption = { createdAt: -1 };
    if (sortBy === 'rating_high') sortOption = { rating: -1, createdAt: -1 };
    if (sortBy === 'rating_low') sortOption = { rating: 1, createdAt: -1 };
    if (sortBy === 'oldest') sortOption = { createdAt: 1 };

    const reviews = await Review.find({
        googlePlaceId: place._id,
        'deletion.isDeleted': false
    })
    .populate('clientId', 'profile.firstName profile.lastName profile.avatar')
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

    const total = await Review.countDocuments({
        googlePlaceId: place._id,
        'deletion.isDeleted': false
    });

    // Calcular estadísticas
    const avgRating = reviews.length > 0 ? 
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    const ratingDistribution = await Review.aggregate([
        {
            $match: {
                googlePlaceId: place._id,
                'deletion.isDeleted': false
            }
        },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: -1 }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            reviews: reviews.map(review => ({
                ...review.toJSON(),
                clientName: review.isAnonymous ? 'Usuario anónimo' : 
                    `${review.clientId.profile.firstName} ${review.clientId.profile.lastName}`,
                formattedDate: review.formattedDate
            })),
            place: {
                id: place._id,
                name: place.name,
                placeId: place.placeId,
                address: place.address
            },
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1
            },
            stats: {
                totalReviews: total,
                averageRating: avgRating,
                ratingDistribution
            }
        }
    });
});

module.exports = {
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
};
