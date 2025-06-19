import axios from 'axios'
import toast from 'react-hot-toast'

// --- CONFIGURACIÓN PARA TU BACKEND (CÓRTATE.CL API) ---

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001' // Puerto ajustado a tu estructura de backend

// Create axios instance for your API
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    // Calculate request duration for performance monitoring
    const duration = new Date() - response.config.metadata.startTime
    
    if (import.meta.env.DEV) { // Usando import.meta.env.DEV que es el estándar en Vite
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle different error types
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          if (!originalRequest._retry) {
            originalRequest._retry = true
            
            try {
              // Try to refresh token using the api instance
              const refreshResponse = await api.post('/auth/refresh')
              
              const { token: newToken } = refreshResponse.data
              localStorage.setItem('token', newToken)
              
              // Update the default header for subsequent requests
              api.defaults.headers.common.Authorization = `Bearer ${newToken}`
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return api(originalRequest)
              
            } catch (refreshError) {
              // Refresh failed, clear session and notify user
              localStorage.removeItem('token')
              // Instead of hard redirect, let the app handle routing
              // window.location.href = '/login'
              toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.')
              // Dispatch an event that React components can listen for to redirect
              window.dispatchEvent(new Event('session-expired'))
            }
          }
          break
          
        case 403:
          // Forbidden
          toast.error(data.message || 'No tienes permisos para realizar esta acción')
          break
          
        case 404:
          // Not found
          if (!originalRequest.url.includes('/auth/profile')) {
            toast.error(data.message || 'Recurso no encontrado')
          }
          break
          
        case 422:
          // Validation error
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => toast.error(err.message || err.msg || 'Error de validación'))
          } else {
            toast.error(data.message || 'Error de validación')
          }
          break
          
        case 429:
          // Too many requests
          toast.error('Demasiadas solicitudes. Intenta nuevamente en unos minutos.')
          break
          
        case 500:
          // Server error
          toast.error('Error del servidor. Intenta nuevamente más tarde.')
          break
          
        default:
          // Other errors
          if (!originalRequest.hideErrorToast) {
            toast.error(data.message || 'Ha ocurrido un error')
          }
      }
    } else if (error.request) {
      // Network error
      if (navigator.onLine) {
        toast.error('Error de conexión con el servidor.')
      } else {
        toast.error('Sin conexión a internet')
      }
    } else {
      // Request setup error
      toast.error('Error inesperado al configurar la solicitud')
    }
    
    return Promise.reject(error)
  }
)

// --- CONFIGURACIÓN PARA GOOGLE PLACES API ---
// Se crea una instancia separada para la API de Google Places.
// No lleva los interceptores de autenticación de nuestra API principal.
export const placesAPI = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api/place',
  timeout: 15000,
});


// --- ENDPOINTS Y HELPERS ---

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    profile: '/auth/profile',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
  },
  
  // Users
  users: {
    base: '/users',
    me: '/users/me',
    favorites: '/users/me/favorites',
    bookings: '/users/me/bookings',
    reviews: '/users/me/reviews',
    notifications: '/users/me/notifications',
  },
  
  // Barbers
  barbers: {
    base: '/barbers',
    nearby: '/barbers/nearby',
    search: '/barbers/search',
    top: '/barbers/top',
    me: '/barbers/me',
    dashboard: '/barbers/me/dashboard',
    stats: '/barbers/me/stats',
    bookings: '/barbers/me/bookings',
    earnings: '/barbers/me/earnings',
    photos: '/barbers/me/photos',
  },
  
  // Bookings
  bookings: {
    base: '/bookings',
    immediate: '/bookings/immediate',
    me: '/bookings/me',
    barber: '/bookings/barber/me',
    availability: (barberId) => `/bookings/barber/${barberId}/availability`,
    slots: (barberId) => `/bookings/barber/${barberId}/slots`,
  },
  
  // Reviews
  reviews: {
    base: '/reviews',
    barber: (barberId) => `/reviews/barber/${barberId}`,
    barberStats: (barberId) => `/reviews/barber/${barberId}/stats`,
    googlePlace: '/reviews/google-place',
    mine: '/reviews/client/mine',
  },
  
  // Google Places (proxied through our backend)
  places: {
    search: '/places/search',
    details: (placeId) => `/places/${placeId}/details`,
    claim: (placeId) => `/places/${placeId}/claim`,
  },
  
  // Penalties (admin)
  penalties: {
    base: '/penalties',
    barber: (barberId) => `/penalties/barber/${barberId}`,
    appeal: (penaltyId) => `/penalties/${penaltyId}/appeal`,
  }
}

// Helper functions for common API patterns
export const apiHelpers = {
  get: async (url, config = {}) => { try { const response = await api.get(url, config); return response.data; } catch (error) { throw error; } },
  post: async (url, data = {}, config = {}) => { try { const response = await api.post(url, data, config); return response.data; } catch (error) { throw error; } },
  put: async (url, data = {}, config = {}) => { try { const response = await api.put(url, data, config); return response.data; } catch (error) { throw error; } },
  delete: async (url, config = {}) => { try { const response = await api.delete(url, config); return response.data; } catch (error) { throw error; } },
  upload: async (url, formData, onProgress = null) => { try { const config = { headers: { 'Content-Type': 'multipart/form-data' } }; if (onProgress) { config.onUploadProgress = (e) => onProgress(Math.round((e.loaded * 100) / e.total)); } const response = await api.post(url, formData, config); return response.data; } catch (error) { throw error; } },
  download: async (url, filename) => { try { const response = await api.get(url, { responseType: 'blob' }); const downloadUrl = window.URL.createObjectURL(new Blob([response.data])); const link = document.createElement('a'); link.href = downloadUrl; link.setAttribute('download', filename); document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(downloadUrl); return response.data; } catch (error) { throw error; } }
}

// ====================================================================
// ======================> NUEVA SECCIÓN <======================
// ====================================================================

// Barber API methods - Agrupamos todas las funciones relacionadas a barberos
export const barberAPI = {
  // Obtener todos los barberos o buscar con query params
  getAll: async (params = {}) => {
    return await apiHelpers.get(endpoints.barbers.base, { params });
  },
  // Obtener un barbero por su ID
  getById: async (id) => {
    return await apiHelpers.get(`${endpoints.barbers.base}/${id}`);
  },
  // Obtener barberos cercanos
  getNearby: async (params) => { // { latitude, longitude, radius }
    return await apiHelpers.get(endpoints.barbers.nearby, { params });
  },
  // Buscar barberos por un término
  search: async (query) => {
    return await apiHelpers.get(endpoints.barbers.search, { params: { q: query } });
  },
  // Obtener el top de barberos
  getTop: async () => {
    return await apiHelpers.get(endpoints.barbers.top);
  },
  // Obtener el perfil del barbero logueado
  getMyProfile: async () => {
    return await apiHelpers.get(endpoints.barbers.me);
  },
  // Actualizar el perfil del barbero logueado
  updateMyProfile: async (data) => {
    return await apiHelpers.put(endpoints.barbers.me, data);
  },
  // Obtener el dashboard del barbero
  getDashboard: async () => {
    return await apiHelpers.get(endpoints.barbers.dashboard);
  },
  // (Y así sucesivamente para los demás endpoints como stats, bookings, earnings, photos...)
};


// ====================================================================
// ======================> FIN DE LA SECCIÓN <======================
// ====================================================================

// Booking API methods
export const bookingAPI = {
  create: async (bookingData) => await apiHelpers.post(endpoints.bookings.base, bookingData),
  getByUser: async () => await apiHelpers.get(endpoints.bookings.me),
  getByBarber: async () => await apiHelpers.get(endpoints.bookings.barber),
  getById: async (id) => await apiHelpers.get(`${endpoints.bookings.base}/${id}`),
  confirm: async (bookingId) => await apiHelpers.put(`${endpoints.bookings.base}/${bookingId}/confirm`),
  cancel: async (bookingId, reason = '') => await apiHelpers.put(`${endpoints.bookings.base}/${bookingId}/cancel`, { reason }),
  complete: async (bookingId, completionData = {}) => await apiHelpers.put(`${endpoints.bookings.base}/${bookingId}/complete`, completionData),
  checkAvailability: async (barberId, date, time) => await apiHelpers.get(`${endpoints.bookings.availability(barberId)}?${new URLSearchParams({ date, time })}`),
  getAvailableSlots: async (barberId, date) => await apiHelpers.get(`${endpoints.bookings.slots(barberId)}?${new URLSearchParams({ date })}`),
  createImmediate: async (bookingData) => await apiHelpers.post(endpoints.bookings.immediate, bookingData),
};

// Request/Response interceptor helpers
export const addRequestInterceptor = (onFulfilled, onRejected) => api.interceptors.request.use(onFulfilled, onRejected);
export const addResponseInterceptor = (onFulfilled, onRejected) => api.interceptors.response.use(onFulfilled, onRejected);
export const removeInterceptor = (interceptor, type = 'request') => { if (type === 'request') { api.interceptors.request.eject(interceptor) } else { api.interceptors.response.eject(interceptor) } };

// Utils
export const isOnline = () => navigator.onLine;
export const getBaseURL = () => API_BASE_URL;

// Exportación por defecto de tu instancia principal de API
export default api
