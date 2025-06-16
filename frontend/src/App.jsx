import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from 'react-error-boundary'

// Context Providers
import { AuthProvider } from '@context/AuthContext'
import { BookingProvider } from '@context/BookingContext'
import { MapProvider } from '@context/MapContext'

// Layout Components
import Header from '@components/common/Header'
import Footer from '@components/common/Footer'
import WhatsAppFloat from '@components/common/WhatsAppFloat'
import LoadingSpinner from '@components/common/LoadingSpinner'
import ErrorFallback from '@components/common/ErrorFallback'

// Page Components (Lazy loaded)
const Landing = React.lazy(() => import('@pages/Landing'))
const Login = React.lazy(() => import('@pages/Login'))
const Register = React.lazy(() => import('@pages/Register'))
const MapPage = React.lazy(() => import('@pages/MapPage'))
const ListPage = React.lazy(() => import('@pages/ListPage'))
const BarberProfile = React.lazy(() => import('@pages/BarberProfile'))
const ClientProfile = React.lazy(() => import('@pages/ClientProfile'))
const BarberDashboard = React.lazy(() => import('@pages/BarberDashboard'))
const BookingHistory = React.lazy(() => import('@pages/BookingHistory'))
const NotFound = React.lazy(() => import('@pages/NotFound'))

// Protected Route Component
import ProtectedRoute from '@components/common/ProtectedRoute'

// Global Styles
import './styles/index.css'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Main App Component
function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo)
        // Here you could send to error reporting service
      }}
    >
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <AuthProvider>
              <BookingProvider>
                <MapProvider>
                  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    {/* Header */}
                    <Header />
                    
                    {/* Main Content */}
                    <main className="relative">
                      <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                          {/* Public Routes */}
                          <Route path="/" element={<Landing />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/mapa" element={<MapPage />} />
                          <Route path="/lista" element={<ListPage />} />
                          <Route path="/barbero/:id" element={<BarberProfile />} />
                          
                          {/* Protected Routes - Client */}
                          <Route 
                            path="/perfil" 
                            element={
                              <ProtectedRoute role="client">
                                <ClientProfile />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/reservas" 
                            element={
                              <ProtectedRoute role="client">
                                <BookingHistory />
                              </ProtectedRoute>
                            } 
                          />
                          
                          {/* Protected Routes - Barber */}
                          <Route 
                            path="/dashboard" 
                            element={
                              <ProtectedRoute role="barber">
                                <BarberDashboard />
                              </ProtectedRoute>
                            } 
                          />
                          
                          {/* Redirects */}
                          <Route path="/home" element={<Navigate to="/" replace />} />
                          <Route path="/inicio" element={<Navigate to="/" replace />} />
                          
                          {/* 404 */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </main>
                    
                    {/* Footer */}
                    <Footer />
                    
                    {/* WhatsApp Float Button */}
                    <WhatsAppFloat />
                    
                    {/* Toast Notifications */}
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#1f2937',
                          color: '#f3f4f6',
                          border: '1px solid #D4AF37',
                        },
                        success: {
                          iconTheme: {
                            primary: '#22c55e',
                            secondary: '#ffffff',
                          },
                        },
                        error: {
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#ffffff',
                          },
                        },
                        loading: {
                          iconTheme: {
                            primary: '#D4AF37',
                            secondary: '#ffffff',
                          },
                        },
                      }}
                    />
                  </div>
                </MapProvider>
              </BookingProvider>
            </AuthProvider>
          </Router>
          
          {/* React Query DevTools (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}

export default App
