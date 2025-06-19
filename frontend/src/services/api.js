import axios from 'axios';
import toast from 'react-hot-toast';

// --- CONFIGURACIÓN PARA TU BACKEND (CÓRTATE.CL API) ---

// URL base de tu API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'; // Ajustado a puerto 3001 como en tus carpetas

// Instancia de Axios para tu API, con toda tu lógica de interceptores
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Muy útil para manejo de cookies si es necesario
});

// >>> Tu lógica de interceptores para 'api' (sin cambios, está perfecta)
// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    if (import.meta.env.DEV) {
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            try {
              const refreshResponse = await api.post('/auth/refresh'); // Usa 'api' para el refresh
              const { token: newToken } = refreshResponse.data;
              localStorage.setItem('token', newToken);
              api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            } catch (refreshError) {
              localStorage.removeItem('token');
              // No uses window.location.href directamente si usas React Router.
              // Es mejor manejar esto con el router. Por ahora lo dejamos como alerta.
              // window.location.href = '/login'; 
              toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
              // Podrías emitir un evento personalizado para que tu App de React reaccione.
              window.dispatchEvent(new Event('session-expired'));
            }
          }
          break;
        case 403:
          toast.error(data.message || 'No tienes permisos para realizar esta acción');
          break;
        case 404:
          if (!originalRequest.url.includes('/auth/profile')) {
            toast.error(data.message || 'Recurso no encontrado');
          }
          break;
        case 422:
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => toast.error(err.message || err.msg || 'Error de validación'));
          } else {
            toast.error(data.message || 'Error de validación');
          }
          break;
        case 429:
          toast.error('Demasiadas solicitudes. Intenta nuevamente en unos minutos.');
          break;
        case 500:
          toast.error('Error del servidor. Intenta nuevamente más tarde.');
          break;
        default:
          if (!originalRequest.hideErrorToast) {
            toast.error(data.message || 'Ha ocurrido un error');
          }
      }
    } else if (error.request) {
      if (navigator.onLine) {
        toast.error('Error de conexión con el servidor.');
      } else {
        toast.error('Sin conexión a internet. Revisa tu red.');
      }
    } else {
      toast.error('Error inesperado al configurar la solicitud.');
    }
    return Promise.reject(error);
  }
);


// --- PARTE NUEVA ---
// --- CONFIGURACIÓN PARA GOOGLE PLACES API ---

// Creamos una instancia separada para Google porque:
// 1. Tiene una URL base completamente diferente.
// 2. No necesita los interceptores de autenticación (Bearer token) de nuestra API.
// 3. Su manejo de errores es distinto.
export const placesAPI = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api/place',
  timeout: 10000, // Un timeout razonable para APIs externas
});

// --- EXPORTACIONES ---

// Tus endpoints, helpers, etc. (sin cambios)
export const endpoints = { /* ... tu objeto de endpoints sin cambios ... */ };
export const apiHelpers = { /* ... tu objeto de helpers sin cambios ... */ };
export const bookingAPI = { /* ... tu objeto de bookingAPI sin cambios ... */ };
export const addRequestInterceptor = (onFulfilled, onRejected) => api.interceptors.request.use(onFulfilled, onRejected);
export const addResponseInterceptor = (onFulfilled, onRejected) => api.interceptors.response.use(onFulfilled, onRejected);
export const removeInterceptor = (interceptor, type = 'request') => { /* ... */ };
export const isOnline = () => navigator.onLine;
export const getBaseURL = () => API_BASE_URL;

// Exportamos la instancia principal de tu API como default
export default api;
