const mongoose = require('mongoose');
const config = require('../config/config');

/**
 * Schema para fotos de la reseña
 */
const ReviewPhotoSchema = new mongoose.Schema({
    // URL de la imagen
    url: {
        type: String,
        required: [true, 'La URL de la foto es requerida'],
        validate: {
            validator: function(v) {
                return /^(https?:\/\/)|(\/uploads\/)/.test(v);
            },
            message: 'La URL de la foto debe ser válida'
        }
    },
    
    // Descripción o caption de la foto
    caption: {
        type: String,
        trim: true,
        maxlength: [200, 'El caption no puede exceder 200 caracteres']
    },
    
    // Orden de la foto en la galería
    order: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Metadata de la imagen
    metadata: {
        originalName: String,
        size: Number, // en bytes
        mimetype: String,
        width: Number,
        height: Number
    },
    
    // Fecha de subida
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
});

/**
 * Schema para respuesta del barbero a la reseña
 */
const BarberResponseSchema = new mongoose.Schema({
    // Respuesta del barbero
    response: {
        type: String,
        required: [true, 'La respuesta es requerida'],
        trim: true,
        minlength: [10, 'La respuesta debe tener al menos 10 caracteres'],
        maxlength: [500, 'La respuesta no puede exceder 500 caracteres']
    },
    
    // Fecha de la respuesta
    respondedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    // Si la respuesta fue editada
    isEdited: {
        type: Boolean,
        default: false
    },
    
    // Fecha de última edición
    lastEditedAt: {
        type: Date,
        default: null
    },
    
    // Historial de ediciones (máximo 5)
    editHistory: [{
        previousResponse: String,
        editedAt: Date,
        reason: String
    }]
}, {
    _id: false
});

/**
 * Schema para información de moderación
 */
const ModerationSchema = new mongoose.Schema({
    // Estado de moderación
    status: {
        type: String,
        enum: {
            values: ['pending', 'approved', 'rejected', 'flagged', 'hidden'],
            message: 'Estado de moderación inválido'
        },
        default: 'approved' // Auto-aprobado por defecto
    },
    
    // Motivo de rechazo o flag
    reason: {
        type: String,
        trim: true,
        maxlength: [300, 'El motivo no puede exceder 300 caracteres']
    },
    
    // Moderador que tomó la acción
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Fecha de moderación
    moderatedAt: {
        type: Date,
        default: null
    },
    
    // Número de reportes recibidos
    reportCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Reportes detallados
    reports: [{
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reason: {
            type: String,
            enum: ['spam', 'offensive', 'fake', 'inappropriate', 'other'],
            required: true
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, 'La descripción no puede exceder 300 caracteres']
        },
        reportedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    _id: false
});

/**
 * Schema para información de eliminación
 */
const DeletionSchema = new mongoose.Schema({
    // Si la reseña fue eliminada
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Usuario que eliminó la reseña
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Rol del usuario que eliminó
    deletedByRole: {
        type: String,
        enum: ['client', 'barber', 'admin', 'system'],
        default: null
    },
    
    // Fecha de eliminación
    deletedAt: {
        type: Date,
        default: null
    },
    
    // Motivo de eliminación
    reason: {
        type: String,
        enum: {
            values: [
                'client_request', 'barber_request', 'admin_action', 
                'inappropriate_content', 'fake_review', 'spam', 
                'violation_terms', 'legal_request', 'other'
            ],
            message: 'Motivo de eliminación inválido'
        },
        default: null
    },
    
    // Descripción detallada del motivo
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    
    // Si se muestra mensaje de eliminación
    showDeletionMessage: {
        type: Boolean,
        default: true
    },
    
    // Mensaje personalizado de eliminación
    deletionMessage: {
        type: String,
        default: 'Comentario de cliente eliminado por peluquero :(',
        trim: true,
        maxlength: [200, 'El mensaje no puede exceder 200 caracteres']
    }
}, {
    _id: false
});

/**
 * Schema para métricas de la reseña
 */
const MetricsSchema = new mongoose.Schema({
    // Número de "me gusta"
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Usuarios que dieron "me gusta"
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Número de veces vista
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Número de veces compartida
    shares: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Si la reseña fue destacada por el barbero
    isFeatured: {
        type: Boolean,
        default: false
    },
    
    // Fecha cuando fue destacada
    featuredAt: {
        type: Date,
        default: null
    },
    
    // Puntuación de utilidad (basada en likes y reportes)
    helpfulnessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    _id: false
});

/**
 * Schema principal de Reseña
 */
const ReviewSchema = new mongoose.Schema({
    // Cliente que hace la reseña
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El ID del cliente es requerido'],
        index: true
    },
    
    // Barbero que recibe la reseña
    barberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Barber',
        required: [true, 'El ID del barbero es requerido'],
        index: true
    },
    
    // Reserva asociada (obligatoria para validar que puede hacer reseña)
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: function() {
            return config.REVIEW_CONFIG.requireBookingToReview;
        },
        index: true,
        validate: {
            validator: async function(bookingId) {
                if (!config.REVIEW_CONFIG.requireBookingToReview) return true;
                if (!bookingId) return false;
                
                const Booking = mongoose.model('Booking');
                const booking = await Booking.findOne({
                    _id: bookingId,
                    clientId: this.clientId,
                    barberId: this.barberId,
                    status: 'completed'
                });
                
                return !!booking;
            },
            message: 'Solo se puede reseñar si se ha completado una reserva con este barbero'
        }
    },
    
    // Calificación (1-5 estrellas)
    rating: {
        type: Number,
        required: [true, 'La calificación es requerida'],
        min: [1, 'La calificación mínima es 1 estrella'],
        max: [5, 'La calificación máxima es 5 estrellas'],
        validate: {
            validator: Number.isInteger,
            message: 'La calificación debe ser un número entero'
        },
        index: true
    },
    
    // Comentario escrito
    comment: {
        type: String,
        required: [true, 'El comentario es requerido'],
        trim: true,
        minlength: [10, 'El comentario debe tener al menos 10 caracteres'],
        maxlength: [config.REVIEW_CONFIG.maxCommentLength, `El comentario no puede exceder ${config.REVIEW_CONFIG.maxCommentLength} caracteres`],
        validate: {
            validator: function(comment) {
                // Validar que no sea solo espacios o caracteres especiales
                return /\w/.test(comment);
            },
            message: 'El comentario debe contener texto válido'
        }
    },
    
    // Fotos de la reseña
    photos: {
        type: [ReviewPhotoSchema],
        validate: {
            validator: function(photos) {
                return photos.length <= config.REVIEW_CONFIG.maxPhotos;
            },
            message: `No se pueden subir más de ${config.REVIEW_CONFIG.maxPhotos} fotos`
        }
    },
    
    // Calificaciones detalladas por aspecto
    aspectRatings: {
        skill: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        punctuality: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        cleanliness: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        friendliness: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        valueForMoney: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        }
    },
    
    // Respuesta del barbero
    barberResponse: {
        type: BarberResponseSchema,
        default: null
    },
    
    // Información de moderación
    moderation: {
        type: ModerationSchema,
        default: () => ({})
    },
    
    // Información de eliminación
    deletion: {
        type: DeletionSchema,
        default: () => ({})
    },
    
    // Métricas de la reseña
    metrics: {
        type: MetricsSchema,
        default: () => ({})
    },
    
    // Información del servicio reseñado
    serviceInfo: {
        type: {
            type: String,
            enum: ['corteHombre', 'corteBarba'],
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        duration: Number,
        location: {
            type: String,
            enum: ['local', 'domicilio'],
            required: true
        }
    },
    
    // Tags automáticos basados en el contenido
    autoTags: [{
        type: String,
        enum: [
            'excelente_servicio', 'muy_profesional', 'puntual', 'recomendado',
            'buena_atencion', 'lugar_limpio', 'buen_precio', 'rapido',
            'mal_servicio', 'impuntual', 'caro', 'sucio'
        ]
    }],
    
    // Si la reseña fue verificada como auténtica
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
    
    // Si es una reseña anónima
    isAnonymous: {
        type: Boolean,
        default: false
    },
    
    // Información de dispositivo/ubicación (para detectar spam)
    deviceInfo: {
        ip: String,
        userAgent: String,
        device: String,
        location: {
            city: String,
            country: String
        }
    },
    
    // Si la reseña fue editada
    isEdited: {
        type: Boolean,
        default: false
    },
    
    // Historial de ediciones
    editHistory: [{
        previousComment: String,
        previousRating: Number,
        editedAt: Date,
        reason: String
    }]
}, {
    timestamps: true,
    versionKey: false,
    
    // Configuración del toJSON
    toJSON: {
        transform: function(doc, ret) {
            // Ocultar información sensible
            if (ret.deviceInfo) {
                delete ret.deviceInfo.ip;
                delete ret.deviceInfo.userAgent;
            }
            
            // Si está eliminada, mostrar solo el mensaje
            if (ret.deletion && ret.deletion.isDeleted) {
                if (ret.deletion.showDeletionMessage) {
                    return {
                        _id: ret._id,
                        isDeleted: true,
                        deletionMessage: ret.deletion.deletionMessage,
                        deletedAt: ret.deletion.deletedAt,
                        rating: ret.rating, // Mantener rating para estadísticas
                        serviceInfo: ret.serviceInfo
                    };
                } else {
                    return null; // No mostrar nada
                }
            }
            
            return ret;
        }
    }
});

// ==========================================
// ÍNDICES PARA OPTIMIZACIÓN
// ==========================================

// Índices compuestos para consultas frecuentes
ReviewSchema.index({ barberId: 1, rating: -1 });
ReviewSchema.index({ clientId: 1, createdAt: -1 });
ReviewSchema.index({ bookingId: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ barberId: 1, 'deletion.isDeleted': 1, 'moderation.status': 1 });

// Índice para búsquedas de texto
ReviewSchema.index({ 
    comment: 'text',
    'barberResponse.response': 'text'
});

// Índices por fechas y estado
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ rating: -1 });
ReviewSchema.index({ 'metrics.isFeatured': 1 });
ReviewSchema.index({ isVerified: 1 });

// Prevenir reseñas duplicadas por booking
ReviewSchema.index({ bookingId: 1 }, { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { bookingId: { $exists: true } }
});

// ==========================================
// MIDDLEWARE PRE-SAVE
// ==========================================

// Generar tags automáticos basados en el contenido
ReviewSchema.pre('save', function(next) {
    if (this.isModified('comment') || this.isNew) {
        this.autoTags = this.generateAutoTags();
    }
    next();
});

// Registrar edición en historial
ReviewSchema.pre('save', function(next) {
    if (this.isModified('comment') || this.isModified('rating')) {
        if (!this.isNew) {
            this.isEdited = true;
            
            // Agregar al historial de ediciones
            if (this.editHistory.length >= 5) {
                this.editHistory.shift(); // Mantener solo las últimas 5 ediciones
            }
            
            this.editHistory.push({
                previousComment: this._original?.comment,
                previousRating: this._original?.rating,
                editedAt: new Date(),
                reason: this._editReason || 'Edición del usuario'
            });
        }
    }
    next();
});

// Validar que no exista reseña duplicada del mismo cliente al mismo barbero
ReviewSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const existingReview = await this.constructor.findOne({
                clientId: this.clientId,
                barberId: this.barberId,
                'deletion.isDeleted': false,
                _id: { $ne: this._id }
            });
            
            if (existingReview && config.REVIEW_CONFIG.requireBookingToReview) {
                return next(new Error('Ya has reseñado a este barbero. Solo puedes hacer una reseña por reserva completada.'));
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Generar tags automáticos basados en el contenido del comentario
 * @returns {Array} - Array de tags generados
 */
ReviewSchema.methods.generateAutoTags = function() {
    const comment = this.comment.toLowerCase();
    const rating = this.rating;
    const tags = [];
    
    // Tags basados en rating
    if (rating >= 5) {
        tags.push('excelente_servicio');
    } else if (rating <= 2) {
        tags.push('mal_servicio');
    }
    
    // Tags basados en palabras clave
    const keywords = {
        'muy_profesional': ['profesional', 'experto', 'habilidoso', 'experimentado'],
        'puntual': ['puntual', 'a tiempo', 'horario', 'llegó temprano'],
        'recomendado': ['recomiendo', 'recomendable', 'volvería', 'excelente'],
        'buena_atencion': ['amable', 'simpático', 'atento', 'cordial', 'agradable'],
        'lugar_limpio': ['limpio', 'higiene', 'pulcro', 'ordenado'],
        'buen_precio': ['barato', 'económico', 'buen precio', 'accesible'],
        'rapido': ['rápido', 'veloz', 'eficiente', 'no se demoró'],
        'impuntual': ['tarde', 'atrasó', 'demoró', 'impuntual'],
        'caro': ['caro', 'costoso', 'excesivo precio'],
        'sucio': ['sucio', 'desaseado', 'desordenado', 'mal olor']
    };
    
    for (const [tag, words] of Object.entries(keywords)) {
        if (words.some(word => comment.includes(word))) {
            tags.push(tag);
        }
    }
    
    return [...new Set(tags)]; // Eliminar duplicados
};

/**
 * Dar "me gusta" a la reseña
 * @param {ObjectId} userId - ID del usuario que da like
 * @returns {boolean} - True si se agregó, false si ya había like
 */
ReviewSchema.methods.toggleLike = function(userId) {
    const index = this.metrics.likedBy.indexOf(userId);
    
    if (index > -1) {
        // Quitar like
        this.metrics.likedBy.splice(index, 1);
        this.metrics.likes = Math.max(0, this.metrics.likes - 1);
        return false;
    } else {
        // Agregar like
        this.metrics.likedBy.push(userId);
        this.metrics.likes += 1;
        return true;
    }
};

/**
 * Incrementar contador de vistas
 */
ReviewSchema.methods.incrementViews = function() {
    this.metrics.views += 1;
    return this.save();
};

/**
 * Incrementar contador de compartidos
 */
ReviewSchema.methods.incrementShares = function() {
    this.metrics.shares += 1;
    return this.save();
};

/**
 * Destacar/no destacar reseña (solo barbero)
 * @param {boolean} featured - Si destacar o no
 */
ReviewSchema.methods.setFeatured = function(featured = true) {
    this.metrics.isFeatured = featured;
    this.metrics.featuredAt = featured ? new Date() : null;
};

/**
 * Eliminar reseña (soft delete)
 * @param {ObjectId} deletedBy - Usuario que elimina
 * @param {string} role - Rol del usuario
 * @param {string} reason - Motivo de eliminación
 * @param {string} customMessage - Mensaje personalizado
 */
ReviewSchema.methods.softDelete = function(deletedBy, role, reason = 'barber_request', customMessage = null) {
    this.deletion.isDeleted = true;
    this.deletion.deletedBy = deletedBy;
    this.deletion.deletedByRole = role;
    this.deletion.deletedAt = new Date();
    this.deletion.reason = reason;
    
    if (customMessage) {
        this.deletion.deletionMessage = customMessage;
    } else if (role === 'barber') {
        this.deletion.deletionMessage = 'Comentario de cliente eliminado por peluquero :(';
    } else if (role === 'admin') {
        this.deletion.deletionMessage = 'Comentario eliminado por moderación';
    }
    
    this.deletion.showDeletionMessage = true;
};

/**
 * Restaurar reseña eliminada
 * @param {ObjectId} restoredBy - Usuario que restaura
 */
ReviewSchema.methods.restore = function(restoredBy) {
    this.deletion.isDeleted = false;
    this.deletion.deletedBy = null;
    this.deletion.deletedByRole = null;
    this.deletion.deletedAt = null;
    this.deletion.showDeletionMessage = false;
    
    // Agregar nota en el historial
    this.timeline = this.timeline || [];
    this.timeline.push({
        action: 'restored',
        by: restoredBy,
        timestamp: new Date(),
        note: 'Reseña restaurada'
    });
};

/**
 * Reportar reseña como inapropiada
 * @param {ObjectId} reporterId - Usuario que reporta
 * @param {string} reason - Motivo del reporte
 * @param {string} description - Descripción detallada
 */
ReviewSchema.methods.addReport = function(reporterId, reason, description = '') {
    // Verificar que no haya reportado antes
    const existingReport = this.moderation.reports.find(
        report => report.reportedBy.toString() === reporterId.toString()
    );
    
    if (existingReport) {
        throw new Error('Ya has reportado esta reseña anteriormente');
    }
    
    this.moderation.reports.push({
        reportedBy: reporterId,
        reason: reason,
        description: description,
        reportedAt: new Date()
    });
    
    this.moderation.reportCount += 1;
    
    // Auto-ocultar si tiene muchos reportes
    if (this.moderation.reportCount >= 5) {
        this.moderation.status = 'flagged';
    }
};

/**
 * Responder reseña (solo barbero)
 * @param {string} response - Respuesta del barbero
 */
ReviewSchema.methods.addBarberResponse = function(response) {
    if (this.barberResponse) {
        // Editar respuesta existente
        this.barberResponse.editHistory = this.barberResponse.editHistory || [];
        
        if (this.barberResponse.editHistory.length >= 5) {
            this.barberResponse.editHistory.shift();
        }
        
        this.barberResponse.editHistory.push({
            previousResponse: this.barberResponse.response,
            editedAt: new Date(),
            reason: 'Edición de respuesta'
        });
        
        this.barberResponse.response = response;
        this.barberResponse.isEdited = true;
        this.barberResponse.lastEditedAt = new Date();
    } else {
        // Nueva respuesta
        this.barberResponse = {
            response: response,
            respondedAt: new Date(),
            isEdited: false
        };
    }
};

/**
 * Calcular puntuación de utilidad
 */
ReviewSchema.methods.calculateHelpfulnessScore = function() {
    const likes = this.metrics.likes || 0;
    const reports = this.moderation.reportCount || 0;
    const views = this.metrics.views || 1;
    
    // Fórmula: (likes - reports) / views * 100, máximo 100
    const score = Math.max(0, Math.min(100, ((likes - reports) / views) * 100));
    this.metrics.helpfulnessScore = Math.round(score);
    
    return this.metrics.helpfulnessScore;
};

// ==========================================
// MÉTODOS ESTÁTICOS
// ==========================================

/**
 * Buscar reseñas por barbero
 * @param {ObjectId} barberId - ID del barbero
 * @param {Object} options - Opciones de búsqueda
 * @returns {Promise<Array>} - Reseñas del barbero
 */
ReviewSchema.statics.findByBarber = async function(barberId, options = {}) {
    try {
        const query = {
            barberId: barberId,
            'deletion.isDeleted': false,
            'moderation.status': { $in: ['approved', 'pending'] }
        };
        
        if (options.rating) {
            query.rating = options.rating;
        }
        
        if (options.minRating) {
            query.rating = { $gte: options.minRating };
        }
        
        if (options.withPhotos) {
            query['photos.0'] = { $exists: true };
        }
        
        if (options.featured) {
            query['metrics.isFeatured'] = true;
        }
        
        const sort = {};
        switch (options.sortBy) {
            case 'newest':
                sort.createdAt = -1;
                break;
            case 'oldest':
                sort.createdAt = 1;
                break;
            case 'rating_high':
                sort.rating = -1;
                break;
            case 'rating_low':
                sort.rating = 1;
                break;
            case 'helpful':
                sort['metrics.helpfulnessScore'] = -1;
                break;
            default:
                sort.createdAt = -1;
        }
        
        return await this.find(query)
            .populate('clientId', 'profile.firstName profile.lastName profile.avatar')
            .sort(sort)
            .limit(options.limit || 50);
            
    } catch (error) {
        console.error('Error al buscar reseñas por barbero:', error);
        return [];
    }
};

/**
 * Obtener estadísticas de reseñas de un barbero
 * @param {ObjectId} barberId - ID del barbero
 * @returns {Promise<Object>} - Estadísticas de reseñas
 */
ReviewSchema.statics.getBarberReviewStats = async function(barberId) {
    try {
        const stats = await this.aggregate([
            {
                $match: {
                    barberId: new mongoose.Types.ObjectId(barberId),
                    'deletion.isDeleted': false,
                    'moderation.status': { $in: ['approved', 'pending'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    ratingDistribution: {
                        $push: '$rating'
                    },
                    totalPhotos: {
                        $sum: { $size: '$photos' }
                    },
                    featuredReviews: {
                        $sum: { $cond: ['$metrics.isFeatured', 1, 0] }
                    },
                    totalLikes: { $sum: '$metrics.likes' },
                    totalViews: { $sum: '$metrics.views' }
                }
            }
        ]);
        
        const result = stats[0] || {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: [],
            totalPhotos: 0,
            featuredReviews: 0,
            totalLikes: 0,
            totalViews: 0
        };
        
        // Calcular distribución de ratings
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        result.ratingDistribution.forEach(rating => {
            distribution[rating] = (distribution[rating] || 0) + 1;
        });
        result.ratingDistribution = distribution;
        
        // Calcular porcentajes
        if (result.totalReviews > 0) {
            result.ratingPercentages = {};
            for (let i = 1; i <= 5; i++) {
                result.ratingPercentages[i] = 
                    Math.round((distribution[i] / result.totalReviews) * 100);
            }
        }
        
        return result;
        
    } catch (error) {
        console.error('Error al obtener estadísticas de reseñas:', error);
        return {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            ratingPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            totalPhotos: 0,
            featuredReviews: 0,
            totalLikes: 0,
            totalViews: 0
        };
    }
};

/**
 * Buscar reseñas que necesitan moderación
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<Array>} - Reseñas para moderar
 */
ReviewSchema.statics.findForModeration = async function(filters = {}) {
    try {
        const query = {
            'moderation.status': 'flagged',
            'moderation.reportCount': { $gte: 3 }
        };
        
        if (filters.reportReason) {
            query['moderation.reports.reason'] = filters.reportReason;
        }
        
        return await this.find(query)
            .populate('clientId', 'profile.firstName profile.lastName')
            .populate('barberId', 'businessName')
            .sort({ 'moderation.reportCount': -1, createdAt: -1 });
            
    } catch (error) {
        console.error('Error al buscar reseñas para moderar:', error);
        return [];
    }
};

/**
 * Buscar reseñas por texto
 * @param {string} searchText - Texto a buscar
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Resultados de búsqueda
 */
ReviewSchema.statics.searchReviews = async function(searchText, filters = {}) {
    try {
        const query = {
            $text: { $search: searchText },
            'deletion.isDeleted': false,
            'moderation.status': { $in: ['approved', 'pending'] }
        };
        
        if (filters.barberId) {
            query.barberId = filters.barberId;
        }
        
        if (filters.minRating) {
            query.rating = { $gte: filters.minRating };
        }
        
        return await this.find(query, { score: { $meta: 'textScore' } })
            .populate('clientId', 'profile.firstName profile.lastName profile.avatar')
            .populate('barberId', 'businessName location')
            .sort({ score: { $meta: 'textScore' }, rating: -1 });
            
    } catch (error) {
        console.error('Error en búsqueda de reseñas:', error);
        return [];
    }
};

/**
 * Obtener reseñas destacadas
 * @param {number} limit - Número de reseñas a obtener
 * @returns {Promise<Array>} - Reseñas destacadas
 */
ReviewSchema.statics.getFeaturedReviews = async function(limit = 10) {
    try {
        return await this.find({
            'metrics.isFeatured': true,
            'deletion.isDeleted': false,
            'moderation.status': 'approved',
            rating: { $gte: 4 }
        })
        .populate('clientId', 'profile.firstName profile.lastName profile.avatar')
        .populate('barberId', 'businessName location')
        .sort({ 'metrics.helpfulnessScore': -1, 'metrics.likes': -1 })
        .limit(limit);
        
    } catch (error) {
        console.error('Error al obtener reseñas destacadas:', error);
        return [];
    }
};

/**
 * Obtener estadísticas generales del sistema de reseñas
 * @returns {Promise<Object>} - Estadísticas generales
 */
ReviewSchema.statics.getGeneralStats = async function() {
    try {
        const stats = await this.aggregate([
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    activeReviews: {
                        $sum: { $cond: [{ $eq: ['$deletion.isDeleted', false] }, 1, 0] }
                    },
                    deletedReviews: {
                        $sum: { $cond: ['$deletion.isDeleted', 1, 0] }
                    },
                    flaggedReviews: {
                        $sum: { $cond: [{ $eq: ['$moderation.status', 'flagged'] }, 1, 0] }
                    },
                    averageRating: { $avg: '$rating' },
                    totalPhotos: {
                        $sum: { $size: '$photos' }
                    },
                    totalLikes: { $sum: '$metrics.likes' },
                    reviewsWithResponse: {
                        $sum: { $cond: [{ $ne: ['$barberResponse', null] }, 1, 0] }
                    },
                    featuredReviews: {
                        $sum: { $cond: ['$metrics.isFeatured', 1, 0] }
                    }
                }
            }
        ]);
        
        const result = stats[0] || {};
        
        // Calcular tasas
        if (result.totalReviews > 0) {
            result.deletionRate = ((result.deletedReviews / result.totalReviews) * 100).toFixed(2);
            result.responseRate = ((result.reviewsWithResponse / result.activeReviews) * 100).toFixed(2);
            result.moderationRate = ((result.flaggedReviews / result.totalReviews) * 100).toFixed(2);
        }
        
        return result;
        
    } catch (error) {
        console.error('Error al obtener estadísticas generales:', error);
        return {};
    }
};

/**
 * Limpiar reseñas spam automáticamente
 * @returns {Promise<number>} - Número de reseñas limpiadas
 */
ReviewSchema.statics.cleanSpamReviews = async function() {
    try {
        // Buscar reseñas potencialmente spam
        const spamReviews = await this.find({
            'deletion.isDeleted': false,
            $or: [
                { 'moderation.reportCount': { $gte: 10 } },
                { 
                    comment: { 
                        $regex: /(spam|fake|bot|promoción)/i 
                    }
                },
                {
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                    deviceInfo: { $exists: true }
                }
            ]
        });
        
        let cleanedCount = 0;
        
        for (const review of spamReviews) {
            // Verificar patrones de spam adicionales
            if (this.isSpamReview(review)) {
                review.softDelete(
                    null, 
                    'system', 
                    'spam', 
                    'Comentario eliminado automáticamente por detección de spam'
                );
                await review.save();
                cleanedCount++;
            }
        }
        
        console.log(`🧹 ${cleanedCount} reseñas spam limpiadas automáticamente`);
        return cleanedCount;
        
    } catch (error) {
        console.error('Error al limpiar spam:', error);
        return 0;
    }
};

/**
 * Verificar si una reseña es spam
 * @param {Object} review - Reseña a verificar
 * @returns {boolean} - True si es spam
 */
ReviewSchema.statics.isSpamReview = function(review) {
    // Verificar patrones comunes de spam
    const spamPatterns = [
        /(.)\1{4,}/, // Caracteres repetidos
        /^.{1,10}$/, // Demasiado corto
        /(http|www|\.com|\.cl)/i, // URLs
        /whatsapp|telefono|contacto/i, // Información de contacto
        /promoción|descuento|oferta/i // Promociones
    ];
    
    const comment = review.comment.toLowerCase();
    
    for (const pattern of spamPatterns) {
        if (pattern.test(comment)) {
            return true;
        }
    }
    
    // Verificar si tiene demasiados reportes
    if (review.moderation.reportCount >= 5) {
        return true;
    }
    
    return false;
};

/**
 * Actualizar puntuaciones de utilidad en lote
 * @returns {Promise<number>} - Número de reseñas actualizadas
 */
ReviewSchema.statics.updateHelpfulnessScores = async function() {
    try {
        const reviews = await this.find({
            'deletion.isDeleted': false,
            'moderation.status': 'approved'
        });
        
        let updatedCount = 0;
        
        for (const review of reviews) {
            const oldScore = review.metrics.helpfulnessScore;
            const newScore = review.calculateHelpfulnessScore();
            
            if (oldScore !== newScore) {
                await review.save();
                updatedCount++;
            }
        }
        
        console.log(`📊 ${updatedCount} puntuaciones de utilidad actualizadas`);
        return updatedCount;
        
    } catch (error) {
        console.error('Error al actualizar puntuaciones:', error);
        return 0;
    }
};

// ==========================================
// MIDDLEWARE POST-SAVE
// ==========================================

// Actualizar estadísticas del barbero después de nueva reseña
ReviewSchema.post('save', async function(doc, next) {
    try {
        if (doc.isNew && !doc.deletion.isDeleted) {
            const Barber = mongoose.model('Barber');
            const barber = await Barber.findById(doc.barberId);
            
            if (barber) {
                // Actualizar rating promedio
                barber.updateRating(doc.rating);
                await barber.save();
            }
        }
    } catch (error) {
        console.error('Error al actualizar estadísticas del barbero:', error);
    }
    
    next();
});

// Actualizar puntuación de utilidad al cambiar likes
ReviewSchema.post('save', function(doc, next) {
    if (doc.isModified('metrics.likes') || doc.isModified('moderation.reportCount')) {
        doc.calculateHelpfulnessScore();
    }
    next();
});

// ==========================================
// HOOKS Y TRIGGERS
// ==========================================

// Trigger para detectar contenido inapropiado automáticamente
ReviewSchema.pre('save', function(next) {
    if (this.isModified('comment') || this.isNew) {
        const inappropriateWords = [
            'idiota', 'estupido', 'basura', 'horrible', 'pesimo',
            'ladron', 'estafa', 'robo', 'malo', 'terrible'
        ];
        
        const comment = this.comment.toLowerCase();
        const hasInappropriateContent = inappropriateWords.some(word => 
            comment.includes(word)
        );
        
        if (hasInappropriateContent) {
            this.moderation.status = 'flagged';
            this.moderation.reason = 'Contenido potencialmente inapropiado detectado automáticamente';
        }
    }
    
    next();
});

// ==========================================
// MÉTODOS VIRTUALES
// ==========================================

// Virtual para obtener el nombre del cliente (si no es anónimo)
ReviewSchema.virtual('clientName').get(function() {
    if (this.isAnonymous || !this.populated('clientId')) {
        return 'Cliente anónimo';
    }
    
    const client = this.clientId;
    return `${client.profile.firstName} ${client.profile.lastName}`;
});

// Virtual para obtener fecha formateada
ReviewSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Virtual para verificar si puede ser editada
ReviewSchema.virtual('canEdit').get(function() {
    const now = new Date();
    const hoursSinceCreation = (now - this.createdAt) / (1000 * 60 * 60);
    
    return hoursSinceCreation < 24 && // Solo dentro de 24 horas
           !this.deletion.isDeleted && 
           this.moderation.status !== 'flagged';
});

// Virtual para obtener resumen de calificaciones por aspecto
ReviewSchema.virtual('aspectRatingSummary').get(function() {
    const aspects = this.aspectRatings;
    if (!aspects) return null;
    
    const ratings = Object.values(aspects).filter(r => r !== null);
    if (ratings.length === 0) return null;
    
    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return {
        average: Math.round(average * 10) / 10,
        count: ratings.length,
        aspects: aspects
    };
});

// Asegurar que los virtuales se incluyan en JSON
ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

// Crear el modelo
const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;
