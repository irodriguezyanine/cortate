const config = require('../config/config');

/**
 * Middleware principal de manejo de errores
 * Debe ir al final de todos los middlewares
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log del error
    console.error('🚨 Error capturado:', err);

    // Error de validación de Mongoose
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            message: message,
            statusCode: 400,
            code: 'VALIDATION_ERROR'
        };
    }

    // Error de duplicado de Mongoose (E11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        error = {
            message: `El ${field} '${value}' ya está en uso`,
            statusCode: 400,
            code: 'DUPLICATE_FIELD'
        };
    }

    // Error de cast de Mongoose (ObjectId inválido)
    if (err.name === 'CastError') {
        error = {
            message: 'Recurso no encontrado - ID inválido',
            statusCode: 404,
            code: 'INVALID_ID'
        };
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        error = {
            message: 'Token de autorización inválido',
            statusCode: 401,
            code: 'INVALID_TOKEN'
        };
    }

    // Error de token expirado
    if (err.name === 'TokenExpiredError') {
        error = {
            message: 'Token de autorización expirado',
            statusCode: 401,
            code: 'TOKEN_EXPIRED'
        };
    }

    // Error de conexión a MongoDB
    if (err.name === 'MongoNetworkError') {
        error = {
            message: 'Error de conexión a la base de datos',
            statusCode: 503,
            code: 'DATABASE_CONNECTION_ERROR'
        };
    }

    // Error de límite de rate limiting
    if (err.status === 429) {
        error = {
            message: 'Demasiadas solicitudes, intente más tarde',
            statusCode: 429,
            code: 'RATE_LIMIT_EXCEEDED'
        };
    }

    // Error de Multer (uploads)
    if (err.code && err.code.startsWith('LIMIT_')) {
        error = {
            message: 'Error en la subida de archivos',
            statusCode: 400,
            code: 'UPLOAD_ERROR',
            details: err.message
        };
    }

    // Error de sintaxis JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        error = {
            message: 'JSON malformado en el cuerpo de la solicitud',
            statusCode: 400,
            code: 'INVALID_JSON'
        };
    }

    // Respuesta del error
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Error interno del servidor',
        code: error.code || 'INTERNAL_SERVER_ERROR',
        ...(config.isDevelopment && {
            stack: err.stack,
            details: error.details
        }),
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    });
};

/**
 * Middleware para manejar rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    error.statusCode = 404;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
};

/**
 * Wrapper para manejar errores async automáticamente
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Clase para errores personalizados de la aplicación
 */
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError
};
