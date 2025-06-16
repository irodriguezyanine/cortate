import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as bookingService from '../services/bookingService';

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking debe ser usado dentro de BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados específicos para proceso de reserva
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingType, setBookingType] = useState('scheduled'); // 'scheduled' o 'immediate'
  const [notes, setNotes] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Cargar reservas del usuario al inicializar
  useEffect(() => {
    if (user && token) {
      loadUserBookings();
    }
  }, [user, token]);

  // Cargar reservas del usuario
  const loadUserBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings(token);
      setBookings(response.data || []);
    } catch (err) {
      setError('Error al cargar las reservas');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear nueva reserva
  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bookingService.createBooking(bookingData, token);
      
      if (response.success) {
        setCurrentBooking(response.data);
        await loadUserBookings(); // Recargar lista
        return response;
      } else {
        throw new Error(response.message || 'Error al crear la reserva');
      }
    } catch (err) {
      setError(err.message || 'Error al crear la reserva');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancelar reserva
  const cancelBooking = async (bookingId, reason = '') => {
    try {
      setLoading(true);
      const response = await bookingService.cancelBooking(bookingId, reason, token);
      
      if (response.success) {
        await loadUserBookings();
        return response;
      } else {
        throw new Error(response.message || 'Error al cancelar la reserva');
      }
    } catch (err) {
      setError(err.message || 'Error al cancelar la reserva');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Confirmar reserva (para barberos)
  const confirmBooking = async (bookingId) => {
    try {
      setLoading(true);
      const response = await bookingService.confirmBooking(bookingId, token);
      
      if (response.success) {
        await loadUserBookings();
        return response;
      } else {
        throw new Error(response.message || 'Error al confirmar la reserva');
      }
    } catch (err) {
      setError(err.message || 'Error al confirmar la reserva');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Completar reserva
  const completeBooking = async (bookingId, completionData = {}) => {
    try {
      setLoading(true);
      const response = await bookingService.completeBooking(bookingId, completionData, token);
      
      if (response.success) {
        await loadUserBookings();
        return response;
      } else {
        throw new Error(response.message || 'Error al completar la reserva');
      }
    } catch (err) {
      setError(err.message || 'Error al completar la reserva');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de reserva en proceso
  const updateBookingProcess = (updates) => {
    setSelectedBarber(updates.barber || selectedBarber);
    setSelectedService(updates.service || selectedService);
    setSelectedDate(updates.date || selectedDate);
    setSelectedTime(updates.time || selectedTime);
    setBookingType(updates.type || bookingType);
    setNotes(updates.notes !== undefined ? updates.notes : notes);
    
    // Calcular precio total
    if (updates.service || selectedService) {
      const service = updates.service || selectedService;
      setTotalPrice(service.price || 0);
    }
  };

  // Limpiar proceso de reserva
  const clearBookingProcess = () => {
    setSelectedBarber(null);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setBookingType('scheduled');
    setNotes('');
    setTotalPrice(0);
    setCurrentBooking(null);
    setError(null);
  };

  // Obtener reservas por estado
  const getBookingsByStatus = (status) => {
    return bookings.filter(booking => booking.status === status);
  };

  // Obtener próximas reservas
  const getUpcomingBookings = () => {
    const now = new Date();
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.scheduledDate);
      return bookingDate > now && booking.status !== 'cancelled' && booking.status !== 'completed';
    }).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  };

  // Obtener historial de reservas
  const getBookingHistory = () => {
    return bookings.filter(booking => 
      booking.status === 'completed' || booking.status === 'cancelled'
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Verificar si puede hacer reserva inmediata
  const canMakeImmediateBooking = () => {
    return selectedBarber && 
           selectedBarber.availability && 
           selectedBarber.availability.immediateBooking === true &&
           selectedBarber.status === 'available';
  };

  // Formatear datos para WhatsApp
  const formatForWhatsApp = (booking) => {
    const barber = booking.barber || selectedBarber;
    const service = booking.service || selectedService;
    
    let message = `¡Hola! Quiero confirmar mi reserva de corte:\n\n`;
    message += `👨‍💼 Barbero: ${barber.name}\n`;
    message += `✂️ Servicio: ${service.name}\n`;
    message += `💰 Precio: $${service.price.toLocaleString('es-CL')}\n`;
    
    if (bookingType === 'immediate') {
      message += `⏰ Tipo: Corte inmediato\n`;
    } else {
      message += `📅 Fecha: ${new Date(selectedDate).toLocaleDateString('es-CL')}\n`;
      message += `⏰ Hora: ${selectedTime}\n`;
    }
    
    if (notes) {
      message += `📝 Notas: ${notes}\n`;
    }
    
    message += `\n¿Confirmas la disponibilidad? ¡Gracias!`;
    
    return encodeURIComponent(message);
  };

  const value = {
    // Estados
    bookings,
    currentBooking,
    loading,
    error,
    selectedBarber,
    selectedService,
    selectedDate,
    selectedTime,
    bookingType,
    notes,
    totalPrice,

    // Acciones
    createBooking,
    cancelBooking,
    confirmBooking,
    completeBooking,
    loadUserBookings,
    updateBookingProcess,
    clearBookingProcess,

    // Utilidades
    getBookingsByStatus,
    getUpcomingBookings,
    getBookingHistory,
    canMakeImmediateBooking,
    formatForWhatsApp,

    // Setters
    setSelectedBarber,
    setSelectedService,
    setSelectedDate,
    setSelectedTime,
    setBookingType,
    setNotes,
    setError
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};
