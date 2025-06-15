const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Barber = require('../models/Barber');

/**
 * Validaciones para registro de barbero
 */
const validateBarberRegistration = [
    // Información básica del negocio
    body('businessName')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre del negocio debe tener entre 3 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s&.-]+$/)
        .withMessage('El nombre del negocio contiene caracteres no válidos')
        .custom(async (value, { req }) => {
            // Verificar que no exista otro barbero con el mismo nombre en la misma ciudad
            const existingBarber = await Barber.findOne({
                businessName: new RegExp(`^${value}$`, 'i'),
                'location.details.city': req.body.city,
                userId: { $ne: req.user?.id }
            });
            
            if (existingBarber) {
                throw new Error('Ya existe un negocio con este nombre en la ciudad');
            }
            return true;
        }),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La descripción no puede exceder 1000 caracteres'),

    // Servicios obligatorios
    body('services.corteHombre.price')
        .isInt({ min: 1000, max: 100000 })
        .withMessage('El precio del corte de hombre debe estar entre $1.000 y $100.000'),

    body('services.corteBarba.price')
        .isInt({ min: 2000, max: 150000 })
        .withMessage('El precio del corte + barba debe estar entre $2.000 y $150.000'),

    // Tipo de servicio
    body('serviceType')
        .isIn(['local', 'domicilio', 'mixto'])
        .withMessage('El tipo de servicio debe ser: local, domicilio o mixto'),

    // Ubicación
    body('location.address')
        .trim()
        .isLength({ min: 10, max: 300 })
        .withMessage('La dirección debe tener entre 10 y 300 caracteres'),

    body('location.coordinates')
        .isArray({ min: 2, max: 2 })
        .withMessage('Las coordenadas deben ser un array de 2 elementos')
        .custom((value) => {
            const [lng, lat] = value;
            if (typeof lng !== 'number' || typeof lat !== 'number') {
                throw new Error('Las coordenadas deben ser números');
            }
            if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
                throw new Error('Las coordenadas están fuera del rango válido');
            }
            return true;
        }),

    body('location.details.city')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('La ciudad debe tener entre 2 y 100 caracteres'),

    body('location.details.region')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('La región debe tener entre 2 y 100 caracteres'),

    // WhatsApp
    body('whatsapp')
        .matches(/^\+?56[0-9]{8,9}$/)
        .withMessage('
