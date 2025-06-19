// frontend/src/App.jsx (Versión Final y Simplificada)

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Ya no necesitamos los Providers aquí

// Layout components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import WhatsAppFloat from './components/common/WhatsAppFloat';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorFallback from './components/common/ErrorFallback';

// Pages
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

// Componentes (no páginas)
import BookingForm from './components/bookings/BookingForm';

// Styles
import './styles/index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
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
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1 pt-16"> {/* Añadido padding-top para que el contenido no quede debajo del header fijo */}
        {children}
      </main>
      {showFooter && <Footer />}
      <WhatsAppFloat />
    </div>
  );
};

// Main App component
function App() {
  return (
    <ErrorBoundary>
      <Router>
        {/* Los providers se han movido a main.jsx */}
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
          
          {/* Rutas comentadas que no existen todavía */}
          {/* 
          <Route path="/barber/profile" element={<ProtectedRoute requiredRole="barber"><Layout><BarberProfilePage /></Layout></ProtectedRoute>} />
          <Route path="/barber/bookings" element={<ProtectedRoute requiredRole="barber"><Layout><BarberBookings /></Layout></ProtectedRoute>} />
          */}

          {/* Redirects */}
          <Route path="/search" element={<Navigate to="/map" replace />} />
          <Route path="/barberos" element={<Navigate to="/map" replace />} />

          {/* 404 */}
          <Route path="*" element={<Layout showFooter={false}><NotFound /></Layout>} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
