const GooglePlace = require('../models/GooglePlace');
const Barber = require('../models/Barber');
const Review = require('../models/Review');
const { asyncHandler } = require('../middleware/errorHandler');
const { searchNearbyPlaces, getPlaceDetails, validatePlaceData } = require('../utils/googlePlaces');
const config = require('../config/config');

/**
 * @desc    Buscar barberías cercanas usando Google Places
 * @route   GET /api/places/search
 * @access  Public
 */
const searchNearbyBarbershops = asyncHandler(async (req, res) => {
    const {
        lat,
        lng,
        radius = 5000,
        keyword = 'barbería peluquería',
        includeRegistered = true
    } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({
            success: false,
            error: 'Coordenadas requeridas',
            code: 'MISSING_COORDINATES'
        });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = Math.min(parseInt(radius), 20000); // Máximo 20km

    try {
        // Buscar en Google Places API
        const googleResults = await searchNearbyPlaces({
            lat: latitude,
            lng: longitude,
            radius: searchRadius,
            keyword,
            type: 'hair_care'
        });

        // Buscar barberos registrados en la zona
        let registeredBarbers = [];
        if (includeRegistered) {
            registeredBarbers = await Barber.find({
                'location.coordinates': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: searchRadius
                    }
                },
                'accountStatus.status': 'active'
            })
            .populate('userId', 'profile.firstName profile.lastName')
            .select('businessName location services stats profile availability');
        }

        // Procesar y combinar resultados
        const places = await Promise.all(
            googleResults.map(async (place) => {
                // Verificar si ya existe en nuestra base de datos
                let existingPlace = await GooglePlace.findOne({ placeId: place.place_id });
                
                if (!existingPlace) {
                    // Crear nuevo lugar si no existe
                    existingPlace = await GooglePlace.create({
                        placeId: place.place_id,
                        name: place.name,
                        address: place.vicinity || place.formatted_address,
                        location: {
                            type: 'Point',
                            coordinates: [place.geometry.location.lng, place.geometry.location.lat]
                        },
                        phone: place.formatted_phone_number,
                        website: place.website,
                        googleData: {
                            rating: place.rating,
                            userRatingsTotal: place.user_ratings_total,
                            priceLevel: place.price_level,
                            types: place.types,
                            photos: place.photos?.slice(0, 3) || []
                        },
                        status: 'unregistered'
                    });
                }

                // Verificar si tiene barbero registrado
                const registeredBarber = await Barber.findOne({
                    $or: [
                        { 'profile.googlePlaceId': place.place_id },
                        {
                            'location.coordinates': {
                                $near: {
                                    $geometry: {
                                        type: 'Point',
                                        coordinates: [place.geometry.location.lng, place.geometry.location.lat]
                                    },
                                    $maxDistance: 50 // 50 metros de distancia
                                }
                            }
                        }
                    ]
                }).populate('userId', 'profile.firstName profile.lastName');

                // Obtener reseñas internas si existen
                const internalReviews = await Review.find({
                    $or: [
                        { googlePlaceId: existingPlace._id },
                        { barberId: registeredBarber?._id }
                    ],
                    'deletion.isDeleted': false
                }).limit(3).sort({ createdAt: -1 });

                return {
                    id: existingPlace._id,
                    placeId: place.place_id,
                    name: place.name,
                    address: place.vicinity || place.formatted_address,
                    location: {
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng
                    },
                    phone: place.formatted_phone_number,
                    website: place.website,
                    distance: calculateDistance(
                        latitude, longitude,
                        place.geometry.location.lat, place.geometry.location.lng
                    ),
                    status: registeredBarber ? 'registered' : 'unregistered',
                    rating: {
                        google: place.rating || 0,
                        googleCount: place.user_ratings_total || 0,
                        internal: registeredBarber?.stats?.rating || 0,
                        internalCount: registeredBarber?.stats?.totalReviews || 0,
                        combined: registeredBarber ? 
                            ((place.rating || 0) + (registeredBarber.stats.rating || 0)) / 2 : 
                            (place.rating || 0)
                    },
                    photos: place.photos?.slice(0, 3) || [],
                    priceLevel: place.price_level,
                    types: place.types,
                    isOpen: place.opening_hours?.open_now,
                    
                    // Datos del barbero registrado si existe
                    barber: registeredBarber ? {
                        id: registeredBarber._id,
                        businessName: registeredBarber.businessName,
                        services: registeredBarber.services,
                        availability: registeredBarber.availability,
                        stats: registeredBarber.stats,
                        profile: {
                            avatar: registeredBarber.profile.avatar,
                            whatsapp: registeredBarber.profile.contact.whatsapp
                        }
                    } : null,
                    
                    // Reseñas recientes
                    recentReviews: internalReviews.map(review => ({
                        id: review._id,
                        rating: review.rating,
                        comment: review.comment.substring(0, 150),
                        author: review.isAnonymous ? 'Usuario anónimo' : 'Usuario verificado',
                        date: review.createdAt,
                        hasPhotos: review.photos.length > 0
                    }))
                };
            })
        );

        // Agregar barberos registrados que no aparecieron en Google
        const googlePlaceIds = googleResults.map(p => p.place_id);
        const additionalBarbers = registeredBarbers
            .filter(barber => !googlePlaceIds.includes(barber.profile.googlePlaceId))
            .map(barber => ({
                id: `barber_${barber._id}`,
                placeId: null,
                name: barber.businessName,
                address: barber.location.address,
                location: {
                    lat: barber.location.coordinates[1],
                    lng: barber.location.coordinates[0]
                },
                phone: barber.profile.contact.phone,
                website: barber.profile.contact.website,
                distance: calculateDistance(
                    latitude, longitude,
                    barber.location.coordinates[1], barber.location.coordinates[0]
                ),
                status: 'registered',
                rating: {
                    google: 0,
                    googleCount: 0,
                    internal: barber.stats.rating,
                    internalCount: barber.stats.totalReviews,
                    combined: barber.stats.rating
                },
                photos: barber.profile.gallery.slice(0, 3),
                isOpen: isBarberOpen(barber.availability),
                barber: {
                    id: barber._id,
                    businessName: barber.businessName,
                    services: barber.services,
                    availability: barber.availability,
                    stats: barber.stats,
                    profile: {
                        avatar: barber.profile.avatar,
                        whatsapp: barber.profile.contact.whatsapp
                    }
                },
                recentReviews: []
            }));

        const allPlaces = [...places, ...additionalBarbers];

        // Ordenar por distancia y rating combinado
        allPlaces.sort((a, b) => {
            const scoreA = (a.rating.combined * 0.7) + ((5000 - a.distance) / 1000 * 0.3);
            const scoreB = (b.rating.combined * 0.7) + ((5000 - b.distance) / 1000 * 0.3);
            return scoreB - scoreA;
        });

        console.log(`🔍 Búsqueda de lugares: ${allPlaces.length} resultados cerca de (${lat}, ${lng})`);

        res.status(200).json({
            success: true,
            data: {
                places: allPlaces,
                searchParams: {
                    lat: latitude,
                    lng: longitude,
                    radius: searchRadius,
                    keyword
                },
                stats: {
                    total: allPlaces.length,
                    registered: allPlaces.filter(p => p.status === 'registered').length,
                    unregistered: allPlaces.filter(p => p.status === 'unregistered').length,
                    withGoogleData: allPlaces.filter(p => p.placeId).length
                }
            }
        });

    } catch (error) {
        console.error('Error en búsqueda de lugares:', error);
        res.status(500).json({
            success: false,
            error: 'Error al buscar lugares',
            code: 'SEARCH_FAILED',
            message: error.message
        });
    }
});

/**
 * @desc    Obtener detalles completos de un lugar
 * @route   GET /api/places/:placeId/details
 * @access  Public
 */
const getPlaceFullDetails = asyncHandler(async (req, res) => {
    const { placeId } = req.params;

    // Buscar en nuestra base de datos primero
    let place = await GooglePlace.findOne({ placeId })
        .populate('reviews', null, null, { sort: { createdAt: -1 } });

    if (!place) {
        // Si no existe, buscar en Google Places y crear
        try {
            const googleDetails = await getPlaceDetails(placeId);
            
            place = await GooglePlace.create({
                placeId: googleDetails.place_id,
                name: googleDetails.name,
                address: googleDetails.formatted_address,
                location: {
                    type: 'Point',
                    coordinates: [
                        googleDetails.geometry.location.lng,
                        googleDetails.geometry.location.lat
                    ]
                },
                phone: googleDetails.formatted_phone_number,
                website: googleDetails.website,
                googleData: {
                    rating: googleDetails.rating,
                    userRatingsTotal: googleDetails.user_ratings_total,
                    priceLevel: googleDetails.price_level,
                    types: googleDetails.types,
                    photos: googleDetails.photos?.slice(0, 10) || [],
                    openingHours: googleDetails.opening_hours || {},
                    reviews: googleDetails.reviews?.slice(0, 5) || []
                },
                status: 'unregistered'
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: 'Lugar no encontrado',
                code: 'PLACE_NOT_FOUND'
            });
        }
    }

    // Buscar barbero registrado asociado
    const registeredBarber = await Barber.findOne({
        $or: [
            { 'profile.googlePlaceId': placeId },
            {
                'location.coordinates': {
                    $near: {
                        $geometry: place.location,
                        $maxDistance: 50
                    }
                }
            }
        ]
    }).populate('userId', 'profile.firstName profile.lastName');

    // Obtener reseñas internas
    const internalReviews = await Review.find({
        $or: [
            { googlePlaceId: place._id },
            { barberId: registeredBarber?._id }
        ],
        'deletion.isDeleted': false
    })
    .populate('clientId', 'profile.firstName profile.lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(20);

    // Incrementar vistas
    place.stats.views += 1;
    await place.save();

    const placeDetails = {
        id: place._id,
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        location: {
            lat: place.location.coordinates[1],
            lng: place.location.coordinates[0]
        },
        phone: place.phone,
        website: place.website,
        status: registeredBarber ? 'registered' : 'unregistered',
        
        // Ratings combinados
        rating: {
            google: place.googleData.rating || 0,
            googleCount: place.googleData.userRatingsTotal || 0,
            internal: registeredBarber?.stats?.rating || 0,
            internalCount: registeredBarber?.stats?.totalReviews || 0,
            combined: registeredBarber ? 
                calculateCombinedRating(
                    place.googleData.rating, 
                    place.googleData.userRatingsTotal,
                    registeredBarber.stats.rating, 
                    registeredBarber.stats.totalReviews
                ) : (place.googleData.rating || 0)
        },

        // Fotos combinadas
        photos: [
            ...(registeredBarber?.profile?.gallery || []).slice(0, 5),
            ...(place.googleData.photos || []).slice(0, 5)
        ].slice(0, 10),

        // Horarios
        openingHours: place.googleData.openingHours || {},
        isOpenNow: place.googleData.openingHours?.open_now,

        // Información del barbero registrado
        barber: registeredBarber ? {
            id: registeredBarber._id,
            businessName: registeredBarber.businessName,
            description: registeredBarber.profile.description,
            services: registeredBarber.services,
            availability: registeredBarber.availability,
            stats: registeredBarber.stats,
            profile: {
                avatar: registeredBarber.profile.avatar,
                gallery: registeredBarber.profile.gallery,
                contact: {
                    whatsapp: registeredBarber.profile.contact.whatsapp,
                    phone: registeredBarber.profile.contact.phone,
                    email: registeredBarber.profile.contact.email
                }
            },
            specialties: registeredBarber.profile.specialties || [],
            certifications: registeredBarber.profile.certifications || []
        } : null,

        // Reseñas internas y de Google combinadas
        reviews: {
            internal: internalReviews.map(review => ({
                id: review._id,
                rating: review.rating,
                comment: review.comment,
                author: review.isAnonymous ? 'Usuario anónimo' : 
                    `${review.clientId.profile.firstName} ${review.clientId.profile.lastName}`,
                avatar: review.isAnonymous ? null : review.clientId.profile.avatar,
                date: review.createdAt,
                photos: review.photos,
                verified: true,
                source: 'cortate'
            })),
            google: place.googleData.reviews || [],
            summary: {
                totalInternal: internalReviews.length,
                totalGoogle: place.googleData.userRatingsTotal || 0,
                averageInternal: registeredBarber?.stats?.rating || 0,
                averageGoogle: place.googleData.rating || 0
            }
        },

        // Estadísticas
        stats: {
            views: place.stats.views,
            totalReviews: internalReviews.length + (place.googleData.userRatingsTotal || 0),
            responseTime: registeredBarber?.stats?.averageResponseTime,
            completionRate: registeredBarber?.stats?.completionRate
        },

        // Información adicional de Google
        googleData: {
            types: place.googleData.types || [],
            priceLevel: place.googleData.priceLevel,
            internationalPhoneNumber: place.googleData.internationalPhoneNumber,
            vicinity: place.googleData.vicinity
        }
    };

    res.status(200).json({
        success: true,
        data: {
            place: placeDetails
        }
    });
});

/**
 * @desc    Reclamar lugar de Google (asociar con barbero)
 * @route   POST /api/places/:placeId/claim
 * @access  Private (Barber)
 */
const claimGooglePlace = asyncHandler(async (req, res) => {
    const { placeId } = req.params;
    const { 
        verificationMethod = 'phone',
        verificationData,
        businessDetails = {}
    } = req.body;

    // Verificar que es un barbero
    const barber = await Barber.findOne({ userId: req.user.id });
    if (!barber) {
        return res.status(403).json({
            success: false,
            error: 'Solo barberos pueden reclamar lugares',
            code: 'BARBER_ONLY'
        });
    }

    // Verificar que el barbero no tenga ya un lugar reclamado
    if (barber.profile.googlePlaceId) {
        return res.status(400).json({
            success: false,
            error: 'Ya tiene un lugar de Google asociado',
            code: 'PLACE_ALREADY_CLAIMED'
        });
    }

    // Buscar o crear el lugar
    let place = await GooglePlace.findOne({ placeId });
    
    if (!place) {
        try {
            const googleDetails = await getPlaceDetails(placeId);
            place = await GooglePlace.create({
                placeId: googleDetails.place_id,
                name: googleDetails.name,
                address: googleDetails.formatted_address,
                location: {
                    type: 'Point',
                    coordinates: [
                        googleDetails.geometry.location.lng,
                        googleDetails.geometry.location.lat
                    ]
                },
                phone: googleDetails.formatted_phone_number,
                website: googleDetails.website,
                googleData: {
                    rating: googleDetails.rating,
                    userRatingsTotal: googleDetails.user_ratings_total,
                    types: googleDetails.types,
                    photos: googleDetails.photos || []
                },
                status: 'unregistered'
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: 'Lugar no encontrado en Google',
                code: 'GOOGLE_PLACE_NOT_FOUND'
            });
        }
    }

    // Verificar que no esté ya reclamado
    if (place.status === 'claimed') {
        return res.status(400).json({
            success: false,
            error: 'Este lugar ya fue reclamado por otro barbero',
            code: 'PLACE_ALREADY_CLAIMED'
        });
    }

    // Crear solicitud de reclamación
    const claimRequest = {
        barberId: barber._id,
        requestedAt: new Date(),
        verificationMethod,
        verificationData,
        businessDetails,
        status: 'pending',
        requestId: `claim_${Date.now()}_${barber._id}`
    };

    place.claimRequests = place.claimRequests || [];
    place.claimRequests.push(claimRequest);
    place.status = 'claim_pending';

    await place.save();

    console.log(`📍 Solicitud de reclamación: ${barber.businessName} solicita ${place.name}`);

    res.status(200).json({
        success: true,
        message: 'Solicitud de reclamación enviada',
        data: {
            requestId: claimRequest.requestId,
            place: {
                id: place._id,
                name: place.name,
                address: place.address
            },
            verificationRequired: true,
            estimatedProcessingTime: '24-48 horas'
        }
    });
});

/**
 * @desc    Aprobar reclamación de lugar (solo admin)
 * @route   PUT /api/places/:placeId/claim/approve
 * @access  Private (Admin)
 */
const approveClaimRequest = asyncHandler(async (req, res) => {
    const { placeId } = req.params;
    const { requestId, adminNotes = '' } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Solo administradores pueden aprobar reclamaciones',
            code: 'ADMIN_ONLY'
        });
    }

    const place = await GooglePlace.findOne({ placeId });
    if (!place) {
        return res.status(404).json({
            success: false,
            error: 'Lugar no encontrado',
            code: 'PLACE_NOT_FOUND'
        });
    }

    const claimRequest = place.claimRequests.find(req => req.requestId === requestId);
    if (!claimRequest) {
        return res.status(404).json({
            success: false,
            error: 'Solicitud de reclamación no encontrada',
            code: 'CLAIM_REQUEST_NOT_FOUND'
        });
    }

    if (claimRequest.status !== 'pending') {
        return res.status(400).json({
            success: false,
            error: 'Solicitud ya procesada',
            code: 'CLAIM_ALREADY_PROCESSED'
        });
    }

    // Aprobar reclamación
    claimRequest.status = 'approved';
    claimRequest.processedAt = new Date();
    claimRequest.processedBy = req.user.id;
    claimRequest.adminNotes = adminNotes;

    place.status = 'claimed';
    place.claimedBy = claimRequest.barberId;
    place.claimedAt = new Date();

    await place.save();

    // Actualizar barbero
    const barber = await Barber.findById(claimRequest.barberId);
    barber.profile.googlePlaceId = place.placeId;
    
    // Actualizar ubicación si no la tiene o está muy lejos
    if (!barber.location.coordinates || 
        calculateDistance(
            barber.location.coordinates[1], barber.location.coordinates[0],
            place.location.coordinates[1], place.location.coordinates[0]
        ) > 100) {
        
        barber.location = {
            address: place.address,
            coordinates: place.location.coordinates,
            city: extractCityFromAddress(place.address),
            region: 'Chile'
        };
    }

    await barber.save();

    console.log(`✅ Reclamación aprobada: ${barber.businessName} ahora es dueño de ${place.name}`);

    res.status(200).json({
        success: true,
        message: 'Reclamación aprobada exitosamente',
        data: {
            place: {
                id: place._id,
                name: place.name,
                status: place.status,
                claimedAt: place.claimedAt
            },
            barber: {
                id: barber._id,
                businessName: barber.businessName,
                googlePlaceId: barber.profile.googlePlaceId
            }
        }
    });
});

/**
 * @desc    Rechazar reclamación de lugar (solo admin)
 * @route   PUT /api/places/:placeId/claim/reject
 * @access  Private (Admin)
 */
const rejectClaimRequest = asyncHandler(async (req, res) => {
    const { placeId } = req.params;
    const { requestId, reason, adminNotes = '' } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Solo administradores pueden rechazar reclamaciones',
            code: 'ADMIN_ONLY'
        });
    }

    const place = await GooglePlace.findOne({ placeId });
    if (!place) {
        return res.status(404).json({
            success: false,
            error: 'Lugar no encontrado',
            code: 'PLACE_NOT_FOUND'
        });
    }

    const claimRequest = place.claimRequests.find(req => req.requestId === requestId);
    if (!claimRequest) {
        return res.status(404).json({
            success: false,
            error: 'Solicitud de reclamación no encontrada',
            code: 'CLAIM_REQUEST_NOT_FOUND'
        });
    }

    // Rechazar reclamación
    claimRequest.status = 'rejected';
    claimRequest.processedAt = new Date();
    claimRequest.processedBy = req.user.id;
    claimRequest.rejectionReason = reason;
    claimRequest.adminNotes = adminNotes;

    // Si no hay más solicitudes pendientes, volver a unregistered
    const pendingRequests = place.claimRequests.filter(req => req.status === 'pending');
    if (pendingRequests.length === 0) {
        place.status = 'unregistered';
    }

    await place.save();

    console.log(`❌ Reclamación rechazada: ${place.name} - ${reason}`);

    res.status(200).json({
        success: true,
        message: 'Reclamación rechazada',
        data: {
            place: {
                id: place._id,
                name: place.name,
                status: place.status
            },
            rejectionReason: reason
        }
    });
});

/**
 * @desc    Obtener solicitudes de reclamación pendientes (solo admin)
 * @route   GET /api/places/admin/claims
 * @access  Private (Admin)
 */
const getPendingClaims = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Solo administradores pueden ver solicitudes',
            code: 'ADMIN_ONLY'
        });
    }

    const {
        page = 1,
        limit = 10,
        status = 'pending'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const places = await GooglePlace.find({
        'claimRequests.status': status
    })
    .populate('claimRequests.barberId', 'businessName userId profile.contact')
    .skip(skip)
    .limit(limitNum)
    .sort({ 'claimRequests.requestedAt': 1 });

    const pendingClaims = [];
    
    places.forEach(place => {
        const requests = place.claimRequests.filter(req => req.status === status);
        requests.forEach(request => {
            pendingClaims.push({
                requestId: request.requestId,
                place: {
                    id: place._id,
                    placeId: place.placeId,
                    name: place.name,
                    address: place.address,
                    googleRating: place.googleData.rating
                },
                barber: {
                    id: request.barberId._id,
                    businessName: request.barberId.businessName,
                    contact: request.barberId.profile.contact
                },
                request: {
                    requestedAt: request.requestedAt,
                    verificationMethod: request.verificationMethod,
                    verificationData: request.verificationData,
                    businessDetails: request.businessDetails,
                    daysSinceRequest: Math.floor(
                        (new Date() - request.requestedAt) / (1000 * 60 * 60 * 24)
                    )
                }
            });
        });
    });

    const total = pendingClaims.length;

    res.status(200).json({
        success: true,
        data: {
            claims: pendingClaims,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            },
            stats: {
                totalPending: total,
                urgentClaims: pendingClaims.filter(c => c.request.daysSinceRequest > 2).length
            }
        }
    });
});

/**
 * @desc    Obtener estadísticas de lugares
 * @route   GET /api/places/admin/stats
 * @access  Private (Admin)
 */
const getPlacesStats = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Solo administradores pueden ver estadísticas',
            code: 'ADMIN_ONLY'
        });
    }

    const stats = await GooglePlace.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgRating: { $avg: '$googleData.rating' },
                totalViews: { $sum: '$stats.views' }
            }
        }
    ]);

    const totalPlaces = await GooglePlace.countDocuments();
    const totalReviews = await Review.countDocuments({ googlePlaceId: { $exists: true } });
    const claimedPlaces = await GooglePlace.countDocuments({ status: 'claimed' });

    res.status(200).json({
        success: true,
        data: {
            totalPlaces,
            totalReviews,
            claimedPlaces,
            claimRate: totalPlaces > 0 ? (claimedPlaces / totalPlaces * 100).toFixed(2) : 0,
            byStatus: stats,
            summary: {
                registered: claimedPlaces,
                unregistered: totalPlaces - claimedPlaces,
                averageGoogleRating: stats.reduce((sum, s) => sum + (s.avgRating || 0), 0) / stats.length
            }
        }
    });
});

// Funciones helper
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
};

const calculateCombinedRating = (googleRating, googleCount, internalRating, internalCount) => {
    if (!googleRating && !internalRating) return 0;
    if (!googleRating) return internalRating;
    if (!internalRating) return googleRating;
    
    const totalCount = googleCount + internalCount;
    const weightedRating = (googleRating * googleCount + internalRating * internalCount) / totalCount;
    return Math.round(weightedRating * 10) / 10;
};

const isBarberOpen = (availability) => {
    if (!availability) return false;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const todaySchedule = availability[currentDay];
    if (!todaySchedule || !todaySchedule.isOpen) return false;
    
    const openTime = parseTime(todaySchedule.openTime);
    const closeTime = parseTime(todaySchedule.closeTime);
    
    return currentTime >= openTime && currentTime <= closeTime;
};

const parseTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

const extractCityFromAddress = (address) => {
    // Lógica simple para extraer ciudad de dirección chilena
    const cities = ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Iquique', 'Rancagua', 'Talca'];
    const foundCity = cities.find(city => address.includes(city));
    return foundCity || 'Santiago';
};

module.exports = {
    searchNearbyBarbershops,
    getPlaceFullDetails,
    claimGooglePlace,
    approveClaimRequest,
    rejectClaimRequest,
    getPendingClaims,
    getPlacesStats
};
