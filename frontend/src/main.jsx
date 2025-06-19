// frontend/src/main.jsx (Corregido y Listo)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ===================== INICIO DE LA CORRECCIÓN =====================
// Importamos los Providers de tus contextos
import { AuthProvider } from './context/AuthContext.jsx';
import { BookingProvider } from './context/BookingContext.jsx';
// ===================== FIN DE LA CORRECCIÓN =======================

// Register Service Worker for PWA (Tu código se mantiene)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Tus otros listeners y monitores se mantienen igual...

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*
      ENVOLVEMOS TODA LA APLICACIÓN EN LOS PROVIDERS.
      Esto garantiza que cualquier componente, en cualquier parte de la app,
      tendrá acceso a los datos de autenticación y de reservas.
      Es la práctica recomendada y la solución a tus problemas de contexto.
    */}
    <AuthProvider>
      <BookingProvider>
        <App />
      </BookingProvider>
    </AuthProvider>
  </React.StrictMode>,
);
