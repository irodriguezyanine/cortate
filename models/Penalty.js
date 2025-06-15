const mongoose = require('mongoose');
const config = require('../config/config');

/**
 * Schema para detalles de la penalización
 */
const PenaltyDetailsSchema = new mongoose.Schema({
    // Descripción detallada del incidente
    description: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true,
        minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },
    
    // Tiempo de retraso (si aplica) en minutos
    delayMinutes: {
        type: Number,
        min: 0,
        max: 1440, // Máximo 24 horas
        default: null
    },
    
    // Número de rechazos consecutivos
    consecutiveRejections: {
        type: Number,
        min: 0,
        default: null
    },
    
    // Impacto en el cliente
    clientImpact: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'critical'],
            message: 'El impacto debe ser: low, medium, high o critical'
        },
        default: 'medium'
    },
    
    // Si es reincidencia
    isRepeatOffense: {
        type: Boolean,
        default: false
    },
    
    // Número de ofensas similares en los últimos 30 días
    recentSimilarOffenses: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Evidencia adicional (URLs de imágenes, documentos)
    evidence: [{
        type: String,
        url: String,
        description: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Testigos o referencias
    witnesses: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        statement: String,
        contactInfo: String
    }]
}, {
    _id: false
});

/**
 * Schema para cálculo de la penalización
 */
const CalculationSchema = new mongoose.Schema({
    // Monto base de la penalización
    baseAmount: {
        type: Number,
        required: [true, 'El monto base es requerido'],
        min: 0
    },
    
    // Multiplicadores aplicados
    multipliers: {
        repeatOffense: {
            type: Number,
            default: 1.0,
            min: 1.0,
            max: 3.0
        },
        severity: {
            type: Number,
            default: 1.0,
            min: 0.5,
            max: 2.0
        },
        impact: {
            type: Number,
            default: 1.0,
            min: 0.5,
            max: 2.0
        },
        timeOfDay: {
            type: Number,
            default: 1.0,
            min: 1.0,
            max: 1.5
        }
    },
    
    // Descuentos aplicados
    discounts: {
        firstTime: {
            type: Number,
            default: 0,
            min: 0,
            max: 0.5
        },
        goodHistory: {
            type: Number,
            default: 0,
            min: 0,
            max: 0.3
        },
        quickResolution: {
            type: Number,
            default: 0,
            min: 0,
            max: 0.2
        }
    },
    
    // Monto final calculado
    finalAmount: {
        type: Number,
        required: [true, 'El monto final es requerido'],
        min: 0
    },
    
    // Fórmula utilizada para el cálculo
    formula: {
        type: String,
        required: true
    },
    
    // Fecha del cálculo
    calculatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
});

/**
 * Schema para resolución de la penalización
 */
const ResolutionSchema = new mongoose.Schema({
    // Estado de resolución
    status: {
        type: String,
        enum: {
            values: ['pending', 'paid', 'disputed', 'waived', 'reduced', 'expired'],
            message: 'Estado de resolución inválido'
        },
        default: 'pending',
        index: true
    },
    
    // Método de resolución
    method: {
        type: String,
        enum: {
            values: ['automatic_payment', 'manual_payment', 'wallet_deduction', 'next_booking', 'waived'],
            message: 'Método de resolución inválido'
        },
        default: null
    },
    
    // Fecha de resolución
    resolvedAt: {
        type: Date,
        default: null
    },
    
    // Usuario que resolvió (si fue manual)
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Monto realmente pagado
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Referencia de transacción
    transactionId: {
        type: String,
        trim: true,
        default: null
    },
    
    // Notas de resolución
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    
    // Si fue disputada
    dispute: {
        disputed: {
            type: Boolean,
            default: false
        },
        reason: String,
        disputedAt: Date,
        evidence: [String],
        adminResponse: String,
        adminDecision: {
            type: String,
            enum: ['upheld', 'reduced', 'dismissed'],
            default: null
        },
        decidedAt: Date
    }
}, {
    _id: false
});

/**
 * Schema para impacto en el perfil
 */
const ProfileImpactSchema = new mongoose.Schema({
    // Cambio en el rating
    ratingImpact: {
        type: Number,
        default: 0,
        min: -1.0,
        max: 0
    },
    
    // Cambio en la posición de búsqueda
    searchRankingImpact: {
        type: Number,
        default: 0,
        min: -100,
        max: 0
    },
    
    // Días de suspensión (si aplica)
    suspensionDays: {
        type: Number,
        default: 0,
        min: 0,
        max: 365
    },
    
    // Fecha de inicio de suspensión
    suspensionStartDate: {
        type: Date,
        default: null
    },
    
    // Fecha de fin de suspensión
    suspensionEndDate: {
        type: Date,
        default: null
    },
    
    // Restricciones aplicadas
    restrictions: {
        canAcceptBookings: {
            type: Boolean,
            default: true
        },
        canAcceptImmediate: {
            type: Boolean,
            default: true
        },
        maxDailyBookings: {
            type: Number,
            default: null,
            min: 0
        },
        requiresManualApproval: {
            type: Boolean,
            default: false
        }
    },
    
    // Fecha de remoción del impacto
    impactRemovedAt: {
        type: Date,
        default: null
    }
}, {
    _id: false
});

/**
 * Schema principal de Penalización
 */
const PenaltySchema = new mongoose.Schema({
    // Usuario penalizado
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El ID del usuario es requerido'],
        index: true
    },
    
    // Tipo de penalización
    type: {
        type: String,
        enum: {
            values: [
                'no_show_client',           // Cliente no se presentó
                'no_show_barber',           // Barbero no se presentó
                'late_cancellation_client', // Cliente canceló tarde
                'late_cancellation_barber', // Barbero canceló tarde
                'rejection_abuse',          // Barbero rechaza demasiado
                'poor_service',             // Servicio de mala calidad
                'inappropriate_behavior',   // Comportamiento inapropiado
                'fake_profile',             // Perfil falso o engañoso
                'spam_reviews',             // Reseñas spam
                'payment_fraud',            // Fraude en pagos
                'repeated_violations',      // Violaciones repetidas
                'system_abuse'              // Abuso del sistema
            ],
            message: 'Tipo de penalización inválido'
        },
        required: [true, 'El tipo de penalización es requerido'],
        index: true
    },
    
    // Subtipo específico
    subtype: {
        type: String,
        trim: true,
        maxlength: [100, 'El subtipo no puede exceder 100 caracteres']
    },
    
    // Reserva relacionada (si aplica)
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        default: null,
        index: true
    },
    
    // Gravedad de la penalización
    severity: {
        type: String,
        enum: {
            values: ['minor', 'moderate', 'major', 'critical'],
            message: 'La gravedad debe ser: minor, moderate, major o critical'
        },
        required: [true, 'La gravedad es requerida'],
        index: true
    },
    
    // Detalles específicos de la penalización
    details: {
        type: PenaltyDetailsSchema,
        required: true
    },
    
    // Cálculo del monto
    calculation: {
        type: CalculationSchema,
        required: true
    },
    
    // Resolución de la penalización
    resolution: {
        type: ResolutionSchema,
        default: () => ({})
    },
    
    // Impacto en el perfil
    profileImpact: {
        type: ProfileImpactSchema,
        default: () => ({})
    },
    
    // Estado actual de la penalización
    status: {
        type: String,
        enum: {
            values: ['active', 'resolved', 'disputed', 'expired', 'waived'],
            message: 'Estado de penalización inválido'
        },
        default: 'active',
        required: true,
        index: true
    },
    
    // Fecha de expiración (si aplica)
    expiresAt: {
        type: Date,
        default: function() {
            // Las penalizaciones expiran después de 6 meses si no se resuelven
            return new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);
        },
        index: { expireAfterSeconds: 0 }
    },
    
    // Usuario que creó la penalización
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El creador es requerido']
    },
    
    // Rol del creador
    createdByRole: {
        type: String,
        enum: ['system', 'admin', 'moderator', 'automatic'],
        required: [true, 'El rol del creador es requerido']
    },
    
    // Si fue generada automáticamente
    isAutomatic: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Número de serie para el usuario (secuencial)
    sequenceNumber: {
        type: Number,
        required: true,
        min: 1
    },
    
    // Penalizaciones relacionadas
    relatedPenalties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Penalty'
    }],
    
    // Historial de cambios
    history: [{
        action: {
            type: String,
            enum: ['created', 'modified', 'resolved', 'disputed', 'waived', 'expired'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        details: String,
        previousState: mongoose.Schema.Types.Mixed,
        newState: mongoose.Schema.Types.Mixed
    }],
    
    // Notificaciones enviadas
    notifications: [{
        type: {
            type: String,
            enum: ['email', 'sms', 'push', 'in_app'],
            required: true
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        content: String,
        delivered: {
            type: Boolean,
            default: false
        }
    }],
    
    // Metadata adicional
    metadata: {
        deviceInfo: {
            ip: String,
            userAgent: String,
            device: String
        },
        location: {
            city: String,
            country: String,
            coordinates: [Number]
        },
        systemVersion: String,
        apiVersion: String
    }
}, {
    timestamps: true,
    versionKey: false,
    
    // Configuración del toJSON
    toJSON: {
        transform: function(doc, ret) {
            // Ocultar información sensible
            if (ret.metadata && ret.metadata.deviceInfo) {
                delete ret.metadata.deviceInfo.ip;
                delete ret.metadata.deviceInfo.userAgent;
            }
            return ret;
        }
    }
});

// ==========================================
// ÍNDICES PARA OPTIMIZACIÓN
// ==========================================

// Índices compuestos para consultas frecuentes
PenaltySchema.index({ userId: 1, status: 1 });
PenaltySchema.index({ type: 1, severity: 1 });
PenaltySchema.index({ bookingId: 1 });
PenaltySchema.index({ createdAt: -1 });
PenaltySchema.index({ expiresAt: 1 });

// Índice único para secuencia por usuario
PenaltySchema.index({ userId: 1, sequenceNumber: 1 }, { unique: true });

// Índices por estado y tipo para reportes
PenaltySchema.index({ status: 1, type: 1 });
PenaltySchema.index({ severity: 1, createdAt: -1 });
PenaltySchema.index({ isAutomatic: 1, createdAt: -1 });

// ==========================================
// MIDDLEWARE PRE-SAVE
// ==========================================

// Generar número de secuencia automáticamente
PenaltySchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const lastPenalty = await this.constructor
                .findOne({ userId: this.userId })
                .sort({ sequenceNumber: -1 });
            
            this.sequenceNumber = lastPenalty ? lastPenalty.sequenceNumber + 1 : 1;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Registrar cambios en el historial
PenaltySchema.pre('save', function(next) {
    if (!this.isNew && this.isModified()) {
        const previousState = this._original || {};
        const newState = this.toObject();
        
        this.history.push({
            action: 'modified',
            timestamp: new Date(),
            performedBy: this._modifiedBy || null,
            details: this._modificationReason || 'Cambio en la penalización',
            previousState: previousState,
            newState: newState
        });
    }
    next();
});

// Aplicar impacto en el perfil automáticamente
PenaltySchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('severity')) {
        try {
            await this.applyProfileImpact();
        } catch (error) {
            console.error('Error al aplicar impacto en perfil:', error);
        }
    }
    next();
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Calcular el monto de la penalización
 * @param {Object} factors - Factores adicionales para el cálculo
 * @returns {Object} - Cálculo detallado
 */
PenaltySchema.methods.calculateAmount = function(factors = {}) {
    const baseAmounts = {
        minor: 2000,     // $2.000 CLP
        moderate: 5000,  // $5.000 CLP
        major: 10000,    // $10.000 CLP
        critical: 20000  // $20.000 CLP
    };
    
    const baseAmount = baseAmounts[this.severity] || 0;
    
    // Aplicar multiplicadores
    let multiplier = 1.0;
    
    // Multiplicador por reincidencia
    if (this.details.isRepeatOffense) {
        multiplier *= 1.5;
    }
    
    // Multiplicador por número de ofensas recientes
    if (this.details.recentSimilarOffenses > 0) {
        multiplier *= (1 + (this.details.recentSimilarOffenses * 0.2));
    }
    
    // Multiplicador por impacto al cliente
    const impactMultipliers = {
        low: 0.8,
        medium: 1.0,
        high: 1.3,
        critical: 1.5
    };
    multiplier *= impactMultipliers[this.details.clientImpact] || 1.0;
    
    // Multiplicador por horario (horarios peak)
    if (factors.isPeakTime) {
        multiplier *= 1.2;
    }
    
    // Aplicar descuentos
    let discount = 0;
    
    // Descuento por primera vez
    if (this.sequenceNumber === 1) {
        discount += 0.3; // 30% de descuento
    }
    
    // Descuento por buen historial
    if (factors.goodHistoryScore && factors.goodHistoryScore > 4.5) {
        discount += 0.2; // 20% de descuento
    }
    
    // Calcular monto final
    const finalAmount = Math.round(baseAmount * multiplier * (1 - discount));
    
    this.calculation = {
        baseAmount: baseAmount,
        multipliers: {
            repeatOffense: this.details.isRepeatOffense ? 1.5 : 1.0,
            severity: 1.0,
            impact: impactMultipliers[this.details.clientImpact] || 1.0,
            timeOfDay: factors.isPeakTime ? 1.2 : 1.0
        },
        discounts: {
            firstTime: this.sequenceNumber === 1 ? 0.3 : 0,
            goodHistory: factors.goodHistoryScore > 4.5 ? 0.2 : 0,
            quickResolution: 0
        },
        finalAmount: finalAmount,
        formula: `${baseAmount} * ${multiplier.toFixed(2)} * (1 - ${discount.toFixed(2)}) = ${finalAmount}`,
        calculatedAt: new Date()
    };
    
    return this.calculation;
};

/**
 * Aplicar impacto en el perfil del usuario
 */
PenaltySchema.methods.applyProfileImpact = async function() {
    const impacts = {
        minor: {
            ratingImpact: -0.1,
            searchRankingImpact: -5,
            suspensionDays: 0
        },
        moderate: {
            ratingImpact: -0.2,
            searchRankingImpact: -15,
            suspensionDays: 1
        },
        major: {
            ratingImpact: -0.3,
            searchRankingImpact: -30,
            suspensionDays: 3
        },
        critical: {
            ratingImpact: -0.5,
            searchRankingImpact: -50,
            suspensionDays: 7
        }
    };
    
    const impact = impacts[this.severity];
    
    if (impact) {
        this.profileImpact.ratingImpact = impact.ratingImpact;
        this.profileImpact.searchRankingImpact = impact.searchRankingImpact;
        this.profileImpact.suspensionDays = impact.suspensionDays;
        
        if (impact.suspensionDays > 0) {
            this.profileImpact.suspensionStartDate = new Date();
            this.profileImpact.suspensionEndDate = new Date(
                Date.now() + impact.suspensionDays * 24 * 60 * 60 * 1000
            );
            
            // Aplicar restricciones durante suspensión
            this.profileImpact.restrictions.canAcceptBookings = false;
            this.profileImpact.restrictions.canAcceptImmediate = false;
        }
    }
    
    // Aplicar cambios al modelo del usuario/barbero
    try {
        const User = mongoose.model('User');
        const user = await User.findById(this.userId);
        
        if (user && user.role === 'barber') {
            const Barber = mongoose.model('Barber');
            const barber = await Barber.findOne({ userId: this.userId });
            
            if (barber) {
                // Aplicar impacto en rating
                barber.stats.rating = Math.max(1, barber.stats.rating + impact.ratingImpact);
                
                // Aplicar suspensión si corresponde
                if (impact.suspensionDays > 0) {
                    barber.penalties.status = 'suspended';
                    barber.penalties.suspendedUntil = this.profileImpact.suspensionEndDate;
                    barber.penalties.count += 1;
                    barber.availability.isAvailable = false;
                }
                
                await barber.save();
            }
        }
    } catch (error) {
        console.error('Error al aplicar impacto en perfil:', error);
    }
};

/**
 * Resolver penalización
 * @param {string} method - Método de resolución
 * @param {number} paidAmount - Monto pagado
 * @param {ObjectId} resolvedBy - Usuario que resuelve
 * @param {string} notes - Notas de resolución
 */
PenaltySchema.methods.resolve = function(method, paidAmount, resolvedBy, notes = '') {
    this.resolution.status = 'paid';
    this.resolution.method = method;
    this.resolution.paidAmount = paidAmount;
    this.resolution.resolvedBy = resolvedBy;
    this.resolution.resolvedAt = new Date();
    this.resolution.notes = notes;
    
    this.status = 'resolved';
    
    // Agregar al historial
    this.history.push({
        action: 'resolved',
        timestamp: new Date(),
        performedBy: resolvedBy,
        details: `Penalización resuelta por ${method}. Monto pagado: $${paidAmount}`,
        newState: { status: 'resolved', paidAmount: paidAmount }
    });
};

/**
 * Disputar penalización
 * @param {string} reason - Motivo de la disputa
 * @param {Array} evidence - Evidencia de la disputa
 */
PenaltySchema.methods.dispute = function(reason, evidence = []) {
    this.resolution.dispute.disputed = true;
    this.resolution.dispute.reason = reason;
    this.resolution.dispute.disputedAt = new Date();
    this.resolution.dispute.evidence = evidence;
    
    this.resolution.status = 'disputed';
    this.status = 'disputed';
    
    // Agregar al historial
    this.history.push({
        action: 'disputed',
        timestamp: new Date(),
        performedBy: this.userId,
        details: `Penalización disputada: ${reason}`,
        newState: { status: 'disputed' }
    });
};

/**
 * Exonerar penalización
 * @param {ObjectId} waivedBy - Usuario que exonera
 * @param {string} reason - Motivo de exoneración
 */
PenaltySchema.methods.waive = function(waivedBy, reason = '') {
    this.resolution.status = 'waived';
    this.resolution.resolvedBy = waivedBy;
    this.resolution.resolvedAt = new Date();
    this.resolution.notes = `Penalización exonerada: ${reason}`;
    
    this.status = 'waived';
    
    // Revertir impacto en perfil
    this.profileImpact.impactRemovedAt = new Date();
    
    // Agregar al historial
    this.history.push({
        action: 'waived',
        timestamp: new Date(),
        performedBy: waivedBy,
        details: `Penalización exonerada: ${reason}`,
        newState: { status: 'waived' }
    });
};

/**
 * Verificar si la penalización está activa
 * @returns {boolean} - True si está activa
 */
PenaltySchema.methods.isActive = function() {
    return this.status === 'active' && new Date() < this.expiresAt;
};

/**
 * Obtener resumen de la penalización
 * @returns {Object} - Resumen
 */
PenaltySchema.methods.getSummary = function() {
    return {
        id: this._id,
        type: this.type,
        severity: this.severity,
        amount: this.calculation.finalAmount,
        status: this.status,
        createdAt: this.createdAt,
        expiresAt: this.expiresAt,
        isActive: this.isActive(),
        sequenceNumber: this.sequenceNumber,
        daysUntilExpiration: Math.ceil((this.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
    };
};

// ==========================================
// MÉTODOS ESTÁTICOS
// ==========================================

/**
 * Buscar penalizaciones por usuario
 * @param {ObjectId} userId - ID del usuario
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Penalizaciones del usuario
 */
PenaltySchema.statics.findByUser = async function(userId, filters = {}) {
    try {
        const query = { userId };
        
        if (filters.status) {
            query.status = Array.isArray(filters.status) ? 
                { $in: filters.status } : filters.status;
        }
        
        if (filters.type) {
            query.type = filters.type;
        }
        
        if (filters.severity) {
            query.severity = filters.severity;
        }
        
        if (filters.fromDate) {
            query.createdAt = { $gte: new Date(filters.fromDate) };
        }
        
        if (filters.toDate) {
            query.createdAt = { 
                ...query.createdAt, 
                $lte: new Date(filters.toDate) 
            };
        }
        
        return await this.find(query)
            .populate('bookingId', 'bookingNumber scheduledFor')
            .populate('createdBy', 'profile.firstName profile.lastName')
            .sort({ createdAt: -1 });
            
    } catch (error) {
        console.error('Error al buscar penalizaciones por usuario:', error);
        return [];
    }
};

/**
 * Obtener penalizaciones activas por usuario
 * @param {ObjectId} userId - ID del usuario
 * @returns {Promise<Array>} - Penalizaciones activas
 */
PenaltySchema.statics.getActivePenalties = async function(userId) {
    try {
        return await this.find({
            userId: userId,
            status: 'active',
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
    } catch (error) {
        console.error('Error al obtener penalizaciones activas:', error);
        return [];
    }
};

/**
 * Crear penalización automática
 * @param {Object} penaltyData - Datos de la penalización
 * @returns {Promise<Penalty>} - Penalización creada
 */
PenaltySchema.statics.createAutomatic = async function(penaltyData) {
    try {
        const penalty = new this({
            ...penaltyData,
            isAutomatic: true,
            createdBy: null,
            createdByRole: 'automatic'
        });
        
        // Calcular monto automáticamente
        penalty.calculateAmount(penaltyData.factors || {});
        
        await penalty.save();
        
        console.log(`🚫 Penalización automática creada: ${penalty.type} para usuario ${penalty.userId}`);
        return penalty;
        
    } catch (error) {
        console.error('Error al crear penalización automática:', error);
        throw error;
    }
};

/**
 * Expirar penalizaciones automáticamente
 * @returns {Promise<number>} - Número de penalizaciones expiradas
 */
PenaltySchema.statics.expireOldPenalties = async function() {
    try {
        const result = await this.updateMany(
            {
                status: 'active',
                expiresAt: { $lte: new Date() }
            },
            {
                $set: { status: 'expired' },
                $push: {
                    history: {
                        action: 'expired',
                        timestamp: new Date(),
                        performedBy: null,
                        details: 'Penalización expirada automáticamente'
                    }
                }
            }
        );
        
        console.log(`⏰ ${result.modifiedCount} penalizaciones expiradas automáticamente`);
        return result.modifiedCount;
        
    } catch (error) {
        console.error('Error al expirar penalizaciones:', error);
        return 0;
    }
};

/**
 * Obtener estadísticas de penalizaciones
 * @param {Object} filters - Filtros para las estadísticas
 * @returns {Promise<Object>} - Estadísticas de penalizaciones
 */
PenaltySchema.statics.getPenaltyStats = async function(filters = {}) {
    try {
        const matchStage = {};
        
        if (filters.userId) {
            matchStage.userId = new mongoose.Types.ObjectId(filters.userId);
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
                    totalPenalties: { $sum: 1 },
                    activePenalties: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    resolvedPenalties: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                    },
                    disputedPenalties: {
                        $sum: { $cond: [{ $eq: ['$status', 'disputed'] }, 1, 0] }
                    },
                    waivedPenalties: {
                        $sum: { $cond: [{ $eq: ['$status', 'waived'] }, 1, 0] }
                    },
                    automaticPenalties: {
                        $sum: { $cond: ['$isAutomatic', 1, 0] }
                    },
                    totalAmount: { $sum: '$calculation.finalAmount' },
                    paidAmount: { $sum: '$resolution.paidAmount' },
                    byType: {
                        $push: '$type'
                    },
                    bySeverity: {
                        $push: '$severity'
                    },
                    averageAmount: { $avg: '$calculation.finalAmount' }
                }
            }
        ]);
        
        const result = stats[0] || {};
        
        // Procesar distribución por tipo y severidad
        if (result.byType) {
            const typeDistribution = {};
            result.byType.forEach(type => {
                typeDistribution[type] = (typeDistribution[type] || 0) + 1;
            });
            result.typeDistribution = typeDistribution;
            delete result.byType;
        }
        
        if (result.bySeverity) {
            const severityDistribution = {};
            result.bySeverity.forEach(severity => {
                severityDistribution[severity] = (severityDistribution[severity] || 0) + 1;
            });
            result.severityDistribution = severityDistribution;
            delete result.bySeverity;
        }
        
        // Calcular tasas
        if (result.totalPenalties > 0) {
            result.resolutionRate = ((result.resolvedPenalties / result.totalPenalties) * 100).toFixed(2);
            result.disputeRate = ((result.disputedPenalties / result.totalPenalties) * 100).toFixed(2);
            result.waiveRate = ((result.waivedPenalties / result.totalPenalties) * 100).toFixed(2);
            result.automationRate = ((result.automaticPenalties / result.totalPenalties) * 100).toFixed(2);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error al obtener estadísticas de penalizaciones:', error);
        return {};
    }
};

/**
 * Encontrar usuarios con penalizaciones frecuentes
 * @param {number} threshold - Número mínimo de penalizaciones
 * @param {number} days - Período en días
 * @returns {Promise<Array>} - Usuarios con penalizaciones frecuentes
 */
PenaltySchema.statics.findFrequentOffenders = async function(threshold = 3, days = 30) {
    try {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const offenders = await this.aggregate([
            {
                $match: {
                    createdAt: { $gte: cutoffDate },
                    status: { $in: ['active', 'resolved'] }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    penaltyCount: { $sum: 1 },
                    totalAmount: { $sum: '$calculation.finalAmount' },
                    severityBreakdown: {
                        $push: '$severity'
                    },
                    typeBreakdown: {
                        $push: '$type'
                    },
                    latestPenalty: { $max: '$createdAt' }
                }
            },
            {
                $match: {
                    penaltyCount: { $gte: threshold }
                }
            },
            {
                $sort: { penaltyCount: -1, totalAmount: -1 }
            }
        ]);
        
        // Poblar información del usuario
        await this.populate(offenders, {
            path: '_id',
            select: 'profile.firstName profile.lastName email role'
        });
        
        return offenders;
        
    } catch (error) {
        console.error('Error al encontrar infractores frecuentes:', error);
        return [];
    }
};

/**
 * Generar reporte de penalizaciones por período
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @returns {Promise<Object>} - Reporte detallado
 */
PenaltySchema.statics.generateReport = async function(startDate, endDate) {
    try {
        const report = {
            period: {
                start: startDate,
                end: endDate,
                days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
            },
            summary: {},
            trends: {},
            topOffenders: [],
            recommendations: []
        };
        
        // Estadísticas generales
        report.summary = await this.getPenaltyStats({
            fromDate: startDate,
            toDate: endDate
        });
        
        // Tendencias diarias
        const dailyTrends = await this.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    amount: { $sum: '$calculation.finalAmount' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);
        
        report.trends.daily = dailyTrends;
        
        // Top infractores
        report.topOffenders = await this.findFrequentOffenders(2, report.period.days);
        
        // Recomendaciones automáticas
        if (report.summary.disputeRate > 20) {
            report.recommendations.push('Alto índice de disputas - revisar criterios de penalización');
        }
        
        if (report.summary.automationRate < 50) {
            report.recommendations.push('Baja automatización - considerar más reglas automáticas');
        }
        
        if (report.topOffenders.length > 10) {
            report.recommendations.push('Muchos infractores frecuentes - revisar políticas de suspensión');
        }
        
        return report;
        
    } catch (error) {
        console.error('Error al generar reporte de penalizaciones:', error);
        return null;
    }
};

/**
 * Procesar penalizaciones pendientes de pago
 * @returns {Promise<number>} - Número de penalizaciones procesadas
 */
PenaltySchema.statics.processOutstandingPayments = async function() {
    try {
        const outstandingPenalties = await this.find({
            status: 'active',
            'resolution.status': 'pending',
            createdAt: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Más de 7 días
        });
        
        let processedCount = 0;
        
        for (const penalty of outstandingPenalties) {
            try {
                // Intentar cobro automático desde wallet o método de pago
                const success = await this.attemptAutomaticPayment(penalty);
                
                if (success) {
                    penalty.resolve('automatic_payment', penalty.calculation.finalAmount, null, 'Pago automático procesado');
                    await penalty.save();
                    processedCount++;
                } else {
                    // Escalar penalización si no se puede cobrar
                    await this.escalatePenalty(penalty);
                }
                
            } catch (error) {
                console.error(`Error al procesar penalización ${penalty._id}:`, error);
            }
        }
        
        console.log(`💳 ${processedCount} penalizaciones procesadas automáticamente`);
        return processedCount;
        
    } catch (error) {
        console.error('Error al procesar pagos pendientes:', error);
        return 0;
    }
};

/**
 * Intentar pago automático de penalización
 * @param {Penalty} penalty - Penalización a procesar
 * @returns {Promise<boolean>} - True si el pago fue exitoso
 */
PenaltySchema.statics.attemptAutomaticPayment = async function(penalty) {
    // Placeholder para integración con sistema de pagos
    // En implementación real, aquí se integraría con Transbank, Flow, etc.
    
    try {
        // Simular intento de pago
        const paymentSuccess = Math.random() > 0.3; // 70% de éxito simulado
        
        if (paymentSuccess) {
            console.log(`💳 Pago automático exitoso para penalización ${penalty._id}`);
            return true;
        } else {
            console.log(`❌ Pago automático falló para penalización ${penalty._id}`);
            return false;
        }
        
    } catch (error) {
        console.error('Error en pago automático:', error);
        return false;
    }
};

/**
 * Escalar penalización no pagada
 * @param {Penalty} penalty - Penalización a escalar
 */
PenaltySchema.statics.escalatePenalty = async function(penalty) {
    // Aumentar severidad y crear nueva penalización
    const newSeverity = this.getNextSeverityLevel(penalty.severity);
    
    if (newSeverity) {
        const escalatedPenalty = new this({
            userId: penalty.userId,
            type: 'repeated_violations',
            subtype: `escalated_from_${penalty.type}`,
            severity: newSeverity,
            details: {
                description: `Penalización escalada por falta de pago de ${penalty._id}`,
                isRepeatOffense: true,
                recentSimilarOffenses: penalty.details.recentSimilarOffenses + 1,
                clientImpact: 'high'
            },
            createdBy: null,
            createdByRole: 'automatic',
            isAutomatic: true,
            relatedPenalties: [penalty._id]
        });
        
        escalatedPenalty.calculateAmount({ isPeakTime: false });
        await escalatedPenalty.save();
        
        console.log(`⬆️ Penalización escalada: ${penalty._id} → ${escalatedPenalty._id}`);
    }
};

/**
 * Obtener siguiente nivel de severidad
 * @param {string} currentSeverity - Severidad actual
 * @returns {string|null} - Siguiente nivel o null si ya es máximo
 */
PenaltySchema.statics.getNextSeverityLevel = function(currentSeverity) {
    const levels = ['minor', 'moderate', 'major', 'critical'];
    const currentIndex = levels.indexOf(currentSeverity);
    
    if (currentIndex < levels.length - 1) {
        return levels[currentIndex + 1];
    }
    
    return null; // Ya es crítico
};

// ==========================================
// MIDDLEWARE POST-SAVE
// ==========================================

// Enviar notificación después de crear penalización
PenaltySchema.post('save', async function(doc, next) {
    if (doc.isNew) {
        try {
            await this.sendPenaltyNotification(doc);
        } catch (error) {
            console.error('Error al enviar notificación de penalización:', error);
        }
    }
    next();
});

// ==========================================
// MÉTODOS AUXILIARES
// ==========================================

/**
 * Enviar notificación de penalización
 * @param {Penalty} penalty - Penalización creada
 */
PenaltySchema.statics.sendPenaltyNotification = async function(penalty) {
    try {
        const User = mongoose.model('User');
        const user = await User.findById(penalty.userId);
        
        if (!user) return;
        
        const notificationContent = this.generateNotificationContent(penalty, user);
        
        // Enviar notificación in-app
        penalty.notifications.push({
            type: 'in_app',
            content: notificationContent.inApp,
            delivered: true
        });
        
        // Enviar email si está habilitado
        if (config.NOTIFICATION_CONFIG.email.enabled) {
            penalty.notifications.push({
                type: 'email',
                content: notificationContent.email,
                delivered: false // Se marca como true cuando se envía realmente
            });
        }
        
        await penalty.save();
        
        console.log(`📱 Notificación de penalización enviada a usuario ${user.email}`);
        
    } catch (error) {
        console.error('Error al enviar notificación:', error);
    }
};

/**
 * Generar contenido de notificación
 * @param {Penalty} penalty - Penalización
 * @param {User} user - Usuario
 * @returns {Object} - Contenido de notificaciones
 */
PenaltySchema.statics.generateNotificationContent = function(penalty, user) {
    const penaltyTypes = {
        no_show_client: 'No te presentaste a tu cita',
        no_show_barber: 'No te presentaste a la cita programada',
        late_cancellation_client: 'Cancelaste tu cita muy tarde',
        late_cancellation_barber: 'Cancelaste la cita muy tarde',
        rejection_abuse: 'Has rechazado demasiadas solicitudes',
        poor_service: 'Servicio de calidad deficiente reportado'
    };
    
    const severityText = {
        minor: 'leve',
        moderate: 'moderada',
        major: 'grave',
        critical: 'crítica'
    };
    
    const typeName = penaltyTypes[penalty.type] || penalty.type;
    const severityName = severityText[penalty.severity] || penalty.severity;
    
    return {
        inApp: `Penalización ${severityName}: ${typeName}. Monto: ${penalty.calculation.finalAmount.toLocaleString('es-CL')}. Tienes 7 días para pagar o disputar.`,
        
        email: `
Estimado/a ${user.profile.firstName},

Has recibido una penalización en Córtate.cl:

Motivo: ${typeName}
Severidad: ${severityName}
Monto: ${penalty.calculation.finalAmount.toLocaleString('es-CL')}
Fecha límite de pago: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CL')}

Detalles: ${penalty.details.description}

Puedes pagar o disputar esta penalización desde tu perfil en la aplicación.

Si consideras que esta penalización es injusta, puedes disputarla proporcionando evidencia que respalde tu caso.

Saludos,
Equipo Córtate.cl
        `
    };
};

// Crear el modelo
const Penalty = mongoose.model('Penalty', PenaltySchema);

module.exports = Penalty;
