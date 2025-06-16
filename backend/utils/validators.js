const config = require('../config/config');

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {Object} Resultado de validación
 */
const validateEmail = (email) => {
    const result = { isValid: false, errors: [] };
    
    if (!email) {
        result.errors.push('Email es requerido');
        return result;
    }
    
    if (typeof email !== 'string') {
        result.errors.push('Email debe ser una cadena de texto');
        return result;
    }
    
    // Regex para validar email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
        result.errors.push('Formato de email inválido');
        return result;
    }
    
    if (email.length > 254) {
        result.errors.push('Email demasiado largo (máximo 254 caracteres)');
        return result;
    }
    
    // Verificar dominios comunes mal escritos
    const commonTypos = {
        'gmail.co': 'gmail.com',
        'gmail.cl': 'gmail.com',
        'hotmai.com': 'hotmail.com',
        'outlok.com': 'outlook.com',
        'yahooo.com': 'yahoo.com'
    };
    
    const domain = email.split('@')[1];
    if (commonTypos[domain]) {
        result.errors.push(`¿Quisiste decir ${email.replace(domain, commonTypos[domain])}?`);
        return result;
    }
    
    result.isValid = true;
    return result;
};

/**
 * Validar contraseña
 * @param {string} password - Contraseña a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validatePassword = (password, options = {}) => {
    const result = { isValid: false, errors: [], strength: 'weak' };
    
    const opts = {
        minLength: options.minLength || config.PASSWORD_MIN_LENGTH || 6,
        requireUppercase: options.requireUppercase || config.PASSWORD_REQUIRE_UPPERCASE || false,
        requireNumbers: options.requireNumbers || config.PASSWORD_REQUIRE_NUMBERS || false,
        requireSpecial: options.requireSpecial || config.PASSWORD_REQUIRE_SPECIAL || false,
        maxLength: options.maxLength || 128
    };
    
    if (!password) {
        result.errors.push('Contraseña es requerida');
        return result;
    }
    
    if (typeof password !== 'string') {
        result.errors.push('Contraseña debe ser una cadena de texto');
        return result;
    }
    
    if (password.length < opts.minLength) {
        result.errors.push(`Contraseña debe tener al menos ${opts.minLength} caracteres`);
    }
    
    if (password.length > opts.maxLength) {
        result.errors.push(`Contraseña no puede tener más de ${opts.maxLength} caracteres`);
    }
    
    if (opts.requireUppercase && !/[A-Z]/.test(password)) {
        result.errors.push('Contraseña debe incluir al menos una letra mayúscula');
    }
    
    if (opts.requireNumbers && !/\d/.test(password)) {
        result.errors.push('Contraseña debe incluir al menos un número');
    }
    
    if (opts.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        result.errors.push('Contraseña debe incluir al menos un carácter especial');
    }
    
    // Verificar contraseñas comunes
    const commonPasswords = [
        '123456', 'password', '123456789', '12345678', '12345',
        'qwerty', 'abc123', '111111', 'admin', 'letmein',
        'welcome', 'monkey', '1234567890', 'chile123'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
        result.errors.push('Contraseña demasiado común, elige una más segura');
    }
    
    // Calcular fortaleza
    let strengthScore = 0;
    if (password.length >= 8) strengthScore++;
    if (/[a-z]/.test(password)) strengthScore++;
    if (/[A-Z]/.test(password)) strengthScore++;
    if (/\d/.test(password)) strengthScore++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore++;
    if (password.length >= 12) strengthScore++;
    
    if (strengthScore >= 5) result.strength = 'strong';
    else if (strengthScore >= 3) result.strength = 'medium';
    else result.strength = 'weak';
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Validar teléfono chileno
 * @param {string} phone - Teléfono a validar
 * @returns {Object} Resultado de validación
 */
const validateChileanPhone = (phone) => {
    const result = { isValid: false, errors: [], formatted: null };
    
    if (!phone) {
        result.errors.push('Teléfono es requerido');
        return result;
    }
    
    // Limpiar el número
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Formatos válidos chilenos:
    // 569XXXXXXXX (12 dígitos con código país)
    // 9XXXXXXXX (9 dígitos celular)
    // 2XXXXXXXX (9 dígitos fijo Santiago)
    // 22XXXXXXX (8 dígitos fijo Santiago sin 0)
    // XXXXXXXX (8 dígitos fijo otras regiones)
    
    if (cleanPhone.length < 8) {
        result.errors.push('Teléfono muy corto');
        return result;
    }
    
    if (cleanPhone.length > 12) {
        result.errors.push('Teléfono muy largo');
        return result;
    }
    
    // Validar formato celular
    if (cleanPhone.startsWith('569') && cleanPhone.length === 12) {
        result.formatted = `+${cleanPhone}`;
        result.isValid = true;
        return result;
    }
    
    if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
        result.formatted = `+56${cleanPhone}`;
        result.isValid = true;
        return result;
    }
    
    // Validar formato fijo Santiago
    if (cleanPhone.startsWith('2') && (cleanPhone.length === 9 || cleanPhone.length === 8)) {
        result.formatted = `+56${cleanPhone}`;
        result.isValid = true;
        return result;
    }
    
    // Validar formato fijo regiones (8 dígitos)
    if (cleanPhone.length === 8 && !cleanPhone.startsWith('0')) {
        result.formatted = `+56${cleanPhone}`;
        result.isValid = true;
        return result;
    }
    
    result.errors.push('Formato de teléfono chileno inválido');
    return result;
};

/**
 * Validar RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {Object} Resultado de validación
 */
const validateRUT = (rut) => {
    const result = { isValid: false, errors: [], formatted: null };
    
    if (!rut) {
        result.errors.push('RUT es requerido');
        return result;
    }
    
    // Limpiar RUT
    const cleanRUT = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (cleanRUT.length < 8 || cleanRUT.length > 9) {
        result.errors.push('RUT debe tener 8 o 9 dígitos');
        return result;
    }
    
    const body = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1);
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    let calculatedDV = 11 - remainder;
    
    if (calculatedDV === 11) calculatedDV = '0';
    else if (calculatedDV === 10) calculatedDV = 'K';
    else calculatedDV = calculatedDV.toString();
    
    if (dv !== calculatedDV) {
        result.errors.push('RUT inválido - dígito verificador incorrecto');
        return result;
    }
    
    // Formatear RUT
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    result.formatted = `${formattedBody}-${dv}`;
    result.isValid = true;
    
    return result;
};

/**
 * Validar nombre completo
 * @param {string} name - Nombre a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validateName = (name, options = {}) => {
    const result = { isValid: false, errors: [] };
    
    const opts = {
        minLength: options.minLength || 2,
        maxLength: options.maxLength || 50,
        allowNumbers: options.allowNumbers || false,
        allowSpecialChars: options.allowSpecialChars || false
    };
    
    if (!name) {
        result.errors.push('Nombre es requerido');
        return result;
    }
    
    if (typeof name !== 'string') {
        result.errors.push('Nombre debe ser una cadena de texto');
        return result;
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < opts.minLength) {
        result.errors.push(`Nombre debe tener al menos ${opts.minLength} caracteres`);
    }
    
    if (trimmedName.length > opts.maxLength) {
        result.errors.push(`Nombre no puede tener más de ${opts.maxLength} caracteres`);
    }
    
    // Validar caracteres permitidos
    if (!opts.allowNumbers && /\d/.test(trimmedName)) {
        result.errors.push('Nombre no puede contener números');
    }
    
    if (!opts.allowSpecialChars && /[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/.test(trimmedName)) {
        result.errors.push('Nombre contiene caracteres no válidos');
    }
    
    // Verificar que no sea solo espacios
    if (!trimmedName) {
        result.errors.push('Nombre no puede estar vacío');
    }
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Validar dirección chilena
 * @param {string} address - Dirección a validar
 * @returns {Object} Resultado de validación
 */
const validateAddress = (address) => {
    const result = { isValid: false, errors: [], suggestions: [] };
    
    if (!address) {
        result.errors.push('Dirección es requerida');
        return result;
    }
    
    if (typeof address !== 'string') {
        result.errors.push('Dirección debe ser una cadena de texto');
        return result;
    }
    
    const trimmedAddress = address.trim();
    
    if (trimmedAddress.length < 10) {
        result.errors.push('Dirección muy corta (mínimo 10 caracteres)');
    }
    
    if (trimmedAddress.length > 200) {
        result.errors.push('Dirección muy larga (máximo 200 caracteres)');
    }
    
    // Verificar que contenga elementos básicos de una dirección
    const hasNumber = /\d/.test(trimmedAddress);
    const hasStreetName = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]{3,}/.test(trimmedAddress);
    
    if (!hasNumber) {
        result.suggestions.push('Incluye el número de la dirección');
    }
    
    if (!hasStreetName) {
        result.errors.push('Dirección debe incluir nombre de calle');
    }
    
    // Palabras comunes en direcciones chilenas
    const streetKeywords = /\b(calle|avenida|pasaje|camino|av\.|avda\.|pje\.|psj\.|villa|población|block)\b/i;
    
    if (!streetKeywords.test(trimmedAddress)) {
        result.suggestions.push('Especifica si es calle, avenida, pasaje, etc.');
    }
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Validar precio en pesos chilenos
 * @param {number|string} price - Precio a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validatePrice = (price, options = {}) => {
    const result = { isValid: false, errors: [], formatted: null };
    
    const opts = {
        min: options.min || 1000, // Mínimo $1.000
        max: options.max || 500000, // Máximo $500.000
        allowZero: options.allowZero || false
    };
    
    if (price === null || price === undefined) {
        result.errors.push('Precio es requerido');
        return result;
    }
    
    const numPrice = typeof price === 'string' ? 
        parseFloat(price.replace(/[^\d.-]/g, '')) : 
        parseFloat(price);
    
    if (isNaN(numPrice)) {
        result.errors.push('Precio debe ser un número válido');
        return result;
    }
    
    if (!opts.allowZero && numPrice <= 0) {
        result.errors.push('Precio debe ser mayor a cero');
        return result;
    }
    
    if (numPrice < opts.min) {
        result.errors.push(`Precio mínimo es ${opts.min.toLocaleString('es-CL')}`);
    }
    
    if (numPrice > opts.max) {
        result.errors.push(`Precio máximo es ${opts.max.toLocaleString('es-CL')}`);
    }
    
    // Verificar que el precio sea razonable (múltiplo de 500)
    if (numPrice % 500 !== 0 && numPrice > 1000) {
        result.suggestions = [`¿Quisiste decir ${Math.round(numPrice / 500) * 500}?`];
    }
    
    result.formatted = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(numPrice);
    
    result.isValid = result.errors.length === 0;
    result.value = numPrice;
    
    return result;
};

/**
 * Validar coordenadas geográficas
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Object} Resultado de validación
 */
const validateCoordinates = (lat, lng) => {
    const result = { isValid: false, errors: [] };
    
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
        result.errors.push('Coordenadas son requeridas');
        return result;
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
        result.errors.push('Coordenadas deben ser números válidos');
        return result;
    }
    
    // Validar rango general
    if (latitude < -90 || latitude > 90) {
        result.errors.push('Latitud debe estar entre -90 y 90');
    }
    
    if (longitude < -180 || longitude > 180) {
        result.errors.push('Longitud debe estar entre -180 y 180');
    }
    
    // Validar que esté dentro de Chile (aproximadamente)
    const chileBounds = {
        north: -17.5,
        south: -56,
        east: -66.4,
        west: -75.6
    };
    
    if (latitude > chileBounds.north || latitude < chileBounds.south ||
        longitude > chileBounds.east || longitude < chileBounds.west) {
        result.errors.push('Coordenadas fuera del territorio chileno');
    }
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Validar horario de disponibilidad
 * @param {Object} schedule - Horario a validar
 * @returns {Object} Resultado de validación
 */
const validateSchedule = (schedule) => {
    const result = { isValid: false, errors: [] };
    
    if (!schedule || typeof schedule !== 'object') {
        result.errors.push('Horario es requerido');
        return result;
    }
    
    const validDays = [0, 1, 2, 3, 4, 5, 6]; // 0=Domingo, 6=Sábado
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    for (const day of validDays) {
        const daySchedule = schedule[day];
        
        if (!daySchedule) continue;
        
        if (typeof daySchedule.isOpen !== 'boolean') {
            result.errors.push(`Día ${day}: isOpen debe ser true o false`);
            continue;
        }
        
        if (daySchedule.isOpen) {
            if (!daySchedule.openTime || !timeRegex.test(daySchedule.openTime)) {
                result.errors.push(`Día ${day}: hora de apertura inválida (formato HH:MM)`);
            }
            
            if (!daySchedule.closeTime || !timeRegex.test(daySchedule.closeTime)) {
                result.errors.push(`Día ${day}: hora de cierre inválida (formato HH:MM)`);
            }
            
            if (daySchedule.openTime && daySchedule.closeTime) {
                const openMinutes = parseTimeToMinutes(daySchedule.openTime);
                const closeMinutes = parseTimeToMinutes(daySchedule.closeTime);
                
                if (openMinutes >= closeMinutes) {
                    result.errors.push(`Día ${day}: hora de apertura debe ser anterior a la de cierre`);
                }
                
                if (closeMinutes - openMinutes < 60) {
                    result.errors.push(`Día ${day}: debe estar abierto al menos 1 hora`);
                }
            }
        }
    }
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Validar servicios de barbero
 * @param {Object} services - Servicios a validar
 * @returns {Object} Resultado de validación
 */
const validateServices = (services) => {
    const result = { isValid: false, errors: [] };
    
    if (!services || typeof services !== 'object') {
        result.errors.push('Servicios son requeridos');
        return result;
    }
    
    // Servicios obligatorios
    const requiredServices = ['corteHombre', 'corteBarba'];
    
    for (const service of requiredServices) {
        if (!services[service]) {
            result.errors.push(`Servicio ${service} es obligatorio`);
            continue;
        }
        
        const serviceData = services[service];
        
        if (!serviceData.price || serviceData.price <= 0) {
            result.errors.push(`${service}: precio es requerido y debe ser mayor a 0`);
        }
        
        if (!serviceData.duration || serviceData.duration < 15) {
            result.errors.push(`${service}: duración mínima es 15 minutos`);
        }
        
        if (serviceData.duration > 240) {
            result.errors.push(`${service}: duración máxima es 240 minutos`);
        }
    }
    
    // Validar servicios opcionales si existen
    const optionalServices = ['corteNiño', 'corteExpress', 'diseño', 'padreFijo'];
    
    for (const service of optionalServices) {
        if (services[service]) {
            const serviceData = services[service];
            
            if (serviceData.price && serviceData.price <= 0) {
                result.errors.push(`${service}: precio debe ser mayor a 0 si se especifica`);
            }
        }
    }
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Validar archivo subido
 * @param {Object} file - Archivo a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} Resultado de validación
 */
const validateFile = (file, options = {}) => {
    const result = { isValid: false, errors: [] };
    
    const opts = {
        maxSize: options.maxSize || 5 * 1024 * 1024, // 5MB por defecto
        allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'],
        maxWidth: options.maxWidth || 2048,
        maxHeight: options.maxHeight || 2048
    };
    
    if (!file) {
        result.errors.push('Archivo es requerido');
        return result;
    }
    
    // Validar tamaño
    if (file.size > opts.maxSize) {
        const maxMB = opts.maxSize / (1024 * 1024);
        result.errors.push(`Archivo muy grande (máximo ${maxMB}MB)`);
    }
    
    // Validar tipo MIME
    if (!opts.allowedTypes.includes(file.mimetype)) {
        result.errors.push(`Tipo de archivo no permitido. Permitidos: ${opts.allowedTypes.join(', ')}`);
    }
    
    // Validar nombre del archivo
    if (file.originalname) {
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        const allowedExtensions = opts.allowedTypes.map(type => type.split('/')[1]);
        
        if (!allowedExtensions.includes(fileExtension) && fileExtension !== 'jpg') {
            result.errors.push(`Extensión de archivo no permitida: .${fileExtension}`);
        }
    }
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Validar datos de reseña
 * @param {Object} reviewData - Datos de la reseña
 * @returns {Object} Resultado de validación
 */
const validateReview = (reviewData) => {
    const result = { isValid: false, errors: [] };
    
    if (!reviewData) {
        result.errors.push('Datos de reseña son requeridos');
        return result;
    }
    
    // Validar rating
    if (!reviewData.rating || !Number.isInteger(reviewData.rating)) {
        result.errors.push('Rating es requerido y debe ser un número entero');
    } else if (reviewData.rating < 1 || reviewData.rating > 5) {
        result.errors.push('Rating debe estar entre 1 y 5');
    }
    
    // Validar comentario
    if (reviewData.comment) {
        if (typeof reviewData.comment !== 'string') {
            result.errors.push('Comentario debe ser texto');
        } else {
            const comment = reviewData.comment.trim();
            
            if (comment.length < 5) {
                result.errors.push('Comentario muy corto (mínimo 5 caracteres)');
            }
            
            if (comment.length > 500) {
                result.errors.push('Comentario muy largo (máximo 500 caracteres)');
            }
            
            // Verificar contenido inapropiado básico
            const inappropriateWords = [
                'puta', 'mierda', 'ctm', 'weon', 'culiao', 'pendejo'
            ];
            
            const hasInappropriate = inappropriateWords.some(word => 
                comment.toLowerCase().includes(word)
            );
            
            if (hasInappropriate) {
                result.errors.push('Comentario contiene lenguaje inapropiado');
            }
        }
    }
    
    // Validar fotos si existen
    if (reviewData.photos && Array.isArray(reviewData.photos)) {
        if (reviewData.photos.length > 3) {
            result.errors.push('Máximo 3 fotos por reseña');
        }
    }
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Función helper para convertir tiempo a minutos
 * @param {string} timeString - Tiempo en formato HH:MM
 * @returns {number} Minutos desde medianoche
 */
const parseTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Validar datos de reserva
 * @param {Object} bookingData - Datos de la reserva
 * @returns {Object} Resultado de validación
 */
const validateBooking = (bookingData) => {
    const result = { isValid: false, errors: [] };
    
    if (!bookingData) {
        result.errors.push('Datos de reserva son requeridos');
        return result;
    }
    
    // Validar barbero ID
    if (!bookingData.barberId) {
        result.errors.push('ID de barbero es requerido');
    }
    
    // Validar fecha y hora
    if (!bookingData.scheduledFor) {
        result.errors.push('Fecha y hora son requeridas');
    } else {
        const scheduledDate = new Date(bookingData.scheduledFor);
        const now = new Date();
        
        if (scheduledDate <= now) {
            result.errors.push('La fecha debe ser en el futuro');
        }
        
        const hoursAhead = (scheduledDate - now) / (1000 * 60 * 60);
        if (hoursAhead < 2) {
            result.errors.push('Debe reservar con al menos 2 horas de anticipación');
        }
        
        const daysAhead = hoursAhead / 24;
        if (daysAhead > 30) {
            result.errors.push('No se puede reservar con más de 30 días de anticipación');
        }
    }
    
    // Validar servicio
    if (!bookingData.service || !bookingData.service.type) {
        result.errors.push('Tipo de servicio es requerido');
    }
    
    // Validar ubicación
    if (!bookingData.location || !bookingData.location.type) {
        result.errors.push('Tipo de ubicación es requerido');
    } else if (bookingData.location.type === 'home' && !bookingData.location.address) {
        result.errors.push('Dirección es requerida para servicios a domicilio');
    }
    
    result.isValid = result.errors.length === 0;
    return result;
};

/**
 * Sanitizar texto para prevenir XSS
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
const sanitizeText = (text) => {
    if (typeof text !== 'string') return '';
    
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
};

/**
 * Validar datos completos según tipo
 * @param {string} type - Tipo de validación
 * @param {any} data - Datos a validar
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Resultado de validación
 */
const validate = (type, data, options = {}) => {
    switch (type) {
        case 'email':
            return validateEmail(data);
        case 'password':
            return validatePassword(data, options);
        case 'phone':
            return validateChileanPhone(data);
        case 'rut':
            return validateRUT(data);
        case 'name':
            return validateName(data, options);
        case 'address':
            return validateAddress(data);
        case 'price':
            return validatePrice(data, options);
        case 'coordinates':
            return validateCoordinates(data.lat, data.lng);
        case 'schedule':
            return validateSchedule(data);
        case 'services':
            return validateServices(data);
        case 'file':
            return validateFile(data, options);
        case 'review':
            return validateReview(data);
        case 'booking':
            return validateBooking(data);
        default:
            return { isValid: false, errors: ['Tipo de validación no reconocido'] };
    }
};

module.exports = {
    validateEmail,
    validatePassword,
    validateChileanPhone,
    validateRUT,
    validateName,
    validateAddress,
    validatePrice,
    validateCoordinates,
    validateSchedule,
    validateServices,
    validateFile,
    validateReview,
    validateBooking,
    sanitizeText,
    validate
};
