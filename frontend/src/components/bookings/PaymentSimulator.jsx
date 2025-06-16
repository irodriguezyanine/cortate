import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  X,
  ArrowLeft,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';
import { formatPrice } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

const PaymentSimulator = ({ 
  booking, 
  onSuccess, 
  onCancel,
  amount,
  description = 'Servicio de barbería'
}) => {
  const [step, setStep] = useState(1); // 1: Método, 2: Detalles, 3: Procesando, 4: Resultado
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: '',
    email: '',
    phone: ''
  });

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Tarjeta de Crédito/Débito',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express',
      processingTime: 'Inmediato',
      fee: 0
    },
    {
      id: 'transbank',
      name: 'Webpay Plus',
      icon: CreditCard,
      description: 'Pago seguro con Transbank',
      processingTime: 'Inmediato',
      fee: 0
    },
    {
      id: 'mobile_payment',
      name: 'Pago Móvil',
      icon: Smartphone,
      description: 'Apple Pay, Google Pay, Samsung Pay',
      processingTime: 'Inmediato',
      fee: 0
    },
    {
      id: 'bank_transfer',
      name: 'Transferencia Bancaria',
      icon: Wallet,
      description: 'Transferencia desde tu banco',
      processingTime: '1-2 días hábiles',
      fee: 0
    }
  ];

  // Simular procesamiento de pago
  const processPayment = async () => {
    setIsProcessing(true);
    setStep(3);

    try {
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simular resultado (95% éxito, 5% fallo)
      const success = Math.random() > 0.05;

      const result = {
        success,
        transactionId: success ? `TXN-${Date.now()}` : null,
        amount,
        method: selectedMethod,
        timestamp: new Date().toISOString(),
        message: success 
          ? 'Pago procesado exitosamente' 
          : 'Error en el procesamiento. Intenta con otro método.'
      };

      setPaymentResult(result);
      setStep(4);

      if (success) {
        // Esperar 2 segundos antes de llamar onSuccess
        setTimeout(() => {
          onSuccess?.(result);
        }, 2000);
      }
    } catch (error) {
      setPaymentResult({
        success: false,
        message: 'Error de conexión. Intenta nuevamente.'
      });
      setStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  // Validar formulario
  const validatePaymentDetails = () => {
    const errors = {};

    if (selectedMethod === 'credit_card') {
      if (!paymentDetails.cardNumber || paymentDetails.cardNumber.length < 16) {
        errors.cardNumber = 'Número de tarjeta inválido';
      }
      if (!paymentDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
        errors.expiryDate = 'Fecha inválida (MM/AA)';
      }
      if (!paymentDetails.cvv || paymentDetails.cvv.length < 3) {
        errors.cvv = 'CVV inválido';
      }
      if (!paymentDetails.holderName.trim()) {
        errors.holderName = 'Nombre del titular requerido';
      }
    }

    if (!paymentDetails.email || !/\S+@\S+\.\S+/.test(paymentDetails.email)) {
      errors.email = 'Email inválido';
    }

    return errors;
  };

  // Formatear número de tarjeta
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Formatear fecha de expiración
  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Renderizar paso 1: Selección de método
  const renderMethodSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Selecciona método de pago</h3>
        <p className="text-gray-400">Elige cómo quieres pagar tu servicio</p>
      </div>

      <div className="space-y-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full p-4 rounded-lg border transition-all text-left ${
                selectedMethod === method.id
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  selectedMethod === method.id ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-300'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-white">{method.name}</h4>
                  <p className="text-sm text-gray-400">{method.description}</p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>⏱️ {method.processingTime}</span>
                    {method.fee > 0 && <span>💰 +{formatPrice(method.fee)}</span>}
                  </div>
                </div>

                {selectedMethod === method.id && (
                  <CheckCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Resumen del pago */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
        <h4 className="font-medium text-white mb-3">Resumen del pago</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Servicio:</span>
            <span className="text-white">{description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal:</span>
            <span className="text-white">{formatPrice(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Comisión:</span>
            <span className="text-white">{formatPrice(0)}</span>
          </div>
          <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold">
            <span className="text-white">Total:</span>
            <span className="text-yellow-400">{formatPrice(amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar paso 2: Detalles del pago
  const renderPaymentDetails = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Detalles del pago</h3>
          <p className="text-gray-400">Completa la información para {method?.name}</p>
        </div>

        <div className="space-y-4">
          {selectedMethod === 'credit_card' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número de tarjeta *
                </label>
                <input
                  type="text"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    cardNumber: formatCardNumber(e.target.value)
                  }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha de expiración *
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.expiryDate}
                    onChange={(e) => setPaymentDetails(prev => ({
                      ...prev,
                      expiryDate: formatExpiryDate(e.target.value)
                    }))}
                    placeholder="MM/AA"
                    maxLength="5"
                    className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    value={paymentDetails.cvv}
                    onChange={(e) => setPaymentDetails(prev => ({
                      ...prev,
                      cvv: e.target.value.replace(/\D/g, '')
                    }))}
                    placeholder="123"
                    maxLength="4"
                    className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del titular *
                </label>
                <input
                  type="text"
                  value={paymentDetails.holderName}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    holderName: e.target.value
                  }))}
                  placeholder="Juan Pérez"
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email para confirmación *
            </label>
            <input
              type="email"
              value={paymentDetails.email}
              onChange={(e) => setPaymentDetails(prev => ({
                ...prev,
                email: e.target.value
              }))}
              placeholder="tu@email.com"
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono (opcional)
            </label>
            <input
              type="tel"
              value={paymentDetails.phone}
              onChange={(e) => setPaymentDetails(prev => ({
                ...prev,
                phone: e.target.value
              }))}
              placeholder="+56 9 1234 5678"
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Información de seguridad */}
        <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-blue-400">Pago seguro</span>
          </div>
          <p className="text-sm text-blue-200">
            Tus datos están protegidos con encriptación SSL de 256 bits. 
            No almacenamos información de tarjetas de crédito.
          </p>
        </div>
      </div>
    );
  };

  // Renderizar paso 3: Procesando
  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
        <Clock className="w-8 h-8 text-black" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Procesando pago...</h3>
        <p className="text-gray-400">Por favor espera mientras procesamos tu pago</p>
      </div>

      <LoadingSpinner size="md" />

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
        <p className="text-sm text-gray-400">
          🔒 No cierres esta ventana durante el procesamiento
        </p>
      </div>
    </div>
  );

  // Renderizar paso 4: Resultado
  const renderResult = () => {
    const isSuccess = paymentResult?.success;
    
    return (
      <div className="text-center space-y-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
          isSuccess ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {isSuccess ? (
            <CheckCircle className="w-8 h-8 text-white" />
          ) : (
            <AlertCircle className="w-8 h-8 text-white" />
          )}
        </div>
        
        <div>
          <h3 className={`text-xl font-semibold mb-2 ${
            isSuccess ? 'text-green-400' : 'text-red-400'
          }`}>
            {isSuccess ? '¡Pago exitoso!' : 'Error en el pago'}
          </h3>
          <p className="text-gray-400">{paymentResult?.message}</p>
        </div>

        {isSuccess && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 text-left">
            <h4 className="font-medium text-white mb-3">Detalles de la transacción</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">ID de transacción:</span>
                <span className="text-white font-mono">{paymentResult.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Monto:</span>
                <span className="text-green-400">{formatPrice(paymentResult.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Método:</span>
                <span className="text-white">{paymentMethods.find(m => m.id === paymentResult.method)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha:</span>
                <span className="text-white">{new Date(paymentResult.timestamp).toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Recibirás un email de confirmación en {paymentDetails.email}
            </p>
            <p className="text-sm text-green-400">
              ✅ Tu reserva ha sido confirmada y pagada
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => {
                setStep(1);
                setPaymentResult(null);
              }}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={isProcessing}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <span>Pagar servicio</span>
              </h2>
              <p className="text-sm text-gray-400">
                Paso {step} de 4
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 1 && renderMethodSelection()}
          {step === 2 && renderPaymentDetails()}
          {step === 3 && renderProcessing()}
          {step === 4 && renderResult()}
        </div>

        {/* Footer con botones */}
        {step < 3 && (
          <div className="p-6 border-t border-gray-700 bg-gray-800/50">
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              
              {step === 1 ? (
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedMethod}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black py-3 px-4 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              ) : (
                <button
                  onClick={processPayment}
                  disabled={Object.keys(validatePaymentDetails()).length > 0}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black py-3 px-4 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Pagar {formatPrice(amount)}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Información de seguridad en el footer */}
        {step === 1 && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>SSL Seguro</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Transbank</span>
              </div>
              <div className="flex items-center space-x-1">
                <CreditCard className="w-3 h-3" />
                <span>Visa • Mastercard</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer para simulación */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-blue-900 border border-blue-500 text-blue-200 text-xs p-3 rounded-lg max-w-sm">
          <p className="font-semibold mb-1">⚠️ Modo Simulación</p>
          <p>Este es un simulador de pagos. No se procesarán transacciones reales.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentSimulator;
