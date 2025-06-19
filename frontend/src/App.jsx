import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';

// Layout components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import WhatsAppFloat from './components/common/WhatsAppFloat';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorFallback from './components/common/ErrorFallback';

// Pages - Estas ya estaban correctas
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import MapPage from './pages/MapPage';
import ListPage from './pages/ListPage';
import BarberProfilePage from './pages/BarberProfilePage';
import BookingHistory from './pages/BookingHistory';
import ClientProfile from './pages/ClientProfile';
import BarberDashboard from './pages/BarberDashboard';
import NotFound from './pages/NotFound';

// ====================================================================
// ======================> INICIO DE LA CORRECCIÓN <=====================
// ====================================================================

// CORRECCIÓN DE RUTAS Y NOMBRES DE ARCHIVO:
// Apuntamos a los archivos correctos con los nombres correctos.

// BookingForm está en 'components/bookings', no en 'pages'.
import BookingForm from './components/bookings/BookingForm';

// Para el perfil del barbero, ya tenías importado "BarberProfilePage".
// Pero en las rutas usabas "BarberProfile", que no estaba importado.
// Así que simplemente reusamos "BarberProfilePage" que ya está importado y es correcto.
// Por eso, la línea 'import BarberProfile from...' se elimina o comenta.
// import BarberProfile from './pages/BarberProfile'; // <-- Este archivo no existe, lo eliminamos.

// BarberBookings probablemente está en una página o componente. Si da error, hay que buscar el archivo correcto.
// Asumiremos por ahora que el archivo se llama "BarberBookingsPage.jsx" en la carpeta "pages".
import BarberBookings from './pages/BarberBookings';

// Las páginas estáticas. Si dan error, es que los archivos no existen o tienen otro nombre.
import HowItWorks from './pages/HowItWorks';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';

// ====================================================================
// ======================> FIN DE LA CORRECCIÓN <======================
// ====================================================================


// Styles
import './styles/index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component { /* ... tu código sin cambios ... */ }

// Layout component
const Layout = ({ children, showHeader = true, showFooter = true }) => { /* ... tu código sin cambios ... */ };

// Main App component
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BookingProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* ... Tus rutas públicas sin cambios ... */}
                <Route path="/" element={<Layout><Landing /></Layout>} />
                <Route path="/barber/:id" element={<Layout><BarberProfilePage /></Layout>} />

                {/* Protected client routes */}
                <Route path="/profile" element={<ProtectedRoute><Layout><ClientProfile /></Layout></ProtectedRoute>} />
                <Route path="/booking/:barberId" element={<ProtectedRoute><Layout><BookingForm /></Layout></ProtectedRoute>} />

                {/* Protected barber routes - CORRECCIÓN AQUÍ */}
                <Route 
                  path="/barber/dashboard" 
                  element={
                    <ProtectedRoute requiredRole="barber"><Layout><BarberDashboard /></Layout></ProtectedRoute>
                  } 
                />

                <Route 
                  path="/barber/profile" 
                  element={
                    // Usamos el componente correcto que ya estaba importado: BarberProfilePage
                    <ProtectedRoute requiredRole="barber"><Layout><BarberProfilePage /></Layout></ProtectedRoute>
                  } 
                />

                <Route 
                  path="/barber/bookings" 
                  element={
                    <ProtectedRoute requiredRole="barber"><Layout><BarberBookings /></Layout></ProtectedRoute>
                  } 
                />

                {/* ... Tus otras rutas sin cambios ... */}
                
                {/* 404 */}
                <Route path="*" element={<Layout showFooter={false}><NotFound /></Layout>} />
              </Routes>
            </div>
          </Router>
        </BookingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
