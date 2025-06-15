const Barber = require('../models/Barber');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const GooglePlace = require('../models/GooglePlace');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/config');

/**
 * @desc    Completar perfil de barbero
 * @route   PUT /api/barbers/complete-profile
 * @access  Private (Barber)
 */
const completeProfile = asyncHandler(async (req, res) => {
    const {
        businessName,
        description,
        services,
        serviceType,
        location,
        whatsapp,
        instagram,
        website,
        gallery
    } = req.body;

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Verificar si el WhatsApp ya está en uso
    if (whatsapp && whatsapp !== barber.whatsapp) {
        const existingWhatsApp = await Barber.findOne({
            whatsapp,
            _id: { $ne: barber._id }
        });

        if (existingWhatsApp) {
            return res.status(400).json({
                success: false,
                error: 'El WhatsApp ya está registrado',
                code: 'WHATSAPP_ALREADY_EXISTS'
            });
        }
    }

    // Actualizar información básica
    if (businessName) barber.businessName = businessName;
    if (description) barber.description = description;
    if (serviceType) barber.serviceType = serviceType;
    if (whatsapp) barber.whatsapp = whatsapp;
    if (instagram) barber.instagram = instagram;
    if (website) barber.website = website;

    // Actualizar servicios obligatorios
    if (services) {
        if (services.corteHombre) {
            barber.services.corteHombre = {
                ...barber.services.corteHombre,
                ...services.corteHombre,
                available: true
            };
        }

        if (services.corteBarba) {
            barber.services.corteBarba = {
                ...barber.services.corteBarba,
                ...services.corteBarba,
                available: true
            };
        }

        if (services.adicionales) {
            barber.services.adicionales = services.adicionales;
        }

        if (services.specialties) {
            barber.services.specialties = services.specialties;
        }
    }

    // Actualizar ubicación
    if (location) {
        barber.location = {
            ...barber.location,
            ...location
        };

        // Intentar vincular con Google Place si se proporciona
        if (location.googlePlaceId) {
            try {
                const googlePlace = await GooglePlace.findOne({ 
                    placeId: location.googlePlaceId 
                });

                if (googlePlace) {
                    await googlePlace.linkBarberProfile(barber._id);
                }
            } catch (error) {
                console.warn('Error vinculando Google Place:', error);
            }
        }
    }

    // Actualizar galería
    if (gallery && Array.isArray(gallery)) {
        barber.gallery = gallery.map((img, index) => ({
            url: img.url,
            caption: img.caption || '',
            uploadedAt: new Date(),
            isMainImage: index === 0 // Primera imagen como principal
        }));
    }

    // Activar perfil si cumple requisitos mínimos
    const hasRequiredServices = barber.services.corteHombre.price > 0 && 
                               barber.services.corteBarba.price > 0;
    const hasLocation = barber.location.address && barber.location.coordinates;
    const hasContact = barber.whatsapp;

    if (hasRequiredServices && hasLocation && hasContact) {
        barber.isActive = true;
    }

    await barber.save();

    // Actualizar rol del usuario a barbero si no lo es
    const user = await User.findById(req.user.id);
    if (user.role !== 'barber') {
        user.role = 'barber';
        await user.save();
    }

    console.log(`💇‍♂️ Perfil completado: ${barber.businessName}`);

    res.status(200).json({
        success: true,
        message: 'Perfil de barbero completado exitosamente',
        data: {
            barber: {
                id: barber._id,
                businessName: barber.businessName,
                isActive: barber.isActive,
                isVerified: barber.verification.isVerified,
                completionPercentage: calculateProfileCompletion(barber)
            },
            nextSteps: getNextSteps(barber)
        }
    });
});

/**
 * @desc    Obtener perfil público de barbero
 * @route   GET /api/barbers/:id
 * @access  Public
 */
const getBarberProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { clientLat, clientLng } = req.query;

    const barber = await Barber.findById(id)
        .populate('userId', 'profile.firstName profile.lastName profile.avatar lastActivity')
        .populate('location.googlePlaceId');

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Calcular distancia si se proporcionan coordenadas del cliente
    let distance = null;
    if (clientLat && clientLng) {
        distance = barber.calculateDistance([parseFloat(clientLng), parseFloat(clientLat)]);
    }

    // Obtener reseñas recientes
    const reviews = await Review.findByBarber(id, { 
        limit: 10, 
        sortBy: 'createdAt' 
    });

    // Obtener estadísticas de reseñas
    const reviewStats = await Review.getBarberReviewStats(id);

    // Incrementar vista del perfil
    if (req.user && req.user.role === 'client') {
        await barber.updateOne({ $inc: { 'stats.profileViews': 1 } });
    }

    // Información de disponibilidad actual
    const availability = {
        isAvailable: barber.availability.isAvailable,
        acceptsImmediate: barber.availability.acceptsImmediate,
        currentStatus: barber.availability.currentStatus,
        statusMessage: barber.availability.statusMessage,
        nextAvailableSlot: getNextAvailableSlot(barber)
    };

    res.status(200).json({
        success: true,
        data: {
            barber: {
                id: barber._id,
                businessName: barber.businessName,
                description: barber.description,
                services: barber.services,
                serviceType: barber.serviceType,
                location: barber.location,
                gallery: barber.gallery,
                stats: barber.stats,
                whatsapp: barber.whatsapp,
                instagram: barber.instagram,
                website: barber.website,
                isActive: barber.isActive,
                isVerified: barber.verification.isVerified,
                isFeatured: barber.isFeatured,
                lastActivity: barber.lastActivity,
                mapStatus: barber.getMapStatus(),
                distance
            },
            owner: {
                name: `${barber.userId.profile.firstName} ${barber.userId.profile.lastName}`,
                avatar: barber.userId.profile.avatar,
                memberSince: barber.createdAt
            },
            availability,
            reviews,
            reviewStats
        }
    });
});

/**
 * @desc    Buscar barberos
 * @route   GET /api/barbers/search
 * @access  Public
 */
const searchBarbers = asyncHandler(async (req, res) => {
    const {
        lat,
        lng,
        radius = 10000,
        serviceType,
        minRating,
        maxPrice,
        availableNow,
        hasProfile = true,
        sortBy = 'distance',
        page = 1,
        limit = 20,
        query
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let barbers = [];

    if (query) {
        // Búsqueda por texto
        barbers = await Barber.find({
            $text: { $search: query },
            isActive: true,
            'verification.isVerified': hasProfile === 'true'
        })
        .populate('userId', 'profile.firstName profile.lastName profile.avatar')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limitNum);
    } else if (lat && lng) {
        // Búsqueda por proximidad
        const coordinates = [parseFloat(lng), parseFloat(lat)];
        const filters = {};

        if (serviceType && serviceType !== 'mixto') {
            filters.serviceType = serviceType;
        }

        if (minRating) {
            filters.minRating = parseFloat(minRating);
        }

        if (maxPrice) {
            filters.maxPrice = parseInt(maxPrice);
        }

        if (availableNow === 'true') {
            filters.acceptsImmediate = true;
        }

        barbers = await Barber.findNearby(coordinates, parseInt(radius), filters);

        // Calcular distancia para cada barbero
        barbers = barbers.map(barber => {
            const distance = barber.calculateDistance(coordinates);
            return { ...barber.toObject(), distance };
        });

        // Ordenar según criterio
        switch (sortBy) {
            case 'rating':
                barbers.sort((a, b) => b.stats.rating - a.stats.rating);
                break;
            case 'price':
                barbers.sort((a, b) => {
                    const priceA = Math.min(a.services.corteHombre.price, a.services.corteBarba.price);
                    const priceB = Math.min(b.services.corteHombre.price, b.services.corteBarba.price);
                    return priceA - priceB;
                });
                break;
            case 'popularity':
                barbers.sort((a, b) => b.stats.totalCuts - a.stats.totalCuts);
                break;
            default: // distance
                barbers.sort((a, b) => a.distance - b.distance);
        }

        // Aplicar paginación manual
        barbers = barbers.slice(skip, skip + limitNum);
    } else {
        // Búsqueda general sin ubicación
        const matchQuery = {
            isActive: true,
            'verification.isVerified': hasProfile === 'true'
        };

        if (serviceType && serviceType !== 'mixto') {
            matchQuery.serviceType = { $in: [serviceType, 'mixto'] };
        }

        if (minRating) {
            matchQuery['stats.rating'] = { $gte: parseFloat(minRating) };
        }

        barbers = await Barber.find(matchQuery)
            .populate('userId', 'profile.firstName profile.lastName profile.avatar')
            .sort({ 'stats.rating': -1, 'stats.totalCuts': -1 })
            .skip(skip)
            .limit(limitNum);
    }

    const total = barbers.length; // Aproximado para paginación

    res.status(200).json({
        success: true,
        data: {
            barbers,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            },
            filters: {
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
                radius: parseInt(radius),
                serviceType,
                minRating: minRating ? parseFloat(minRating) : null,
                maxPrice: maxPrice ? parseInt(maxPrice) : null,
                availableNow: availableNow === 'true',
                sortBy
            }
        }
    });
});

/**
 * @desc    Actualizar disponibilidad de barbero
 * @route   PUT /api/barbers/availability
 * @access  Private (Barber)
 */
const updateAvailability = asyncHandler(async (req, res) => {
    const {
        isAvailable,
        acceptsImmediate,
        currentStatus,
        statusMessage,
        schedule,
        unavailableDates,
        bookingSettings
    } = req.body;

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Verificar que esté verificado para cambiar disponibilidad
    if (!barber.verification.isVerified && isAvailable) {
        return res.status(403).json({
            success: false,
            error: 'Debe estar verificado para activar disponibilidad',
            code: 'NOT_VERIFIED'
        });
    }

    // Actualizar disponibilidad
    if (typeof isAvailable === 'boolean') {
        barber.availability.isAvailable = isAvailable;
    }

    if (typeof acceptsImmediate === 'boolean') {
        barber.availability.acceptsImmediate = acceptsImmediate;
    }

    if (currentStatus) {
        barber.availability.currentStatus = currentStatus;
    }

    if (statusMessage !== undefined) {
        barber.availability.statusMessage = statusMessage;
    }

    // Actualizar horarios
    if (schedule && Array.isArray(schedule)) {
        barber.availability.schedule = schedule;
    }

    // Actualizar fechas no disponibles
    if (unavailableDates && Array.isArray(unavailableDates)) {
        barber.availability.unavailableDates = unavailableDates;
    }

    // Actualizar configuración de reservas
    if (bookingSettings) {
        barber.availability.bookingSettings = {
            ...barber.availability.bookingSettings,
            ...bookingSettings
        };
    }

    await barber.save();

    console.log(`📅 Disponibilidad actualizada: ${barber.businessName} - ${isAvailable ? 'Disponible' : 'No disponible'}`);

    res.status(200).json({
        success: true,
        message: 'Disponibilidad actualizada exitosamente',
        data: {
            availability: barber.availability,
            mapStatus: barber.getMapStatus()
        }
    });
});

/**
 * @desc    Actualizar servicios y precios
 * @route   PUT /api/barbers/services
 * @access  Private (Barber)
 */
const updateServices = asyncHandler(async (req, res) => {
    const { services } = req.body;

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Verificar límites de cambios diarios si se incluye en req
    if (req.dailyLimits) {
        const { priceChanges } = req.dailyLimits;
        if (priceChanges.remaining <= 0) {
            return res.status(429).json({
                success: false,
                error: 'Límite de cambios diarios excedido',
                code: 'DAILY_LIMIT_EXCEEDED',
                message: `Solo puede cambiar precios ${priceChanges.limit} veces por día`,
                remainingChanges: priceChanges.remaining
            });
        }
    }

    // Actualizar servicios obligatorios
    if (services.corteHombre) {
        barber.services.corteHombre = {
            ...barber.services.corteHombre,
            ...services.corteHombre
        };
    }

    if (services.corteBarba) {
        barber.services.corteBarba = {
            ...barber.services.corteBarba,
            ...services.corteBarba
        };
    }

    // Actualizar servicios adicionales
    if (services.adicionales) {
        barber.services.adicionales = services.adicionales;
    }

    if (services.specialties) {
        barber.services.specialties = services.specialties;
    }

    if (services.promotions) {
        barber.services.promotions = services.promotions;
    }

    await barber.save();

    console.log(`💰 Servicios actualizados: ${barber.businessName}`);

    res.status(200).json({
        success: true,
        message: 'Servicios actualizados exitosamente',
        data: {
            services: barber.services,
            dailyLimits: req.dailyLimits || null
        }
    });
});

/**
 * @desc    Subir imágenes de verificación (CI)
 * @route   POST /api/barbers/verification
 * @access  Private (Barber)
 */
const uploadVerification = asyncHandler(async (req, res) => {
    const { ciFront, ciBack } = req.files || {};

    if (!ciFront || !ciBack) {
        return res.status(400).json({
            success: false,
            error: 'Ambas imágenes de CI son requeridas',
            code: 'MISSING_CI_IMAGES',
            message: 'Debe subir la imagen frontal y trasera de su cédula de identidad'
        });
    }

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Actualizar imágenes de verificación
    barber.verification.ciImages = {
        front: ciFront[0].url,
        back: ciBack[0].url
    };

    barber.verification.verificationStatus = 'under_review';

    await barber.save();

    console.log(`📄 Verificación subida: ${barber.businessName}`);

    res.status(200).json({
        success: true,
        message: 'Imágenes de verificación subidas exitosamente',
        data: {
            verificationStatus: barber.verification.verificationStatus,
            message: 'Sus documentos están siendo revisados. Le notificaremos cuando la verificación esté completa.'
        }
    });
});

/**
 * @desc    Actualizar galería de imágenes
 * @route   PUT /api/barbers/gallery
 * @access  Private (Barber)
 */
const updateGallery = asyncHandler(async (req, res) => {
    const { images, mainImageIndex } = req.body;

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Debe proporcionar al menos una imagen',
            code: 'NO_IMAGES'
        });
    }

    // Actualizar galería
    barber.gallery = images.map((img, index) => ({
        url: img.url,
        caption: img.caption || '',
        uploadedAt: new Date(),
        isMainImage: index === (mainImageIndex || 0)
    }));

    await barber.save();

    console.log(`🖼️  Galería actualizada: ${barber.businessName} - ${images.length} imágenes`);

    res.status(200).json({
        success: true,
        message: 'Galería actualizada exitosamente',
        data: {
            gallery: barber.gallery,
            totalImages: barber.gallery.length
        }
    });
});

/**
 * @desc    Obtener reservas del barbero
 * @route   GET /api/barbers/bookings
 * @access  Private (Barber)
 */
const getBarberBookings = asyncHandler(async (req, res) => {
    const {
        status,
        date,
        fromDate,
        toDate,
        page = 1,
        limit = 20,
        sortBy = 'scheduledFor',
        sortOrder = 'asc'
    } = req.query;

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    const filters = { barberId: barber._id };

    // Aplicar filtros
    if (status && status !== 'all') {
        if (status.includes(',')) {
            filters.status = { $in: status.split(',') };
        } else {
            filters.status = status;
        }
    }

    if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        filters.scheduledFor = { $gte: startOfDay, $lte: endOfDay };
    } else {
        if (fromDate) {
            filters.scheduledFor = { $gte: new Date(fromDate) };
        }
        if (toDate) {
            filters.scheduledFor = {
                ...filters.scheduledFor,
                $lte: new Date(toDate)
            };
        }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const bookings = await Booking.find(filters)
        .populate('clientId', 'profile.firstName profile.lastName profile.phone profile.avatar')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Booking.countDocuments(filters);

    // Estadísticas rápidas para el día actual
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const todayStats = await Booking.aggregate([
        {
            $match: {
                barberId: barber._id,
                scheduledFor: { $gte: startOfToday, $lte: endOfToday }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalEarnings: { $sum: '$payment.amount' }
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
                itemsPerPage: limitNum
            },
            todayStats,
            filters: {
                status,
                date,
                fromDate,
                toDate
            }
        }
    });
});

/**
 * @desc    Obtener estadísticas del barbero
 * @route   GET /api/barbers/stats
 * @access  Private (Barber)
 */
const getBarberStats = asyncHandler(async (req, res) => {
    const { period = '1month' } = req.query;

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Calcular fecha de inicio según período
    let startDate = new Date();
    switch (period) {
        case '1week':
            startDate.setDate(startDate.getDate() - 7);
            break;
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
            startDate.setMonth(startDate.getMonth() - 1);
    }

    // Estadísticas de reservas
    const bookingStats = await Booking.aggregate([
        {
            $match: {
                barberId: barber._id,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalEarnings: { $sum: '$payment.amount' }
            }
        }
    ]);

    // Estadísticas diarias
    const dailyStats = await Booking.aggregate([
        {
            $match: {
                barberId: barber._id,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                bookings: { $sum: 1 },
                earnings: { $sum: '$payment.amount' },
                completedBookings: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);

    // Servicios más populares
    const popularServices = await Booking.aggregate([
        {
            $match: {
                barberId: barber._id,
                status: 'completed',
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$service.type',
                count: { $sum: 1 },
                totalEarnings: { $sum: '$payment.amount' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    // Horarios más populares
    const popularHours = await Booking.aggregate([
        {
            $match: {
                barberId: barber._id,
                status: 'completed',
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $hour: '$scheduledFor' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ]);

    // Estadísticas de reseñas
    const reviewStats = await Review.getBarberReviewStats(barber._id);

    // Clientes recurrentes
    const repeatClients = await Booking.aggregate([
        {
            $match: {
                barberId: barber._id,
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$clientId',
                visits: { $sum: 1 },
                totalSpent: { $sum: '$payment.amount' },
                lastVisit: { $max: '$scheduledFor' }
            }
        },
        {
            $match: { visits: { $gt: 1 } }
        },
        {
            $sort: { visits: -1 }
        },
        {
            $limit: 10
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'client'
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            period,
            overview: {
                totalBookings: bookingStats.reduce((sum, stat) => sum + stat.count, 0),
                totalEarnings: bookingStats.reduce((sum, stat) => sum + stat.totalEarnings, 0),
                completedBookings: bookingStats.find(s => s._id === 'completed')?.count || 0,
                cancelledBookings: bookingStats.find(s => s._id === 'cancelled')?.count || 0,
                currentRating: barber.stats.rating,
                totalReviews: barber.stats.totalReviews,
                repeatClientsCount: repeatClients.length
            },
            bookingStats,
            dailyStats,
            popularServices,
            popularHours,
            reviewStats,
            repeatClients,
            barberInfo: {
                businessName: barber.businessName,
                totalCuts: barber.stats.totalCuts,
                memberSince: barber.createdAt,
                isVerified: barber.verification.isVerified
            }
        }
    });
});

/**
 * Calcular porcentaje de completitud del perfil
 */
const calculateProfileCompletion = (barber) => {
    let score = 0;
    const maxScore = 100;

    // Información básica (30 puntos)
    if (barber.businessName) score += 10;
    if (barber.description) score += 10;
    if (barber.whatsapp) score += 10;

    // Servicios (25 puntos)
    if (barber.services.corteHombre.price > 0) score += 10;
    if (barber.services.corteBarba.price > 0) score += 10;
    if (barber.services.adicionales && barber.services.adicionales.length > 0) score += 5;

    // Ubicación (15 puntos)
    if (barber.location.address) score += 10;
    if (barber.location.coordinates && barber.location.coordinates.length === 2) score += 5;

    // Galería (15 puntos)
    if (barber.gallery && barber.gallery.length > 0) score += 10;
    if (barber.gallery && barber.gallery.length >= 3) score += 5;

    // Verificación (10 puntos)
    if (barber.verification.ciImages && barber.verification.ciImages.front) score += 5;
    if (barber.verification.isVerified) score += 5;

    // Extras (5 puntos)
    if (barber.instagram || barber.website) score += 5;

    return Math.round((score / maxScore) * 100);
};

/**
 * Obtener próximos pasos según el estado del perfil
 */
const getNextSteps = (barber) => {
    const steps = [];

    if (!barber.businessName) {
        steps.push('Agregar nombre del negocio');
    }

    if (!barber.services.corteHombre.price || barber.services.corteHombre.price === 0) {
        steps.push('Configurar precio del corte de hombre');
    }

    if (!barber.services.corteBarba.price || barber.services.corteBarba.price === 0) {
        steps.push('Configurar precio del corte + barba');
    }

    if (!barber.gallery || barber.gallery.length === 0) {
        steps.push('Subir al menos una imagen de tu trabajo');
    }

    if (!barber.verification.ciImages || !barber.verification.ciImages.front) {
        steps.push('Subir imágenes de verificación (CI)');
    }

    if (!barber.verification.isVerified) {
        steps.push('Esperar verificación de documentos');
    }

    if (!barber.availability.schedule || barber.availability.schedule.length === 0) {
        steps.push('Configurar horarios de trabajo');
    }

    if (steps.length === 0) {
        steps.push('¡Perfil completado! Ya puedes recibir reservas');
    }

    return steps;
};

/**
 * Obtener próximo slot disponible
 */
const getNextAvailableSlot = (barber) => {
    if (!barber.availability.isAvailable || !barber.availability.schedule) {
        return null;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // Buscar en los próximos 7 días
    for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7;
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[checkDay];

        const daySchedule = barber.availability.schedule.find(s => s.day === dayName);

        if (daySchedule && daySchedule.isWorking && daySchedule.shifts) {
            for (const shift of daySchedule.shifts) {
                const shiftStart = parseInt(shift.start.replace(':', ''));
                const shiftEnd = parseInt(shift.end.replace(':', ''));

                // Si es el mismo día, debe ser después del tiempo actual
                if (i === 0 && shiftStart <= currentTime) continue;

                // Encontrado slot disponible
                const slotDate = new Date(now);
                slotDate.setDate(slotDate.getDate() + i);
                slotDate.setHours(Math.floor(shiftStart / 100), shiftStart % 100, 0, 0);

                return {
                    date: slotDate,
                    day: dayName,
                    time: shift.start,
                    daysFromNow: i
                };
            }
        }
    }

    return null;
};

/**
 * @desc    Responder a reseña
 * @route   POST /api/barbers/reviews/:reviewId/respond
 * @access  Private (Barber)
 */
const respondToReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length < 10) {
        return res.status(400).json({
            success: false,
            error: 'La respuesta debe tener al menos 10 caracteres',
            code: 'INVALID_RESPONSE'
        });
    }

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    const review = await Review.findOne({
        _id: reviewId,
        barberId: barber._id,
        'deletion.isDeleted': false
    });

    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    // Agregar respuesta
    review.addBarberResponse(response.trim());
    await review.save();

    console.log(`💬 Respuesta a reseña: ${barber.businessName} respondió a reseña ${reviewId}`);

    res.status(200).json({
        success: true,
        message: 'Respuesta agregada exitosamente',
        data: {
            review: {
                id: review._id,
                barberResponse: review.barberResponse
            }
        }
    });
});

/**
 * @desc    Eliminar reseña (soft delete)
 * @route   DELETE /api/barbers/reviews/:reviewId
 * @access  Private (Barber)
 */
const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { reason = 'Contenido inapropiado' } = req.body;

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    const review = await Review.findOne({
        _id: reviewId,
        barberId: barber._id,
        'deletion.isDeleted': false
    });

    if (!review) {
        return res.status(404).json({
            success: false,
            error: 'Reseña no encontrada',
            code: 'REVIEW_NOT_FOUND'
        });
    }

    // Eliminar reseña (soft delete)
    review.softDelete(req.user.id, 'barber', 'barber_request', reason);
    await review.save();

    console.log(`🗑️  Reseña eliminada: ${barber.businessName} eliminó reseña ${reviewId}`);

    res.status(200).json({
        success: true,
        message: 'Reseña eliminada exitosamente',
        data: {
            deletionMessage: review.deletion.deletionMessage
        }
    });
});

/**
 * @desc    Activar/desactivar perfil
 * @route   PUT /api/barbers/toggle-active
 * @access  Private (Barber)
 */
const toggleActiveStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Verificar que esté verificado para activar
    if (isActive && !barber.verification.isVerified) {
        return res.status(403).json({
            success: false,
            error: 'Debe estar verificado para activar el perfil',
            code: 'NOT_VERIFIED'
        });
    }

    // Verificar que tenga servicios configurados
    if (isActive && (barber.services.corteHombre.price === 0 || barber.services.corteBarba.price === 0)) {
        return res.status(400).json({
            success: false,
            error: 'Debe configurar precios de servicios antes de activar',
            code: 'SERVICES_NOT_CONFIGURED'
        });
    }

    barber.isActive = isActive;

    // Si se desactiva, también desactivar disponibilidad
    if (!isActive) {
        barber.availability.isAvailable = false;
        barber.availability.acceptsImmediate = false;
        barber.availability.currentStatus = 'offline';
    }

    await barber.save();

    console.log(`🔄 Estado cambiado: ${barber.businessName} - ${isActive ? 'Activado' : 'Desactivado'}`);

    res.status(200).json({
        success: true,
        message: `Perfil ${isActive ? 'activado' : 'desactivado'} exitosamente`,
        data: {
            isActive: barber.isActive,
            availability: barber.availability
        }
    });
});

/**
 * @desc    Obtener barberos destacados
 * @route   GET /api/barbers/featured
 * @access  Public
 */
const getFeaturedBarbers = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const featuredBarbers = await Barber.find({
        isFeatured: true,
        isActive: true,
        'verification.isVerified': true
    })
    .populate('userId', 'profile.firstName profile.lastName profile.avatar')
    .sort({ 'stats.rating': -1, 'stats.totalCuts': -1 })
    .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        data: {
            featured: featuredBarbers,
            total: featuredBarbers.length
        }
    });
});

/**
 * @desc    Obtener top barberos por rating
 * @route   GET /api/barbers/top-rated
 * @access  Public
 */
const getTopRatedBarbers = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const topBarbers = await Barber.getTopRated(parseInt(limit));

    res.status(200).json({
        success: true,
        data: {
            topRated: topBarbers,
            total: topBarbers.length
        }
    });
});

/**
 * @desc    Vincular con Google Place
 * @route   POST /api/barbers/link-google-place
 * @access  Private (Barber)
 */
const linkGooglePlace = asyncHandler(async (req, res) => {
    const { placeId } = req.body;

    if (!placeId) {
        return res.status(400).json({
            success: false,
            error: 'Google Place ID requerido',
            code: 'MISSING_PLACE_ID'
        });
    }

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Verificar que el Google Place existe
    let googlePlace = await GooglePlace.findOne({ placeId });

    if (!googlePlace) {
        // Intentar sincronizar desde Google Places API
        try {
            googlePlace = await GooglePlace.syncWithGoogle(placeId);
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Google Place no válido',
                code: 'INVALID_GOOGLE_PLACE',
                message: 'No se pudo verificar el lugar con Google Places'
            });
        }
    }

    // Verificar que no esté ya vinculado a otro barbero
    if (googlePlace.hasBarberProfile && googlePlace.barberId?.toString() !== barber._id.toString()) {
        return res.status(400).json({
            success: false,
            error: 'Google Place ya vinculado',
            code: 'PLACE_ALREADY_LINKED',
            message: 'Este lugar ya está vinculado a otro barbero'
        });
    }

    // Vincular Google Place con barbero
    await googlePlace.linkBarberProfile(barber._id);

    // Actualizar ubicación del barbero con datos de Google
    if (googlePlace.geometry && googlePlace.formattedAddress) {
        barber.location.googlePlaceId = placeId;
        barber.location.address = googlePlace.formattedAddress;
        barber.location.coordinates = [
            googlePlace.geometry.location.lng,
            googlePlace.geometry.location.lat
        ];

        await barber.save();
    }

    console.log(`🔗 Google Place vinculado: ${barber.businessName} -> ${googlePlace.name}`);

    res.status(200).json({
        success: true,
        message: 'Google Place vinculado exitosamente',
        data: {
            googlePlace: {
                id: googlePlace._id,
                placeId: googlePlace.placeId,
                name: googlePlace.name,
                address: googlePlace.formattedAddress,
                rating: googlePlace.rating
            },
            barber: {
                location: barber.location
            }
        }
    });
});

/**
 * @desc    Obtener agenda del día
 * @route   GET /api/barbers/schedule/:date?
 * @access  Private (Barber)
 */
const getDaySchedule = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const targetDate = date ? new Date(date) : new Date();

    const barber = await Barber.findOne({ userId: req.user.id });

    if (!barber) {
        return res.status(404).json({
            success: false,
            error: 'Perfil de barbero no encontrado',
            code: 'BARBER_NOT_FOUND'
        });
    }

    // Obtener reservas del día
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const bookings = await Booking.find({
        barberId: barber._id,
        scheduledFor: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('clientId', 'profile.firstName profile.lastName profile.phone profile.avatar')
    .sort({ scheduledFor: 1 });

    // Obtener configuración de horarios
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getDay()];
    const daySchedule = barber.availability.schedule.find(s => s.day === dayName);

    // Verificar si es día no disponible
    const isUnavailable = barber.availability.unavailableDates.some(unavailable => {
        const unavailableDate = new Date(unavailable.date);
        return unavailableDate.toDateString() === targetDate.toDateString();
    });

    res.status(200).json({
        success: true,
        data: {
            date: targetDate.toISOString().split('T')[0],
            dayName,
            isWorkingDay: daySchedule?.isWorking || false,
            isUnavailable,
            shifts: daySchedule?.shifts || [],
            bookings,
            summary: {
                totalBookings: bookings.length,
                confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
                pendingBookings: bookings.filter(b => b.status === 'pending').length,
                estimatedEarnings: bookings
                    .filter(b => ['confirmed', 'completed'].includes(b.status))
                    .reduce((sum, b) => sum + b.payment.amount, 0)
            }
        }
    });
});

module.exports = {
    completeProfile,
    getBarberProfile,
    searchBarbers,
    updateAvailability,
    updateServices,
    uploadVerification,
    updateGallery,
    getBarberBookings,
    getBarberStats,
    respondToReview,
    deleteReview,
    toggleActiveStatus,
    getFeaturedBarbers,
    getTopRatedBarbers,
    linkGooglePlace,
    getDaySchedule
};
