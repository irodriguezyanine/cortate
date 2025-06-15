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
        .withMessage('El número de WhatsApp debe tener formato chileno válido (+56xxxxxxxxx)'),

    // Servicios adicionales (opcional)
    body('services.adicionales')
        .optional()
        .isArray()
        .withMessage('Los servicios adicionales deben ser un array')
        .custom((value) => {
            const validServices = ['ninos', 'expres', 'diseno', 'padre_hijo', 'cejas', 'nariz', 'orejas'];
            const invalidServices = value.filter(service => !validServices.includes(service));
            if (invalidServices.length > 0) {
                throw new Error(`Servicios adicionales inválidos: ${invalidServices.join(', ')}`);
            }
            return true;
        }),

    // Instagram (opcional)
    body('instagram')
        .optional()
        .matches(/^@?[a-zA-Z0-9._]{1,30}$/)
        .withMessage('Formato de Instagram inválido'),

    // Sitio web (opcional)
    body('website')
        .optional()
        .isURL()
        .withMessage('El sitio web debe ser una URL válida')
];

/**
 * Validaciones para actualización de perfil de barbero
 */
const validateBarberUpdate = [
    body('businessName')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre del negocio debe tener entre 3 y 100 caracteres'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La descripción no puede exceder 1000 caracteres'),

    body('services.corteHombre.price')
        .optional()
        .isInt({ min: 1000, max: 100000 })
        .withMessage('El precio del corte de hombre debe estar entre $1.000 y $100.000'),

    body('services.corteBarba.price')
        .optional()
        .isInt({ min: 2000, max: 150000 })
        .withMessage('El precio del corte + barba debe estar entre $2.000 y $150.000'),

    body('whatsapp')
        .optional()
        .matches(/^\+?56[0-9]{8,9}$/)
        .withMessage('El número de WhatsApp debe tener formato chileno válido'),
];

/**
 * Validaciones para disponibilidad de barbero
 */
const validateAvailability = [
    body('isAvailable')
        .optional()
        .isBoolean()
        .withMessage('isAvailable debe ser true o false'),

    body('acceptsImmediate')
        .optional()
        .isBoolean()
        .withMessage('acceptsImmediate debe ser true o false'),

    body('currentStatus')
        .optional()
        .isIn(['available', 'busy', 'break', 'offline'])
        .withMessage('El estado actual debe ser: available, busy, break o offline'),

    body('schedule')
        .optional()
        .isArray()
        .withMessage('El horario debe ser un array')
        .custom((schedule) => {
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            
            for (const daySchedule of schedule) {
                if (!validDays.includes(daySchedule.day)) {
                    throw new Error(`Día inválido: ${daySchedule.day}`);
                }
                
                if (daySchedule.isWorking && daySchedule.shifts) {
                    for (const shift of daySchedule.shifts) {
                        if (!shift.start || !shift.end) {
                            throw new Error('Los turnos deben tener hora de inicio y fin');
                        }
                        
                        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(shift.start) ||
                            !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(shift.end)) {
                            throw new Error('Formato de hora inválido (debe ser HH:MM)');
                        }
                        
                        if (shift.start >= shift.end) {
                            throw new Error('La hora de inicio debe ser menor que la de fin');
                        }
                    }
                }
            }
            
            return true;
        }),

    body('bookingSettings.minimumAdvanceTime')
        .optional()
        .isInt({ min: 0, max: 1440 })
        .withMessage('El tiempo mínimo de anticipación debe estar entre 0 y 1440 minutos'),

    body('bookingSettings.maximumAdvanceDays')
        .optional()
        .isInt({ min: 1, max: 90 })
        .withMessage('Los días máximos de anticipación deben estar entre 1 y 90')
];

/**
 * Validaciones para galería de imágenes
 */
const validateGallery = [
    body('images')
        .isArray({ min: 1, max: 10 })
        .withMessage('Debe subir entre 1 y 10 imágenes'),

    body('images.*.caption')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('El caption no puede exceder 200 caracteres'),

    body('mainImageIndex')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El índice de imagen principal debe ser un número válido')
        .custom((value, { req }) => {
            if (req.body.images && value >= req.body.images.length) {
                throw new Error('El índice de imagen principal está fuera de rango');
            }
            return true;
        })
];

/**
 * Middleware para verificar que el usuario puede registrarse como barbero
 */
const canRegisterAsBarber = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Autenticación requerida',
                code: 'AUTH_REQUIRED'
            });
        }

        // Verificar que no sea ya un barbero
        if (req.user.role === 'barber') {
            return res.status(400).json({
                success: false,
                error: 'Ya es un barbero registrado',
                code: 'ALREADY_BARBER'
            });
        }

        // Verificar que el email esté verificado
        if (!req.user.isVerified) {
            return res.status(403).json({
                success: false,
                error: 'Email no verificado',
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Debe verificar su email antes de registrarse como barbero'
            });
        }

        // Verificar que no tenga penalizaciones críticas
        const Penalty = require('../models/Penalty');
        const criticalPenalties = await Penalty.find({
            userId: req.user.id,
            status: 'active',
            severity: 'critical'
        });

        if (criticalPenalties.length > 0) {
            return res.status(403).json({
                success: false,
                error: 'Penalizaciones activas',
                code: 'ACTIVE_PENALTIES',
                message: 'No puede registrarse como barbero debido a penalizaciones críticas'
            });
        }

        // Verificar que no exista ya un perfil de barbero
        const existingBarber = await Barber.findOne({ userId: req.user.id });
        if (existingBarber) {
            return res.status(400).json({
                success: false,
                error: 'Ya tiene un perfil de barbero',
                code: 'BARBER_PROFILE_EXISTS'
            });
        }

        next();
    } catch (error) {
        console.error('Error en verificación de elegibilidad de barbero:', error);
        return res.status(500).json({
            success: false,
            error: 'Error de verificación',
            code: 'VERIFICATION_ERROR'
        });
    }
};

/**
 * Middleware para verificar que el barbero puede actualizar servicios
 */
const canUpdateServices = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'barber') {
            return res.status(403).json({
                success: false,
                error: 'Solo barberos pueden actualizar servicios',
                code: 'BARBER_ONLY'
            });
        }

        const barber = await Barber.findOne({ userId: req.user.id });
        if (!barber) {
            return res.status(404).json({
                success: false,
                error: 'Perfil de barbero no encontrado',
                code: 'BARBER_NOT_FOUND'
            });
        }

        // Verificar que no tenga reservas activas si cambia precios
        if (req.body.services) {
            const Booking = require('../models/Booking');
            const activeBookings = await Booking.find({
                barberId: barber._id,
                status: { $in: ['pending', 'accepted', 'confirmed'] }
            });

            if (activeBookings.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No puede cambiar precios con reservas activas',
                    code: 'ACTIVE_BOOKINGS',
                    message: 'Complete o cancele las reservas pendientes antes de cambiar precios',
                    activeBookingsCount: activeBookings.length
                });
            }
        }

        req.barber = barber;
        next();
    } catch (error) {
        console.error('Error en verificación de actualización de servicios:', error);
        return res.status(500).json({
            success: false,
            error: 'Error de verificación',
            code: 'VERIFICATION_ERROR'
        });
    }
};

/**
 * Middleware para validar ubicación con Google Places
 */
const validateLocationWithGoogle = async (req, res, next) => {
    try {
        if (!req.body.location || !req.body.location.coordinates) {
            return next();
        }

        const [lng, lat] = req.body.location.coordinates;
        
        // Verificar que las coordenadas estén en Chile
        // Chile aproximadamente: lat -17 a -56, lng -66 a -109
        if (lat > -17 || lat < -56 || lng > -66 || lng < -109) {
            return res.status(400).json({
                success: false,
                error: 'Ubicación fuera de Chile',
                code: 'INVALID_LOCATION',
                message: 'La ubicación debe estar dentro del territorio chileno'
            });
        }

        // Opcional: Verificar con Google Places API que la dirección existe
        if (req.body.location.googlePlaceId) {
            try {
                const googlePlacesUtil = require('../utils/googlePlaces');
                const placeDetails = await googlePlacesUtil.getPlaceDetails(req.body.location.googlePlaceId);
                
                if (!placeDetails) {
                    return res.status(400).json({
                        success: false,
                        error: 'Lugar de Google no válido',
                        code: 'INVALID_GOOGLE_PLACE'
                    });
                }

                // Agregar información verificada de Google
                req.body.location.verified = true;
                req.body.location.googleData = placeDetails;
            } catch (error) {
                console.warn('Error al verificar con Google Places:', error);
                // Continuar sin verificación de Google
            }
        }

        next();
    } catch (error) {
        console.error('Error en validación de ubicación:', error);
        return res.status(500).json({
            success: false,
            error: 'Error de validación',
            code: 'VALIDATION_ERROR'
        });
    }
};

/**
 * Middleware para validar imágenes de verificación (CI)
 */
const validateVerificationImages = [
    body('ciImages.front')
        .notEmpty()
        .withMessage('La imagen frontal de la CI es requerida')
        .custom((value) => {
            if (!value.startsWith('/uploads/') && !value.startsWith('http')) {
                throw new Error('URL de imagen frontal inválida');
            }
            return true;
        }),

    body('ciImages.back')
        .notEmpty()
        .withMessage('La imagen trasera de la CI es requerida')
        .custom((value) => {
            if (!value.startsWith('/uploads/') && !value.startsWith('http')) {
                throw new Error('URL de imagen trasera inválida');
            }
            return true;
        })
];

/**
 * Middleware para verificar límites de cambios por día
 */
const checkDailyLimits = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'barber') {
            return next();
        }

        const barber = await Barber.findOne({ userId: req.user.id });
        if (!barber) {
            return next();
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Contar cambios de precio hoy
        const priceChangesToday = await barber.constructor.countDocuments({
            userId: req.user.id,
            updatedAt: { $gte: today, $lt: tomorrow },
            $or: [
                { 'services.corteHombre.price': { $exists: true } },
                { 'services.corteBarba.price': { $exists: true } }
            ]
        });

        // Límite de 3 cambios de precio por día
        if (req.body.services && priceChangesToday >= 3) {
            return res.status(429).json({
                success: false,
                error: 'Límite de cambios diarios excedido',
                code: 'DAILY_LIMIT_EXCEEDED',
                message: 'Solo puede cambiar precios 3 veces por día',
                remainingChanges: 0
            });
        }

        // Agregar información de límites a la respuesta
        req.dailyLimits = {
            priceChanges: {
                used: priceChangesToday,
                limit: 3,
                remaining: 3 - priceChangesToday
            }
        };

        next();
    } catch (error) {
        console.error('Error en verificación de límites diarios:', error);
        next(); // Continuar sin límites en caso de error
    }
};

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value,
            location: error.location
        }));

        return res.status(400).json({
            success: false,
            error: 'Errores de validación',
            code: 'VALIDATION_ERROR',
            message: 'Los datos enviados contienen errores',
            errors: formattedErrors,
            errorCount: formattedErrors.length
        });
    }
    
    next();
};

/**
 * Middleware para sanitizar datos de entrada
 */
const sanitizeBarberData = (req, res, next) => {
    try {
        if (req.body.businessName) {
            req.body.businessName = req.body.businessName.trim();
        }
        
        if (req.body.description) {
            req.body.description = req.body.description.trim();
        }
        
        if (req.body.whatsapp) {
            // Normalizar formato de WhatsApp
            let phone = req.body.whatsapp.replace(/\D/g, '');
            if (phone.startsWith('56')) {
                phone = '+' + phone;
            } else if (!phone.startsWith('+56')) {
                phone = '+56' + phone;
            }
            req.body.whatsapp = phone;
        }
        
        if (req.body.instagram) {
            // Remover @ si está presente
            req.body.instagram = req.body.instagram.replace('@', '');
        }
        
        if (req.body.services) {
            // Asegurar que los precios sean enteros
            if (req.body.services.corteHombre && req.body.services.corteHombre.price) {
                req.body.services.corteHombre.price = parseInt(req.body.services.corteHombre.price);
            }
            if (req.body.services.corteBarba && req.body.services.corteBarba.price) {
                req.body.services.corteBarba.price = parseInt(req.body.services.corteBarba.price);
            }
        }
        
        next();
    } catch (error) {
        console.error('Error en sanitización de datos:', error);
        return res.status(500).json({
            success: false,
            error: 'Error de procesamiento',
            code: 'SANITIZATION_ERROR'
        });
    }
};

/**
 * Middleware para verificar horarios de trabajo válidos
 */
const validateWorkingHours = (req, res, next) => {
    try {
        if (!req.body.schedule) {
            return next();
        }

        const schedule = req.body.schedule;
        let hasWorkingDay = false;

        for (const daySchedule of schedule) {
            if (daySchedule.isWorking) {
                hasWorkingDay = true;
                
                if (!daySchedule.shifts || daySchedule.shifts.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Días de trabajo deben tener turnos',
                        code: 'MISSING_SHIFTS',
                        message: `El día ${daySchedule.day} está marcado como día de trabajo pero no tiene turnos`
                    });
                }

                // Verificar que no haya solapamiento de turnos
                const shifts = daySchedule.shifts.sort((a, b) => a.start.localeCompare(b.start));
                for (let i = 0; i < shifts.length - 1; i++) {
                    if (shifts[i].end > shifts[i + 1].start) {
                        return res.status(400).json({
                            success: false,
                            error: 'Turnos solapados',
                            code: 'OVERLAPPING_SHIFTS',
                            message: `Los turnos del ${daySchedule.day} se solapan`
                        });
                    }
                }
            }
        }

        if (!hasWorkingDay) {
            return res.status(400).json({
                success: false,
                error: 'Debe tener al menos un día de trabajo',
                code: 'NO_WORKING_DAYS',
                message: 'Debe configurar al menos un día de trabajo'
            });
        }

        next();
    } catch (error) {
        console.error('Error en validación de horarios:', error);
        return res.status(500).json({
            success: false,
            error: 'Error de validación',
            code: 'VALIDATION_ERROR'
        });
    }
};

module.exports = {
    validateBarberRegistration,
    validateBarberUpdate,
    validateAvailability,
    validateGallery,
    validateVerificationImages,
    canRegisterAsBarber,
    canUpdateServices,
    validateLocationWithGoogle,
    checkDailyLimits,
    handleValidationErrors,
    sanitizeBarberData,
    validateWorkingHours
};
