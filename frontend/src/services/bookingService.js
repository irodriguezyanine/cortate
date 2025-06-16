import { bookingAPI } from './api';

// Servicio para manejar reservas
class BookingService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutos (datos más dinámicos)
  }

  // Crear nueva reserva
  async createBooking(bookingData, token) {
    try {
      // Validar datos de reserva
      const validation = this.validateBookingData(bookingData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          errors: validation.errors
        };
      }

      const response = await bookingAPI.create(bookingData);
      
      if (response.success) {
        // Limpiar cache de reservas
        this.clearBookingCache();
        
        return {
          success: true,
          data: response.data,
          message: 'Reserva creada exitosamente'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Error al crear la reserva'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Obtener reservas del usuario
  async getUserBookings(token) {
    try {
      const cacheKey = 'user_bookings';
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await bookingAPI.getByUser();
      
      if (response.success) {
        const result = {
          success: true,
          data: response.data || []
        };
        
        this.setCache(cacheKey, result);
        return result;
      } else {
        return {
          success: false,
          data: [],
          message: response.message || 'Error al obtener reservas'
        };
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Obtener reservas del barbero
  async getBarberBookings(token) {
    try {
      const cacheKey = 'barber_bookings';
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await bookingAPI.getByBarber();
      
      if (response.success) {
        const result = {
          success: true,
          data: response.data || []
        };
        
        this.setCache(cacheKey, result);
        return result;
      } else {
        return {
          success: false,
          data: [],
          message: response.message || 'Error al obtener reservas'
        };
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Obtener reserva por ID
  async getBookingById(id, token) {
    try {
      const response = await bookingAPI.getById(id);
      
      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          data: null,
          message: response.message || 'Reserva no encontrada'
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Confirmar reserva (para barberos)
  async confirmBooking(bookingId, token) {
    try {
      const response = await bookingAPI.confirm(bookingId);
      
      if (response.success) {
        this.clearBookingCache();
        
        return {
          success: true,
          data: response.data,
          message: 'Reserva confirmada exitosamente'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Error al confirmar reserva'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Cancelar reserva
  async cancelBooking(bookingId, reason = '', token) {
    try {
      const response = await bookingAPI.cancel(bookingId, reason);
      
      if (response.success) {
        this.clearBookingCache();
        
        return {
          success: true,
          data: response.data,
          message: 'Reserva cancelada exitosamente'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Error al cancelar reserva'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Completar reserva
  async completeBooking(bookingId, completionData = {}, token) {
    try {
      const response = await bookingAPI.complete(bookingId, completionData);
      
      if (response.success) {
        this.clearBookingCache();
        
        return {
          success: true,
          data: response.data,
          message: 'Reserva completada exitosamente'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Error al completar reserva'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Verificar disponibilidad
  async checkAvailability(barberId, date, time) {
    try {
      const response = await bookingAPI.checkAvailability(barberId, date, time);
      
      if (response.success) {
        return {
          success: true,
          available: response.data.available,
          conflictingBookings: response.data.conflictingBookings || []
        };
      } else {
        return {
          success: false,
          available: false,
          message: response.message || 'Error al verificar disponibilidad'
        };
      }
    } catch (error) {
      return {
        success: false,
        available: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Validar datos de reserva
  validateBookingData(data) {
    const errors = {};
    let isValid = true;

    // Validar barbero
    if (!data.barberId) {
      errors.barberId = 'Debes seleccionar un barbero';
      isValid = false;
    }

    // Validar servicio
    if (!data.service || !data.service.name || !data.service.price) {
      errors.service = 'Debes seleccionar un servicio válido';
      isValid = false;
    }

    // Validar tipo de reserva
    if (!data.type || !['scheduled', 'immediate'].includes(data.type)) {
      errors.type = 'Tipo de reserva inválido';
      isValid = false;
    }

    // Validar fecha y hora para reservas programadas
    if (data.type === 'scheduled') {
      if (!data.scheduledDate) {
        errors.scheduledDate = 'Debes seleccionar una fecha';
        isValid = false;
      } else {
        const selectedDate = new Date(data.scheduledDate);
        const now = new Date();
        
        if (selectedDate <= now) {
          errors.scheduledDate = 'La fecha debe ser futura';
          isValid = false;
        }
      }

      if (!data.scheduledTime) {
        errors.scheduledTime = 'Debes seleccionar una hora';
        isValid = false;
      }
    }

    // Validar ubicación para servicios a domicilio
    if (data.serviceType === 'home' || data.serviceType === 'both') {
      if (!data.clientAddress) {
        errors.clientAddress = 'Debes proporcionar tu dirección';
        isValid = false;
      }
    }

    // Validar precio
    if (!data.totalPrice || data.totalPrice <= 0) {
      errors.totalPrice = 'Precio inválido';
      isValid = false;
    }

    return {
      isValid,
      errors,
      message: isValid ? 'Datos válidos' : 'Por favor corrige los errores'
    };
  }

  // Filtrar reservas por estado
  filterBookingsByStatus(bookings, status) {
    return bookings.filter(booking => booking.status === status);
  }

  // Obtener próximas reservas
  getUpcomingBookings(bookings) {
    const now = new Date();
    return bookings
      .filter(booking => {
        const bookingDate = new Date(booking.scheduledDate);
        return bookingDate > now && 
               booking.status !== 'cancelled' && 
               booking.status !== 'completed';
      })
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  }

  // Obtener historial de reservas
  getBookingHistory(bookings) {
    return bookings
      .filter(booking => 
        booking.status === 'completed' || booking.status === 'cancelled'
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Obtener reservas de hoy
  getTodayBookings(bookings) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.scheduledDate);
      const bookingDateStr = bookingDate.toISOString().split('T')[0];
      return bookingDateStr === todayStr;
    });
  }

  // Calcular estadísticas de reservas
  calculateBookingStats(bookings) {
    const stats = {
      total: bookings.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageRating: 0
    };

    let totalRating = 0;
    let ratedBookings = 0;

    bookings.forEach(booking => {
      stats[booking.status] = (stats[booking.status] || 0) + 1;
      
      if (booking.status === 'completed') {
        stats.totalRevenue += booking.totalPrice || 0;
        
        if (booking.review && booking.review.rating) {
          totalRating += booking.review.rating;
          ratedBookings++;
        }
      }
    });

    if (ratedBookings > 0) {
      stats.averageRating = totalRating / ratedBookings;
    }

    return stats;
  }

  // Formatear mensaje para WhatsApp
  formatWhatsAppMessage(booking) {
    const service = booking.service;
    const barber = booking.barber;
    
    let message = `¡Hola! Quiero confirmar mi reserva:\n\n`;
    message += `👨‍💼 Barbero: ${barber.name}\n`;
    message += `✂️ Servicio: ${service.name}\n`;
    message += `💰 Precio: $${service.price.toLocaleString('es-CL')}\n`;
    
    if (booking.type === 'immediate') {
      message += `⏰ Tipo: Corte inmediato\n`;
    } else {
      const date = new Date(booking.scheduledDate);
      message += `📅 Fecha: ${date.toLocaleDateString('es-CL')}\n`;
      message += `⏰ Hora: ${booking.scheduledTime}\n`;
    }
    
    if (booking.serviceType === 'home') {
      message += `🏠 Ubicación: A domicilio\n`;
      message += `📍 Dirección: ${booking.clientAddress}\n`;
    } else {
      message += `🏪 Ubicación: En local\n`;
      message += `📍 Dirección: ${barber.address}\n`;
    }
    
    if (booking.notes) {
      message += `📝 Notas: ${booking.notes}\n`;
    }
    
    message += `\n¿Confirmas la disponibilidad? ¡Gracias!`;
    
    return encodeURIComponent(message);
  }

  // Obtener URL de WhatsApp para contacto directo
  getWhatsAppUrl(booking, barberPhone) {
    const message = this.formatWhatsAppMessage(booking);
    const phone = barberPhone.replace(/[^\d]/g, ''); // Limpiar número
    const formattedPhone = phone.startsWith('56') ? phone : `56${phone}`;
    
    return `https://wa.me/${formattedPhone}?text=${message}`;
  }

  // Verificar si puede cancelar sin penalización
  canCancelWithoutPenalty(booking) {
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return false;
    }

    const now = new Date();
    const bookingDate = new Date(booking.scheduledDate);
    const hoursDifference = (bookingDate - now) / (1000 * 60 * 60);

    if (booking.type === 'immediate') {
      return hoursDifference >= 0.17; // 10 minutos
    } else {
      return hoursDifference >= 0.5; // 30 minutos
    }
  }

  // Calcular tiempo restante para la reserva
  getTimeUntilBooking(booking) {
    const now = new Date();
    const bookingDate = new Date(booking.scheduledDate);
    const timeDiff = bookingDate - now;

    if (timeDiff <= 0) {
      return { text: 'Ya pasó', expired: true };
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return { text: `En ${days} día${days > 1 ? 's' : ''}`, expired: false };
    } else if (hours > 0) {
      return { text: `En ${hours} hora${hours > 1 ? 's' : ''}`, expired: false };
    } else {
      return { text: `En ${minutes} minuto${minutes > 1 ? 's' : ''}`, expired: false };
    }
  }

  // Obtener color de estado para UI
  getStatusColor(status) {
    const colors = {
      pending: '#f59e0b', // Amarillo
      confirmed: '#10b981', // Verde
      'in-progress': '#3b82f6', // Azul
      completed: '#6b7280', // Gris
      cancelled: '#ef4444', // Rojo
      'no-show': '#dc2626' // Rojo oscuro
    };
    
    return colors[status] || '#6b7280';
  }

  // Obtener texto de estado traducido
  getStatusText(status) {
    const statusTexts = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      'in-progress': 'En progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      'no-show': 'No asistió'
    };
    
    return statusTexts[status] || status;
  }

  // Generar horarios disponibles
  generateAvailableSlots(barber, date) {
    const slots = [];
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    // Verificar si el barbero trabaja ese día
    const workingHours = barber.workingHours?.[dayOfWeek];
    if (!workingHours || !workingHours.isOpen) {
      return slots;
    }

    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    const start = new Date(selectedDate);
    start.setHours(startHour, startMinute, 0, 0);
    
    const end = new Date(selectedDate);
    end.setHours(endHour, endMinute, 0, 0);
    
    // Generar slots cada 30 minutos
    const current = new Date(start);
    const now = new Date();
    
    while (current < end) {
      // Solo agregar horarios futuros
      if (current > now) {
        slots.push({
          time: current.toTimeString().slice(0, 5),
          datetime: new Date(current),
          available: true // Se verificará disponibilidad real con el backend
        });
      }
      
      current.setMinutes(current.getMinutes() + 30);
    }
    
    return slots;
  }

  // Métodos de cache
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearBookingCache() {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes('booking')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clearCache() {
    this.cache.clear();
  }
}

// Crear instancia singleton
const bookingService = new BookingService();

export default bookingService;
