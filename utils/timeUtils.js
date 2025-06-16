const config = require('../config/config');

/**
 * Configurar zona horaria chilena
 */
const CHILE_TIMEZONE = 'America/Santiago';
const LOCALE = 'es-CL';

/**
 * Obtener fecha actual en Chile
 * @returns {Date} Fecha actual en zona horaria chilena
 */
const getCurrentChileTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: CHILE_TIMEZONE }));
};

/**
 * Convertir fecha a zona horaria chilena
 * @param {Date|string} date - Fecha a convertir
 * @returns {Date} Fecha en zona horaria chilena
 */
const toChileTime = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Date(dateObj.toLocaleString("en-US", { timeZone: CHILE_TIMEZONE }));
};

/**
 * Formatear fecha en español chileno
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - Formato de salida
 * @returns {string} Fecha formateada
 */
const formatChileDate = (date, format = 'full') => {
    const dateObj = toChileTime(date);
    
    const formats = {
        'full': {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        },
        'short': {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        },
        'date-only': {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        },
        'time-only': {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        'datetime': {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        'relative': 'relative' // Para manejo especial
    };
    
    if (format === 'relative') {
        return getRelativeTime(dateObj);
    }
    
    return dateObj.toLocaleDateString(LOCALE, formats[format] || formats.full);
};

/**
 * Formatear hora en formato chileno
 * @param {Date|string} date - Fecha con hora
 * @param {boolean} includeSeconds - Incluir segundos
 * @returns {string} Hora formateada
 */
const formatChileTime = (date, includeSeconds = false) => {
    const dateObj = toChileTime(date);
    
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: CHILE_TIMEZONE
    };
    
    if (includeSeconds) {
        options.second = '2-digit';
    }
    
    return dateObj.toLocaleTimeString(LOCALE, options);
};

/**
 * Obtener tiempo relativo en español
 * @param {Date|string} date - Fecha de referencia
 * @param {Date} baseDate - Fecha base (por defecto: ahora)
 * @returns {string} Tiempo relativo formateado
 */
const getRelativeTime = (date, baseDate = null) => {
    const dateObj = toChileTime(date);
    const base = baseDate ? toChileTime(baseDate) : getCurrentChileTime();
    
    const diffMs = dateObj.getTime() - base.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Tiempo pasado
    if (diffMs < 0) {
        const absDiffMinutes = Math.abs(diffMinutes);
        const absDiffHours = Math.abs(diffHours);
        const absDiffDays = Math.abs(diffDays);
        
        if (absDiffMinutes < 1) return 'hace un momento';
        if (absDiffMinutes < 60) return `hace ${absDiffMinutes} minuto${absDiffMinutes > 1 ? 's' : ''}`;
        if (absDiffHours < 24) return `hace ${absDiffHours} hora${absDiffHours > 1 ? 's' : ''}`;
        if (absDiffDays < 7) return `hace ${absDiffDays} día${absDiffDays > 1 ? 's' : ''}`;
        if (absDiffDays < 30) return `hace ${Math.floor(absDiffDays / 7)} semana${Math.floor(absDiffDays / 7) > 1 ? 's' : ''}`;
        return formatChileDate(dateObj, 'short');
    }
    
    // Tiempo futuro
    if (diffMinutes < 1) return 'en un momento';
    if (diffMinutes < 60) return `en ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `en ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `en ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffDays < 30) return `en ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    
    return formatChileDate(dateObj, 'short');
};

/**
 * Verificar si una fecha está en horario laboral
 * @param {Date|string} date - Fecha a verificar
 * @param {Object} businessHours - Horarios de negocio
 * @returns {boolean} True si está en horario laboral
 */
const isBusinessHours = (date, businessHours = null) => {
    const dateObj = toChileTime(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    const currentMinutes = hour * 60 + minute;
    
    // Horarios por defecto si no se especifican
    const defaultHours = {
        1: { start: '09:00', end: '19:00', isOpen: true }, // Lunes
        2: { start: '09:00', end: '19:00', isOpen: true }, // Martes
        3: { start: '09:00', end: '19:00', isOpen: true }, // Miércoles
        4: { start: '09:00', end: '19:00', isOpen: true }, // Jueves
        5: { start: '09:00', end: '19:00', isOpen: true }, // Viernes
        6: { start: '09:00', end: '17:00', isOpen: true }, // Sábado
        0: { start: '10:00', end: '16:00', isOpen: false } // Domingo
    };
    
    const hours = businessHours || defaultHours;
    const daySchedule = hours[dayOfWeek];
    
    if (!daySchedule || !daySchedule.isOpen) {
        return false;
    }
    
    const startMinutes = parseTimeToMinutes(daySchedule.start);
    const endMinutes = parseTimeToMinutes(daySchedule.end);
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

/**
 * Convertir tiempo en formato HH:MM a minutos desde medianoche
 * @param {string} timeString - Tiempo en formato "HH:MM"
 * @returns {number} Minutos desde medianoche
 */
const parseTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Convertir minutos a formato HH:MM
 * @param {number} minutes - Minutos desde medianoche
 * @returns {string} Tiempo en formato "HH:MM"
 */
const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Generar slots de tiempo disponibles
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @param {number} slotDuration - Duración del slot en minutos
 * @param {Object} businessHours - Horarios de negocio
 * @param {Array} blockedSlots - Slots bloqueados
 * @returns {Array} Array de slots disponibles
 */
const generateTimeSlots = (startDate, endDate, slotDuration = 30, businessHours = null, blockedSlots = []) => {
    const slots = [];
    const start = toChileTime(startDate);
    const end = toChileTime(endDate);
    
    let currentSlot = new Date(start);
    
    while (currentSlot < end) {
        // Verificar si está en horario laboral
        if (isBusinessHours(currentSlot, businessHours)) {
            // Verificar si no está bloqueado
            const isBlocked = blockedSlots.some(blocked => {
                const blockedStart = toChileTime(blocked.start);
                const blockedEnd = toChileTime(blocked.end);
                return currentSlot >= blockedStart && currentSlot < blockedEnd;
            });
            
            if (!isBlocked) {
                slots.push({
                    start: new Date(currentSlot),
                    end: new Date(currentSlot.getTime() + slotDuration * 60 * 1000),
                    formatted: formatChileTime(currentSlot),
                    duration: slotDuration,
                    available: true
                });
            }
        }
        
        // Avanzar al siguiente slot
        currentSlot = new Date(currentSlot.getTime() + slotDuration * 60 * 1000);
    }
    
    return slots;
};

/**
 * Calcular duración entre dos fechas
 * @param {Date|string} startDate - Fecha de inicio
 * @param {Date|string} endDate - Fecha de fin
 * @returns {Object} Duración calculada
 */
const calculateDuration = (startDate, endDate) => {
    const start = toChileTime(startDate);
    const end = toChileTime(endDate);
    
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    return {
        milliseconds: diffMs,
        minutes: diffMinutes,
        hours: diffHours,
        days: diffDays,
        formatted: formatDuration(diffMinutes)
    };
};

/**
 * Formatear duración en texto legible
 * @param {number} minutes - Duración en minutos
 * @returns {string} Duración formateada
 */
const formatDuration = (minutes) => {
    if (minutes < 60) {
        return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    let result = `${hours} hora${hours !== 1 ? 's' : ''}`;
    
    if (remainingMinutes > 0) {
        result += ` y ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    return result;
};

/**
 * Verificar si una fecha está dentro del rango de reservas
 * @param {Date|string} date - Fecha a verificar
 * @param {number} maxDaysAhead - Máximo días en el futuro
 * @param {number} minHoursAhead - Mínimo horas en el futuro
 * @returns {Object} Resultado de validación
 */
const isValidBookingTime = (date, maxDaysAhead = 30, minHoursAhead = 2) => {
    const bookingDate = toChileTime(date);
    const now = getCurrentChileTime();
    
    const diffMs = bookingDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    const validations = {
        isValid: true,
        errors: [],
        warnings: []
    };
    
    // Verificar que no sea en el pasado
    if (diffMs < 0) {
        validations.isValid = false;
        validations.errors.push('No se pueden hacer reservas en el pasado');
    }
    
    // Verificar tiempo mínimo de anticipación
    if (diffHours < minHoursAhead) {
        validations.isValid = false;
        validations.errors.push(`Se requiere al menos ${minHoursAhead} horas de anticipación`);
    }
    
    // Verificar tiempo máximo de anticipación
    if (diffDays > maxDaysAhead) {
        validations.isValid = false;
        validations.errors.push(`No se pueden hacer reservas con más de ${maxDaysAhead} días de anticipación`);
    }
    
    // Verificar que sea en horario laboral
    if (!isBusinessHours(bookingDate)) {
        validations.warnings.push('La fecha está fuera del horario laboral habitual');
    }
    
    // Verificar día de la semana
    const dayOfWeek = bookingDate.getDay();
    if (dayOfWeek === 0) { // Domingo
        validations.warnings.push('Las reservas en domingo pueden tener disponibilidad limitada');
    }
    
    return validations;
};

/**
 * Obtener siguiente día laborable
 * @param {Date|string} date - Fecha de referencia
 * @param {Array} excludeDays - Días a excluir (0-6, 0=Domingo)
 * @returns {Date} Siguiente día laborable
 */
const getNextBusinessDay = (date, excludeDays = [0]) => {
    let nextDay = new Date(toChileTime(date));
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (excludeDays.includes(nextDay.getDay())) {
        nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
};

/**
 * Calcular tiempo de espera hasta próximo horario disponible
 * @param {Object} availability - Disponibilidad del barbero
 * @param {Date} fromTime - Desde qué hora calcular
 * @returns {Object} Información del próximo horario
 */
const getNextAvailableTime = (availability, fromTime = null) => {
    const now = fromTime ? toChileTime(fromTime) : getCurrentChileTime();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Buscar en el día actual primero
    if (availability[currentDay] && availability[currentDay].isOpen) {
        const daySchedule = availability[currentDay];
        const openMinutes = parseTimeToMinutes(daySchedule.openTime);
        const closeMinutes = parseTimeToMinutes(daySchedule.closeTime);
        
        if (currentMinutes < closeMinutes) {
            const nextSlot = Math.max(currentMinutes + 30, openMinutes); // Mínimo 30 min adelante
            if (nextSlot < closeMinutes) {
                const nextTime = new Date(now);
                nextTime.setHours(Math.floor(nextSlot / 60));
                nextTime.setMinutes(nextSlot % 60);
                nextTime.setSeconds(0);
                
                return {
                    date: nextTime,
                    isToday: true,
                    waitTime: calculateDuration(now, nextTime)
                };
            }
        }
    }
    
    // Buscar en los próximos días
    for (let i = 1; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (availability[checkDay] && availability[checkDay].isOpen) {
            const nextDate = new Date(now);
            nextDate.setDate(nextDate.getDate() + i);
            nextDate.setHours(parseInt(availability[checkDay].openTime.split(':')[0]));
            nextDate.setMinutes(parseInt(availability[checkDay].openTime.split(':')[1]));
            nextDate.setSeconds(0);
            
            return {
                date: nextDate,
                isToday: false,
                waitTime: calculateDuration(now, nextDate)
            };
        }
    }
    
    return null; // No hay disponibilidad en la próxima semana
};

/**
 * Validar formato de hora
 * @param {string} timeString - Hora en formato "HH:MM"
 * @returns {boolean} True si el formato es válido
 */
const isValidTimeFormat = (timeString) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
};

/**
 * Obtener horarios por defecto para barberos
 * @returns {Object} Horarios por defecto
 */
const getDefaultBusinessHours = () => {
    return {
        1: { isOpen: true, openTime: '09:00', closeTime: '19:00' }, // Lunes
        2: { isOpen: true, openTime: '09:00', closeTime: '19:00' }, // Martes
        3: { isOpen: true, openTime: '09:00', closeTime: '19:00' }, // Miércoles
        4: { isOpen: true, openTime: '09:00', closeTime: '19:00' }, // Jueves
        5: { isOpen: true, openTime: '09:00', closeTime: '19:00' }, // Viernes
        6: { isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Sábado
        0: { isOpen: false, openTime: '10:00', closeTime: '16:00' } // Domingo
    };
};

/**
 * Convertir disponibilidad de barbero a formato calendario
 * @param {Object} availability - Disponibilidad del barbero
 * @param {Date} startDate - Fecha de inicio
 * @param {number} days - Número de días a generar
 * @returns {Array} Calendario de disponibilidad
 */
const generateAvailabilityCalendar = (availability, startDate, days = 30) => {
    const calendar = [];
    const start = toChileTime(startDate);
    
    for (let i = 0; i < days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        
        const dayOfWeek = currentDate.getDay();
        const dayAvailability = availability[dayOfWeek];
        
        const dayInfo = {
            date: currentDate,
            dayOfWeek,
            dayName: currentDate.toLocaleDateString(LOCALE, { weekday: 'long' }),
            isOpen: dayAvailability?.isOpen || false,
            openTime: dayAvailability?.openTime || null,
            closeTime: dayAvailability?.closeTime || null,
            isPast: currentDate < getCurrentChileTime(),
            isToday: currentDate.toDateString() === getCurrentChileTime().toDateString()
        };
        
        calendar.push(dayInfo);
    }
    
    return calendar;
};

module.exports = {
    getCurrentChileTime,
    toChileTime,
    formatChileDate,
    formatChileTime,
    getRelativeTime,
    isBusinessHours,
    parseTimeToMinutes,
    minutesToTime,
    generateTimeSlots,
    calculateDuration,
    formatDuration,
    isValidBookingTime,
    getNextBusinessDay,
    getNextAvailableTime,
    isValidTimeFormat,
    getDefaultBusinessHours,
    generateAvailabilityCalendar,
    CHILE_TIMEZONE,
    LOCALE
};
