const config = require('../config/config');

/**
 * Formatear número de teléfono chileno para WhatsApp
 * @param {string} phone - Número de teléfono
 * @returns {string} Número formateado para WhatsApp
 */
const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    
    // Remover todos los caracteres no numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Si empieza con 56 (código de Chile), usar tal como está
    if (cleanPhone.startsWith('56')) {
        return cleanPhone;
    }
    
    // Si empieza con 9 (celular chileno), agregar 56
    if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
        return `56${cleanPhone}`;
    }
    
    // Si es número de 8 dígitos, agregar 569 (asumiendo celular)
    if (cleanPhone.length === 8) {
        return `569${cleanPhone}`;
    }
    
    // Si no coincide con formatos chilenos, devolver como está
    return cleanPhone;
};

/**
 * Crear URL de WhatsApp con mensaje predefinido
 * @param {string} phone - Número de teléfono
 * @param {string} message - Mensaje a enviar
 * @returns {string} URL de WhatsApp
 */
const createWhatsAppUrl = (phone, message = '') => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    if (!formattedPhone) return null;
    
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

/**
 * Formatear mensaje de confirmación de reserva
 * @param {Object} booking - Datos de la reserva
 * @param {Object} barber - Datos del barbero
 * @param {Object} client - Datos del cliente
 * @returns {string} Mensaje formateado
 */
const formatBookingConfirmation = (booking, barber, client) => {
    const serviceName = getServiceDisplayName(booking.service.type);
    const servicePrice = formatCurrency(booking.payment.amount);
    const bookingDate = formatDate(booking.scheduledFor);
    const bookingTime = formatTime(booking.scheduledFor);
    const location = booking.location.type === 'home' ? 'a domicilio' : 'en local';
    
    return `🔸 *CÓRTATE.CL - Confirmación de Reserva* 🔸

¡Hola ${client.profile.firstName}! Tu reserva ha sido confirmada ✅

📋 *Detalles de la reserva:*
• Reserva N°: *${booking.bookingNumber}*
• Servicio: *${serviceName}*
• Precio: *${servicePrice}*
• Modalidad: *${location}*
• Fecha: *${bookingDate}*
• Hora: *${bookingTime}*

👨‍💼 *Tu barbero:*
• Nombre: *${barber.businessName}*
• Contacto: ${barber.profile.contact.phone}
${barber.location.address ? `• Dirección: ${barber.location.address}` : ''}

${booking.location.type === 'home' ? 
`📍 *Dirección del servicio:*
${booking.location.address}
${booking.location.notes ? `Notas: ${booking.location.notes}` : ''}` : ''}

⏰ *Recordatorios importantes:*
• Llega 5 minutos antes de tu cita
• Confirma tu asistencia respondiendo este mensaje
• Puedes cancelar hasta 2 horas antes sin penalización

¿Tienes alguna consulta? ¡Responde este mensaje!

Gracias por elegir *CÓRTATE.CL* 💫`;
};

/**
 * Formatear mensaje de nueva reserva para barbero
 * @param {Object} booking - Datos de la reserva
 * @param {Object} client - Datos del cliente
 * @returns {string} Mensaje formateado
 */
const formatNewBookingForBarber = (booking, client) => {
    const serviceName = getServiceDisplayName(booking.service.type);
    const servicePrice = formatCurrency(booking.payment.amount);
    const bookingDate = formatDate(booking.scheduledFor);
    const bookingTime = formatTime(booking.scheduledFor);
    const location = booking.location.type === 'home' ? 'a domicilio' : 'en local';
    
    return `🔸 *CÓRTATE.CL - Nueva Reserva* 🔸

¡Tienes una nueva reserva! 🎉

📋 *Detalles:*
• Reserva N°: *${booking.bookingNumber}*
• Cliente: *${client.profile.firstName} ${client.profile.lastName}*
• Teléfono: ${client.profile.phone}
• Servicio: *${serviceName}*
• Precio: *${servicePrice}*
• Modalidad: *${location}*
• Fecha: *${bookingDate}*
• Hora: *${bookingTime}*

${booking.location.type === 'home' ? 
`📍 *Dirección del servicio:*
${booking.location.address}
${booking.location.notes ? `Notas: ${booking.location.notes}` : ''}` : ''}

${booking.notes ? `💬 *Notas del cliente:*
${booking.notes}` : ''}

⚡ *Acciones necesarias:*
• Acepta o rechaza la reserva en la app
• Contacta al cliente si tienes dudas
• Confirma la dirección si es a domicilio

¡Ingresa a tu dashboard para gestionar la reserva!`;
};

/**
 * Formatear mensaje de cancelación
 * @param {Object} booking - Datos de la reserva
 * @param {string} cancelledBy - Quien canceló ('client' o 'barber')
 * @param {string} reason - Motivo de cancelación
 * @returns {string} Mensaje formateado
 */
const formatBookingCancellation = (booking, cancelledBy, reason = '') => {
    const serviceName = getServiceDisplayName(booking.service.type);
    const bookingDate = formatDate(booking.scheduledFor);
    const bookingTime = formatTime(booking.scheduledFor);
    const refundInfo = booking.payment.refundAmount > 0 ? 
        `💰 *Reembolso:* ${formatCurrency(booking.payment.refundAmount)} será procesado en 2-3 días hábiles` : '';
    
    const cancellerText = cancelledBy === 'client' ? 'el cliente' : 'el barbero';
    
    return `🔸 *CÓRTATE.CL - Reserva Cancelada* 🔸

❌ Tu reserva ha sido cancelada por ${cancellerText}

📋 *Detalles de la reserva cancelada:*
• Reserva N°: *${booking.bookingNumber}*
• Servicio: *${serviceName}*
• Fecha: *${bookingDate}*
• Hora: *${bookingTime}*

${reason ? `💬 *Motivo:* ${reason}` : ''}

${refundInfo}

🔄 *¿Qué puedes hacer ahora?*
• Buscar otro barbero disponible
• Reprogramar para otra fecha
• Contactar soporte si tienes dudas

¡Esperamos verte pronto en *CÓRTATE.CL*! 🌟`;
};

/**
 * Formatear mensaje de recordatorio de cita
 * @param {Object} booking - Datos de la reserva
 * @param {Object} barber - Datos del barbero
 * @param {number} hoursUntil - Horas hasta la cita
 * @returns {string} Mensaje formateado
 */
const formatBookingReminder = (booking, barber, hoursUntil = 2) => {
    const serviceName = getServiceDisplayName(booking.service.type);
    const bookingTime = formatTime(booking.scheduledFor);
    const location = booking.location.type === 'home' ? 'a domicilio' : 'en local';
    
    return `🔸 *CÓRTATE.CL - Recordatorio de Cita* 🔸

⏰ ¡Tu cita es en ${hoursUntil} horas!

📋 *Detalles:*
• Servicio: *${serviceName}*
• Hora: *${bookingTime}*
• Barbero: *${barber.businessName}*
• Modalidad: *${location}*

${booking.location.type === 'home' ? 
`📍 *Dirección:* ${booking.location.address}` : 
`📍 *Dirección:* ${barber.location.address}`}

✅ *Confirma tu asistencia respondiendo:*
• "SÍ" - Confirmo mi asistencia
• "NO" - Necesito cancelar

${booking.location.type === 'home' ? 
'🏠 El barbero llegará a tu domicilio' : 
'🏪 Recuerda llegar 5 minutos antes'}

¡Te esperamos! 💫`;
};

/**
 * Formatear mensaje de servicio completado
 * @param {Object} booking - Datos de la reserva
 * @param {Object} barber - Datos del barbero
 * @returns {string} Mensaje formateado
 */
const formatServiceCompleted = (booking, barber) => {
    const serviceName = getServiceDisplayName(booking.service.type);
    const servicePrice = formatCurrency(booking.payment.amount);
    
    return `🔸 *CÓRTATE.CL - Servicio Completado* 🔸

✅ ¡Tu corte ha sido completado!

📋 *Resumen del servicio:*
• Servicio: *${serviceName}*
• Barbero: *${barber.businessName}*
• Precio: *${servicePrice}*
• Reserva N°: *${booking.bookingNumber}*

⭐ *¡Califica tu experiencia!*
Tu opinión es muy importante para nosotros y ayuda a otros usuarios.

🔗 Califica aquí: ${config.FRONTEND_URL}/review/${booking._id}

💡 *¿Te gustó el servicio?*
• Agrega a ${barber.businessName} a tus favoritos
• Comparte tu experiencia con amigos
• ¡Reserva tu próximo corte!

¡Gracias por elegir *CÓRTATE.CL*! 🌟`;
};

/**
 * Formatear mensaje de bienvenida para nuevos usuarios
 * @param {Object} user - Datos del usuario
 * @param {string} userType - Tipo de usuario ('client' o 'barber')
 * @returns {string} Mensaje formateado
 */
const formatWelcomeMessage = (user, userType) => {
    if (userType === 'client') {
        return `🔸 *¡Bienvenido a CÓRTATE.CL!* 🔸

¡Hola ${user.profile.firstName}! 👋

Te damos la bienvenida a la mejor plataforma de reservas de cortes de pelo en Chile 🇨🇱

🎯 *¿Qué puedes hacer?*
• Encontrar barberos cerca de ti
• Ver fotos y reseñas reales
• Reservar online en segundos
• Servicios a domicilio o en local
• Pagar de forma segura

📱 *Próximos pasos:*
1. Completa tu perfil
2. Encuentra tu barbero ideal
3. ¡Haz tu primera reserva!

🎁 *Oferta especial:* ¡10% de descuento en tu primera reserva!

¿Listo para tu mejor corte? 💫`;
    } else {
        return `🔸 *¡Bienvenido a CÓRTATE.CL!* 🔸

¡Hola! Bienvenido al equipo de barberos profesionales 👨‍💼

🎯 *¿Qué puedes hacer?*
• Crear tu perfil profesional
• Recibir reservas automáticamente
• Gestionar tu agenda
• Aumentar tus ingresos
• Construir tu reputación

📱 *Próximos pasos:*
1. Completa tu perfil profesional
2. Sube fotos de tu trabajo
3. Define tus servicios y precios
4. ¡Empieza a recibir clientes!

💼 *Únete a cientos de barberos que ya confían en nosotros*

¡Comienza a hacer crecer tu negocio! 🚀`;
    }
};

/**
 * Formatear mensaje de promoción especial
 * @param {Object} promotion - Datos de la promoción
 * @param {Object} user - Datos del usuario
 * @returns {string} Mensaje formateado
 */
const formatPromotionMessage = (promotion, user) => {
    return `🔸 *CÓRTATE.CL - Oferta Especial* 🔸

¡Hola ${user.profile.firstName}! 🎉

🔥 *${promotion.title}*

${promotion.description}

💰 *Tu descuento:* ${promotion.discount}% OFF
⏰ *Válido hasta:* ${formatDate(promotion.validUntil)}
🎯 *Código:* *${promotion.code}*

${promotion.conditions ? `📋 *Condiciones:*
${promotion.conditions}` : ''}

🚀 *¿Cómo usar tu descuento?*
1. Reserva tu corte en la app
2. Ingresa el código al pagar
3. ¡Disfruta tu descuento!

¡No dejes pasar esta oportunidad! ⭐`;
};

/**
 * Formatear mensaje de soporte/ayuda
 * @param {Object} user - Datos del usuario
 * @param {string} issue - Tipo de problema
 * @returns {string} Mensaje formateado
 */
const formatSupportMessage = (user, issue = 'general') => {
    const issueMessages = {
        booking: 'problemas con tu reserva',
        payment: 'consultas sobre pagos',
        barber: 'problemas con barberos',
        technical: 'problemas técnicos',
        general: 'consultas generales'
    };
    
    return `🔸 *CÓRTATE.CL - Soporte al Cliente* 🔸

¡Hola ${user.profile.firstName}! 👋

Estamos aquí para ayudarte con ${issueMessages[issue]} 🤝

📞 *Canales de soporte:*
• WhatsApp: Responde a este mensaje
• Email: soporte@cortate.cl
• App: Chat en vivo disponible

⏰ *Horarios de atención:*
• Lunes a Viernes: 9:00 - 20:00
• Sábados: 10:00 - 18:00
• Domingos: 10:00 - 16:00

🚀 *Respuesta promedio:* Menos de 2 horas

💡 *Preguntas frecuentes:* ${config.FRONTEND_URL}/faq

¡Estamos para ayudarte! 💫`;
};

/**
 * Obtener nombre de servicio para mostrar
 * @param {string} serviceType - Tipo de servicio
 * @returns {string} Nombre formateado del servicio
 */
const getServiceDisplayName = (serviceType) => {
    const serviceNames = {
        'corteHombre': 'Corte de pelo hombre',
        'corteBarba': 'Corte + barba',
        'corteNiño': 'Corte niño',
        'corteExpress': 'Corte exprés',
        'diseño': 'Diseño especial',
        'padreFijo': 'Padre e hijo',
        'afeitado': 'Afeitado completo',
        'arregloBarba': 'Arreglo de barba',
        'lavado': 'Lavado y peinado'
    };
    
    return serviceNames[serviceType] || serviceType;
};

/**
 * Formatear moneda chilena
 * @param {number} amount - Cantidad en pesos
 * @returns {string} Moneda formateada
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(amount);
};

/**
 * Formatear fecha en español
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Santiago'
    });
};

/**
 * Formatear hora en español
 * @param {Date} date - Fecha con hora a formatear
 * @returns {string} Hora formateada
 */
const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Santiago'
    });
};

/**
 * Crear mensaje personalizado genérico
 * @param {string} template - Plantilla del mensaje
 * @param {Object} variables - Variables para reemplazar
 * @returns {string} Mensaje personalizado
 */
const createCustomMessage = (template, variables = {}) => {
    let message = template;
    
    // Reemplazar variables en formato {{variable}}
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        message = message.replace(regex, variables[key]);
    });
    
    return message;
};

/**
 * Validar número de teléfono chileno
 * @param {string} phone - Número a validar
 * @returns {boolean} True si es válido
 */
const isValidChileanPhone = (phone) => {
    if (!phone) return false;
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Formatos válidos:
    // 569XXXXXXXX (con código país)
    // 9XXXXXXXX (celular)
    // 2XXXXXXXX (fijo Santiago)
    // XXXXXXXX (8 dígitos)
    
    return (
        (cleanPhone.startsWith('569') && cleanPhone.length === 12) ||
        (cleanPhone.startsWith('9') && cleanPhone.length === 9) ||
        (cleanPhone.startsWith('2') && cleanPhone.length === 9) ||
        (cleanPhone.length === 8)
    );
};

/**
 * Generar link de contacto directo con barbero
 * @param {Object} barber - Datos del barbero
 * @param {Object} booking - Datos de la reserva (opcional)
 * @returns {string} URL de WhatsApp
 */
const createBarberContactLink = (barber, booking = null) => {
    let message = `¡Hola! Te contacto desde *CÓRTATE.CL* 👋\n\n`;
    
    if (booking) {
        message += `Tengo una consulta sobre mi reserva N° *${booking.bookingNumber}*\n`;
        message += `Servicio: ${getServiceDisplayName(booking.service.type)}\n`;
        message += `Fecha: ${formatDate(booking.scheduledFor)}\n\n`;
    }
    
    message += `¿Podrías ayudarme? 😊`;
    
    return createWhatsAppUrl(barber.profile.contact.whatsapp, message);
};

/**
 * Crear mensaje de emergencia/urgencia
 * @param {Object} user - Datos del usuario
 * @param {string} urgencyType - Tipo de urgencia
 * @param {Object} details - Detalles adicionales
 * @returns {string} Mensaje formateado
 */
const formatEmergencyMessage = (user, urgencyType, details = {}) => {
    let message = `🔸 *CÓRTATE.CL - URGENTE* 🔸\n\n`;
    message += `¡Hola ${user.profile.firstName}! 🚨\n\n`;
    
    switch (urgencyType) {
        case 'barber_not_arrived':
            message += `Tu barbero no ha llegado a la cita programada.\n\n`;
            message += `📋 *Detalles:*\n`;
            message += `• Reserva: *${details.bookingNumber}*\n`;
            message += `• Hora programada: *${formatTime(details.scheduledFor)}*\n\n`;
            message += `🔄 *Acciones inmediatas:*\n`;
            message += `• Estamos contactando al barbero\n`;
            message += `• Te buscaremos una alternativa\n`;
            message += `• Recibirás compensación si aplica\n\n`;
            break;
            
        case 'client_emergency':
            message += `Recibimos tu solicitud de ayuda urgente.\n\n`;
            message += `🆘 *¿Qué está pasando?*\n`;
            message += `Nuestro equipo te contactará en los próximos minutos.\n\n`;
            break;
            
        case 'payment_issue':
            message += `Detectamos un problema con tu pago.\n\n`;
            message += `💳 *No te preocupes:*\n`;
            message += `• No se realizó ningún cobro\n`;
            message += `• Tu reserva sigue confirmada\n`;
            message += `• Puedes pagar al momento del servicio\n\n`;
            break;
    }
    
    message += `📞 *Contacto inmediato:*\n`;
    message += `Responde este mensaje o llama al +56 9 XXXX XXXX\n\n`;
    message += `¡Resolveremos esto juntos! 💪`;
    
    return message;
};

module.exports = {
    formatPhoneForWhatsApp,
    createWhatsAppUrl,
    formatBookingConfirmation,
    formatNewBookingForBarber,
    formatBookingCancellation,
    formatBookingReminder,
    formatServiceCompleted,
    formatWelcomeMessage,
    formatPromotionMessage,
    formatSupportMessage,
    getServiceDisplayName,
    formatCurrency,
    formatDate,
    formatTime,
    createCustomMessage,
    isValidChileanPhone,
    createBarberContactLink,
    formatEmergencyMessage
};
