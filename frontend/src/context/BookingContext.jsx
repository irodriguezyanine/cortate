// frontend/src/context/BookingContext.jsx (Restaurado y Corregido)

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

  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingType, setBookingType] = useState('scheduled');
  const [notes, setNotes] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (user && token) {
      loadUserBookings();
    } else {
      setBookings([]);
    }
  }, [user, token]);

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings(token); // Restaurado el token
      setBookings(response.data || []);
    } catch (err) {
      setError('Error al cargar las reservas');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bookingService.createBooking(bookingData, token); // Restaurado el token
      
      if (response.success) {
        setCurrentBooking(response.data);
        await loadUserBookings();
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

  const cancelBooking = async (bookingId, reason = '') => {
    try {
      setLoading(true);
      const response = await bookingService.cancelBooking(bookingId, reason, token); // Restaurado el token
      
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

  // ... (tus otras funciones se mantienen igual)
  const confirmBooking = async (bookingId) => { /* ... tu código ... */ };
  const completeBooking = async (bookingId, completionData = {}) => { /* ... tu código ... */ };
  const updateBookingProcess = (updates) => { /* ... tu código ... */ };
  const clearBookingProcess = () => { /* ... tu código ... */ };
  const getBookingsByStatus = (status) => { /* ... tu código ... */ };
  const getUpcomingBookings = () => { /* ... tu código ... */ };
  const getBookingHistory = () => { /* ... tu código ... */ };
  const canMakeImmediateBooking = () => { /* ... tu código ... */ };
  const formatForWhatsApp = (booking) => { /* ... tu código ... */ };

  // Agregamos el alias de forma segura
  const add = createBooking;

  const value = {
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
    createBooking,
    cancelBooking,
    confirmBooking,
    completeBooking,
    loadUserBookings,
    updateBookingProcess,
    clearBookingProcess,
    add, // <-- Mantenemos el alias por si acaso
    getBookingsByStatus,
    getUpcomingBookings,
    getBookingHistory,
    canMakeImmediateBooking,
    formatForWhatsApp,
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
