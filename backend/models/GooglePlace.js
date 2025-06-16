const mongoose = require('mongoose');
const config = require('../config/config');

/**
 * Schema para fotos de Google Places
 */
const GooglePhotoSchema = new mongoose.Schema({
    // Referencia de foto de Google
    photoReference: {
        type: String,
        required: true,
        trim: true
    },
    
    // URL construida para la foto
    url: {
        type: String,
        required: true
    },
    
    // Dimensiones de la foto
    width: {
        type: Number,
        min: 1
    },
    
    height: {
        type: Number,
        min: 1
    },
    
    // Atribuciones requeridas por Google
    htmlAttributions: [String],
    
    // Fecha de última actualización
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
});

/**
 * Schema para horarios de Google Places
 */
const OpeningHoursSchema = new mongoose.Schema({
    // Si está abierto ahora
    openNow: {
        type: Boolean,
        default: null
    },
    
    // Períodos de apertura semanales
    periods: [{
        open: {
            day: {
                type: Number,
                min: 0,
                max: 6,
                required: true
            },
            time: {
                type: String,
                match: [/^\d{4}$/, 'Tiempo debe estar en formato HHMM'],
                required: true
            }
        },
        close: {
            day: {
                type: Number,
                min: 0,
                max: 6
            },
            time: {
                type: String,
                match: [/^\d{4}$/]
            }
        }
    }],
    
    // Texto de horarios en formato legible
    weekdayText: [String],
    
    // Horarios especiales (feriados, etc.)
    specialHours: [{
        date: Date,
        hours: String,
        isClosed: Boolean
    }]
}, {
    _id: false
});

/**
 * Schema para reseñas públicas de Google
 */
const GoogleReviewSchema = new mongoose.Schema({
    // Nombre del autor
    authorName: {
        type: String,
        required: true,
        trim: true
    },
    
    // URL del perfil del autor (si disponible)
    authorUrl: {
        type: String,
        trim: true
    },
    
    // Idioma de la reseña
    language: {
        type: String,
        default: 'es'
    },
    
    // URL de foto de perfil del autor
    profilePhotoUrl: {
        type: String,
        trim: true
    },
    
    // Calificación (1-5)
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    
    // Tiempo relativo (ej: "hace 2 meses")
    relativeTimeDescription: {
        type: String,
        trim: true
    },
    
    // Texto de la reseña
    text: {
        type: String,
        trim: true,
        maxlength: [3000, 'El texto de la reseña no puede exceder 3000 caracteres']
    },
    
    // Timestamp de la reseña
    time: {
        type: Number,
        required: true
    },
    
    // Fecha convertida del timestamp
    reviewDate: {
        type: Date,
        required: true
    },
    
    // Si la reseña fue traducida
    translated: {
        type: Boolean,
        default: false
    }
}, {
    _id: false
});

/**
 * Schema para geometría y ubicación
 */
const GeometrySchema = new mongoose.Schema({
    // Ubicación principal
    location: {
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        lng: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    
    // Viewport recomendado para mostrar en mapa
    viewport: {
        northeast: {
            lat: Number,
            lng: Number
        },
        southwest: {
            lat: Number,
            lng: Number
        }
    }
}, {
    _id: false
});

/**
 * Schema para información de contacto
 */
const ContactInfoSchema = new mongoose.Schema({
    // Teléfono con formato internacional
    formattedPhoneNumber: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Formato de teléfono inválido']
    },
    
    // Teléfono en formato nacional
    nationalPhoneNumber: {
        type: String,
        trim: true
    },
    
    // Sitio web oficial
    website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Debe ser una URL válida']
    },
    
    // URL de Google Maps
    url: {
        type: String,
        trim: true
    },
    
    // UTC offset en minutos
    utcOffset: {
        type: Number
    }
}, {
    _id: false
});

/**
 * Schema principal de Google Place
 */
const GooglePlaceSchema = new mongoose.Schema({
    // ID único de Google Places
    placeId: {
        type: String,
        required: [true, 'El place_id de Google es requerido'],
        unique: true,
        trim: true,
        index: true
    },
    
    // Nombre del negocio
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxlength: [200, 'El nombre no puede exceder 200 caracteres'],
        index: 'text'
    },
    
    // Dirección formateada
    formattedAddress: {
        type: String,
        required: [true, 'La dirección es requerida'],
        trim: true,
        maxlength: [400, 'La dirección no puede exceder 400 caracteres']
    },
    
    // Componentes de la dirección
    addressComponents: [{
        longName: String,
        shortName: String,
        types: [String]
    }],
    
    // Geometría y coordenadas
    geometry: {
        type: GeometrySchema,
        required: true
    },
    
    // Coordenadas en formato MongoDB [lng, lat]
    coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere'
    },
    
    // Información de contacto
    contactInfo: {
        type: ContactInfoSchema,
        default: () => ({})
    },
    
    // Horarios de apertura
    openingHours: {
        type: OpeningHoursSchema,
        default: null
    },
    
    // Fotos del lugar
    photos: [GooglePhotoSchema],
    
    // Tipos de lugar según Google
    types: [{
        type: String,
        trim: true
    }],
    
    // Calificación de Google (0-5)
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: null,
        index: true
    },
    
    // Número total de calificaciones en Google
    userRatingsTotal: {
        type: Number,
        min: 0,
        default: 0
    },
    
    // Nivel de precios (0-4, 4 siendo más caro)
    priceLevel: {
        type: Number,
        min: 0,
        max: 4,
        default: null
    },
    
    // Reseñas públicas de Google (máximo 5)
    reviews: [GoogleReviewSchema],
    
    // Si tiene perfil registrado en Córtate.cl
    hasBarberProfile: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Referencia al perfil de barbero (si existe)
    barberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Barber',
        default: null,
        index: true
    },
    
    // Estado del lugar
    businessStatus: {
        type: String,
        enum: {
            values: ['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'],
            message: 'Estado de negocio inválido'
        },
        default: 'OPERATIONAL'
    },
    
    // Si el lugar fue verificado manualmente
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // Fecha de verificación manual
    verifiedAt: {
        type: Date,
        default: null
    },
    
    // Usuario que verificó
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Estadísticas de interacción
    stats: {
        // Veces que apareció en búsquedas
        searchAppearances: {
            type: Number,
            default: 0
        },
        
        // Veces que fue clickeado en mapa
        mapClicks: {
            type: Number,
            default: 0
        },
        
        // Veces que se vio el perfil
        profileViews: {
            type: Number,
            default: 0
        },
        
        // Veces que se llamó desde la app
        callClicks: {
            type: Number,
            default: 0
        },
        
        // Veces que se pidieron direcciones
        directionRequests: {
            type: Number,
            default: 0
        },
        
        // Solicitudes de registro enviadas
        registrationRequests: {
            type: Number,
            default: 0
        }
    },
    
    // Información de actualización
    lastSyncedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // Última vez que cambió la información en Google
    lastModified: {
        type: Date,
        default: Date.now
    },
    
    // Campos que han cambiado desde la última sincronización
    changedFields: [String],
    
    // Si necesita re-sincronización
    needsSync: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Errores de sincronización
    syncErrors: [{
        error: String,
        timestamp: Date,
        details: mongoose.Schema.Types.Mixed
    }],
    
    // Metadata adicional
    metadata: {
        // Región/ciudad principal
        city: {
            type: String,
            trim: true,
            index: true
        },
        
        // Comuna específica
        commune: {
            type: String,
            trim: true
        },
        
        // Región administrativa
        region: {
            type: String,
            trim: true
        },
        
        // Si es una cadena conocida
        isChain: {
            type: Boolean,
            default: false
        },
        
        // Nombre de la cadena
        chainName: {
            type: String,
            trim: true
        },
        
        // Confiabilidad de los datos (0-100)
        dataQuality: {
            type: Number,
            min: 0,
            max: 100,
            default: 50
        },
        
        // Popularidad estimada
        popularityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    
    // Flags especiales
    flags: {
        // Si fue reportado como duplicado
        isDuplicate: {
            type: Boolean,
            default: false
        },
        
        // Si fue reportado como cerrado
        reportedClosed: {
            type: Boolean,
            default: false
        },
        
        // Si tiene información incorrecta
        hasIncorrectInfo: {
            type: Boolean,
            default: false
        },
        
        // Si es sospechoso de ser falso
        isSuspicious: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true,
    versionKey: false,
    
    // Configuración del toJSON
    toJSON: {
        transform: function(doc, ret) {
            // Simplificar coordenadas para frontend
            ret.lat = ret.geometry.location.lat;
            ret.lng = ret.geometry.location.lng;
            
            // Agregar estado para el mapa
            ret.mapStatus = doc.getMapStatus();
            
            // Limpiar campos innecesarios para frontend
            delete ret.syncErrors;
            delete ret.changedFields;
            
            return ret;
        }
    }
});

// ==========================================
// ÍNDICES PARA OPTIMIZACIÓN
// ==========================================

// Índices geoespaciales
GooglePlaceSchema.index({ coordinates: '2dsphere' });

// Índices compuestos para búsquedas frecuentes
GooglePlaceSchema.index({ hasBarberProfile: 1, businessStatus: 1 });
GooglePlaceSchema.index({ rating: -1, userRatingsTotal: -1 });
GooglePlaceSchema.index({ 'metadata.city': 1, hasBarberProfile: 1 });

// Índices para sincronización
GooglePlaceSchema.index({ lastSyncedAt: 1 });
GooglePlaceSchema.index({ needsSync: 1 });

// Índice de texto para búsquedas
GooglePlaceSchema.index({
    name: 'text',
    formattedAddress: 'text',
    'metadata.city': 'text'
});

// ==========================================
// MIDDLEWARE PRE-SAVE
// ==========================================

// Actualizar coordenadas en formato MongoDB
GooglePlaceSchema.pre('save', function(next) {
    if (this.isModified('geometry') || this.isNew) {
        this.coordinates = [
            this.geometry.location.lng,
            this.geometry.location.lat
        ];
    }
    next();
});

// Extraer información de ciudad/región de la dirección
GooglePlaceSchema.pre('save', function(next) {
    if (this.isModified('addressComponents') || this.isNew) {
        this.extractLocationMetadata();
    }
    next();
});

// Calcular calidad de datos
GooglePlaceSchema.pre('save', function(next) {
    if (this.isNew || this.isModified()) {
        this.calculateDataQuality();
    }
    next();
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Extraer metadata de ubicación desde componentes de dirección
 */
GooglePlaceSchema.methods.extractLocationMetadata = function() {
    if (!this.addressComponents) return;
    
    for (const component of this.addressComponents) {
        if (component.types.includes('locality')) {
            this.metadata.city = component.longName;
        } else if (component.types.includes('administrative_area_level_2')) {
            this.metadata.commune = component.longName;
        } else if (component.types.includes('administrative_area_level_1')) {
            this.metadata.region = component.longName;
        }
    }
};

/**
 * Calcular calidad de los datos
 */
GooglePlaceSchema.methods.calculateDataQuality = function() {
    let score = 0;
    
    // Información básica (40 puntos)
    if (this.name) score += 10;
    if (this.formattedAddress) score += 10;
    if (this.geometry) score += 10;
    if (this.contactInfo.formattedPhoneNumber) score += 10;
    
    // Información adicional (30 puntos)
    if (this.openingHours) score += 10;
    if (this.contactInfo.website) score += 10;
    if (this.photos && this.photos.length > 0) score += 10;
    
    // Reseñas y rating (20 puntos)
    if (this.rating && this.rating > 0) score += 10;
    if (this.userRatingsTotal > 5) score += 5;
    if (this.reviews && this.reviews.length > 0) score += 5;
    
    // Verificación (10 puntos)
    if (this.isVerified) score += 10;
    
    this.metadata.dataQuality = Math.min(100, score);
};

/**
 * Calcular puntuación de popularidad
 */
GooglePlaceSchema.methods.calculatePopularityScore = function() {
    let score = 0;
    
    // Base en rating y número de reseñas
    if (this.rating) {
        score += this.rating * 10; // Máximo 50 puntos
    }
    
    if (this.userRatingsTotal) {
        score += Math.min(30, this.userRatingsTotal / 10); // Máximo 30 puntos
    }
    
    // Interacciones en la app
    const interactions = this.stats.mapClicks + this.stats.profileViews + this.stats.callClicks;
    score += Math.min(20, interactions / 5); // Máximo 20 puntos
    
    this.metadata.popularityScore = Math.min(100, Math.round(score));
    return this.metadata.popularityScore;
};

/**
 * Obtener estado para mostrar en el mapa
 * @returns {string} - Color del estado
 */
GooglePlaceSchema.methods.getMapStatus = function() {
    if (this.hasBarberProfile) {
        // Lugar con perfil registrado - verificar estado del barbero
        return 'green'; // Por defecto verde, se puede refinar con datos del barbero
    } else {
        // Lugar sin perfil - rojo
        return 'red';
    }
};

/**
 * Obtener horario actual
 * @returns {Object} - Estado de apertura actual
 */
GooglePlaceSchema.methods.getCurrentOpenStatus = function() {
    if (!this.openingHours || !this.openingHours.periods) {
        return { isOpen: null, nextChange: null };
    }
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    // Buscar período actual
    const todayPeriods = this.openingHours.periods.filter(period => 
        period.open.day === currentDay
    );
    
    for (const period of todayPeriods) {
        const openTime = parseInt(period.open.time);
        const closeTime = period.close ? parseInt(period.close.time) : 2359;
        
        if (currentTime >= openTime && currentTime <= closeTime) {
            return {
                isOpen: true,
                closesAt: this.formatTime(closeTime),
                nextChange: closeTime
            };
        }
    }
    
    // No está abierto ahora, buscar próxima apertura
    const nextOpening = this.findNextOpening(currentDay, currentTime);
    
    return {
        isOpen: false,
        opensAt: nextOpening ? this.formatTime(nextOpening.time) : null,
        nextChange: nextOpening ? nextOpening.time : null
    };
};

/**
 * Encontrar próxima apertura
 * @param {number} currentDay - Día actual (0-6)
 * @param {number} currentTime - Tiempo actual (HHMM)
 * @returns {Object|null} - Próxima apertura
 */
GooglePlaceSchema.methods.findNextOpening = function(currentDay, currentTime) {
    // Buscar en los próximos 7 días
    for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7;
        const dayPeriods = this.openingHours.periods.filter(period => 
            period.open.day === checkDay
        );
        
        for (const period of dayPeriods) {
            const openTime = parseInt(period.open.time);
            
            // Si es el mismo día, debe ser después del tiempo actual
            if (i === 0 && openTime <= currentTime) continue;
            
            return {
                day: checkDay,
                time: openTime
            };
        }
    }
    
    return null;
};

/**
 * Formatear tiempo HHMM a formato legible
 * @param {number} time - Tiempo en formato HHMM
 * @returns {string} - Tiempo formateado
 */
GooglePlaceSchema.methods.formatTime = function(time) {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Generar URLs de fotos con tamaño específico
 * @param {number} maxWidth - Ancho máximo
 * @param {number} maxHeight - Alto máximo  
 * @returns {Array} - URLs de fotos
 */
GooglePlaceSchema.methods.getPhotoUrls = function(maxWidth = 400, maxHeight = 300) {
    return this.photos.map(photo => {
        return `https://maps.googleapis.com/maps/api/place/photo?` +
               `maxwidth=${maxWidth}&maxheight=${maxHeight}&` +
               `photoreference=${photo.photoReference}&` +
               `key=${config.GOOGLE_PLACES_API_KEY}`;
    });
};

/**
 * Incrementar estadística específica
 * @param {string} statType - Tipo de estadística
 */
GooglePlaceSchema.methods.incrementStat = function(statType) {
    if (this.stats.hasOwnProperty(statType)) {
        this.stats[statType] += 1;
        return this.save();
    }
};

/**
 * Marcar como necesita sincronización
 * @param {Array} fields - Campos que cambiaron
 */
GooglePlaceSchema.methods.markForSync = function(fields = []) {
    this.needsSync = true;
    this.changedFields = fields;
    return this.save();
};

/**
 * Asociar con perfil de barbero
 * @param {ObjectId} barberId - ID del barbero
 */
GooglePlaceSchema.methods.linkBarberProfile = function(barberId) {
    this.hasBarberProfile = true;
    this.barberId = barberId;
    this.lastSyncedAt = new Date();
    return this.save();
};

/**
 * Desasociar perfil de barbero
 */
GooglePlaceSchema.methods.unlinkBarberProfile = function() {
    this.hasBarberProfile = false;
    this.barberId = null;
    return this.save();
};

// ==========================================
// MÉTODOS ESTÁTICOS
// ==========================================

/**
 * Buscar lugares por proximidad geográfica
 * @param {Array} coordinates - [lng, lat]
 * @param {number} maxDistance - Distancia máxima en metros
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Lugares cercanos
 */
GooglePlaceSchema.statics.findNearby = async function(coordinates, maxDistance = 10000, filters = {}) {
    try {
        const query = {
            coordinates: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    },
                    $maxDistance: maxDistance
                }
            },
            businessStatus: 'OPERATIONAL'
        };
        
        if (filters.hasProfile !== undefined) {
            query.hasBarberProfile = filters.hasProfile;
        }
        
        if (filters.minRating) {
            query.rating = { $gte: filters.minRating };
        }
        
        if (filters.city) {
            query['metadata.city'] = new RegExp(filters.city, 'i');
        }
        
        return await this.find(query)
            .populate('barberId', 'businessName services availability whatsapp')
            .sort({ 'metadata.popularityScore': -1, rating: -1 });
            
    } catch (error) {
        console.error('Error al buscar lugares cercanos:', error);
        return [];
    }
};

/**
 * Sincronizar lugar con Google Places API
 * @param {string} placeId - ID del lugar
 * @returns {Promise<GooglePlace>} - Lugar actualizado
 */
GooglePlaceSchema.statics.syncWithGoogle = async function(placeId) {
    try {
        const googlePlacesUtil = require('../utils/googlePlaces');
        const placeDetails = await googlePlacesUtil.getPlaceDetails(placeId);
        
        if (!placeDetails) {
            throw new Error('No se pudieron obtener detalles del lugar');
        }
        
        // Buscar lugar existente o crear nuevo
        let place = await this.findOne({ placeId: placeId });
        
        if (!place) {
            place = new this({ placeId: placeId });
        }
        
        // Actualizar datos desde Google
        place.updateFromGoogleData(placeDetails);
        place.lastSyncedAt = new Date();
        place.needsSync = false;
        place.syncErrors = []; // Limpiar errores previos
        
        await place.save();
        
        console.log(`🔄 Lugar sincronizado: ${place.name}`);
        return place;
        
    } catch (error) {
        console.error(`Error al sincronizar lugar ${placeId}:`, error);
        
        // Registrar error de sincronización
        const place = await this.findOne({ placeId: placeId });
        if (place) {
            place.syncErrors.push({
                error: error.message,
                timestamp: new Date(),
                details: error
            });
            await place.save();
        }
        
        throw error;
    }
};

/**
 * Actualizar datos desde respuesta de Google Places
 * @param {Object} googleData - Datos de Google Places API
 */
GooglePlaceSchema.methods.updateFromGoogleData = function(googleData) {
    // Información básica
    this.name = googleData.name;
    this.formattedAddress = googleData.formatted_address;
    this.addressComponents = googleData.address_components;
    
    // Geometría
    this.geometry = {
        location: {
            lat: googleData.geometry.location.lat,
            lng: googleData.geometry.location.lng
        },
        viewport: googleData.geometry.viewport
    };
    
    // Información de contacto
    if (googleData.formatted_phone_number) {
        this.contactInfo.formattedPhoneNumber = googleData.formatted_phone_number;
    }
    if (googleData.international_phone_number) {
        this.contactInfo.nationalPhoneNumber = googleData.international_phone_number;
    }
    if (googleData.website) {
        this.contactInfo.website = googleData.website;
    }
    if (googleData.url) {
        this.contactInfo.url = googleData.url;
    }
    if (googleData.utc_offset) {
        this.contactInfo.utcOffset = googleData.utc_offset;
    }
    
    // Horarios
    if (googleData.opening_hours) {
        this.openingHours = {
            openNow: googleData.opening_hours.open_now,
            periods: googleData.opening_hours.periods,
            weekdayText: googleData.opening_hours.weekday_text
        };
    }
    
    // Fotos
    if (googleData.photos) {
        this.photos = googleData.photos.slice(0, 10).map(photo => ({
            photoReference: photo.photo_reference,
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${config.GOOGLE_PLACES_API_KEY}`,
            width: photo.width,
            height: photo.height,
            htmlAttributions: photo.html_attributions
        }));
    }
    
    // Rating y reseñas
    if (googleData.rating) {
        this.rating = googleData.rating;
    }
    if (googleData.user_ratings_total) {
        this.userRatingsTotal = googleData.user_ratings_total;
    }
    if (googleData.price_level) {
        this.priceLevel = googleData.price_level;
    }
    
    // Reseñas (máximo 5)
    if (googleData.reviews) {
        this.reviews = googleData.reviews.slice(0, 5).map(review => ({
            authorName: review.author_name,
            authorUrl: review.author_url,
            language: review.language,
            profilePhotoUrl: review.profile_photo_url,
            rating: review.rating,
            relativeTimeDescription: review.relative_time_description,
            text: review.text,
            time: review.time,
            reviewDate: new Date(review.time * 1000),
            translated: review.translated || false
        }));
    }
    
    // Tipos y estado
    this.types = googleData.types;
    this.businessStatus = googleData.business_status || 'OPERATIONAL';
};

/**
 * Buscar lugares que necesitan sincronización
 * @param {number} limit - Número máximo de lugares
 * @returns {Promise<Array>} - Lugares que necesitan sync
 */
GooglePlaceSchema.statics.findNeedingSync = async function(limit = 50) {
    try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        return await this.find({
            $or: [
                { needsSync: true },
                { lastSyncedAt: { $lt: oneWeekAgo } }
            ],
            businessStatus: { $ne: 'CLOSED_PERMANENTLY' }
        })
        .sort({ lastSyncedAt: 1 })
        .limit(limit);
        
    } catch (error) {
        console.error('Error al buscar lugares para sincronizar:', error);
        return [];
    }
};

/**
 * Buscar barberías por texto
 * @param {string} searchText - Texto a buscar
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Resultados de búsqueda
 */
GooglePlaceSchema.statics.searchByText = async function(searchText, filters = {}) {
    try {
        const query = {
            $text: { $search: searchText },
            businessStatus: 'OPERATIONAL'
        };
        
        if (filters.hasProfile !== undefined) {
            query.hasBarberProfile = filters.hasProfile;
        }
        
        if (filters.city) {
            query['metadata.city'] = new RegExp(filters.city, 'i');
        }
        
        if (filters.minRating) {
            query.rating = { $gte: filters.minRating };
        }
        
        return await this.find(query, { score: { $meta: 'textScore' } })
            .populate('barberId', 'businessName services whatsapp')
            .sort({ score: { $meta: 'textScore' }, rating: -1 });
            
    } catch (error) {
        console.error('Error en búsqueda de texto:', error);
        return [];
    }
};

/**
 * Obtener estadísticas de lugares
 * @returns {Promise<Object>} - Estadísticas generales
 */
GooglePlaceSchema.statics.getGeneralStats = async function() {
    try {
        const stats = await this.aggregate([
            {
                $group: {
                    _id: null,
                    totalPlaces: { $sum: 1 },
                    placesWithProfile: {
                        $sum: { $cond: ['$hasBarberProfile', 1, 0] }
                    },
                    placesWithoutProfile: {
                        $sum: { $cond: [{ $eq: ['$hasBarberProfile', false] }, 1, 0] }
                    },
                    averageRating: { $avg: '$rating' },
                    totalPhotos: {
                        $sum: { $size: '$photos' }
                    },
                    totalReviews: {
                        $sum: '$userRatingsTotal'
                    },
                    verifiedPlaces: {
                        $sum: { $cond: ['$isVerified', 1, 0] }
                    },
                    placesNeedingSync: {
                        $sum: { $cond: ['$needsSync', 1, 0] }
                    },
                    totalInteractions: {
                        $sum: {
                            $add: [
                                '$stats.mapClicks',
                                '$stats.profileViews',
                                '$stats.callClicks'
                            ]
                        }
                    }
                }
            }
        ]);
        
        const result = stats[0] || {};
        
        // Calcular porcentajes
        if (result.totalPlaces > 0) {
            result.profileCoverage = ((result.placesWithProfile / result.totalPlaces) * 100).toFixed(2);
            result.verificationRate = ((result.verifiedPlaces / result.totalPlaces) * 100).toFixed(2);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error al obtener estadísticas de lugares:', error);
        return {};
    }
};

/**
 * Obtener distribución por ciudades
 * @returns {Promise<Array>} - Distribución por ciudad
 */
GooglePlaceSchema.statics.getCityDistribution = async function() {
    try {
        return await this.aggregate([
            {
                $group: {
                    _id: '$metadata.city',
                    totalPlaces: { $sum: 1 },
                    placesWithProfile: {
                        $sum: { $cond: ['$hasBarberProfile', 1, 0] }
                    },
                    averageRating: { $avg: '$rating' },
                    totalInteractions: {
                        $sum: {
                            $add: [
                                '$stats.mapClicks',
                                '$stats.profileViews'
                            ]
                        }
                    }
                }
            },
            {
                $match: {
                    _id: { $ne: null }
                }
            },
            {
                $sort: { totalPlaces: -1 }
            },
            {
                $limit: 20
            }
        ]);
        
    } catch (error) {
        console.error('Error al obtener distribución por ciudad:', error);
        return [];
    }
};

/**
 * Importar lugares desde búsqueda de Google Places
 * @param {string} query - Consulta de búsqueda
 * @param {Array} coordinates - [lng, lat] centro de búsqueda
 * @param {number} radius - Radio en metros
 * @returns {Promise<Array>} - Lugares importados
 */
GooglePlaceSchema.statics.importFromGoogleSearch = async function(query, coordinates, radius = 50000) {
    try {
        const googlePlacesUtil = require('../utils/googlePlaces');
        const searchResults = await googlePlacesUtil.searchNearby(query, coordinates, radius);
        
        const importedPlaces = [];
        
        for (const place of searchResults) {
            try {
                // Verificar si ya existe
                let existingPlace = await this.findOne({ placeId: place.place_id });
                
                if (!existingPlace) {
                    // Crear nuevo lugar
                    const newPlace = new this({
                        placeId: place.place_id,
                        name: place.name,
                        formattedAddress: place.vicinity || place.formatted_address,
                        geometry: {
                            location: {
                                lat: place.geometry.location.lat,
                                lng: place.geometry.location.lng
                            }
                        },
                        rating: place.rating,
                        userRatingsTotal: place.user_ratings_total,
                        types: place.types,
                        priceLevel: place.price_level,
                        businessStatus: place.business_status || 'OPERATIONAL',
                        photos: place.photos ? place.photos.slice(0, 5).map(photo => ({
                            photoReference: photo.photo_reference,
                            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${config.GOOGLE_PLACES_API_KEY}`,
                            width: photo.width,
                            height: photo.height,
                            htmlAttributions: photo.html_attributions
                        })) : []
                    });
                    
                    await newPlace.save();
                    importedPlaces.push(newPlace);
                    
                    console.log(`📍 Lugar importado: ${newPlace.name}`);
                } else {
                    // Actualizar lugar existente si es necesario
                    if (existingPlace.needsSync) {
                        await this.syncWithGoogle(existingPlace.placeId);
                        importedPlaces.push(existingPlace);
                    }
                }
                
            } catch (error) {
                console.error(`Error al importar lugar ${place.place_id}:`, error);
            }
        }
        
        console.log(`✅ ${importedPlaces.length} lugares importados desde Google Places`);
        return importedPlaces;
        
    } catch (error) {
        console.error('Error en importación desde Google:', error);
        return [];
    }
};

/**
 * Limpiar lugares duplicados
 * @returns {Promise<number>} - Número de duplicados limpiados
 */
GooglePlaceSchema.statics.cleanDuplicates = async function() {
    try {
        const duplicates = await this.aggregate([
            {
                $group: {
                    _id: {
                        name: '$name',
                        address: '$formattedAddress'
                    },
                    places: { $push: '$_id' },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);
        
        let cleanedCount = 0;
        
        for (const duplicate of duplicates) {
            // Mantener el lugar con mejor calidad de datos
            const places = await this.find({
                _id: { $in: duplicate.places }
            }).sort({ 'metadata.dataQuality': -1, lastSyncedAt: -1 });
            
            const [keepPlace, ...removePlaces] = places;
            
            // Marcar como duplicados y transferir estadísticas
            for (const removePlace of removePlaces) {
                // Transferir estadísticas al lugar principal
                Object.keys(removePlace.stats).forEach(key => {
                    if (typeof removePlace.stats[key] === 'number') {
                        keepPlace.stats[key] += removePlace.stats[key];
                    }
                });
                
                // Marcar como duplicado
                removePlace.flags.isDuplicate = true;
                await removePlace.save();
                
                cleanedCount++;
            }
            
            await keepPlace.save();
        }
        
        console.log(`🧹 ${cleanedCount} lugares duplicados marcados`);
        return cleanedCount;
        
    } catch (error) {
        console.error('Error al limpiar duplicados:', error);
        return 0;
    }
};

/**
 * Procesar solicitudes de registro de barberos
 * @returns {Promise<number>} - Número de solicitudes procesadas
 */
GooglePlaceSchema.statics.processRegistrationRequests = async function() {
    try {
        const placesWithRequests = await this.find({
            'stats.registrationRequests': { $gt: 0 },
            hasBarberProfile: false
        }).sort({ 'stats.registrationRequests': -1 });
        
        let processedCount = 0;
        
        for (const place of placesWithRequests) {
            // Generar notificación para administradores
            console.log(`📧 Lugar con ${place.stats.registrationRequests} solicitudes: ${place.name}`);
            
            // Aquí se podría enviar email o notificación a admins
            // También se podría auto-aprobar lugares con buena reputación
            
            if (place.rating >= 4.5 && place.userRatingsTotal >= 10) {
                console.log(`⭐ Lugar ${place.name} elegible para auto-aprobación`);
                // Lógica de auto-aprobación
            }
            
            processedCount++;
        }
        
        return processedCount;
        
    } catch (error) {
        console.error('Error al procesar solicitudes:', error);
        return 0;
    }
};

/**
 * Generar reporte de cobertura por región
 * @returns {Promise<Object>} - Reporte de cobertura
 */
GooglePlaceSchema.statics.generateCoverageReport = async function() {
    try {
        const report = {
            national: {},
            regions: [],
            cities: [],
            recommendations: []
        };
        
        // Estadísticas nacionales
        report.national = await this.getGeneralStats();
        
        // Por regiones
        const regionStats = await this.aggregate([
            {
                $group: {
                    _id: '$metadata.region',
                    totalPlaces: { $sum: 1 },
                    placesWithProfile: {
                        $sum: { $cond: ['$hasBarberProfile', 1, 0] }
                    },
                    averageRating: { $avg: '$rating' }
                }
            },
            {
                $match: { _id: { $ne: null } }
            },
            {
                $addFields: {
                    coveragePercentage: {
                        $multiply: [
                            { $divide: ['$placesWithProfile', '$totalPlaces'] },
                            100
                        ]
                    }
                }
            },
            {
                $sort: { totalPlaces: -1 }
            }
        ]);
        
        report.regions = regionStats;
        
        // Por ciudades
        report.cities = await this.getCityDistribution();
        
        // Generar recomendaciones
        const lowCoverageRegions = regionStats.filter(r => r.coveragePercentage < 30);
        const highPotentialCities = report.cities.filter(c => 
            c.totalPlaces >= 5 && c.placesWithProfile < 2
        );
        
        if (lowCoverageRegions.length > 0) {
            report.recommendations.push({
                type: 'low_coverage',
                message: `${lowCoverageRegions.length} regiones con cobertura < 30%`,
                regions: lowCoverageRegions.map(r => r._id)
            });
        }
        
        if (highPotentialCities.length > 0) {
            report.recommendations.push({
                type: 'expansion_opportunity',
                message: `${highPotentialCities.length} ciudades con alto potencial`,
                cities: highPotentialCities.map(c => c._id)
            });
        }
        
        return report;
        
    } catch (error) {
        console.error('Error al generar reporte de cobertura:', error);
        return null;
    }
};

// ==========================================
// TAREAS AUTOMÁTICAS
// ==========================================

/**
 * Sincronizar lugares automáticamente (para cron job)
 * @param {number} batchSize - Número de lugares por lote
 * @returns {Promise<number>} - Lugares sincronizados
 */
GooglePlaceSchema.statics.autoSync = async function(batchSize = 20) {
    try {
        const placesToSync = await this.findNeedingSync(batchSize);
        let syncedCount = 0;
        
        for (const place of placesToSync) {
            try {
                await this.syncWithGoogle(place.placeId);
                syncedCount++;
                
                // Pausa entre requests para respetar rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error al sincronizar ${place.placeId}:`, error);
            }
        }
        
        console.log(`🔄 ${syncedCount}/${placesToSync.length} lugares sincronizados`);
        return syncedCount;
        
    } catch (error) {
        console.error('Error en sincronización automática:', error);
        return 0;
    }
};

/**
 * Actualizar popularidad de lugares (para cron job)
 * @returns {Promise<number>} - Lugares actualizados
 */
GooglePlaceSchema.statics.updatePopularityScores = async function() {
    try {
        const places = await this.find({
            businessStatus: 'OPERATIONAL'
        }).limit(100);
        
        let updatedCount = 0;
        
        for (const place of places) {
            const oldScore = place.metadata.popularityScore;
            const newScore = place.calculatePopularityScore();
            
            if (oldScore !== newScore) {
                await place.save();
                updatedCount++;
            }
        }
        
        console.log(`📈 ${updatedCount} puntuaciones de popularidad actualizadas`);
        return updatedCount;
        
    } catch (error) {
        console.error('Error al actualizar popularidad:', error);
        return 0;
    }
};

// ==========================================
// VIRTUAL FIELDS
// ==========================================

// Virtual para distancia (se calcula dinámicamente)
GooglePlaceSchema.virtual('distance').get(function() {
    // Se calcula desde el frontend o en consultas específicas
    return this._distance || null;
});

// Virtual para estado del mapa simplificado
GooglePlaceSchema.virtual('mapStatus').get(function() {
    return this.getMapStatus();
});

// Virtual para información de apertura actual
GooglePlaceSchema.virtual('currentOpenStatus').get(function() {
    return this.getCurrentOpenStatus();
});

// Asegurar que los virtuales se incluyan en JSON
GooglePlaceSchema.set('toJSON', { virtuals: true });
GooglePlaceSchema.set('toObject', { virtuals: true });

// Crear el modelo
const GooglePlace = mongoose.model('GooglePlace', GooglePlaceSchema);

module.exports = GooglePlace;
