const mongoose = require('mongoose');
const config = require('./config');

// Configuración de opciones de conexión optimizada para producción
const connectionOptions = {
    // Configuración de conexión
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
    // Configuración de autenticación y seguridad
    authSource: 'admin',
    ssl: true,
    sslValidate: true,
    
    // Pool de conexiones optimizado
    maxPoolSize: 10, // Máximo 10 conexiones simultáneas
    minPoolSize: 2,  // Mínimo 2 conexiones en el pool
    maxIdleTimeMS: 30000, // Cerrar conexiones inactivas después de 30s
    
    // Timeouts configurados para estabilidad
    serverSelectionTimeoutMS: 10000, // 10s timeout para selección de servidor
    socketTimeoutMS: 45000, // 45s timeout para operaciones de socket
    connectTimeoutMS: 10000, // 10s timeout para conexión inicial
    
    // Configuración de heartbeat y monitoreo
    heartbeatFrequencyMS: 10000, // Heartbeat cada 10s
    
    // Buffer de comandos deshabilitado para mejor manejo de errores
    bufferMaxEntries: 0,
    bufferCommands: false,
    
    // Configuración para retry de escrituras
    retryWrites: true,
    retryReads: true,
    
    // Configuración de compresión
    compressors: ['zlib'],
    zlibCompressionLevel: 6,
    
    // Configuración para desarrollo vs producción
    ...(process.env.NODE_ENV === 'production' ? {
        // Configuraciones adicionales para producción
        w: 'majority',
        j: true,
        wtimeoutMS: 5000
    } : {
        // Configuraciones para desarrollo
        w: 1,
        j: false
    })
};

/**
 * Conecta a la base de datos MongoDB Atlas
 * @returns {Promise<mongoose.Connection>} Conexión establecida
 */
const connectDB = async () => {
    try {
        // Validar que existe la URI de conexión
        if (!config.MONGODB_URI) {
            throw new Error('MONGODB_URI no está definida en las variables de entorno');
        }

        console.log('🔄 Iniciando conexión a MongoDB...');
        console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        
        // Mostrar información de conexión (sin exponer credenciales)
        const uriInfo = parseMongoURI(config.MONGODB_URI);
        console.log(`🗄️  Base de datos: ${uriInfo.database}`);
        console.log(`🌐 Cluster: ${uriInfo.host}`);

        // Establecer conexión
        const conn = await mongoose.connect(config.MONGODB_URI, connectionOptions);

        console.log('✅ MongoDB conectado exitosamente');
        console.log(`📊 Conexión activa: ${conn.connection.host}`);
        console.log(`📈 Estado: ${conn.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);

        // Configurar event listeners para monitoreo
        setupConnectionMonitoring(conn.connection);

        return conn.connection;

    } catch (error) {
        console.error('❌ Error de conexión a MongoDB:', error.message);
        
        // Logging detallado del error según el tipo
        if (error.name === 'MongoNetworkError') {
            console.error('🌐 Error de red: Verifica tu conexión a internet y la configuración de red');
        } else if (error.name === 'MongoAuthenticationError') {
            console.error('🔐 Error de autenticación: Verifica las credenciales de MongoDB');
        } else if (error.name === 'MongoServerSelectionError') {
            console.error('🎯 Error de selección de servidor: Verifica la URI de conexión y whitelist de IPs');
        } else if (error.message.includes('MONGODB_URI')) {
            console.error('⚙️  Error de configuración: Verifica las variables de entorno');
        }

        // En desarrollo, mostrar más detalles del error
        if (process.env.NODE_ENV === 'development') {
            console.error('📋 Detalles del error:', error);
        }

        // Salir del proceso en caso de error crítico
        process.exit(1);
    }
};

/**
 * Desconecta de la base de datos de forma segura
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
    try {
        console.log('🔄 Desconectando de MongoDB...');
        await mongoose.connection.close();
        console.log('✅ Desconexión de MongoDB exitosa');
    } catch (error) {
        console.error('❌ Error al desconectar de MongoDB:', error.message);
        throw error;
    }
};

/**
 * Verifica el estado de la conexión a la base de datos
 * @returns {Object} Estado de la conexión
 */
const getConnectionStatus = () => {
    const states = {
        0: 'Desconectado',
        1: 'Conectado', 
        2: 'Conectando',
        3: 'Desconectando'
    };

    const conn = mongoose.connection;
    
    return {
        status: states[conn.readyState] || 'Desconocido',
        readyState: conn.readyState,
        host: conn.host || 'No disponible',
        name: conn.name || 'No disponible',
        collections: Object.keys(conn.collections || {}),
        models: Object.keys(mongoose.models || {}),
        isConnected: conn.readyState === 1
    };
};

/**
 * Configura el monitoreo de eventos de conexión
 * @param {mongoose.Connection} connection - Conexión de mongoose
 */
const setupConnectionMonitoring = (connection) => {
    // Evento de conexión exitosa
    connection.on('connected', () => {
        console.log('🔗 MongoDB: Conexión establecida');
    });

    // Evento de desconexión
    connection.on('disconnected', () => {
        console.log('💔 MongoDB: Conexión perdida');
        
        // En producción, intentar reconectar automáticamente
        if (process.env.NODE_ENV === 'production') {
            console.log('🔄 Intentando reconectar a MongoDB...');
        }
    });

    // Evento de reconexión
    connection.on('reconnected', () => {
        console.log('🔄 MongoDB: Reconexión exitosa');
    });

    // Evento de error
    connection.on('error', (error) => {
        console.error('❌ Error de MongoDB:', error.message);
        
        // Log específico según tipo de error
        if (error.name === 'MongoNetworkTimeoutError') {
            console.error('⏱️  Timeout de red detectado');
        } else if (error.name === 'MongoWriteConcernError') {
            console.error('✍️  Error de escritura detectado');
        }
    });

    // Evento de cierre de conexión
    connection.on('close', () => {
        console.log('🚪 MongoDB: Conexión cerrada');
    });

    // Evento de apertura de conexión
    connection.on('open', () => {
        console.log('🚀 MongoDB: Conexión abierta y lista');
    });

    // Monitoreo de eventos de servidor
    connection.on('serverOpening', () => {
        console.log('🔌 MongoDB: Servidor abriendo conexión');
    });

    connection.on('serverClosed', () => {
        console.log('🔌 MongoDB: Servidor cerró conexión');
    });

    // Eventos de topología (para clusters)
    connection.on('topologyOpening', () => {
        console.log('🌐 MongoDB: Topología abriendo');
    });

    connection.on('topologyClosed', () => {
        console.log('🌐 MongoDB: Topología cerrada');
    });
};

/**
 * Parsea la URI de MongoDB para extraer información sin exponer credenciales
 * @param {string} uri - URI de conexión de MongoDB
 * @returns {Object} Información parseada de la URI
 */
const parseMongoURI = (uri) => {
    try {
        // Regex para parsear URI de MongoDB
        const regex = /mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)/;
        const match = uri.match(regex);
        
        if (match) {
            return {
                protocol: 'mongodb+srv',
                username: match[1],
                host: match[3],
                database: match[4]
            };
        }
        
        // Fallback para URIs diferentes
        return {
            protocol: 'mongodb',
            host: 'localhost',
            database: 'cortate_cl'
        };
    } catch (error) {
        console.error('❌ Error al parsear URI de MongoDB:', error.message);
        return {
            protocol: 'mongodb',
            host: 'unknown',
            database: 'unknown'
        };
    }
};

/**
 * Ejecuta health check de la base de datos
 * @returns {Promise<Object>} Resultado del health check
 */
const healthCheck = async () => {
    try {
        const start = Date.now();
        
        // Verificar conexión básica
        const status = getConnectionStatus();
        
        if (!status.isConnected) {
            throw new Error('Base de datos no conectada');
        }

        // Ping a la base de datos
        await mongoose.connection.db.admin().ping();
        
        const responseTime = Date.now() - start;

        // Obtener estadísticas básicas
        const stats = await mongoose.connection.db.stats();

        return {
            status: 'healthy',
            responseTime: `${responseTime}ms`,
            connection: status,
            database: {
                name: stats.db,
                collections: stats.collections,
                documents: stats.objects,
                dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
                indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`
            },
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            connection: getConnectionStatus(),
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Limpia la base de datos (solo para testing y desarrollo)
 * @returns {Promise<void>}
 */
const clearDatabase = async () => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('❌ No se puede limpiar la base de datos en producción');
    }
    
    try {
        console.log('🧹 Limpiando base de datos...');
        
        const collections = await mongoose.connection.db.collections();
        
        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`🗑️  Colección ${collection.collectionName} limpiada`);
        }
        
        console.log('✅ Base de datos limpiada exitosamente');
    } catch (error) {
        console.error('❌ Error al limpiar base de datos:', error.message);
        throw error;
    }
};

// Exportar funciones
module.exports = {
    connectDB,
    disconnectDB,
    getConnectionStatus,
    healthCheck,
    clearDatabase,
    
    // Para testing
    connectionOptions,
    parseMongoURI
};
