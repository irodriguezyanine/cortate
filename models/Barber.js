const mongoose = require('mongoose');
const config = require('../config/config');

/**
 * Schema para servicios del barbero
 * Define precios y disponibilidad de servicios
 */
const ServicesSchema = new mongoose.Schema({
    // Servicios obligatorios
    corteHombre: {
        price: {
            type: Number,
            required: [true, 'El precio del corte de hombre es obligatorio'],
            min: [1000, 'El precio mínimo es $1.000'],
            max: [100000, 'El precio máximo es $100.000'],
            validate: {
                validator: Number.isInteger,
                message: 'El precio debe ser un número entero'
            }
        },
        available: {
            type: Boolean,
            default: true
        },
        duration: {
            type: Number, // Duración en minutos
            default: 30,
            min: [15, 'Duración mínima: 15 minutos'],
            max: [120, 'Duración máxima: 120 minutos']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'La descripción no puede exceder 200 caracteres']
        }
    },
    
    corteBarba: {
        price: {
            type: Number,
            required: [true, 'El precio del corte + barba es obligatorio'],
            min: [2000, 'El precio mínimo es $2.000'],
            max: [150000, 'El precio máximo es $150.000'],
            validate: {
                validator: Number.isInteger,
                message: 'El precio debe ser un número entero'
            }
        },
        available: {
            type: Boolean,
            default: true
        },
        duration: {
            type: Number,
            default: 45,
            min: [30, 'Duración mínima: 30 minutos'],
            max: [180, 'Duración máxima: 180 minutos']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'La descripción no puede exceder 200 caracteres']
        }
    },
    
    // Servicios adicionales opcionales (tags)
    adicionales: [{
        type: String,
        enum: {
            values: ['ninos', 'expres', 'diseno', 'padre_hijo', 'cejas', 'nariz', 'orejas', 'masaje'],
            message: 'Servicio adicional no válido'
        }
    }],
    
    // Información adicional sobre servicios
    specialties: [{
        name: {
            type: String,
            trim: true,
            maxlength: [50, 'El nombre de la especialidad no puede exceder 50 caracteres']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'La descripción no puede exceder 200 caracteres']
        },
        price: {
            type: Number,
            min: 0
        }
    }],
    
    // Promociones activas
    promotions: [{
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, 'El nombre de la promoción no puede exceder 100 caracteres']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, 'La descripción no puede exceder 300 caracteres']
        },
        discount: {
            type: Number,
            min: [0, 'El descuento no puede ser negativo'],
            max: [100, 'El descuento no puede exceder 100%']
        },
        validUntil: {
            type: Date,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }]
}, {
    _id: false
});

/**
 * Schema para ubicación del barbero
 */
const LocationSchema = new mongoose.Schema({
    // Dirección completa
    address: {
        type: String,
        required: [true, 'La dirección es requerida'],
        trim: true,
        maxlength: [300, 'La dirección no puede exceder 300 caracteres']
    },
    
    // Coordenadas geográficas [longitude, latitude]
    coordinates: {
        type: [Number],
        required: [true, 'Las coordenadas son requeridas'],
        validate: {
            validator: function(coords) {
                return coords.length === 2 && 
                       coords[0] >= -180 && coords[0] <= 180 && // longitude
                       coords[1] >= -90 && coords[1] <= 90;     // latitude
            },
            message: 'Las coordenadas deben estar en formato [longitude, latitude] válido'
        },
        index: '2dsphere'
    },
    
    // ID de Google Places (si está asociado)
    googlePlaceId: {
        type: String,
        trim: true,
        sparse: true,
        index: true
    },
    
    // Información detallada de ubicación
    details: {
        city: {
            type: String,
            required: [true, 'La ciudad es requerida'],
            trim: true,
            maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
        },
        region: {
            type: String,
            required: [true, 'La región es requerida'],
            trim: true,
            maxlength: [100, 'La región no puede exceder 100 caracteres']
        },
        country: {
            type: String,
            default: 'Chile',
            trim: true
        },
        postalCode: {
            type: String,
            trim: true,
            match: [/^\d{7}$/, 'Código postal chileno debe tener 7 dígitos']
        },
        neighborhood: {
            type: String,
            trim: true,
            maxlength: [100, 'El barrio no puede exceder 100 caracteres']
        }
    },
    
    // Información adicional del local
    businessInfo: {
        hasParking: {
            type: Boolean,
            default: false
        },
        isAccessible: {
            type: Boolean,
            default: false
        },
        hasWifi: {
            type: Boolean,
            default: false
        },
        hasAirConditioning: {
            type: Boolean,
            default: false
        },
        maxCapacity: {
            type: Number,
            min: 1,
            max: 20,
            default: 1
        }
    }
}, {
    _id: false
});

/**
 * Schema para disponibilidad y horarios
 */
const AvailabilitySchema = new mongoose.Schema({
    // Estado general de disponibilidad
    isAvailable: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // Acepta cortes inmediatos ("libre ahora")
    acceptsImmediate: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Estado actual del barbero
    currentStatus: {
        type: String,
        enum: {
            values: ['available', 'busy', 'break', 'offline'],
            message: 'Estado debe ser: available, busy, break o offline'
        },
        default: 'offline'
    },
    
    // Mensaje de estado personalizado
    statusMessage: {
        type: String,
        trim: true,
        maxlength: [100, 'El mensaje de estado no puede exceder 100 caracteres']
    },
    
    // Horario de trabajo semanal
    schedule: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            required: true
        },
        isWorking: {
            type: Boolean,
            default: false
        },
        shifts: [{
            start: {
                type: String,
                required: true,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
            },
            end: {
                type: String,
                required: true,
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
            }
        }]
    }],
    
    // Días de vacaciones o no disponibles
    unavailableDates: [{
        date: {
            type: Date,
            required: true
        },
        reason: {
            type: String,
            trim: true,
            maxlength: [100, 'La razón no puede exceder 100 caracteres']
        },
        allDay: {
            type: Boolean,
            default: true
        },
        startTime: String,
        endTime: String
    }],
    
    // Configuración de reservas
    bookingSettings: {
        // Tiempo mínimo de anticipación para reservas (en minutos)
        minimumAdvanceTime: {
            type: Number,
            default: 60, // 1 hora
            min: 0
        },
        
        // Tiempo máximo de anticipación (en días)
        maximumAdvanceDays: {
            type: Number,
            default: 30,
            min: 1,
            max: 90
        },
        
        // Tiempo entre citas (en minutos)
        bufferTime: {
            type: Number,
            default: 15,
            min: 0,
            max: 60
        },
        
        // Acepta reservas para el mismo día
        acceptsSameDayBookings: {
            type: Boolean,
            default: true
        }
    }
}, {
    _id: false
});

/**
 * Schema para estadísticas del barbero
 */
const StatsSchema = new mongoose.Schema({
    // Número total de cortes realizados
    totalCuts: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },
    
    // Calificación promedio
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        index: true
    },
    
    // Número total de reseñas
    totalReviews: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Distribución de calificaciones
    ratingDistribution: {
        oneStars: { type: Number, default: 0 },
        twoStars: { type: Number, default: 0 },
        threeStars: { type: Number, default: 0 },
        fourStars: { type: Number, default: 0 },
        fiveStars: { type: Number, default: 0 }
    },
    
    // Ingresos totales
    totalEarnings: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Estadísticas de reservas
    bookingStats: {
        totalBookings: { type: Number, default: 0 },
        completedBookings: { type: Number, default: 0 },
        cancelledBookings: { type: Number, default: 0 },
        rejectedBookings: { type: Number, default: 0 },
        noShowBookings: { type: Number, default: 0 }
    },
    
    // Tasa de respuesta y aceptación
    responseRate: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    
    acceptanceRate: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    
    // Tiempo promedio de respuesta (en minutos)
    averageResponseTime: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Clientes recurrentes
    repeatCustomers: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Fecha del último corte
    lastCut: {
        type: Date,
        default: null
    },
    
    // Mejor mes en términos de ingresos
    bestMonth: {
        month: String,
        year: Number,
        earnings: Number,
        cuts: Number
    }
}, {
    _id: false
});

/**
 * Schema para verificación del barbero
 */
const VerificationSchema = new mongoose.Schema({
    // Imágenes de la cédula de identidad (frente y reverso)
    ciImages: {
        front: {
            type: String,
            required: [true, 'La imagen frontal de la CI es requerida']
        },
        back: {
            type: String,
            required: [true, 'La imagen trasera de la CI es requerida']
        }
    },
    
    // Estado de verificación
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Fecha de verificación
    verifiedAt: {
        type: Date,
        default: null
    },
    
    // Administrador que verificó
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Motivo de rechazo (si aplica)
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, 'El motivo no puede exceder 500 caracteres']
    },
    
    // Estado del proceso de verificación
    verificationStatus: {
        type: String,
        enum: {
            values: ['pending', 'under_review', 'approved', 'rejected', 'expired'],
            message: 'Estado debe ser: pending, under_review, approved, rejected o expired'
        },
        default: 'pending'
    },
    
    // Notas del revisor
    reviewerNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
    }
}, {
    _id: false
});

/**
 * Schema para penalizaciones del barbero
 */
const PenaltiesSchema = new mongoose.Schema({
    // Contador de penalizaciones activas
    count: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Fecha de la última penalización
    lastPenalty: {
        type: Date,
        default: null
    },
    
    // Estado actual del barbero
    status: {
        type: String,
        enum: {
            values: ['active', 'warning', 'suspended', 'banned'],
            message: 'Estado debe ser: active, warning, suspended o banned'
        },
        default: 'active',
        index: true
    },
    
    // Fecha hasta cuando está suspendido
    suspendedUntil: {
        type: Date,
        default: null
    },
    
    // Motivo de suspensión
    suspensionReason: {
        type: String,
        trim: true,
        maxlength: [300, 'El motivo no puede exceder 300 caracteres']
    },
    
    // Historial de penalizaciones (últimas 10)
    history: [{
        type: {
            type: String,
            enum: ['rejection', 'no_show', 'late_response', 'poor_service'],
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        description: String,
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking'
        }
    }]
}, {
    _id: false
});

/**
 * Schema principal del Barbero
 */
const BarberSchema = new mongoose.Schema({
    // Referencia al usuario
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El ID de usuario es requerido'],
        unique: true,
        index: true
    },
    
    // Nombre del negocio
    businessName: {
        type: String,
        required: [true, 'El nombre del negocio es requerido'],
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
        index: 'text'
    },
    
    // Descripción del barbero/negocio
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },
    
    // Servicios ofrecidos
    services: {
        type: ServicesSchema,
        required: true
    },
    
    // Tipo de servicio principal
    serviceType: {
        type: String,
        enum: {
            values: ['local', 'domicilio', 'mixto'],
            message: 'El tipo de servicio debe ser: local, domicilio o mixto'
        },
        required: [true, 'El tipo de servicio es requerido'],
        index: true
    },
    
    // Ubicación del barbero
    location: {
        type: LocationSchema,
        required: true
    },
    
    // Disponibilidad y horarios
    availability: {
        type: AvailabilitySchema,
        default: () => ({})
    },
    
    // Galería de imágenes
    gallery: [{
        url: {
            type: String,
            required: true
        },
        caption: {
            type: String,
            trim: true,
            maxlength: [200, 'El caption no puede exceder 200 caracteres']
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        isMainImage: {
            type: Boolean,
            default: false
        }
    }],
    
    // Estadísticas
    stats: {
        type: StatsSchema,
        default: () => ({})
    },
    
    // Verificación
    verification: {
        type: VerificationSchema,
        required: true
    },
    
    // Penalizaciones
    penalties: {
        type: PenaltiesSchema,
        default: () => ({})
    },
    
    // Número de WhatsApp para contacto
    whatsapp: {
        type: String,
        required: [true, 'El número de WhatsApp es requerido'],
        trim: true,
        match: [/^\+?56[0-9]{8,9}$/, 'Formato de WhatsApp chileno inválido (+56xxxxxxxxx)']
    },
    
    // Instagram (opcional)
    instagram: {
        type: String,
        trim: true,
        match: [/^@?[a-zA-Z0-9._]{1,30}$/, 'Formato de Instagram inválido']
    },
    
    // Sitio web (opcional)
    website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Debe ser una URL válida']
    },
    
    // Estado del perfil
    isActive: {
        type: Boolean,
        default: false, // Inactivo hasta verificación
        index: true
    },
    
    // Featured/Destacado (para promociones)
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Fecha de último corte realizado
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false,
    
    // Configuración del toJSON
    toJSON: {
        transform: function(doc, ret) {
            // Ocultar información sensible de verificación
            if (ret.verification && ret.verification.ciImages) {
                delete ret.verification.ciImages;
                delete ret.verification.reviewerNotes;
            }
            return ret;
        }
    }
});

// ==========================================
// ÍNDICES PARA OPTIMIZACIÓN
// ==========================================

// Índices geoespaciales para búsquedas por ubicación
BarberSchema.index({ 'location.coordinates': '2dsphere' });

// Índices compuestos para búsquedas frecuentes
BarberSchema.index({ serviceType: 1, 'availability.isAvailable': 1 });
BarberSchema.index({ 'stats.rating': -1, 'stats.totalCuts': -1 });
BarberSchema.index({ isActive: 1, 'verification.isVerified': 1 });
BarberSchema.index({ 'availability.acceptsImmediate': 1, 'availability.currentStatus': 1 });

// Índices de texto para búsquedas
BarberSchema.index({ 
    businessName: 'text', 
    description: 'text',
    'location.details.city': 'text',
    'location.details.neighborhood': 'text'
});

// Índices por rendimiento
BarberSchema.index({ createdAt: -1 });
BarberSchema.index({ lastActivity: -1 });
BarberSchema.index({ 'penalties.status': 1 });

// ==========================================
// MIDDLEWARE PRE-SAVE
// ==========================================

// Validar horarios antes de guardar
BarberSchema.pre('save', function(next) {
    if (this.availability && this.availability.schedule) {
        for (let daySchedule of this.availability.schedule) {
            if (daySchedule.isWorking && daySchedule.shifts) {
                for (let shift of daySchedule.shifts) {
                    if (shift.start >= shift.end) {
                        return next(new Error(`Horario inválido para ${daySchedule.day}: la hora de inicio debe ser menor que la de fin`));
                    }
                }
            }
        }
    }
    next();
});

// Actualizar actividad al guardar
BarberSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.lastActivity = new Date();
    }
    next();
});

// Validar que tenga al menos una imagen principal
BarberSchema.pre('save', function(next) {
    if (this.gallery && this.gallery.length > 0) {
        const hasMainImage = this.gallery.some(img => img.isMainImage);
        if (!hasMainImage) {
            // Marcar la primera imagen como principal
            this.gallery[0].isMainImage = true;
        }
    }
    next();
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Verificar si el barbero está disponible en un momento específico
 * @param {Date} dateTime - Fecha y hora a verificar
 * @returns {boolean} - True si está disponible
 */
BarberSchema.methods.isAvailableAt = function(dateTime) {
    if (!this.availability.isAvailable || this.penalties.status === 'suspended') {
        return false;
    }
    
    const date = new Date(dateTime);
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const timeStr = date.toTimeString().slice(0, 5); // HH:MM format
    
    // Verificar si trabaja ese día
    const daySchedule = this.availability.schedule.find(s => s.day === dayName);
    if (!daySchedule || !daySchedule.isWorking) {
        return false;
    }
    
    // Verificar si está en horario de trabajo
    const isInWorkingHours = daySchedule.shifts.some(shift => 
        timeStr >= shift.start && timeStr <= shift.end
    );
    
    if (!isInWorkingHours) {
        return false;
    }
    
    // Verificar fechas no disponibles
    const isUnavailable = this.availability.unavailableDates.some(unavailable => {
        const unavailableDate = new Date(unavailable.date);
        return unavailableDate.toDateString() === date.toDateString();
    });
    
    return !isUnavailable;
};

/**
 * Obtener precio de un servicio específico
 * @param {string} serviceType - Tipo de servicio ('corteHombre' o 'corteBarba')
 * @returns {number} - Precio del servicio
 */
BarberSchema.methods.getServicePrice = function(serviceType) {
    if (serviceType === 'corteHombre' && this.services.corteHombre.available) {
        return this.services.corteHombre.price;
    }
    if (serviceType === 'corteBarba' && this.services.corteBarba.available) {
        return this.services.corteBarba.price;
    }
    return 0;
};

/**
 * Obtener imagen principal de la galería
 * @returns {string|null} - URL de la imagen principal
 */
BarberSchema.methods.getMainImage = function() {
    const mainImage = this.gallery.find(img => img.isMainImage);
    return mainImage ? mainImage.url : (this.gallery[0] ? this.gallery[0].url : null);
};

/**
 * Calcular distancia desde un punto específico
 * @param {Array} coordinates - [longitude, latitude]
 * @returns {number} - Distancia en metros (estimada)
 */
BarberSchema.methods.calculateDistance = function(coordinates) {
    if (!coordinates || !this.location.coordinates) {
        return Infinity;
    }
    
    const [lon1, lat1] = this.location.coordinates;
    const [lon2, lat2] = coordinates;
    
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c);
};

/**
 * Actualizar estadísticas después de una reserva completada
 * @param {Object} bookingData - Datos de la reserva
 */
BarberSchema.methods.updateStatsAfterBooking = function(bookingData) {
    this.stats.totalCuts += 1;
    this.stats.totalEarnings += bookingData.payment.amount;
    this.stats.bookingStats.totalBookings += 1;
    this.stats.bookingStats.completedBookings += 1;
    this.stats.lastCut = new Date();
    
    // Actualizar mejor mes
    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
    
    if (!this.stats.bestMonth || 
        !this.stats.bestMonth.month || 
        this.stats.bestMonth.earnings < this.stats.totalEarnings) {
        this.stats.bestMonth = {
            month: monthYear,
            year: currentDate.getFullYear(),
            earnings: this.stats.totalEarnings,
            cuts: this.stats.totalCuts
        };
    }
};

/**
 * Actualizar calificación promedio
 * @param {number} newRating - Nueva calificación (1-5)
 */
BarberSchema.methods.updateRating = function(newRating) {
    const oldTotal = this.stats.rating * this.stats.totalReviews;
    this.stats.totalReviews += 1;
    this.stats.rating = (oldTotal + newRating) / this.stats.totalReviews;
    
    // Actualizar distribución de calificaciones
    const ratingKey = ['', 'oneStars', 'twoStars', 'threeStars', 'fourStars', 'fiveStars'][newRating];
    if (ratingKey) {
        this.stats.ratingDistribution[ratingKey] += 1;
    }
};

/**
 * Verificar si puede aceptar reservas inmediatas
 * @returns {boolean} - True si puede aceptar reservas inmediatas
 */
BarberSchema.methods.canAcceptImmediate = function() {
    return this.availability.isAvailable && 
           this.availability.acceptsImmediate && 
           this.availability.currentStatus === 'available' &&
           this.penalties.status === 'active' &&
           this.verification.isVerified;
};

/**
 * Obtener estado para mostrar en el mapa
 * @returns {string} - Color del estado ('green', 'blue', 'red', 'gray')
 */
BarberSchema.methods.getMapStatus = function() {
    if (!this.verification.isVerified) return 'red';
    if (!this.availability.isAvailable || this.penalties.status !== 'active') return 'gray';
    if (this.availability.acceptsImmediate && this.availability.currentStatus === 'available') return 'blue';
    if (this.availability.isAvailable) return 'green';
    return 'gray';
};

/**
 * Generar mensaje de WhatsApp personalizado
 * @param {Object} clientData - Datos del cliente
 * @param {string} serviceType - Tipo de servicio solicitado
 * @returns {string} - Mensaje de WhatsApp
 */
BarberSchema.methods.generateWhatsAppMessage = function(clientData, serviceType = 'corte') {
    const serviceName = serviceType === 'corteBarba' ? 'Corte + Barba' : 'Corte de Pelo';
    const price = this.getServicePrice(serviceType);
    
    return `¡Hola ${this.businessName}! 👋\n\nTe contacto desde Córtate.cl para agendar:\n\n` +
           `🧔 Servicio: ${serviceName}\n` +
           `💰 Precio: ${price.toLocaleString('es-CL')}\n` +
           `👤 Cliente: ${clientData.name}\n` +
           `📱 Teléfono: ${clientData.phone}\n\n` +
           `¿Tienes disponibilidad? ¡Gracias! 💇‍♂️`;
};

// ==========================================
// MÉTODOS ESTÁTICOS
// ==========================================

/**
 * Buscar barberos por proximidad geográfica
 * @param {Array} coordinates - [longitude, latitude]
 * @param {number} maxDistance - Distancia máxima en metros
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Barberos cercanos
 */
BarberSchema.statics.findNearby = async function(coordinates, maxDistance = 10000, filters = {}) {
    try {
        const query = {
            'location.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    },
                    $maxDistance: maxDistance
                }
            },
            isActive: true,
            'verification.isVerified': true
        };
        
        // Aplicar filtros adicionales
        if (filters.serviceType) {
            query.serviceType = { $in: [filters.serviceType, 'mixto'] };
        }
        
        if (filters.acceptsImmediate) {
            query['availability.acceptsImmediate'] = true;
            query['availability.currentStatus'] = 'available';
        }
        
        if (filters.minRating) {
            query['stats.rating'] = { $gte: filters.minRating };
        }
        
        if (filters.maxPrice) {
            query.$or = [
                { 'services.corteHombre.price': { $lte: filters.maxPrice } },
                { 'services.corteBarba.price': { $lte: filters.maxPrice } }
            ];
        }
        
        return await this.find(query)
            .populate('userId', 'profile.firstName profile.lastName profile.avatar')
            .sort({ 'stats.rating': -1, 'stats.totalCuts': -1 });
            
    } catch (error) {
        console.error('Error al buscar barberos cercanos:', error);
        return [];
    }
};

/**
 * Buscar barberos disponibles para reserva inmediata
 * @param {Array} coordinates - [longitude, latitude]
 * @param {number} maxDistance - Distancia máxima en metros
 * @returns {Promise<Array>} - Barberos disponibles ahora
 */
BarberSchema.statics.findAvailableNow = async function(coordinates, maxDistance = 10000) {
    return await this.findNearby(coordinates, maxDistance, { 
        acceptsImmediate: true 
    });
};

/**
 * Obtener barberos mejor calificados
 * @param {number} limit - Número de resultados
 * @returns {Promise<Array>} - Top barberos
 */
BarberSchema.statics.getTopRated = async function(limit = 10) {
    try {
        return await this.find({
            isActive: true,
            'verification.isVerified': true,
            'stats.totalReviews': { $gte: 5 } // Mínimo 5 reseñas
        })
        .populate('userId', 'profile.firstName profile.lastName profile.avatar')
        .sort({ 'stats.rating': -1, 'stats.totalReviews': -1 })
        .limit(limit);
    } catch (error) {
        console.error('Error al obtener top barberos:', error);
        return [];
    }
};

/**
 * Obtener estadísticas generales de barberos
 * @returns {Promise<Object>} - Estadísticas
 */
BarberSchema.statics.getGeneralStats = async function() {
    try {
        const stats = await this.aggregate([
            {
                $group: {
                    _id: null,
                    totalBarbers: { $sum: 1 },
                    activeBarbers: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    },
                    verifiedBarbers: {
                        $sum: { $cond: ['$verification.isVerified', 1, 0] }
                    },
                    averageRating: { $avg: '$stats.rating' },
                    totalCuts: { $sum: '$stats.totalCuts' },
                    totalEarnings: { $sum: '$stats.totalEarnings' },
                    barbersWithLocal: {
                        $sum: { $cond: [{ $in: ['$serviceType', ['local', 'mixto']] }, 1, 0] }
                    },
                    barbersWithDomicilio: {
                        $sum: { $cond: [{ $in: ['$serviceType', ['domicilio', 'mixto']] }, 1, 0] }
                    }
                }
            }
        ]);
        
        return stats[0] || {};
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return {};
    }
};

/**
 * Buscar barberos por texto (nombre, descripción, ubicación)
 * @param {string} searchText - Texto a buscar
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Resultados de búsqueda
 */
BarberSchema.statics.searchBarbers = async function(searchText, filters = {}) {
    try {
        const query = {
            $text: { $search: searchText },
            isActive: true,
            'verification.isVerified': true
        };
        
        // Aplicar filtros
        if (filters.serviceType) {
            query.serviceType = { $in: [filters.serviceType, 'mixto'] };
        }
        
        if (filters.city) {
            query['location.details.city'] = new RegExp(filters.city, 'i');
        }
        
        return await this.find(query, { score: { $meta: 'textScore' } })
            .populate('userId', 'profile.firstName profile.lastName profile.avatar')
            .sort({ score: { $meta: 'textScore' }, 'stats.rating': -1 });
            
    } catch (error) {
        console.error('Error en búsqueda de barberos:', error);
        return [];
    }
};

// Crear el modelo
const Barber = mongoose.model('Barber', BarberSchema);

module.exports = Barber;
