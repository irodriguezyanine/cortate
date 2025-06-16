const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');

/**
 * Schema para el perfil de usuario
 * Información personal y de contacto
 */
const ProfileSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
        match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios']
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true,
        minlength: [2, 'El apellido debe tener al menos 2 caracteres'],
        maxlength: [50, 'El apellido no puede exceder 50 caracteres'],
        match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios']
    },
    phone: {
        type: String,
        required: [true, 'El teléfono es requerido'],
        trim: true,
        match: [/^\+?56[0-9]{8,9}$/, 'Formato de teléfono chileno inválido (+56xxxxxxxxx)'],
        unique: true,
        sparse: true
    },
    avatar: {
        type: String,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^(https?:\/\/)|(\/uploads\/)/.test(v);
            },
            message: 'La URL del avatar debe ser válida'
        }
    },
    address: {
        street: {
            type: String,
            trim: true,
            maxlength: [200, 'La dirección no puede exceder 200 caracteres']
        },
        city: {
            type: String,
            trim: true,
            maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
        },
        region: {
            type: String,
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
        }
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
            validator: function(coords) {
                if (!coords || coords.length === 0) return true;
                return coords.length === 2 && 
                       coords[0] >= -180 && coords[0] <= 180 && // longitude
                       coords[1] >= -90 && coords[1] <= 90;     // latitude
            },
            message: 'Las coordenadas deben estar en formato [longitude, latitude] válido'
        },
        index: '2dsphere' // Índice geoespacial para búsquedas por proximidad
    },
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(date) {
                if (!date) return true;
                const today = new Date();
                const age = today.getFullYear() - date.getFullYear();
                return age >= 16 && age <= 100; // Entre 16 y 100 años
            },
            message: 'La edad debe estar entre 16 y 100 años'
        }
    },
    gender: {
        type: String,
        enum: {
            values: ['masculino', 'femenino', 'otro', 'prefiero-no-decir'],
            message: 'Género debe ser: masculino, femenino, otro o prefiero-no-decir'
        }
    }
}, {
    _id: false // No crear _id separado para subdocumentos
});

/**
 * Schema para preferencias del usuario
 */
const PreferencesSchema = new mongoose.Schema({
    // Preferencias de notificaciones
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        },
        push: {
            type: Boolean,
            default: true
        },
        whatsapp: {
            type: Boolean,
            default: true
        },
        marketing: {
            type: Boolean,
            default: false
        }
    },
    
    // Preferencias de servicio
    preferredServiceType: {
        type: String,
        enum: ['local', 'domicilio', 'mixto'],
        default: 'mixto'
    },
    
    // Radio de búsqueda preferido (en metros)
    searchRadius: {
        type: Number,
        default: 10000, // 10km por defecto
        min: [1000, 'El radio mínimo es 1km'],
        max: [50000, 'El radio máximo es 50km']
    },
    
    // Rango de precios preferido
    priceRange: {
        min: {
            type: Number,
            default: 0,
            min: 0
        },
        max: {
            type: Number,
            default: 50000, // $50.000 CLP
            min: 0
        }
    },
    
    // Idioma preferido
    language: {
        type: String,
        enum: ['es', 'en'],
        default: 'es'
    },
    
    // Tema de la aplicación
    theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'dark'
    }
}, {
    _id: false
});

/**
 * Schema para estadísticas del usuario
 */
const StatsSchema = new mongoose.Schema({
    // Reservas realizadas
    totalBookings: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Reservas completadas exitosamente
    completedBookings: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Reservas canceladas
    cancelledBookings: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // No-shows (no se presentó)
    noShows: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Total gastado en la plataforma
    totalSpent: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Promedio de calificaciones dadas
    averageRatingGiven: {
        type: Number,
        default: 0,
        min: 1,
        max: 5
    },
    
    // Barbero favorito (más reservas)
    favoriteBarber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Barber',
        default: null
    },
    
    // Fecha de última reserva
    lastBooking: {
        type: Date,
        default: null
    }
}, {
    _id: false
});

/**
 * Schema para verificación de cuenta
 */
const VerificationSchema = new mongoose.Schema({
    // Email verificado
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpires: {
        type: Date,
        default: null
    },
    
    // Teléfono verificado
    phoneVerified: {
        type: Boolean,
        default: false
    },
    phoneVerificationCode: {
        type: String,
        default: null
    },
    phoneVerificationExpires: {
        type: Date,
        default: null
    },
    phoneVerificationAttempts: {
        type: Number,
        default: 0,
        max: 5 // Máximo 5 intentos por hora
    },
    
    // Identidad verificada (para barberos)
    identityVerified: {
        type: Boolean,
        default: false
    },
    identityVerificationDate: {
        type: Date,
        default: null
    }
}, {
    _id: false
});

/**
 * Schema principal del Usuario
 */
const UserSchema = new mongoose.Schema({
    // Información básica de autenticación
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Formato de email inválido'
        ],
        index: true
    },
    
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false // No incluir en consultas por defecto
    },
    
    // Rol del usuario
    role: {
        type: String,
        enum: {
            values: ['client', 'barber', 'admin'],
            message: 'El rol debe ser: client, barber o admin'
        },
        required: [true, 'El rol es requerido'],
        default: 'client',
        index: true
    },
    
    // Información del perfil
    profile: {
        type: ProfileSchema,
        required: true
    },
    
    // Preferencias del usuario
    preferences: {
        type: PreferencesSchema,
        default: () => ({})
    },
    
    // Estadísticas del usuario
    stats: {
        type: StatsSchema,
        default: () => ({})
    },
    
    // Verificación de cuenta
    verification: {
        type: VerificationSchema,
        default: () => ({})
    },
    
    // Estado de la cuenta
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    isSuspended: {
        type: Boolean,
        default: false,
        index: true
    },
    
    suspensionReason: {
        type: String,
        default: null
    },
    
    suspensionExpires: {
        type: Date,
        default: null
    },
    
    // Tokens para resetear contraseña
    passwordResetToken: {
        type: String,
        default: null,
        select: false
    },
    
    passwordResetExpires: {
        type: Date,
        default: null,
        select: false
    },
    
    // Intentos de login fallidos
    loginAttempts: {
        count: {
            type: Number,
            default: 0
        },
        lastAttempt: {
            type: Date,
            default: null
        },
        lockedUntil: {
            type: Date,
            default: null
        }
    },
    
    // Sesiones activas
    activeSessions: [{
        token: String,
        device: String,
        ip: String,
        userAgent: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastActivity: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Marcas de tiempo
    lastLogin: {
        type: Date,
        default: null
    },
    
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    versionKey: false,
    
    // Configuración del toJSON para ocultar campos sensibles
    toJSON: {
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            delete ret.activeSessions;
            delete ret.loginAttempts;
            delete ret.verification.emailVerificationToken;
            delete ret.verification.phoneVerificationCode;
            return ret;
        }
    }
});

// ==========================================
// ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
// ==========================================

// Índice compuesto para búsquedas frecuentes
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ 'profile.phone': 1 });
UserSchema.index({ isActive: 1, isSuspended: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastActivity: -1 });

// Índice geoespacial para búsquedas por ubicación
UserSchema.index({ 'profile.coordinates': '2dsphere' });

// Índice TTL para limpiar tokens expirados
UserSchema.index({ 'verification.emailVerificationExpires': 1 }, { expireAfterSeconds: 0 });
UserSchema.index({ 'verification.phoneVerificationExpires': 1 }, { expireAfterSeconds: 0 });
UserSchema.index({ passwordResetExpires: 1 }, { expireAfterSeconds: 0 });

// ==========================================
// MIDDLEWARE PRE-SAVE
// ==========================================

// Hash de contraseña antes de guardar
UserSchema.pre('save', async function(next) {
    // Solo hashear si la contraseña fue modificada
    if (!this.isModified('password')) return next();
    
    try {
        // Generar salt y hashear contraseña
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Actualizar lastActivity en cada save
UserSchema.pre('save', function(next) {
    if (this.isNew || this.isModified()) {
        this.lastActivity = new Date();
    }
    next();
});

// Validar coordenadas si se establece dirección
UserSchema.pre('save', function(next) {
    if (this.profile.address && this.profile.address.street && !this.profile.coordinates) {
        // En un caso real, aquí geocodificarías la dirección
        console.log('⚠️  Dirección sin coordenadas, considera geocodificar');
    }
    next();
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * Comparar contraseña con hash almacenado
 * @param {string} candidatePassword - Contraseña a verificar
 * @returns {Promise<boolean>} - True si la contraseña es correcta
 */
UserSchema.methods.comparePassword = async function(candidatePassword) {
    if (!candidatePassword || !this.password) {
        return false;
    }
    
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Error al comparar contraseña:', error);
        return false;
    }
};

/**
 * Generar token JWT para el usuario
 * @param {string} type - Tipo de token ('access' o 'refresh')
 * @returns {string} - Token JWT
 */
UserSchema.methods.generateAuthToken = function(type = 'access') {
    const payload = {
        userId: this._id,
        email: this.email,
        role: this.role,
        type: type
    };
    
    const options = {
        expiresIn: type === 'refresh' ? config.JWT_REFRESH_EXPIRE : config.JWT_EXPIRE,
        issuer: 'cortate.cl',
        audience: 'cortate.cl'
    };
    
    return jwt.sign(payload, config.JWT_SECRET, options);
};

/**
 * Generar token para resetear contraseña
 * @returns {string} - Token de reset
 */
UserSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutos
    
    return resetToken;
};

/**
 * Generar código de verificación de teléfono
 * @returns {string} - Código de 6 dígitos
 */
UserSchema.methods.generatePhoneVerificationCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    this.verification.phoneVerificationCode = code;
    this.verification.phoneVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutos
    this.verification.phoneVerificationAttempts += 1;
    
    return code;
};

/**
 * Verificar si la cuenta está bloqueada por intentos fallidos
 * @returns {boolean} - True si está bloqueada
 */
UserSchema.methods.isLocked = function() {
    return !!(this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil > Date.now());
};

/**
 * Incrementar intentos de login fallidos
 */
UserSchema.methods.incrementLoginAttempts = function() {
    // Si ya está bloqueado y el bloqueo expiró, resetear
    if (this.loginAttempts.lockedUntil && this.loginAttempts.lockedUntil < Date.now()) {
        return this.updateOne({
            $unset: {
                'loginAttempts.lockedUntil': 1
            },
            $set: {
                'loginAttempts.count': 1,
                'loginAttempts.lastAttempt': Date.now()
            }
        });
    }
    
    const updates = {
        $inc: {
            'loginAttempts.count': 1
        },
        $set: {
            'loginAttempts.lastAttempt': Date.now()
        }
    };
    
    // Bloquear cuenta después de 5 intentos fallidos
    if (this.loginAttempts.count + 1 >= 5 && !this.isLocked) {
        updates.$set['loginAttempts.lockedUntil'] = Date.now() + 30 * 60 * 1000; // 30 minutos
    }
    
    return this.updateOne(updates);
};

/**
 * Resetear intentos de login después de login exitoso
 */
UserSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: {
            'loginAttempts.count': 1,
            'loginAttempts.lockedUntil': 1
        },
        $set: {
            'lastLogin': Date.now(),
            'lastActivity': Date.now()
        }
    });
};

/**
 * Obtener nombre completo
 * @returns {string} - Nombre completo
 */
UserSchema.methods.getFullName = function() {
    return `${this.profile.firstName} ${this.profile.lastName}`.trim();
};

/**
 * Verificar si puede hacer reservas (no suspendido, verificado)
 * @returns {boolean} - True si puede hacer reservas
 */
UserSchema.methods.canMakeBookings = function() {
    return this.isActive && 
           !this.isSuspended && 
           this.verification.emailVerified;
};

/**
 * Obtener avatar URL o generar uno por defecto
 * @returns {string} - URL del avatar
 */
UserSchema.methods.getAvatarUrl = function() {
    if (this.profile.avatar) {
        return this.profile.avatar;
    }
    
    // Generar avatar por defecto usando iniciales
    const initials = this.getFullName()
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();
        
    return `https://ui-avatars.com/api/?name=${initials}&background=d4af37&color=000&size=200`;
};

// ==========================================
// MÉTODOS ESTÁTICOS
// ==========================================

/**
 * Buscar usuario por email con manejo de errores
 * @param {string} email - Email del usuario
 * @returns {Promise<User|null>} - Usuario encontrado o null
 */
UserSchema.statics.findByEmail = async function(email) {
    try {
        return await this.findOne({ 
            email: email.toLowerCase().trim(),
            isActive: true 
        }).select('+password');
    } catch (error) {
        console.error('Error al buscar usuario por email:', error);
        return null;
    }
};

/**
 * Buscar usuarios por proximidad geográfica
 * @param {Array} coordinates - [longitude, latitude]
 * @param {number} maxDistance - Distancia máxima en metros
 * @returns {Promise<Array>} - Usuarios cercanos
 */
UserSchema.statics.findNearby = async function(coordinates, maxDistance = 10000) {
    try {
        return await this.find({
            'profile.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    },
                    $maxDistance: maxDistance
                }
            },
            isActive: true,
            isSuspended: false
        });
    } catch (error) {
        console.error('Error al buscar usuarios cercanos:', error);
        return [];
    }
};

/**
 * Obtener estadísticas generales de usuarios
 * @returns {Promise<Object>} - Estadísticas
 */
UserSchema.statics.getGeneralStats = async function() {
    try {
        const stats = await this.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalClients: {
                        $sum: { $cond: [{ $eq: ['$role', 'client'] }, 1, 0] }
                    },
                    totalBarbers: {
                        $sum: { $cond: [{ $eq: ['$role', 'barber'] }, 1, 0] }
                    },
                    activeUsers: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    },
                    verifiedUsers: {
                        $sum: { $cond: ['$verification.emailVerified', 1, 0] }
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

// Crear el modelo
const User = mongoose.model('User', UserSchema);

module.exports = User;
