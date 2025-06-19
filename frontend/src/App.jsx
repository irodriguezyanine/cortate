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

// Pages (estos ya estaban correctos)
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

// CORRECCIÓN DE RUTAS DE IMPORTACIÓN:
// Apuntamos a la ubicación correcta de los componentes.
// BookingForm está en 'components/bookings', no en 'pages'.
import BookingForm from './components/bookings/BookingForm'; 

// BarberProfile y BarberBookings probablemente son páginas, así que las dejamos apuntando a 'pages'.
// Si estos también dan error, solo ajusta su ruta a la carpeta correcta.
import BarberProfile from './pages/BarberProfile';
import BarberBookings from './pages/BarberBookings';

// Las páginas estáticas probablemente sí están en la carpeta 'pages'.
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
class ErrorBoundary extends React.Component {
  // ... tu código de ErrorBoundary sin cambios ...
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Layout component
const Layout = ({ children, showHeader = true, showFooter = true }) => {
  // ... tu código de Layout sin cambios ...
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      <WhatsAppFloat />
    </div>
  );
};

// Main App component
function App() {
  // ... tu código de App y Routes sin cambios ...
  // Ahora las rutas funcionarán porque los componentes se importan correctamente.
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BookingProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Layout><Landing /></Layout>} />
                <Route path="/login" element={<Layout showFooter={false}><Login /></Layout>} />
                <Route path="/register" element={<Layout showFooter={false}><Register /></Layout>} />
                <Route path="/map" element={<Layout showFooter={false}><MapPage /></Layout>} />
                <Route path="/list" element={<Layout><ListPage /></Layout>} />
                <Route path="/barber/:id" element={<Layout><BarberProfilePage /></Layout>} />

                {/* Protected client routes */}
                <Route path="/bookings" element={<ProtectedRoute><Layout><BookingHistory /></Layout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Layout><ClientProfile /></Layout></ProtectedRoute>} />
                <Route path="/booking/:barberId" element={<ProtectedRoute><Layout><BookingForm /></Layout></ProtectedRoute>} />

                {/* Protected barber routes */}
                <Route path="/barber/dashboard" element={<ProtectedRoute requiredRole="barber"><Layout><BarberDashboard /></Layout></ProtectedRoute>} />
                <Route path="/barber/profile" element={<ProtectedRoute requiredRole="barber"><Layout><BarberProfile /></Layout></ProtectedRoute>} />
                <Route path="/barber/bookings" element={<ProtectedRoute requiredRole="barber"><Layout><BarberBookings /></Layout></ProtectedRoute>} />

                {/* Static pages */}
                <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
                <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
                <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
                <Route path="/contact" element={<Layout><Contact /></Layout>} />

                {/* Redirects */}
                <Route path="/search" element={<Navigate to="/map" replace />} />
                <Route path="/barberos" element={<Navigate to="/map" replace />} />

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
