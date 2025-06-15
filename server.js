const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

// Importar configuración
const { connectDB } = require('./config/database');
const config = require('./config/config');

// Importar middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const barberRoutes = require('./routes/barbers');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const penaltyRoutes = require('./routes/penalties');
const placesRoutes = require('./routes/places');

// Importar controladores para tareas automáticas
const { autoExpireBookings } = require('./controllers/bookingController');
const { updatePenaltyStatus } = require('./controllers/penaltyController');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    
    // Crear subdirectorios
    ['profiles', 'galleries', 'verification', 'reviews'].forEach(dir => {
        const dirPath = path.join(uploadsDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
    
    console.log('📁 Directorios de uploads creados');
}

// Configuración de rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting más estricto para auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // máximo 10 intentos de login por IP cada 15 min
    message: {
        error: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});

// Middleware de seguridad y configuración
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'", "https://maps.googleapis.com"],
            connectSrc: ["'self'", "https://maps.googleapis.com", "https://places.googleapis.com"]
        }
    }
}));

app.use(compression()); // Compresión gzip
app.use(limiter); // Rate limiting general

// CORS configurado para desarrollo y producción
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001', 
            'https://cortate-cl.vercel.app',
            'https://cortate-cl.netlify.app',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        // Permitir requests sin origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging personalizado
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip}`);
    
    // Log de errores 4xx y 5xx
    const originalSend = res.send;
    res.send = function(data) {
        if (res.statusCode >= 400) {
            console.error(`[${timestamp}] ERROR ${res.statusCode} - ${req.method} ${req.url} - IP: ${ip}`);
            if (data && typeof data === 'string') {
                try {
                    const errorData = JSON.parse(data);
                    console.error('Error details:', errorData);
                } catch (e) {
                    console.error('Error response:', data);
                }
            }
        }
        originalSend.call(this, data);
    };
    
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Endpoint de información del servidor
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Córtate.cl API',
        version: '1.0.0',
        description: 'Sistema de reservas para barberías en Chile',
        author: 'Córtate.cl Team',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            barbers: '/api/barbers', 
            bookings: '/api/bookings',
            reviews: '/api/reviews',
            penalties: '/api/penalties',
            places: '/api/places'
        }
    });
});

// Aplicar rate limiting específico a rutas de autenticación
app.use('/api/auth', authLimiter);

// Configurar rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/bookings', authenticateToken, bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/penalties', authenticateToken, penaltyRoutes);
app.use('/api/places', placesRoutes);

// Endpoint para testing de conexión con frontend
app.get('/api/test', (req, res) => {
    res.json({
        message: '¡Conexión exitosa con Córtate.cl API!',
        timestamp: new Date().toISOString(),
        requestHeaders: {
            origin: req.get('Origin'),
            userAgent: req.get('User-Agent'),
            authorization: req.get('Authorization') ? 'Present' : 'Not present'
        }
    });
});

// Ruta catch-all para endpoints no encontrados
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        message: `La ruta ${req.originalUrl} no existe en la API`,
        availableEndpoints: [
            '/api/auth',
            '/api/users', 
            '/api/barbers',
            '/api/bookings',
            '/api/reviews',
            '/api/penalties',
            '/api/places'
        ],
        timestamp: new Date().toISOString()
    });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Configuración de tareas automáticas con cron
// Verificar reservas expiradas cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('🔄 Ejecutando tarea: Verificar reservas expiradas...');
        await autoExpireBookings();
    } catch (error) {
        console.error('❌ Error en tarea automática de reservas:', error);
    }
});

// Actualizar estado de penalizaciones cada hora
cron.schedule('0 * * * *', async () => {
    try {
        console.log('🔄 Ejecutando tarea: Actualizar penalizaciones...');
        await updatePenaltyStatus();
    } catch (error) {
        console.error('❌ Error en tarea automática de penalizaciones:', error);
    }
});

// Limpiar archivos temporales cada día a las 3 AM
cron.schedule('0 3 * * *', () => {
    try {
        console.log('🧹 Ejecutando limpieza de archivos temporales...');
        // Aquí podrías implementar limpieza de archivos antiguos
        // Por ejemplo, eliminar imágenes huérfanas después de X días
    } catch (error) {
        console.error('❌ Error en limpieza automática:', error);
    }
});

// Función para inicializar el servidor
async function startServer() {
    try {
        // Conectar a la base de datos
        console.log('🔄 Conectando a MongoDB...');
        await connectDB();
        console.log('✅ MongoDB conectado exitosamente');

        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log('\n🚀================================🚀');
            console.log(`   CÓRTATE.CL API INICIADO`);
            console.log(`   Puerto: ${PORT}`);
            console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   URL: http://localhost:${PORT}`);
            console.log(`   Health: http://localhost:${PORT}/health`);
            console.log(`   API Info: http://localhost:${PORT}/api/info`);
            console.log('🚀================================🚀\n');
        });

        // Manejar cierre graceful del servidor
        process.on('SIGTERM', () => {
            console.log('🔄 SIGTERM recibido, cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado exitosamente');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('\n🔄 SIGINT recibido, cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado exitosamente');
                process.exit(0);
            });
        });

        // Manejar errores no capturados
        process.on('unhandledRejection', (err) => {
            console.error('❌ Error no manejado:', err);
            server.close(() => {
                process.exit(1);
            });
        });

        process.on('uncaughtException', (err) => {
            console.error('❌ Excepción no capturada:', err);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Error al inicializar el servidor:', error.message);
        process.exit(1);
    }
}

// Inicializar el servidor
startServer();

module.exports = app;
