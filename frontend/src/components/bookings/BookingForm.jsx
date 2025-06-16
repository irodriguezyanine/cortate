import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle,
  User,
  Scissors,
  Home,
  Store,
  AlertCircle,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatPrice } from '../../utils/helpers';
import { formatWhatsAppBookingMessage } from '../../utils/formatters';

const BookingForm = ({ barber, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { createBooking, updateBookingProcess, clearBookingProcess } = useBooking();
  
  const [step, setStep] = useState(1); // 1: Servicio, 2: Fecha/Hora, 3: Detalles, 4: Confirmación
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    service: null,
    type: 'scheduled', // 'scheduled' | 'immediate'
    scheduledDate: '',
    scheduledTime: '',
    serviceType: 'in_shop', // 'in_shop' | 'home' | 'both'
    clientAddress: '',
    notes: '',
    phone: user?.phone || '',
    totalPrice: 0
  });

  // Horarios disponibles (simulado - en producción vendría del backend)
  const availableSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      clearBookingProcess();
    };
  }, [clearBookingProcess]);

  // Calcular precio total
  useEffect(() => {
    if (formData.service) {
      setFormData(prev => ({
        ...prev,
        totalPrice: formData.service.price
      }));
    }
  }, [formData.service]);

  // Actualizar contexto de reserva
  useEffect(() => {
    updateBookingProcess({
      barber,
      service: formData.service,
      date: formData.scheduledDate,
      time: formData.scheduledTime,
      type: formData.type,
      notes: formData.notes
    });
  }, [formData, barber, updateBookingProcess]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    switch (currentStep) {
      case 1:
        if (!formData.service) {
          newErrors.service = 'Debes seleccionar un servicio';
        }
        break;

      case 2:
        if (formData.type === 'scheduled') {
          if (!formData.scheduledDate) {
            newErrors.scheduledDate = 'Debes seleccionar una fecha';
          } else {
            const selectedDate = new Date(formData.scheduledDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
              newErrors.scheduledDate = 'La fecha no puede ser anterior a hoy';
            }
          }
          
          if (!formData.scheduledTime) {
            newErrors.scheduledTime = 'Debes seleccionar una hora';
          }
        }
        break;

      case 3:
        if (formData.serviceType === 'home' && !formData.clientAddress) {
          newErrors.clientAddress = 'Debes proporcionar tu dirección';
        }
        
        if (!formData.phone) {
          newErrors.phone = 'Debes proporcionar tu teléfono';
        } else if (!/^(\+?56)?[0-9]{8,9}$/.test(formData.phone)) {
          newErrors.phone = 'Número de teléfono inválido';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      const bookingData = {
        barberId: barber.id,
        service: formData.service,
        type: formData.type,
        scheduledDate: formData.type === 'scheduled' ? formData.scheduledDate : null,
        scheduledTime: formData.type === 'scheduled' ? formData.scheduledTime : null,
        serviceType: formData.serviceType,
        clientAddress: formData.serviceType === 'home' ? formData.clientAddress : null,
        notes: formData.notes,
        phone: formData.phone,
        totalPrice: formData.totalPrice
      };

      const result = await createBooking(bookingData);
      
      if (result.success) {
        setStep(4); // Mostrar confirmación
        onSuccess?.(result.data);
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      setErrors({ general: 'Error al crear la reserva. Intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 días máximo
    return maxDate.toISOString().split('T')[0];
  };

  const generateWhatsAppMessage = () => {
    return formatWhatsAppBookingMessage({
      ...formData,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      type: formData.type
    }, barber);
  };

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const phone = barber.phone.replace(/[^\d]/g, '');
    const formattedPhone = phone.startsWith('56') ? phone : `56${phone}`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Renderizar paso 1: Selección de servicio
  const renderServiceStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Selecciona tu servicio</h3>
        <p className="text-gray-400">Elige el servicio que necesitas</p>
      </div>

      <div className="space-y-3">
        {barber.services?.map((service, index) => (
          <button
            key={index}
            onClick={() => handleInputChange('service', service)}
            className={`w-full p-4 rounded-lg border transition-all ${
              formData.service?.name === service.name
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Scissors className="w-5 h-5 text-yellow-400" />
                <div className="text-left">
                  <h4 className="font-medium text-white">{service.name}</h4>
                  {service.description && (
                    <p className="text-sm text-gray-400">{service.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-yellow-400">
                  {formatPrice(service.price)}
                </div>
                {service.duration && (
                  <div className="text-sm text-gray-400">{service.duration} min</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {errors.service && (
        <p className="text-red-400 text-sm">{errors.service}</p>
      )}

      {/* Tipo de servicio */}
      <div className="space-y-3">
        <h4 className="font-medium text-white">Tipo de atención</h4>
        <div className="grid grid-cols-1 gap-3">
          {barber.serviceTypes?.includes('in_shop') && (
            <button
              onClick={() => handleInputChange('serviceType', 'in_shop')}
              className={`p-3 rounded-lg border transition-all ${
                formData.serviceType === 'in_shop'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Store className="w-5 h-5 text-yellow-400" />
                <div className="text-left">
                  <div className="font-medium text-white">En local</div>
                  <div className="text-sm text-gray-400">Visita el local del barbero</div>
                </div>
              </div>
            </button>
          )}

          {barber.serviceTypes?.includes('home') && (
            <button
              onClick={() => handleInputChange('serviceType', 'home')}
              className={`p-3 rounded-lg border transition-all ${
                formData.serviceType === 'home'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5 text-yellow-400" />
                <div className="text-left">
                  <div className="font-medium text-white">A domicilio</div>
                  <div className="text-sm text-gray-400">El barbero va a tu ubicación</div>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar paso 2: Fecha y hora
  const renderDateTimeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">¿Cuándo te gustaría el corte?</h3>
        <p className="text-gray-400">Selecciona fecha y hora</p>
      </div>

      {/* Tipo de reserva */}
      <div className="space-y-3">
        <h4 className="font-medium text-white">Tipo de reserva</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleInputChange('type', 'scheduled')}
            className={`p-3 rounded-lg border transition-all ${
              formData.type === 'scheduled'
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
          >
            <div className="text-center">
              <Calendar className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="font-medium text-white">Programada</div>
              <div className="text-xs text-gray-400">Agenda con anticipación</div>
            </div>
          </button>

          {barber.availability?.immediateBooking && (
            <button
              onClick={() => handleInputChange('type', 'immediate')}
              className={`p-3 rounded-lg border transition-all ${
                formData.type === 'immediate'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="font-medium text-white">Inmediata</div>
                <div className="text-xs text-gray-400">Disponible ahora</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Selección de fecha y hora para reservas programadas */}
      {formData.type === 'scheduled' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            {errors.scheduledDate && (
              <p className="text-red-400 text-sm mt-1">{errors.scheduledDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hora
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => handleInputChange('scheduledTime', slot)}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    formData.scheduledTime === slot
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            {errors.scheduledTime && (
              <p className="text-red-400 text-sm mt-1">{errors.scheduledTime}</p>
            )}
          </div>
        </div>
      )}

      {/* Mensaje para reservas inmediatas */}
      {formData.type === 'immediate' && (
        <div className="bg-blue-900/50 border border-blue-400 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-blue-400">Corte inmediato</span>
          </div>
          <p className="text-sm text-blue-200">
            Tu solicitud será enviada al barbero para confirmar disponibilidad inmediata.
          </p>
        </div>
      )}
    </div>
  );

  // Renderizar paso 3: Detalles adicionales
  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Detalles de la reserva</h3>
        <p className="text-gray-400">Información adicional y contacto</p>
      </div>

      {/* Dirección para servicios a domicilio */}
      {formData.serviceType === 'home' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tu dirección *
          </label>
          <input
            type="text"
            value={formData.clientAddress}
            onChange={(e) => handleInputChange('clientAddress', e.target.value)}
            placeholder="Calle, número, comuna..."
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
          {errors.clientAddress && (
            <p className="text-red-400 text-sm mt-1">{errors.clientAddress}</p>
          )}
        </div>
      )}

      {/* Teléfono de contacto */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Teléfono de contacto *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="+56 9 1234 5678"
          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
        {errors.phone && (
          <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
        )}
      </div>

      {/* Notas adicionales */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notas adicionales (opcional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Especificaciones del corte, referencias, etc..."
          rows="3"
          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
        />
      </div>

      {/* Resumen del precio */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Total a pagar:</span>
          <span className="text-2xl font-bold text-yellow-400">
            {formatPrice(formData.totalPrice)}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Pago directo al barbero
        </p>
      </div>
    </div>
  );

  // Renderizar paso 4: Confirmación
  const renderConfirmationStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-white">¡Reserva creada exitosamente!</h3>
        
        <p className="text-gray-400">
          Tu reserva ha sido enviada al barbero. Recibirás una confirmación por WhatsApp.
        </p>
      </div>

      {/* Resumen de la reserva */}
      <div className="bg-gray-800 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-white mb-3">Resumen de tu reserva</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Barbero:</span>
            <span className="text-white">{barber.name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Servicio:</span>
            <span className="text-white">{formData.service?.name}</span>
          </div>
          
          {formData.type === 'scheduled' ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha:</span>
                <span className="text-white">
                  {new Date(formData.scheduledDate).toLocaleDateString('es-CL')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hora:</span>
                <span className="text-white">{formData.scheduledTime}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-400">Tipo:</span>
              <span className="text-white">Corte inmediato</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-400">Ubicación:</span>
            <span className="text-white">
              {formData.serviceType === 'home' ? 'A domicilio' : 'En local'}
            </span>
          </div>
          
          <div className="flex justify-between border-t border-gray-600 pt-2 mt-2">
            <span className="text-gray-400">Total:</span>
            <span className="text-yellow-400 font-semibold">
              {formatPrice(formData.totalPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="space-y-3">
        <button
          onClick={openWhatsApp}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Confirmar por WhatsApp</span>
        </button>
        
        <button
          onClick={() => onSuccess?.()}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Ir a mis reservas
        </button>
      </div>

      <p className="text-xs text-gray-500">
        El barbero confirmará tu disponibilidad por WhatsApp
      </p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header con información del barbero */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-black font-semibold">
              {barber.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{barber.name}</h2>
            <p className="text-sm text-gray-400 flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{barber.address}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Indicador de progreso */}
      {step < 4 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  stepNumber <= step
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {stepNumber}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Contenido del formulario */}
      <div className="bg-gray-900 rounded-lg p-6">
        {/* Error general */}
        {errors.general && (
          <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{errors.general}</span>
          </div>
        )}

        {/* Renderizar paso actual */}
        {step === 1 && renderServiceStep()}
        {step === 2 && renderDateTimeStep()}
        {step === 3 && renderDetailsStep()}
        {step === 4 && renderConfirmationStep()}

        {/* Botones de navegación */}
        {step < 4 && (
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-700">
            <button
              onClick={step === 1 ? onCancel : handleBack}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {step === 1 ? 'Cancelar' : 'Atrás'}
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!formData.service && step === 1}
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creando reserva...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Confirmar reserva</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Información adicional */}
      {step < 4 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ✓ Sin costo de reserva • ✓ Pago directo al barbero • ✓ Confirmación por WhatsApp
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
