// ================================
// FORMATEADORES ESPECÍFICOS - CÓRTATE.CL
// ================================

// Formatear mensaje de WhatsApp para reservas
export const formatWhatsAppBookingMessage = (booking, barber) => {
  let message = `¡Hola ${barber.name}! Te contacto desde Córtate.cl\n\n`;
  
  message += `🎯 SOLICITUD DE RESERVA\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Información del servicio
  if (booking.service) {
    message += `✂️ Servicio: ${booking.service.name}\n`;
    message += `💰 Precio: ${booking.service.price.toLocaleString('es-CL')}\n\n`;
  }
  
  // Información de tiempo
  if (booking.type === 'immediate') {
    message += `⚡ Tipo: CORTE INMEDIATO\n`;
    message += `🕐 Solicitud: Ahora mismo\n\n`;
  } else if (booking.scheduledDate && booking.scheduledTime) {
    const date = new Date(booking.scheduledDate);
    message += `📅 Fecha: ${date.toLocaleDateString('es-CL', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}\n`;
    message += `🕐 Hora: ${booking.scheduledTime}\n\n`;
  }
  
  // Información de ubicación
  if (booking.serviceType === 'home') {
    message += `🏠 Modalidad: A DOMICILIO\n`;
    if (booking.clientAddress) {
      message += `📍 Mi dirección: ${booking.clientAddress}\n`;
    }
  } else if (booking.serviceType === 'in_shop') {
    message += `🏪 Modalidad: EN LOCAL\n`;
    message += `📍 Tu dirección: ${barber.address || 'Ver perfil'}\n`;
  } else {
    message += `🔄 Modalidad: Local o domicilio (a coordinar)\n`;
  }
  
  message += `\n`;
  
  // Notas adicionales
  if (booking.notes) {
    message += `📝 Notas especiales:\n${booking.notes}\n\n`;
  }
  
  // Servicios adicionales
  if (booking.additionalServices && booking.additionalServices.length > 0) {
    message += `🎁 Servicios adicionales:\n`;
    booking.additionalServices.forEach(service => {
      message += `• ${service}\n`;
    });
    message += `\n`;
  }
  
  message += `¿Confirmas disponibilidad? ¡Gracias! 🙏`;
  
  return message;
};

// Formatear mensaje de WhatsApp general
export const formatWhatsAppGeneralMessage = (subject = '', customMessage = '') => {
  let message = `¡Hola! Te contacto desde Córtate.cl 💇‍♂️\n\n`;
  
  if (subject) {
    message += `📋 Consulta: ${subject}\n\n`;
  }
  
  if (customMessage) {
    message += `${customMessage}\n\n`;
  } else {
    message += `Me gustaría obtener más información sobre tus servicios.\n\n`;
  }
  
  message += `¿Podrías ayudarme? ¡Gracias! 🙏`;
  
  return message;
};

// Formatear número de teléfono para WhatsApp
export const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  
  // Limpiar número
  const cleaned = phone.replace(/[^\d]/g, '');
  
  // Asegurar código de país chileno
  if (cleaned.startsWith('56')) {
    return cleaned;
  } else if (cleaned.startsWith('9') && cleaned.length === 9) {
    return `56${cleaned}`;
  } else if (cleaned.length === 8) {
    return `56${cleaned}`;
  }
  
  return `56${cleaned}`;
};

// Formatear datos de perfil de barbero para mostrar
export const formatBarberProfile = (barber) => {
  const profile = {
    ...barber,
    formattedPhone: barber.phone ? formatPhoneDisplay(barber.phone) : null,
    formattedRating: barber.rating ? barber.rating.toFixed(1) : '0.0',
    formattedReviews: barber.totalReviews || 0,
    priceRange: barber.services ? getPriceRange(barber.services) : null,
    distance: barber.distance ? formatDistance(barber.distance) : null,
    statusText: getStatusText(barber.status),
    availabilityText: getAvailabilityText(barber.availability),
    serviceTypesText: getServiceTypesText(barber.serviceTypes)
  };
  
  return profile;
};

// Formatear teléfono para mostrar
export const formatPhoneDisplay = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/[^\d]/g, '');
  const local = cleaned.startsWith('56') ? cleaned.slice(2) : cleaned;
  
  if (local.length === 8) {
    return `${local.slice(0, 4)}-${local.slice(4)}`;
  } else if (local.length === 9) {
    return `+56 ${local.slice(0, 1)} ${local.slice(1, 5)}-${local.slice(5)}`;
  }
  
  return phone;
};

// Obtener rango de precios de servicios
export const getPriceRange = (services) => {
  if (!services || services.length === 0) return null;
  
  const prices = services.map(s => s.price).filter(p => p > 0);
  if (prices.length === 0) return null;
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  if (min === max) {
    return `${min.toLocaleString('es-CL')}`;
  } else {
    return `${min.toLocaleString('es-CL')} - ${max.toLocaleString('es-CL')}`;
  }
};

// Formatear distancia
export const formatDistance = (distance) => {
  if (!distance) return '';
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else {
    return `${distance.toFixed(1)}km`;
  }
};

// Obtener texto de estado
export const getStatusText = (status) => {
  const statusTexts = {
    available: 'Disponible',
    busy: 'Ocupado',
    offline: 'Desconectado',
    break: 'En descanso'
  };
  
  return statusTexts[status] || 'Desconocido';
};

// Obtener texto de disponibilidad
export const getAvailabilityText = (availability) => {
  if (!availability) return 'Disponibilidad no especificada';
  
  let text = '';
  
  if (availability.immediateBooking) {
    text = 'Acepta cortes inmediatos';
  } else {
    text = 'Solo reservas programadas';
  }
  
  if (availability.homeService) {
    text += ' • Servicio a domicilio';
  }
  
  return text;
};

// Obtener texto de tipos de servicio
export const getServiceTypesText = (serviceTypes) => {
  if (!serviceTypes || serviceTypes.length === 0) return '';
  
  const typeTexts = {
    in_shop: 'En local',
    home: 'A domicilio',
    both: 'Local y domicilio'
  };
  
  return serviceTypes.map(type => typeTexts[type] || type).join(', ');
};

// Formatear horarios de trabajo
export const formatWorkingHours = (workingHours) => {
  if (!workingHours) return {};
  
  const days = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 
    'Jueves', 'Viernes', 'Sábado'
  ];
  
  return days.map((day, index) => {
    const dayHours = workingHours[index];
    
    if (!dayHours || !dayHours.isOpen) {
      return {
        day,
        isOpen: false,
        text: 'Cerrado'
      };
    }
    
    return {
      day,
      isOpen: true,
      start: dayHours.start,
      end: dayHours.end,
      text: `${dayHours.start} - ${dayHours.end}`
    };
  });
};

// Formatear reseña para mostrar
export const formatReview = (review) => {
  return {
    ...review,
    formattedDate: review.createdAt ? formatRelativeTime(review.createdAt) : '',
    ratingStars: generateStarRating(review.rating),
    truncatedComment: review.comment ? truncateText(review.comment, 150) : '',
    authorInitials: getInitials(review.author?.name || 'Usuario')
  };
};

// Generar estrellas para rating
export const generateStarRating = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('★');
    } else if (i === fullStars && hasHalfStar) {
      stars.push('☆');
    } else {
      stars.push('☆');
    }
  }
  
  return stars.join('');
};

// Formatear estadísticas de barbero
export const formatBarberStats = (stats) => {
  return {
    totalCuts: stats.totalBookings || 0,
    totalRevenue: formatPrice(stats.totalRevenue || 0),
    averageRating: (stats.averageRating || 0).toFixed(1),
    totalReviews: stats.totalReviews || 0,
    completionRate: stats.completionRate ? `${(stats.completionRate * 100).toFixed(1)}%` : '0%',
    responseTime: stats.averageResponseTime ? formatResponseTime(stats.averageResponseTime) : 'N/A'
  };
};

// Formatear tiempo de respuesta
export const formatResponseTime = (minutes) => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${Math.round(remainingMinutes)}min`;
    }
  }
};

// Formatear historial de reservas
export const formatBookingHistory = (bookings) => {
  return bookings.map(booking => ({
    ...booking,
    formattedDate: booking.scheduledDate ? formatDate(booking.scheduledDate) : '',
    formattedTime: booking.scheduledTime || '',
    formattedPrice: formatPrice(booking.totalPrice),
    statusText: getBookingStatusText(booking.status),
    statusColor: getBookingStatusColor(booking.status),
    canReview: booking.status === 'completed' && !booking.review,
    canCancel: ['pending', 'confirmed'].includes(booking.status) && 
               canCancelBooking(booking.scheduledDate)
  }));
};

// Obtener texto de estado de reserva
export const getBookingStatusText = (status) => {
  const statusTexts = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    'in-progress': 'En progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    'no-show': 'No asistió',
    rejected: 'Rechazada'
  };
  
  return statusTexts[status] || status;
};

// Obtener color de estado de reserva
export const getBookingStatusColor = (status) => {
  const statusColors = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    'in-progress': '#3b82f6',
    completed: '#6b7280',
    cancelled: '#ef4444',
    'no-show': '#dc2626',
    rejected: '#ef4444'
  };
  
  return statusColors[status] || '#6b7280';
};

// Verificar si se puede cancelar reserva
export const canCancelBooking = (scheduledDate) => {
  if (!scheduledDate) return false;
  
  const now = new Date();
  const bookingDate = new Date(scheduledDate);
  const hoursUntil = (bookingDate - now) / (1000 * 60 * 60);
  
  return hoursUntil >= 0.5; // 30 minutos de anticipación
};

// Formatear tiempo relativo
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const dateObj = new Date(date);
  const diffInMs = now - dateObj;
  const diffInMinutes = diffInMs / (1000 * 60);
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  if (diffInMinutes < 1) {
    return 'Ahora mismo';
  } else if (diffInMinutes < 60) {
    const minutes = Math.floor(diffInMinutes);
    return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  } else if (diffInDays < 7) {
    const days = Math.floor(diffInDays);
    return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  } else {
    return formatDate(dateObj, { month: 'short', day: 'numeric' });
  }
};

// Formatear fecha
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString('es-CL', { ...defaultOptions, ...options });
};

// Formatear precio
export const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) {
    return '$0';
  }
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

// Truncar texto
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

// Obtener iniciales
export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Formatear filtros aplicados para mostrar
export const formatAppliedFilters = (filters) => {
  const applied = [];
  
  if (filters.search) {
    applied.push(`Búsqueda: "${filters.search}"`);
  }
  
  if (filters.rating) {
    applied.push(`${filters.rating}+ estrellas`);
  }
  
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    if (max === Infinity) {
      applied.push(`Desde ${min.toLocaleString('es-CL')}`);
    } else {
      applied.push(`${min.toLocaleString('es-CL')} - ${max.toLocaleString('es-CL')}`);
    }
  }
  
  if (filters.serviceType) {
    const typeTexts = {
      in_shop: 'En local',
      home: 'A domicilio',
      both: 'Local y domicilio'
    };
    applied.push(typeTexts[filters.serviceType]);
  }
  
  if (filters.available) {
    applied.push('Solo disponibles');
  }
  
  if (filters.distance) {
    applied.push(`Hasta ${filters.distance}km`);
  }
  
  return applied;
};

export default {
  formatWhatsAppBookingMessage,
  formatWhatsAppGeneralMessage,
  formatPhoneForWhatsApp,
  formatBarberProfile,
  formatPhoneDisplay,
  getPriceRange,
  formatDistance,
  getStatusText,
  getAvailabilityText,
  getServiceTypesText,
  formatWorkingHours,
  formatReview,
  generateStarRating,
  formatBarberStats,
  formatResponseTime,
  formatBookingHistory,
  getBookingStatusText,
  getBookingStatusColor,
  canCancelBooking,
  formatRelativeTime,
  formatDate,
  formatPrice,
  truncateText,
  getInitials,
  formatAppliedFilters
};
