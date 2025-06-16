const User = require('../models/User');
const Barber = require('../models/Barber');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Penalty = require('../models/Penalty');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/config');

/**
 * @desc    Obtener perfil de usuario
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate('stats.favoriteBarber', 'businessName location rating');

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND'
        });
    }

    // Obtener información adicional si es barbero
    let barberProfile = null;
    if (user.role === 'barber') {
        barberProfile = await Barber.findOne({ userId: user._id })
            .populate('location.googlePlaceId');
    }

    // Obtener estadísticas recientes
    const recentBookings = await Booking.find({ 
        clientId: user._id 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('barberId', 'businessName location');

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profile: user.profile,
                preferences: user.preferences,
                stats: user.stats,
                verification: {
                    emailVerified: user.verification.emailVerified,
                    phoneVerified: user.verification.phoneVerified,
                    identityVerified: user.verification.identityVerified
                },
                isActive: user.isActive,
                isSuspended: user.isSuspended,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            },
            barberProfile,
            recentBookings,
            avatarUrl: user.getAvatarUrl()
        }
    });
});

/**
 * @desc    Actualizar perfil de usuario
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
    const {
        firstName,
        lastName,
        phone,
        address,
        coordinates,
        dateOfBirth,
        gender,
        avatar
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND'
        });
    }

    // Verificar si el teléfono ya está en uso por otro usuario
    if (phone && phone !== user.profile.phone) {
        const existingPhone = await User.findOne({
            'profile.phone': phone,
            _id: { $ne: user._id }
        });

        if (existingPhone) {
            return res.status(400).json({
                success: false,
                error: 'El teléfono ya está en uso',
                code: 'PHONE_ALREADY_EXISTS'
            });
        }

        // Si cambia el teléfono, marcar como no verificado
        user.verification.phoneVerified = false;
        user.verification.phoneVerificationCode = undefined;
        user.verification.phoneVerificationExpires = undefined;
    }

    // Actualizar campos del perfil
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phone) user.profile.phone = phone;
    if (avatar) user.profile.avatar = avatar;
    if (dateOfBirth) user.profile.dateOfBirth = new Date(dateOfBirth);
    if (gender) user.profile.gender = gender;

    // Actualizar dirección si se proporciona
    if (address) {
        user.profile.address = {
            street: address.street || user.profile.address?.street,
            city: address.city || user.profile.address?.city,
            region: address.region || user.profile.address?.region,
            country: address.country || user.profile.address?.country || 'Chile',
            postalCode: address.postalCode || user.profile.address?.postalCode
        };
    }

    // Actualizar coordenadas
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
        user.profile.coordinates = coordinates;
    }

    await user.save();

    console.log(`👤 Perfil actualizado: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
            user: {
                id: user._id,
                profile: user.profile,
                verification: {
                    emailVerified: user.verification.emailVerified,
                    phoneVerified: user.verification.phoneVerified
                }
            }
        }
    });
});

/**
 * @desc    Actualizar preferencias de usuario
 * @route   PUT /api/users/preferences
 * @access  Private
 */
const updatePreferences = asyncHandler(async (req, res) => {
    const {
        notifications,
        preferredServiceType,
        searchRadius,
        priceRange,
        language,
        theme
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND'
        });
    }

    // Actualizar preferencias
    if (notifications) {
        user.preferences.notifications = {
            ...user.preferences.notifications,
            ...notifications
        };
    }

    if (preferredServiceType) {
        user.preferences.preferredServiceType = preferredServiceType;
    }

    if (searchRadius) {
        user.preferences.searchRadius = searchRadius;
    }

    if (priceRange) {
        user.preferences.priceRange = {
            min: priceRange.min || user.preferences.priceRange.min,
            max: priceRange.max || user.preferences.priceRange.max
        };
    }

    if (language) {
        user.preferences.language = language;
    }

    if (theme) {
        user.preferences.theme = theme;
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Preferencias actualizadas exitosamente',
        data: {
            preferences: user.preferences
        }
    });
});

/**
 * @desc    Obtener historial de reservas del usuario
 * @route   GET /api/users/bookings
 * @access  Private
 */
const getUserBookings = asyncHandler(async (req, res) => {
    const {
        status,
        fromDate,
        toDate,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const filters = { clientId: req.user.id };

    if (status) {
        filters.status = status;
    }

    if (fromDate || toDate) {
        filters.scheduledFor = {};
        if (fromDate) filters.scheduledFor.$gte = new Date(fromDate);
        if (toDate) filters.scheduledFor.$lte = new Date(toDate);
    }

    // Obtener reservas
    const bookings = await Booking.find(filters)
        .populate('barberId', 'businessName location whatsapp stats.rating')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum);

    // Contar total para paginación
    const total = await Booking.countDocuments(filters);

    // Calcular estadísticas del usuario
    const stats = await Booking.aggregate([
        { $match: { clientId: req.user.id } },
        {
            $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                completedBookings: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                cancelledBookings: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                },
                totalSpent: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', 'completed'] },
                            '$payment.amount',
                            0
                        ]
                    }
                },
                averageRating: { $avg: '$clientReview.rating' }
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
            stats: stats[0] || {
                totalBookings: 0,
                completedBookings: 0,
                cancelledBookings: 0,
                totalSpent: 0,
                averageRating: 0
            }
        }
    });
});

/**
 * @desc    Obtener reseñas escritas por el usuario
 * @route   GET /api/users/reviews
 * @access  Private
 */
const getUserReviews = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({
        clientId: req.user.id,
        'deletion.isDeleted': false
    })
    .populate('barberId', 'businessName location')
    .populate('bookingId', 'bookingNumber scheduledFor')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limitNum);

    const total = await Review.countDocuments({
        clientId: req.user.id,
        'deletion.isDeleted': false
    });

    res.status(200).json({
        success: true,
        data: {
            reviews,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            }
        }
    });
});

/**
 * @desc    Obtener penalizaciones del usuario
 * @route   GET /api/users/penalties
 * @access  Private
 */
const getUserPenalties = asyncHandler(async (req, res) => {
    const {
        status = 'active',
        page = 1,
        limit = 10
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const penalties = await Penalty.find({
        userId: req.user.id,
        ...(status !== 'all' && { status })
    })
    .populate('bookingId', 'bookingNumber scheduledFor')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    const total = await Penalty.countDocuments({
        userId: req.user.id,
        ...(status !== 'all' && { status })
    });

    // Calcular total de multas pendientes
    const activePenalties = await Penalty.aggregate([
        {
            $match: {
                userId: req.user.id,
                status: 'active'
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$calculation.finalAmount' },
                count: { $sum: 1 }
            }
        }
    ]);

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
            summary: activePenalties[0] || { totalAmount: 0, count: 0 }
        }
    });
});

/**
 * @desc    Agregar barbero a favoritos
 * @route   POST /api/users/favorites/:barberId
 * @access  Private
 */
const addFavoriteBarber = asyncHandler(async (req, res) => {
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

    const user = await User.findById(req.user.id);

    // Verificar si ya está en favoritos
    const isAlreadyFavorite = user.favorites?.some(fav => fav.toString() === barberId);

    if (isAlreadyFavorite) {
        return res.status(400).json({
            success: false,
            error: 'Barbero ya está en favoritos',
            code: 'ALREADY_FAVORITE'
        });
    }

    // Agregar a favoritos
    if (!user.favorites) user.favorites = [];
    user.favorites.push(barberId);

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Barbero agregado a favoritos',
        data: {
            barberId,
            totalFavorites: user.favorites.length
        }
    });
});

/**
 * @desc    Remover barbero de favoritos
 * @route   DELETE /api/users/favorites/:barberId
 * @access  Private
 */
const removeFavoriteBarber = asyncHandler(async (req, res) => {
    const { barberId } = req.params;

    const user = await User.findById(req.user.id);

    if (!user.favorites || user.favorites.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No tienes barberos favoritos',
            code: 'NO_FAVORITES'
        });
    }

    // Remover de favoritos
    user.favorites = user.favorites.filter(fav => fav.toString() !== barberId);

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Barbero removido de favoritos',
        data: {
            barberId,
            totalFavorites: user.favorites.length
        }
    });
});

/**
 * @desc    Obtener barberos favoritos
 * @route   GET /api/users/favorites
 * @access  Private
 */
const getFavoriteBarbers = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate({
            path: 'favorites',
            populate: {
                path: 'userId',
                select: 'profile.firstName profile.lastName profile.avatar'
            }
        });

    if (!user.favorites || user.favorites.length === 0) {
        return res.status(200).json({
            success: true,
            data: {
                favorites: [],
                total: 0
            }
        });
    }

    res.status(200).json({
        success: true,
        data: {
            favorites: user.favorites,
            total: user.favorites.length
        }
    });
});

/**
 * @desc    Obtener estadísticas del usuario
 * @route   GET /api/users/stats
 * @access  Private
 */
const getUserStats = asyncHandler(async (req, res) => {
    const { period = '6months' } = req.query;

    // Calcular fecha de inicio según el período
    let startDate = new Date();
    switch (period) {
        case '1month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case '3months':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        case '6months':
            startDate.setMonth(startDate.getMonth() - 6);
            break;
        case '1year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        default:
            startDate.setMonth(startDate.getMonth() - 6);
    }

    // Estadísticas de reservas
    const bookingStats = await Booking.aggregate([
        {
            $match: {
                clientId: req.user.id,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$payment.amount' }
            }
        }
    ]);

    // Estadísticas por mes
    const monthlyStats = await Booking.aggregate([
        {
            $match: {
                clientId: req.user.id,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                bookings: { $sum: 1 },
                spent: { $sum: '$payment.amount' }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }
    ]);

    // Barberos más visitados
    const topBarbers = await Booking.aggregate([
        {
            $match: {
                clientId: req.user.id,
                status: 'completed',
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$barberId',
                visits: { $sum: 1 },
                totalSpent: { $sum: '$payment.amount' }
            }
        },
        {
            $sort: { visits: -1 }
        },
        {
            $limit: 5
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

    // Estadísticas de reseñas
    const reviewStats = await Review.aggregate([
        {
            $match: {
                clientId: req.user.id,
                'deletion.isDeleted': false
            }
        },
        {
            $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        }
    ]);

    // Procesar distribución de ratings
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (reviewStats[0] && reviewStats[0].ratingDistribution) {
        reviewStats[0].ratingDistribution.forEach(rating => {
            ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        });
    }

    res.status(200).json({
        success: true,
        data: {
            period,
            bookingStats,
            monthlyStats,
            topBarbers,
            reviewStats: {
                ...reviewStats[0],
                ratingDistribution
            },
            summary: {
                totalBookings: bookingStats.reduce((sum, stat) => sum + stat.count, 0),
                totalSpent: bookingStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
                completedBookings: bookingStats.find(s => s._id === 'completed')?.count || 0,
                cancelledBookings: bookingStats.find(s => s._id === 'cancelled')?.count || 0
            }
        }
    });
});

/**
 * @desc    Desactivar cuenta de usuario
 * @route   DELETE /api/users/account
 * @access  Private
 */
const deactivateAccount = asyncHandler(async (req, res) => {
    const { reason, password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            error: 'Contraseña requerida para desactivar cuenta',
            code: 'PASSWORD_REQUIRED'
        });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verificar contraseña
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        return res.status(400).json({
            success: false,
            error: 'Contraseña incorrecta',
            code: 'INCORRECT_PASSWORD'
        });
    }

    // Verificar que no tenga reservas activas
    const activeBookings = await Booking.find({
        clientId: user._id,
        status: { $in: ['pending', 'accepted', 'confirmed'] }
    });

    if (activeBookings.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'No puede desactivar cuenta con reservas activas',
            code: 'ACTIVE_BOOKINGS',
            message: 'Complete o cancele sus reservas pendientes antes de desactivar la cuenta',
            activeBookings: activeBookings.length
        });
    }

    // Desactivar cuenta
    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivationReason = reason || 'Usuario solicitó desactivación';

    await user.save();

    // Si es barbero, desactivar también el perfil de barbero
    if (user.role === 'barber') {
        await Barber.updateOne(
            { userId: user._id },
            { 
                isActive: false,
                availability: { isAvailable: false }
            }
        );
    }

    console.log(`❌ Cuenta desactivada: ${user.email} - Razón: ${reason}`);

    res.status(200).json({
        success: true,
        message: 'Cuenta desactivada exitosamente'
    });
});

/**
 * @desc    Exportar datos del usuario (GDPR)
 * @route   GET /api/users/export
 * @access  Private
 */
const exportUserData = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    // Obtener todos los datos del usuario
    const bookings = await Booking.find({ clientId: req.user.id });
    const reviews = await Review.find({ clientId: req.user.id });
    const penalties = await Penalty.find({ userId: req.user.id });

    let barberProfile = null;
    if (user.role === 'barber') {
        barberProfile = await Barber.findOne({ userId: req.user.id });
    }

    const exportData = {
        user: user.toJSON(),
        barberProfile,
        bookings,
        reviews,
        penalties,
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.id
    };

    console.log(`📤 Datos exportados: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Datos exportados exitosamente',
        data: exportData
    });
});

module.exports = {
    getProfile,
    updateProfile,
    updatePreferences,
    getUserBookings,
    getUserReviews,
    getUserPenalties,
    addFavoriteBarber,
    removeFavoriteBarber,
    getFavoriteBarbers,
    getUserStats,
    deactivateAccount,
    exportUserData
};
