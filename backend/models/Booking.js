const mongoose = require('mongoose');
const config = require('../config/config');

/**
 * Schema para servicios de la reserva
 */
const ServiceSchema = new mongoose.Schema({
    // Tipo de servicio principal
    type: {
        type: String,
        enum: {
            values: ['corteHombre', 'corteBarba'],
            message: 'El tipo de servicio debe ser: corteHombre o corteBarba'
        },
        required: [true, 'El tipo de servicio es requerido']
    },
    
    // Servicios adicionales seleccionados
    additionalServices: [{
        type: String,
        enum: {
            values: ['ninos', 'expres', 'diseno', 'padre_hijo', 'cejas', 'nariz', 'orejas'],
            message: 'Servicio adicional no válido'
        }
    }],
    
    // Precio total del servicio
    price: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [1000, 'El precio mínimo es $1.000'],
        max: [200000, 'El precio máximo es $200.000'],
        validate: {
            validator: Number.isInteger,
            message: 'El precio debe ser un número entero'
        }
    },
    
    // Duración estimada en minutos
    duration: {
        type: Number,
        required: [true, 'La duración es requerida'],
        min: [15, 'Duración mínima: 15 minutos'],
        max: [240, 'Duración máxima: 240 minutos'],
        default: 30
    },
    
    // Descripción o notas especiales del servicio
    notes: {
        type: String,
        trim: true,
        maxlength: [300, 'Las notas no pueden exceder 300 caracteres']
    }
}, {
    _id: false
});

/**
 * Schema para ubicación de la reserva
 */
const LocationSchema = new mongoose.Schema({
    // Tipo de ubicación
    type: {
        type: String,
        enum: {
            values: ['local', 'domicilio'],
            message: 'La ubicación debe ser: local o domicilio'
        },
        required: [true, 'El tipo de ubicación es requerido']
    },
    
    // Dirección completa
    address: {
        type: String,
        required: [true, 'La dirección es requerida'],
        trim: true,
        maxlength: [400, 'La dirección no puede exceder 400 caracteres']
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
    
    // Detalles adicionales de ubicación
    details: {
        apartment: {
            type: String,
            trim: true,
            maxlength: [50, 'Número de apartamento no puede exceder 50 caracteres']
        },
        floor: {
            type: String,
            trim: true,
            maxlength: [20, 'Piso no puede exceder 20 caracteres']
        },
        building: {
            type: String,
            trim: true,
            maxlength: [100, 'Nombre del edificio no puede exceder 100 caracteres']
        },
        reference: {
            type: String,
            trim: true,
            maxlength: [200, 'Referencia no puede exceder 200 caracteres']
        },
        accessInstructions: {
            type: String,
            trim: true,
            maxlength: [300, 'Instrucciones de acceso no pueden exceder 300 caracteres']
        }
    },
    
    // Información del local (si es tipo local)
    businessInfo: {
        name: String,
        phone: String,
        openingHours: String
    }
}, {
    _id: false
});

/**
 * Schema para timeline de eventos de la reserva
 */
const TimelineEventSchema = new mongoose.Schema({
    // Estado o evento
    status: {
        type: String,
        enum: [
            'created', 'pending', 'accepted', 'rejected', 
            'confirmed', 'in_progress', 'completed', 'cancelled',
            'expired', 'no_show_client', 'no_show_barber'
        ],
        required: true
    },
    
    // Timestamp del evento
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    // Usuario que realizó la acción
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Nota o comentario del evento
    note: {
        type: String,
        trim: true,
        maxlength: [500, 'La nota no puede exceder 500 caracteres']
    },
    
    // Datos adicionales del evento
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    _id: false
});

/**
 * Schema para información de pago
 */
const PaymentSchema = new mongoose.Schema({
    // Monto total a pagar
    amount: {
        type: Number,
        required: [true, 'El monto es requerido'],
        min: [0, 'El monto no puede ser negativo']
    },
    
    // Desglose de costos
    breakdown: {
        servicePrice: {
            type: Number,
            required: true,
            min: 0
        },
        additionalServicesPrice: {
            type: Number,
            default: 0,
            min: 0
        },
        transportFee: {
            type: Number,
            default: 0,
            min: 0
        },
        appCommission: {
            type: Number,
            default: 0,
            min: 0
        },
        taxes: {
            type: Number,
            default: 0,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // Método de pago
    method: {
        type: String,
        enum: {
            values: ['cash', 'transfer', 'card', 'app_payment'],
            message: 'Método de pago debe ser: cash, transfer, card o app_payment'
        },
        default: 'cash'
    },
    
    // Estado del pago
    status: {
        type: String,
        enum: {
            values: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'],
            message: 'Estado de pago inválido'
        },
        default: 'pending',
        index: true
    },
    
    // ID de transacción externa (si aplica)
    transactionId: {
        type: String,
        trim: true,
        sparse: true,
        index: true
    },
    
    // Información del proveedor de pago
    provider: {
        name: String,
        reference: String,
        metadata: mongoose.Schema.Types.Mixed
    },
    
    // Fechas importantes del pago
    paidAt: {
        type: Date,
        default: null
    },
    
    refundedAt: {
        type: Date,
        default: null
    }
}, {
    _id: false
});

/**
 * Schema para información de cancelación
 */
const CancellationSchema = new mongoose.Schema({
    // Usuario que canceló
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Rol del usuario que canceló
    cancelledByRole: {
        type: String,
        enum: ['client', 'barber', 'system', 'admin'],
        required: true
    },
    
    // Motivo de la cancelación
    reason: {
        type: String,
        enum: {
            values: [
                'client_request', 'barber_unavailable', 'weather', 'emergency',
                'no_show', 'late_arrival', 'payment_failed', 'system_error',
                'duplicate_booking', 'location_issue', 'service_unavailable'
            ],
            message: 'Motivo de cancelación inválido'
        },
        required: true
    },
    
    // Descripción detallada
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    
    // Fecha y hora de cancelación
    cancelledAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    // Penalización aplicada
    penalty: {
        applied: {
            type: Boolean,
            default: false
        },
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        reason: String
    },
    
    // Reembolso aplicado
    refund: {
        applied: {
            type: Boolean,
            default: false
        },
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        processedAt: Date
    }
}, {
    _id: false
});

/**
 * Schema principal de Reserva
 */
const BookingSchema = new mongoose.Schema({
    // Referencia al cliente
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El ID del cliente es requerido'],
        index: true
    },
    
    // Referencia al barbero
    barberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Barber',
        required: [true, 'El ID del barbero es requerido'],
        index: true
    },
    
    // Número único de reserva (generado automáticamente)
    bookingNumber: {
        type: String,
        unique: true,
        index: true
    },
    
    // Servicios solicitados
    service: {
        type: ServiceSchema,
        required: true
    },
    
    // Tipo de reserva
    type: {
        type: String,
        enum: {
            values: ['scheduled', 'immediate'],
            message: 'El tipo debe ser: scheduled o immediate'
        },
        required: [true, 'El tipo de reserva es requerido'],
        index: true
    },
    
    // Fecha y hora programada
    scheduledFor: {
        type: Date,
        required: [true, 'La fecha programada es requerida'],
        index: true,
        validate: {
            validator: function(date) {
                // No permitir fechas en el pasado (excepto para immediate)
                if (this.type === 'immediate') return true;
                return date > new Date();
            },
            message: 'La fecha programada debe ser en el futuro'
        }
    },
    
    // Ubicación de la reserva
    location: {
        type: LocationSchema,
        required: true
    },
    
    // Estado actual de la reserva
    status: {
        type: String,
        enum: {
            values: [
                'pending',           // Esperando respuesta del barbero
                'accepted',          // Aceptada por el barbero
                'rejected',          // Rechazada por el barbero
                'confirmed',         // Confirmada por ambas partes
                'in_progress',       // En progreso
                'completed',         // Completada exitosamente
                'cancelled',         // Cancelada
                'expired',           // Expirada sin respuesta
                'no_show_client',    // Cliente no se presentó
                'no_show_barber'     // Barbero no se presentó
            ],
            message: 'Estado de reserva inválido'
        },
        default: 'pending',
        required: true,
        index: true
    },
    
    // Timeline de eventos
    timeline: [TimelineEventSchema],
    
    // Información de pago
    payment: {
        type: PaymentSchema,
        required: true
    },
    
    // Información de cancelación (si aplica)
    cancellation: {
        type: CancellationSchema,
        default: null
    },
    
    // Fecha de expiración automática
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 }, // MongoDB TTL index
        default: function() {
            const minutes = this.type === 'immediate' ? 
                config.BOOKING_CONFIG.immediateExpirationMinutes : 
                config.BOOKING_CONFIG.pendingExpirationMinutes;
            return new Date(Date.now() + minutes * 60 * 1000);
        }
    },
    
    // Tiempo de respuesta del barbero (en minutos)
    responseTime: {
        type: Number,
        default: null,
        min: 0
    },
    
    // Calificación y reseña del cliente (después de completada)
    clientReview: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'El comentario no puede exceder 500 caracteres']
        },
        photos: [String],
        reviewedAt: Date
    },
    
    // Calificación del barbero al cliente
    barberReview: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [300, 'El comentario no puede exceder 300 caracteres']
        },
        reviewedAt: Date
    },
    
    // Notas especiales o instrucciones
    specialInstructions: {
        type: String,
        trim: true,
        maxlength: [500, 'Las instrucciones no pueden exceder 500 caracteres']
    },
    
    // Datos de contacto para coordinación
    contactInfo: {
        clientPhone: String,
        barberPhone: String,
        whatsappThread: String
    },
    
    // Metadata adicional
    metadata: {
        userAgent: String,
        ip: String,
        source: {
            type: String,
            enum: ['web', 'mobile', 'api'],
            default: 'web'
        },
        marketingSource: String,
        estimatedDistance: Number // en metros
    }
}, {
    timestamps: true,
    versionKey: false,
    
    // Configuración del toJSON
    toJSON: {
        transform: function(doc, ret) {
            // Ocultar información sensible
            if (ret.metadata) {
                delete ret.metadata.ip;
                delete ret.metadata.userAgent;
            }
            return ret;
        }
    }
});

// ==========================================
// ÍNDICES PARA OPTIMIZACIÓN
// ==========================================

// Índices compuestos para consultas frecuentes
BookingSchema.index({ clientId: 1, status: 1 });
BookingSchema.index({ barberId: 1, status: 1 });
BookingSchema.index({ status: 1, scheduledFor: 1 });
BookingSchema.index({ type: 1, expiresAt: 1 });
BookingSchema.index({ bookingNumber: 1 });

// Índice geoespacial para búsquedas por ubicación
BookingSchema.index({ 'location.coordinates': '2dsphere' });

// Índices por fechas para reportes
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ scheduledFor: 1 });
BookingSchema.index({ 'payment.status': 1 });

// Índice de texto para búsquedas
BookingSchema.index({
    bookingNumber: 'text',
    'service.notes': 'text',
    specialInstructions: 'text'
});

// ==========================================
// MIDDLEWARE PRE-SAVE
// ==========================================

// Generar número de reserva único
BookingSchema.pre('save', async function(next) {
    if (this.isNew && !this.bookingNumber) {
        const date = new Date();
        const prefix = 'CRT';
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Buscar el último número del día
        const lastBooking = await this.constructor
            .findOne({
                bookingNumber: new RegExp(`^${prefix}${year}${month}${day}`)
            })
            .sort({ bookingNumber: -1 });
        
        let sequence = 1;
        if (lastBooking) {
            const lastSequence = parseInt(lastBooking.bookingNumber.slice(-4));
            sequence = lastSequence + 1;
        }
        
        this.bookingNumber = `${prefix}${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    }
    next();
});

// Agregar evento al timeline en cada cambio de estado
BookingSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.timeline.push({
            status: this.status,
            timestamp: new Date(),
            actor: this._updatedBy || this.clientId, // Se debe setear _updatedBy antes de save
            note: this._statusNote || `Estado cambiado a ${this.status}`
        });
    }
    next();
});

// Validar fechas y horarios
BookingSchema.pre('save', function(next) {
    const now = new Date();
    
    // Validar que la fecha programada sea válida
    if (this.scheduledFor <= now && this.type !== 'immediate') {
        return next(new Error('La fecha programada debe ser en el futuro'));
    }
    
    // Validar tiempo mínimo de anticipación
    if (this.type === 'scheduled') {
        const minAdvanceTime = 60 * 60 * 1000; // 1 hora en millisegundos
        if (this.scheduledFor.getTime() - now.getTime() < minAdvanceTime) {
            return next(new Error('La reserva debe hacerse con al menos 1 hora de anticipación'));
        }
    }
    
    next();
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Verificar si la reserva puede ser cancelada sin penalización
 * @returns {Object} - { canCancel: boolean, penalty: number, reason: string }
 */
BookingSchema.methods.canCancelWithoutPenalty = function() {
    const now = new Date();
    const scheduledTime = new Date(this.scheduledFor);
    const timeDifference = scheduledTime.getTime() - now.getTime();
    const minutesDifference = Math.floor(timeDifference / (1000 * 60));
    
    // Políticas según tipo de reserva
    const freeMinutes = this.type === 'immediate' ? 
        config.BOOKING_CONFIG.cancellationPolicy.immediateFreeMinutes :
        config.BOOKING_CONFIG.cancellationPolicy.scheduledFreeMinutes;
    
    if (minutesDifference >= freeMinutes) {
        return {
            canCancel: true,
            penalty: 0,
            reason: `Cancelación gratuita (más de ${freeMinutes} minutos de anticipación)`
        };
    }
    
    // Calcular penalización
    const penaltyPercentage = config.BOOKING_CONFIG.cancellationPolicy.lateCancellationPenalty;
    const penaltyAmount = Math.round(this.payment.amount * penaltyPercentage);
    
    return {
        canCancel: true,
        penalty: penaltyAmount,
        reason: `Cancelación tardía (menos de ${freeMinutes} minutos): ${penaltyPercentage * 100}% de penalización`
    };
};

/**
 * Calcular tiempo restante para expiración
 * @returns {number} - Minutos restantes antes de expirar
 */
BookingSchema.methods.getTimeToExpiration = function() {
    const now = new Date();
    const timeDifference = this.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(timeDifference / (1000 * 60)));
};

/**
 * Verificar si la reserva ha expirado
 * @returns {boolean} - True si ha expirado
 */
BookingSchema.methods.isExpired = function() {
    return new Date() > this.expiresAt && this.status === 'pending';
};

/**
 * Aceptar reserva (solo barberos)
 * @param {ObjectId} barberId - ID del barbero que acepta
 * @returns {Promise<void>}
 */
BookingSchema.methods.accept = async function(barberId) {
    if (this.status !== 'pending') {
        throw new Error('Solo se pueden aceptar reservas pendientes');
    }
    
    if (this.isExpired()) {
        throw new Error('La reserva ha expirado');
    }
    
    // Calcular tiempo de respuesta
    const responseTime = Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60));
    
    this.status = 'accepted';
    this.responseTime = responseTime;
    this._updatedBy = barberId;
    this._statusNote = 'Reserva aceptada por el barbero';
    
    // Extender tiempo de expiración para confirmación
    this.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas más
    
    await this.save();
};

/**
 * Rechazar reserva (solo barberos)
 * @param {ObjectId} barberId - ID del barbero que rechaza
 * @param {string} reason - Motivo del rechazo
 * @returns {Promise<void>}
 */
BookingSchema.methods.reject = async function(barberId, reason = 'No disponible') {
    if (this.status !== 'pending') {
        throw new Error('Solo se pueden rechazar reservas pendientes');
    }
    
    this.status = 'rejected';
    this._updatedBy = barberId;
    this._statusNote = `Reserva rechazada: ${reason}`;
    
    await this.save();
};

/**
 * Cancelar reserva
 * @param {ObjectId} userId - ID del usuario que cancela
 * @param {string} role - Rol del usuario ('client' o 'barber')
 * @param {string} reason - Motivo de cancelación
 * @returns {Promise<void>}
 */
BookingSchema.methods.cancel = async function(userId, role, reason = 'client_request') {
    if (!['pending', 'accepted', 'confirmed'].includes(this.status)) {
        throw new Error('No se puede cancelar una reserva en este estado');
    }
    
    const penaltyInfo = this.canCancelWithoutPenalty();
    
    this.status = 'cancelled';
    this._updatedBy = userId;
    this._statusNote = `Reserva cancelada por ${role}: ${reason}`;
    
    // Configurar información de cancelación
    this.cancellation = {
        cancelledBy: userId,
        cancelledByRole: role,
        reason: reason,
        description: `Cancelación realizada por ${role}`,
        cancelledAt: new Date(),
        penalty: {
            applied: penaltyInfo.penalty > 0,
            amount: penaltyInfo.penalty,
            percentage: penaltyInfo.penalty > 0 ? config.BOOKING_CONFIG.cancellationPolicy.lateCancellationPenalty * 100 : 0,
            reason: penaltyInfo.reason
        },
        refund: {
            applied: penaltyInfo.penalty < this.payment.amount,
            amount: this.payment.amount - penaltyInfo.penalty,
            processedAt: null // Se procesa después
        }
    };
    
    await this.save();
};

/**
 * Marcar como completada
 * @param {ObjectId} barberId - ID del barbero
 * @returns {Promise<void>}
 */
BookingSchema.methods.complete = async function(barberId) {
    if (this.status !== 'in_progress' && this.status !== 'confirmed') {
        throw new Error('Solo se pueden completar reservas confirmadas o en progreso');
    }
    
    this.status = 'completed';
    this._updatedBy = barberId;
    this._statusNote = 'Servicio completado exitosamente';
    this.payment.status = 'paid';
    this.payment.paidAt = new Date();
    
    await this.save();
};

/**
 * Generar mensaje de WhatsApp para coordinación
 * @param {string} messageType - Tipo de mensaje ('acceptance', 'reminder', 'arrival')
 * @returns {string} - Mensaje de WhatsApp
 */
BookingSchema.methods.generateWhatsAppMessage = function(messageType = 'acceptance') {
    const serviceName = this.service.type === 'corteBarba' ? 'Corte + Barba' : 'Corte de Pelo';
    const date = this.scheduledFor.toLocaleDateString('es-CL');
    const time = this.scheduledFor.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    
    const messages = {
        acceptance: `✅ ¡Reserva confirmada! 
        
📅 Fecha: ${date}
🕐 Hora: ${time}
💇‍♂️ Servicio: ${serviceName}
💰 Precio: ${this.payment.amount.toLocaleString('es-CL')}
📍 Ubicación: ${this.location.address}

Reserva #${this.bookingNumber}
¡Te esperamos! 🎉`,

        reminder: `⏰ Recordatorio de tu cita

📅 Mañana a las ${time}
💇‍♂️ ${serviceName}
📍 ${this.location.address}

Reserva #${this.bookingNumber}
¡No olvides tu cita! 👍`,

        arrival: `🚗 En camino

Llegando en aproximadamente 10-15 minutos a:
📍 ${this.location.address}

Reserva #${this.bookingNumber}
¡Nos vemos pronto! 👋`
    };
    
    return messages[messageType] || messages.acceptance;
};

/**
 * Obtener resumen de la reserva
 * @returns {Object} - Resumen de la reserva
 */
BookingSchema.methods.getSummary = function() {
    return {
        bookingNumber: this.bookingNumber,
        status: this.status,
        type: this.type,
        service: {
            name: this.service.type === 'corteBarba' ? 'Corte + Barba' : 'Corte de Pelo',
            price: this.payment.amount,
            duration: this.service.duration
        },
        schedule: {
            date: this.scheduledFor.toLocaleDateString('es-CL'),
            time: this.scheduledFor.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
            timestamp: this.scheduledFor
        },
        location: {
            type: this.location.type,
            address: this.location.address
        },
        timeToExpiration: this.getTimeToExpiration(),
        canCancel: this.status === 'pending' || this.status === 'accepted',
        cancellationInfo: this.canCancelWithoutPenalty()
    };
};

// ==========================================
// MÉTODOS ESTÁTICOS
// ==========================================

/**
 * Buscar reservas por cliente
 * @param {ObjectId} clientId - ID del cliente
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Reservas del cliente
 */
BookingSchema.statics.findByClient = async function(clientId, filters = {}) {
    try {
        const query = { clientId };
        
        if (filters.status) {
            query.status = filters.status;
        }
        
        if (filters.fromDate) {
            query.scheduledFor = { $gte: new Date(filters.fromDate) };
        }
        
        if (filters.toDate) {
            query.scheduledFor = { 
                ...query.scheduledFor, 
                $lte: new Date(filters.toDate) 
            };
        }
        
        return await this.find(query)
            .populate('barberId', 'businessName location whatsapp')
            .sort({ scheduledFor: -1 });
            
    } catch (error) {
        console.error('Error al buscar reservas por cliente:', error);
        return [];
    }
};

/**
 * Buscar reservas por barbero
 * @param {ObjectId} barberId - ID del barbero
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Reservas del barbero
 */
BookingSchema.statics.findByBarber = async function(barberId, filters = {}) {
    try {
        const query = { barberId };
        
        if (filters.status) {
            query.status = Array.isArray(filters.status) ? 
                { $in: filters.status } : filters.status;
        }
        
        if (filters.date) {
            const startOfDay = new Date(filters.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.date);
            endOfDay.setHours(23, 59, 59, 999);
            
            query.scheduledFor = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        
        return await this.find(query)
            .populate('clientId', 'profile.firstName profile.lastName profile.phone profile.avatar')
            .sort({ scheduledFor: 1 });
            
    } catch (error) {
        console.error('Error al buscar reservas por barbero:', error);
        return [];
    }
};

/**
 * Expirar reservas pendientes automáticamente
 * @returns {Promise<number>} - Número de reservas expiradas
 */
BookingSchema.statics.expirePendingBookings = async function() {
    try {
        const result = await this.updateMany(
            {
                status: 'pending',
                expiresAt: { $lte: new Date() }
            },
            {
                $set: { 
                    status: 'expired',
                    'timeline.$[].timestamp': new Date()
                },
                $push: {
                    timeline: {
                        status: 'expired',
                        timestamp: new Date(),
                        actor: null,
                        note: 'Reserva expirada automáticamente por falta de respuesta'
                    }
                }
            }
        );
        
        console.log(`💫 ${result.modifiedCount} reservas expiradas automáticamente`);
        return result.modifiedCount;
        
    } catch (error) {
        console.error('Error al expirar reservas:', error);
        return 0;
    }
};

/**
 * Obtener estadísticas de reservas
 * @param {Object} filters - Filtros para las estadísticas
 * @returns {Promise<Object>} - Estadísticas de reservas
 */
BookingSchema.statics.getBookingStats = async function(filters = {}) {
    try {
        const matchStage = {};
        
        if (filters.barberId) {
            matchStage.barberId = new mongoose.Types.ObjectId(filters.barberId);
        }
        
        if (filters.clientId) {
            matchStage.clientId = new mongoose.Types.ObjectId(filters.clientId);
        }
        
        if (filters.fromDate || filters.toDate) {
            matchStage.createdAt = {};
            if (filters.fromDate) {
                matchStage.createdAt.$gte = new Date(filters.fromDate);
            }
            if (filters.toDate) {
                matchStage.createdAt.$lte = new Date(filters.toDate);
            }
        }
        
        const stats = await this.aggregate([
            { $match: matchStage },
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
                    pendingBookings: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    expiredBookings: {
                        $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
                    },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'completed'] },
                                '$payment.amount',
                                0
                            ]
                        }
                    },
                    averageServicePrice: { $avg: '$payment.amount' },
                    immediateBookings: {
                        $sum: { $cond: [{ $eq: ['$type', 'immediate'] }, 1, 0] }
                    },
                    scheduledBookings: {
                        $sum: { $cond: [{ $eq: ['$type', 'scheduled'] }, 1, 0] }
                    },
                    averageResponseTime: { $avg: '$responseTime' }
                }
            }
        ]);
        
        const result = stats[0] || {};
        
        // Calcular tasas de conversión
        if (result.totalBookings > 0) {
            result.completionRate = ((result.completedBookings / result.totalBookings) * 100).toFixed(2);
            result.cancellationRate = ((result.cancelledBookings / result.totalBookings) * 100).toFixed(2);
            result.expirationRate = ((result.expiredBookings / result.totalBookings) * 100).toFixed(2);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error al obtener estadísticas de reservas:', error);
        return {};
    }
};

/**
 * Buscar reservas próximas a expirar
 * @param {number} minutesAhead - Minutos de anticipación
 * @returns {Promise<Array>} - Reservas próximas a expirar
 */
BookingSchema.statics.findExpiringBookings = async function(minutesAhead = 5) {
    try {
        const expirationTime = new Date(Date.now() + minutesAhead * 60 * 1000);
        
        return await this.find({
            status: 'pending',
            expiresAt: { 
                $lte: expirationTime,
                $gt: new Date()
            }
        })
        .populate('clientId', 'profile.firstName profile.lastName profile.phone')
        .populate('barberId', 'businessName whatsapp');
        
    } catch (error) {
        console.error('Error al buscar reservas próximas a expirar:', error);
        return [];
    }
};

/**
 * Obtener reservas para recordatorios
 * @param {number} hoursAhead - Horas de anticipación para recordatorio
 * @returns {Promise<Array>} - Reservas para enviar recordatorios
 */
BookingSchema.statics.findBookingsForReminders = async function(hoursAhead = 24) {
    try {
        const reminderTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
        const windowStart = new Date(reminderTime.getTime() - 30 * 60 * 1000); // 30 min antes
        const windowEnd = new Date(reminderTime.getTime() + 30 * 60 * 1000);   // 30 min después
        
        return await this.find({
            status: { $in: ['accepted', 'confirmed'] },
            scheduledFor: {
                $gte: windowStart,
                $lte: windowEnd
            },
            'metadata.reminderSent': { $ne: true }
        })
        .populate('clientId', 'profile.firstName profile.lastName profile.phone')
        .populate('barberId', 'businessName whatsapp location');
        
    } catch (error) {
        console.error('Error al buscar reservas para recordatorios:', error);
        return [];
    }
};

/**
 * Marcar recordatorio como enviado
 * @param {ObjectId} bookingId - ID de la reserva
 * @returns {Promise<void>}
 */
BookingSchema.statics.markReminderSent = async function(bookingId) {
    try {
        await this.findByIdAndUpdate(bookingId, {
            'metadata.reminderSent': true,
            'metadata.reminderSentAt': new Date()
        });
    } catch (error) {
        console.error('Error al marcar recordatorio enviado:', error);
    }
};

/**
 * Obtener reservas por proximidad geográfica
 * @param {Array} coordinates - [longitude, latitude]
 * @param {number} maxDistance - Distancia máxima en metros
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Reservas cercanas
 */
BookingSchema.statics.findNearby = async function(coordinates, maxDistance = 10000, filters = {}) {
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
            }
        };
        
        if (filters.status) {
            query.status = filters.status;
        }
        
        if (filters.date) {
            const startOfDay = new Date(filters.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.date);
            endOfDay.setHours(23, 59, 59, 999);
            
            query.scheduledFor = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        
        return await this.find(query)
            .populate('clientId', 'profile.firstName profile.lastName')
            .populate('barberId', 'businessName location')
            .sort({ scheduledFor: 1 });
            
    } catch (error) {
        console.error('Error al buscar reservas cercanas:', error);
        return [];
    }
};

// ==========================================
// MIDDLEWARE POST-SAVE
// ==========================================

// Actualizar estadísticas del barbero después de cambios de estado
BookingSchema.post('save', async function(doc, next) {
    try {
        if (doc.isModified('status')) {
            const Barber = mongoose.model('Barber');
            const barber = await Barber.findById(doc.barberId);
            
            if (barber) {
                // Actualizar contadores según el nuevo estado
                switch (doc.status) {
                    case 'completed':
                        barber.stats.bookingStats.completedBookings += 1;
                        barber.stats.totalEarnings += doc.payment.amount;
                        break;
                    case 'cancelled':
                        barber.stats.bookingStats.cancelledBookings += 1;
                        break;
                    case 'rejected':
                        barber.stats.bookingStats.rejectedBookings += 1;
                        break;
                    case 'expired':
                        // Penalizar por no responder
                        if (doc.type === 'immediate') {
                            barber.penalties.count += 1;
                            barber.penalties.lastPenalty = new Date();
                        }
                        break;
                }
                
                // Actualizar tiempo de respuesta promedio
                if (doc.responseTime && doc.status === 'accepted') {
                    const totalResponses = barber.stats.bookingStats.completedBookings + 
                                         barber.stats.bookingStats.rejectedBookings;
                    const currentAvg = barber.stats.averageResponseTime || 0;
                    barber.stats.averageResponseTime = 
                        ((currentAvg * (totalResponses - 1)) + doc.responseTime) / totalResponses;
                }
                
                await barber.save();
            }
        }
    } catch (error) {
        console.error('Error al actualizar estadísticas del barbero:', error);
    }
    
    next();
});

// ==========================================
// VALIDACIONES PERSONALIZADAS
// ==========================================

// Validar que el barbero no tenga conflictos de horario
BookingSchema.pre('save', async function(next) {
    if (this.isNew && this.status === 'accepted') {
        try {
            const conflictingBooking = await this.constructor.findOne({
                barberId: this.barberId,
                status: { $in: ['accepted', 'confirmed', 'in_progress'] },
                scheduledFor: {
                    $gte: new Date(this.scheduledFor.getTime() - this.service.duration * 60 * 1000),
                    $lte: new Date(this.scheduledFor.getTime() + this.service.duration * 60 * 1000)
                },
                _id: { $ne: this._id }
            });
            
            if (conflictingBooking) {
                return next(new Error('El barbero ya tiene una reserva en ese horario'));
            }
        } catch (error) {
            return next(error);
        }
    }
    
    next();
});

// Crear el modelo
const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
