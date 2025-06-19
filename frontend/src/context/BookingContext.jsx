import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
// Asumo que tu servicio está bien definido.
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
    } else {
      // Si el usuario cierra sesión, limpia las reservas
      setBookings([]);
    }
  }, [user, token]);

  // Cargar reservas del usuario
  const loadUserBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getUserBookings(); // No es necesario pasar el token si tu api.js lo maneja con interceptores
      setBookings(data || []);
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
      
      const newBooking = await bookingService.createBooking(bookingData);
      
      setCurrentBooking(newBooking);
      await loadUserBookings(); // Recargar lista
      return newBooking;
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al crear la reserva';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cancelar reserva
  const cancelBooking = async (bookingId, reason = '') => {
    try {
      setLoading(true);
      const updatedBooking = await bookingService.cancelBooking(bookingId, reason);
      await loadUserBookings();
      return updatedBooking;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al cancelar la reserva';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // (El resto de tus funciones como confirmBooking, completeBooking... se mantienen igual)
  const confirmBooking = async (bookingId) => { /* ... tu código ... */ };
  const completeBooking = async (bookingId, completionData = {}) => { /* ... tu código ... */ };
  const updateBookingProcess = (updates) => { /* ... tu código ... */ };
  const clearBookingProcess = () => { /* ... tu código ... */ };
  const getBookingsByStatus = (status) => { /* ... tu código ... */ };
  const getUpcomingBookings = () => { /* ... tu código ... */ };
  const getBookingHistory = () => { /* ... tu código ... */ };
  const canMakeImmediateBooking = () => { /* ... tu código ... */ };
  const formatForWhatsApp = (booking) => { /* ... tu código ... */ };

  // ====================================================================
  // ======================> INICIO DE LA CORRECCIÓN <=====================
  // ====================================================================
  
  // ¡AQUÍ ESTÁ LA SOLUCIÓN!
  // Creamos una función "add" que es simplemente un alias para "createBooking".
  // Esto hará que cualquier componente que llame a `add` funcione sin crashear.
  const add = createBooking;

  // ====================================================================
  // ======================> FIN DE LA CORRECCIÓN <======================
  // ====================================================================

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
    add, // <-- AÑADIMOS LA FUNCIÓN 'add' AL VALOR DEL CONTEXTO

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
