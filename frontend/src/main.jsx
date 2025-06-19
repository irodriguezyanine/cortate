// frontend/src/main.jsx (Corregido y Listo para Desplegar)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Importamos los Providers de tus contextos
import { AuthProvider } from './context/AuthContext.jsx';
import { BookingProvider } from './context/BookingContext.jsx';

// Tus otros scripts (Service Worker, etc.) se mantienen igual
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// ... tus otros listeners ...

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*
      LA SOLUCIÓN DEFINITIVA:
      Envolvemos <App /> con los Providers aquí, en el punto más alto.
    */}
    <AuthProvider>
      <BookingProvider>
        <App />
      </BookingProvider>
    </AuthProvider>
  </React.StrictMode>,
);
