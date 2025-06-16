// ================================
// CONSTANTES GENERALES - CÓRTATE.CL
// ================================

// URLs y endpoints
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';

// Google APIs
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// ================================
// CONFIGURACIÓN REGIONAL
// ================================
export const REGION_CONFIG = {
  country: 'Chile',
  countryCode: 'CL',
  currency: 'CLP',
  locale: 'es-CL',
  timezone: 'America/Santiago',
  phonePrefix: '+56',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  decimalSeparator: ',',
  thousandsSeparator: '.'
};

// Ciudades principales de Chile
export const MAIN_CITIES = [
  'Santiago',
  'Valparaíso',
  'Viña del Mar',
  'Concepción',
  'La Serena',
  'Antofagasta',
  'Temuco',
  'Iquique',
  'Rancagua',
  'Talca',
  'Arica',
  'Chillán',
  'Calama',
  'Puerto Montt',
  'Valdivia'
];

// ================================
// TIPOS DE USUARIO
// ================================
export const USER_TYPES = {
  CLIENT: 'client',
  BARBER: 'barber',
  ADMIN: 'admin'
};

export const USER_TYPE_LABELS = {
  [USER_TYPES.CLIENT]: 'Cliente',
  [USER_TYPES.BARBER]: 'Barbero',
  [USER_TYPES.ADMIN]: 'Administrador'
};

// ================================
// ESTADOS DE RESERVA
// ================================
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
  REJECTED: 'rejected'
};

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'Pendiente',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmada',
  [BOOKING_STATUS.IN_PROGRESS]: 'En progreso',
  [BOOKING_STATUS.COMPLETED]: 'Completada',
  [BOOKING_STATUS.CANCELLED]: 'Cancelada',
  [BOOKING_STATUS.NO_SHOW]: 'No asistió',
  [BOOKING_STATUS.REJECTED]: 'Rechazada'
};

export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: '#f59e0b',
  [BOOKING_STATUS.CONFIRMED]: '#10b981',
  [BOOKING_STATUS.IN_PROGRESS]: '#3b82f6',
  [BOOKING_STATUS.COMPLETED]: '#6b7280',
  [BOOKING_STATUS.CANCELLED]: '#ef4444',
  [BOOKING_STATUS.NO_SHOW]: '#dc2626',
  [BOOKING_STATUS.REJECTED]: '#ef4444'
};

// ================================
// TIPOS DE RESERVA
// ================================
export const BOOKING_TYPES = {
  SCHEDULED: 'scheduled',
  IMMEDIATE: 'immediate'
};

export const BOOKING_TYPE_LABELS = {
  [BOOKING_TYPES.SCHEDULED]: 'Programada',
  [BOOKING_TYPES.IMMEDIATE]: 'Inmediata'
};

// ================================
// TIPOS DE SERVICIO
// ================================
export const SERVICE_TYPES = {
  IN_SHOP: 'in_shop',
  HOME: 'home',
  BOTH: 'both'
};

export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPES.IN_SHOP]: 'Solo en local',
  [SERVICE_TYPES.HOME]: 'Solo a domicilio',
  [SERVICE_TYPES.BOTH]: 'Local y domicilio'
};

// Servicios principales (obligatorios)
export const MAIN_SERVICES = {
  HAIRCUT: {
    name: 'Corte de Cabello',
    description: 'Corte masculino tradicional',
    required: true,
    category: 'principal'
  },
  HAIRCUT_BEARD: {
    name: 'Corte + Barba',
    description: 'Corte de cabello más arreglo de barba',
    required: true,
    category: 'principal'
  }
};

// Servicios adicionales (opcionales)
export const ADDITIONAL_SERVICES = {
  KIDS: {
    name: 'Corte Niños',
    description: 'Especializado en cortes infantiles',
    tag: 'niños',
    icon: '👶'
  },
  EXPRESS: {
    name: 'Corte Exprés',
    description: 'Corte rápido en 20 minutos',
    tag: 'exprés',
    icon: '⚡'
  },
  DESIGN: {
    name: 'Diseño',
    description: 'Cortes con diseños personalizados',
    tag: 'diseño',
    icon: '🎨'
  },
  FATHER_SON: {
    name: 'Padre e Hijo',
    description: 'Experiencia especial para padres e hijos',
    tag: 'padre e hijo',
    icon: '👨‍👦'
  }
};

// ================================
// ESTADOS DEL BARBERO
// ================================
export const BARBER_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
  BREAK: 'break'
};

export const BARBER_STATUS_LABELS = {
  [BARBER_STATUS.AVAILABLE]: 'Disponible',
  [BARBER_STATUS.BUSY]: 'Ocupado',
  [BARBER_STATUS.OFFLINE]: 'Desconectado',
  [BARBER_STATUS.BREAK]: 'En descanso'
};

export const BARBER_STATUS_COLORS = {
  [BARBER_STATUS.AVAILABLE]: '#16a34a', // Verde
  [BARBER_STATUS.BUSY]: '#f59e0b', // Amarillo
  [BARBER_STATUS.OFFLINE]: '#6b7280', // Gris
  [BARBER_STATUS.BREAK]: '#3b82f6' // Azul
};

// Colores para el mapa
export const MAP_MARKER_COLORS = {
  AVAILABLE: '#16a34a', // Verde - disponible para reservar
  IMMEDIATE: '#2563eb', // Azul - acepta cortes inmediatos
  NO_PROFILE: '#dc2626', // Rojo - sin perfil
  OFFLINE: '#6b7280' // Gris - no disponible
};

// ================================
// RANGOS DE PRECIOS
// ================================
export const PRICE_RANGES = [
  { min: 0, max: 10000, label: 'Hasta $10.000' },
  { min: 10000, max: 15000, label: '$10.000 - $15.000' },
  { min: 15000, max: 20000, label: '$15.000 - $20.000' },
  { min: 20000, max: 30000, label: '$20.000 - $30.000' },
  { min: 30000, max: 50000, label: '$30.000 - $50.000' },
  { min: 50000, max: Infinity, label: 'Más de $50.000' }
];

// ================================
// CONFIGURACIÓN DE ARCHIVOS
// ================================
export const FILE_UPLOAD = {
  MAX_SIZE: {
    PROFILE_IMAGE: 5 * 1024 * 1024, // 5MB
    GALLERY_IMAGE: 10 * 1024 * 1024, // 10MB
    REVIEW_IMAGE: 5 * 1024 * 1024 // 5MB
  },
  ACCEPTED_TYPES: {
    IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    DOCUMENTS: ['application/pdf']
  },
  MAX_GALLERY_IMAGES: 10,
  MAX_REVIEW_IMAGES: 3
};

// ================================
// CONFIGURACIÓN DE VALIDACIÓN
// ================================
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_PATTERN: /^(\+?56)?[0-9]{8,9}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MAX_COMMENT_LENGTH: 500,
  MIN_RATING: 1,
  MAX_RATING: 5
};

// ================================
// CONFIGURACIÓN DE HORARIOS
// ================================
export const WORKING_HOURS = {
  DEFAULT_START: '09:00',
  DEFAULT_END: '18:00',
  SLOT_DURATION: 30, // minutos
  BREAK_DURATION: 60, // minutos
  MIN_ADVANCE_BOOKING: 30, // minutos
  MAX_ADVANCE_BOOKING: 30 // días
};

export const DAYS_OF_WEEK = [
  { id: 0, name: 'Domingo', short: 'Dom' },
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' }
];

// ================================
// CONFIGURACIÓN DE PENALIZACIONES
// ================================
export const PENALTIES = {
  LATE_CANCELLATION: 0.10, // 10% del precio
  NO_SHOW: 0.50, // 50% del precio
  MAX_REJECTIONS_PER_DAY: 3,
  MAX_NO_SHOWS_PER_WEEK: 2,
  SUSPENSION_DAYS: 7
};

// ================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ================================
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_REMINDER: 'booking_reminder',
  REVIEW_RECEIVED: 'review_received',
  PAYMENT_RECEIVED: 'payment_received'
};

// ================================
// CONFIGURACIÓN DE FILTROS
// ================================
export const FILTER_OPTIONS = {
  SORT_BY: [
    { value: 'distance', label: 'Distancia' },
    { value: 'rating', label: 'Calificación' },
    { value: 'price_low', label: 'Precio: Menor a Mayor' },
    { value: 'price_high', label: 'Precio: Mayor a Menor' },
    { value: 'reviews', label: 'Más Reseñas' },
    { value: 'name', label: 'Nombre A-Z' }
  ],
  RATING_FILTER: [
    { value: 4, label: '4+ estrellas' },
    { value: 3, label: '3+ estrellas' },
    { value: 2, label: '2+ estrellas' },
    { value: 1, label: '1+ estrellas' }
  ],
  DISTANCE_FILTER: [
    { value: 1, label: 'Hasta 1 km' },
    { value: 2, label: 'Hasta 2 km' },
    { value: 5, label: 'Hasta 5 km' },
    { value: 10, label: 'Hasta 10 km' },
    { value: 20, label: 'Hasta 20 km' }
  ]
};

// ================================
// MENSAJES Y TEXTOS
// ================================
export const MESSAGES = {
  ERRORS: {
    NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
    UNAUTHORIZED: 'Sesión expirada. Por favor inicia sesión nuevamente.',
    SERVER: 'Error del servidor. Por favor intenta más tarde.',
    VALIDATION: 'Por favor verifica los datos ingresados.',
    NOT_FOUND: 'El recurso solicitado no fue encontrado.',
    PERMISSION_DENIED: 'No tienes permisos para realizar esta acción.'
  },
  SUCCESS: {
    PROFILE_UPDATED: 'Perfil actualizado exitosamente',
    BOOKING_CREATED: 'Reserva creada exitosamente',
    BOOKING_CANCELLED: 'Reserva cancelada exitosamente',
    REVIEW_SUBMITTED: 'Reseña enviada exitosamente',
    IMAGE_UPLOADED: 'Imagen subida exitosamente'
  },
  CONFIRMATION: {
    DELETE_ACCOUNT: '¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.',
    CANCEL_BOOKING: '¿Estás seguro de cancelar esta reserva?',
    DELETE_REVIEW: '¿Estás seguro de eliminar esta reseña?'
  }
};

// ================================
// CONFIGURACIÓN DE MAPA
// ================================
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: -33.4489, lng: -70.6693 }, // Santiago, Chile
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
  SEARCH_RADIUS: 10, // km
  MARKER_CLUSTER_MAX_ZOOM: 15
};

// ================================
// REDES SOCIALES Y CONTACTO
// ================================
export const SOCIAL_MEDIA = {
  WHATSAPP: {
    NUMBER: '56912345678',
    DEFAULT_MESSAGE: '¡Hola! Tengo una consulta sobre Córtate.cl'
  },
  INSTAGRAM: '@cortate.cl',
  FACEBOOK: 'facebook.com/cortate.cl',
  EMAIL: 'contacto@cortate.cl'
};

// ================================
// CONFIGURACIÓN DE ANALYTICS
// ================================
export const ANALYTICS_EVENTS = {
  BARBER_VIEW: 'barber_view',
  BOOKING_START: 'booking_start',
  BOOKING_COMPLETE: 'booking_complete',
  WHATSAPP_CLICK: 'whatsapp_click',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied'
};

// ================================
// CONFIGURACIÓN DE CACHE
// ================================
export const CACHE_KEYS = {
  USER_LOCATION: 'user_location',
  RECENT_SEARCHES: 'recent_searches',
  FAVORITE_BARBERS: 'favorite_barbers',
  MAP_PREFERENCES: 'map_preferences'
};

export const CACHE_EXPIRY = {
  USER_LOCATION: 30 * 60 * 1000, // 30 minutos
  SEARCH_RESULTS: 5 * 60 * 1000, // 5 minutos
  BARBER_DETAILS: 10 * 60 * 1000, // 10 minutos
  USER_PREFERENCES: 24 * 60 * 60 * 1000 // 24 horas
};

// ================================
// CONFIGURACIÓN DE PAGINACIÓN
// ================================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
  MOBILE_PAGE_SIZE: 6
};

// ================================
// BREAKPOINTS RESPONSIVE
// ================================
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// ================================
// CONFIGURACIÓN DE DESARROLLO
// ================================
export const DEV_CONFIG = {
  ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
  ENABLE_MOCK_DATA: process.env.REACT_APP_USE_MOCK_DATA === 'true',
  API_DELAY: process.env.NODE_ENV === 'development' ? 1000 : 0
};

export default {
  API_BASE_URL,
  REGION_CONFIG,
  USER_TYPES,
  BOOKING_STATUS,
  SERVICE_TYPES,
  MAIN_SERVICES,
  ADDITIONAL_SERVICES,
  BARBER_STATUS,
  PRICE_RANGES,
  FILE_UPLOAD,
  VALIDATION,
  WORKING_HOURS,
  PENALTIES,
  FILTER_OPTIONS,
  MESSAGES,
  MAP_CONFIG,
  SOCIAL_MEDIA,
  ANALYTICS_EVENTS,
  CACHE_KEYS,
  PAGINATION,
  BREAKPOINTS,
  DEV_CONFIG
};
