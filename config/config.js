require('dotenv').config();

/**
 * Configuración centralizada para Córtate.cl
 * Maneja todas las variables de entorno y configuraciones del sistema
 */

// Validar variables de entorno críticas
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GOOGLE_PLACES_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
    console.error('💡 Asegúrate de tener un archivo .env con todas las variables requeridas');
    process.exit(1);
}

// Configuración del entorno
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';
const isTesting = NODE_ENV === 'test';

// Configuración del servidor
const config = {
    // ==========================================
    // CONFIGURACIÓN BÁSICA DEL SERVIDOR
    // ==========================================
    NODE_ENV,
    isDevelopment,
    isProduction,
    isTesting,
    
    PORT: process.env.PORT || 5000,
    
    // URLs del frontend para CORS
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:3001',
    
    // ==========================================
    // CONFIGURACIÓN DE BASE DE DATOS
    // ==========================================
    MONGODB_URI: process.env.MONGODB_URI,
    
    // Configuración específica de MongoDB
    DB_CONFIG: {
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
        maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 30000,
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 10000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
        connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
    },
    
    // ==========================================
    // CONFIGURACIÓN DE AUTENTICACIÓN JWT
    // ==========================================
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
    
    // Configuración de cookies para JWT
    JWT_COOKIE: {
        httpOnly: true,
        secure: isProduction, // Solo HTTPS en producción
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días en millisegundos
    },
    
    // ==========================================
    // CONFIGURACIÓN DE GOOGLE PLACES API
    // ==========================================
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    
    // Configuración específica de Google Places
    GOOGLE_PLACES_CONFIG: {
        language: 'es',
        region: 'CL', // Chile
        types: 'hair_care|beauty_salon',
        radius: 50000, // 50km por defecto
        maxResults: 60, // Máximo resultados por búsqueda
        
        // Campos a obtener de Google Places
        fields: [
            'place_id',
            'name',
            'formatted_address', 
            'geometry',
            'photos',
            'rating',
            'user_ratings_total',
            'formatted_phone_number',
            'opening_hours',
            'website',
            'types',
            'reviews'
        ].join(','),
        
        // Ciudades principales de Chile para búsquedas
        mainCities: [
            { name: 'Santiago', coordinates: [-33.4489, -70.6693] },
            { name: 'Valparaíso', coordinates: [-33.0458, -71.6197] },
            { name: 'Viña del Mar', coordinates: [-33.0249, -71.5514] },
            { name: 'Concepción', coordinates: [-36.8201, -73.0444] },
            { name: 'La Serena', coordinates: [-29.9027, -71.2519] },
            { name: 'Antofagasta', coordinates: [-23.6509, -70.3975] },
            { name: 'Temuco', coordinates: [-38.7359, -72.5904] },
            { name: 'Iquique', coordinates: [-20.2208, -70.1431] },
            { name: 'Rancagua', coordinates: [-34.1708, -70.7394] },
            { name: 'Talca', coordinates: [-35.4264, -71.6554] }
        ]
    },
    
    // ==========================================
    // CONFIGURACIÓN DE UPLOADS Y ARCHIVOS
    // ==========================================
    UPLOAD_CONFIG: {
        // Directorio base para uploads
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        
        // Tamaños máximos por tipo de archivo
        maxFileSizes: {
            profile: 5 * 1024 * 1024,      // 5MB para fotos de perfil
            gallery: 10 * 1024 * 1024,     // 10MB para galería
            verification: 10 * 1024 * 1024, // 10MB para verificación CI
            review: 5 * 1024 * 1024        // 5MB para fotos de reseñas
        },
        
        // Tipos de archivos permitidos
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/webp'
        ],
        
        // Configuración de subdirectorios
        directories: {
            profiles: 'profiles',
            galleries: 'galleries',
            verification: 'verification',
            reviews: 'reviews',
            temp: 'temp'
        }
    },
    
    // ==========================================
    // CONFIGURACIÓN DE RESERVAS Y NEGOCIO
    // ==========================================
    BOOKING_CONFIG: {
        // Tiempos de expiración
        pendingExpirationMinutes: parseInt(process.env.BOOKING_PENDING_EXPIRATION) || 15,
        immediateExpirationMinutes: parseInt(process.env.BOOKING_IMMEDIATE_EXPIRATION) || 5,
        
        // Políticas de cancelación
        cancellationPolicy: {
            // Cancelación gratuita hasta X minutos antes
            scheduledFreeMinutes: parseInt(process.env.SCHEDULED_FREE_CANCELLATION) || 30,
            immediateFreeMinutes: parseInt(process.env.IMMEDIATE_FREE_CANCELLATION) || 10,
            
            // Porcentajes de penalización
            lateCancellationPenalty: parseFloat(process.env.LATE_CANCELLATION_PENALTY) || 0.10, // 10%
            noShowPenalty: parseFloat(process.env.NO_SHOW_PENALTY) || 0.50, // 50%
        },
        
        // Estados posibles de reservas
        statuses: [
            'pending',    // Esperando aceptación
            'accepted',   // Aceptada por barbero
            'rejected',   // Rechazada por barbero
            'completed',  // Completada exitosamente
            'cancelled',  // Cancelada
            'expired',    // Expirada sin respuesta
            'no_show'     // Cliente no se presentó
        ],
        
        // Tipos de servicio
        serviceTypes: [
            'local',      // En local del barbero
            'domicilio',  // A domicilio del cliente
            'mixto'       // Ambos tipos
        ],
        
        // Servicios disponibles
        services: {
            required: [
                { key: 'corteHombre', name: 'Corte Hombre', required: true },
                { key: 'corteBarba', name: 'Corte + Barba', required: true }
            ],
            optional: [
                { key: 'ninos', name: 'Niños', icon: '👶' },
                { key: 'expres', name: 'Exprés', icon: '⚡' },
                { key: 'diseno', name: 'Diseño', icon: '✨' },
                { key: 'padre_hijo', name: 'Padre e Hijo', icon: '👨‍👦' }
            ]
        }
    },
    
    // ==========================================
    // CONFIGURACIÓN DE PENALIZACIONES
    // ==========================================
    PENALTY_CONFIG: {
        // Tipos de penalizaciones
        types: {
            NO_SHOW: 'no-show',
            LATE_CANCELLATION: 'late-cancellation', 
            REJECTION: 'rejection',
            CLIENT_CANCELLATION: 'client-cancellation'
        },
        
        // Límites para suspensiones
        limits: {
            maxRejectionsPerDay: parseInt(process.env.MAX_REJECTIONS_PER_DAY) || 3,
            maxNoShowsPerWeek: parseInt(process.env.MAX_NO_SHOWS_PER_WEEK) || 2,
            suspensionDays: parseInt(process.env.SUSPENSION_DAYS) || 7
        },
        
        // Cálculo de impacto en rating
        ratingImpact: {
            noShow: -0.2,           // -0.2 puntos por no-show
            lateRejection: -0.1,    // -0.1 puntos por rechazo tardío
            frequentRejections: -0.3 // -0.3 puntos por rechazos frecuentes
        }
    },
    
    // ==========================================
    // CONFIGURACIÓN DE RESEÑAS
    // ==========================================
    REVIEW_CONFIG: {
        // Rango de calificaciones
        minRating: 1,
        maxRating: 5,
        
        // Límites de contenido
        maxCommentLength: parseInt(process.env.MAX_COMMENT_LENGTH) || 500,
        maxPhotos: parseInt(process.env.MAX_REVIEW_PHOTOS) || 3,
        
        // Validaciones
        requireBookingToReview: process.env.REQUIRE_BOOKING_TO_REVIEW !== 'false',
        allowAnonymousReviews: process.env.ALLOW_ANONYMOUS_REVIEWS === 'true'
    },
    
    // ==========================================
    // CONFIGURACIÓN DE NOTIFICACIONES
    // ==========================================
    NOTIFICATION_CONFIG: {
        // WhatsApp
        whatsapp: {
            enabled: process.env.WHATSAPP_ENABLED === 'true',
            baseUrl: 'https://wa.me',
            defaultMessage: '¡Hola! Te contacto desde Córtate.cl 💇‍♂️'
        },
        
        // Email (para futuras implementaciones)
        email: {
            enabled: process.env.EMAIL_ENABLED === 'true',
            from: process.env.EMAIL_FROM || 'noreply@cortate.cl',
            smtp: {
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        },
        
        // Push notifications (para futuras implementaciones)
        push: {
            enabled: process.env.PUSH_ENABLED === 'true',
            vapidKeys: {
                publicKey: process.env.VAPID_PUBLIC_KEY,
                privateKey: process.env.VAPID_PRIVATE_KEY
            }
        }
    },
    
    // ==========================================
    // CONFIGURACIÓN DE SEGURIDAD
    // ==========================================
    SECURITY_CONFIG: {
        // Rate limiting
        rateLimiting: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 min
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
            authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10
        },
        
        // Configuración de passwords
        password: {
            minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 6,
            requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
            requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
            requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL === 'true'
        },
        
        // Configuración de sesiones
        session: {
            maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 3,
            invalidateOnPasswordChange: process.env.INVALIDATE_ON_PASSWORD_CHANGE !== 'false'
        }
    },
    
    // ==========================================
    // CONFIGURACIÓN DE LOGGING
    // ==========================================
    LOGGING_CONFIG: {
        level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
        logToFile: process.env.LOG_TO_FILE === 'true',
        logFile: process.env.LOG_FILE || './logs/app.log',
        
        // Configuración específica por entorno
        console: {
            colorize: isDevelopment,
            timestamp: true,
            level: isDevelopment ? 'debug' : 'info'
        }
    },
    
    // ==========================================
    // CONFIGURACIÓN DE PAGOS (FUTURO)
    // ==========================================
    PAYMENT_CONFIG: {
        // Configuración para Transbank/Flow/Khipu
        enabled: process.env.PAYMENTS_ENABLED === 'true',
        provider: process.env.PAYMENT_PROVIDER || 'simulation',
        
        // Comisiones del marketplace
        commission: parseFloat(process.env.MARKETPLACE_COMMISSION) || 0.10, // 10%
        
        // Moneda
        currency: 'CLP',
        
        // Proveedores disponibles (para futuro)
        providers: {
            transbank: {
                enabled: process.env.TRANSBANK_ENABLED === 'true',
                apiKey: process.env.TRANSBANK_API_KEY,
                environment: process.env.TRANSBANK_ENV || 'sandbox'
            },
            flow: {
                enabled: process.env.FLOW_ENABLED === 'true',
                apiKey: process.env.FLOW_API_KEY,
                secret: process.env.FLOW_SECRET,
                environment: process.env.FLOW_ENV || 'sandbox'
            }
        }
    },
    
    // ==========================================
    // CONFIGURACIÓN DE DESARROLLO
    // ==========================================
    DEV_CONFIG: {
        // Datos de prueba
        seedDatabase: process.env.SEED_DATABASE === 'true',
        createTestUsers: process.env.CREATE_TEST_USERS === 'true',
        
        // Debugging
        enableDebugRoutes: isDevelopment,
        logSqlQueries: isDevelopment && process.env.LOG_SQL === 'true',
        
        // Herramientas de desarrollo
        enableCors: process.env.ENABLE_CORS !== 'false',
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001'
        ]
    }
};

// Función para validar configuración crítica
const validateConfig = () => {
    const errors = [];
    
    // Validar JWT Secret
    if (config.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET debe tener al menos 32 caracteres');
    }
    
    // Validar configuración de Google Places
    if (!config.GOOGLE_PLACES_API_KEY || config.GOOGLE_PLACES_API_KEY.length < 10) {
        errors.push('GOOGLE_PLACES_API_KEY debe ser una clave válida');
    }
    
    // Validar MongoDB URI
    if (!config.MONGODB_URI.includes('mongodb')) {
        errors.push('MONGODB_URI debe ser una URI válida de MongoDB');
    }
    
    if (errors.length > 0) {
        console.error('❌ Errores de configuración:');
        errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
    }
    
    console.log('✅ Configuración validada exitosamente');
};

// Función para mostrar resumen de configuración
const showConfigSummary = () => {
    if (!isDevelopment) return;
    
    console.log('\n📋 RESUMEN DE CONFIGURACIÓN:');
    console.log(`   Entorno: ${config.NODE_ENV}`);
    console.log(`   Puerto: ${config.PORT}`);
    console.log(`   Base de datos: ${config.MONGODB_URI.includes('localhost') ? 'Local' : 'Atlas'}`);
    console.log(`   JWT expira en: ${config.JWT_EXPIRE}`);
    console.log(`   Google Places: ${config.GOOGLE_PLACES_API_KEY ? 'Configurado' : 'No configurado'}`);
    console.log(`   Uploads: ${config.UPLOAD_CONFIG.uploadDir}`);
    console.log(`   Rate limiting: ${config.SECURITY_CONFIG.rateLimiting.max} req/${config.SECURITY_CONFIG.rateLimiting.windowMs/60000}min`);
    console.log('');
};

// Validar configuración al cargar el módulo
if (!isTesting) {
    validateConfig();
    showConfigSummary();
}

module.exports = config;
