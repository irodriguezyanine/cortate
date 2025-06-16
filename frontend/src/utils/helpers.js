import { REGION_CONFIG, VALIDATION, BOOKING_STATUS_COLORS, BARBER_STATUS_COLORS } from './constants';

// ================================
// FUNCIONES DE FORMATEO
// ================================

// Formatear precio chileno
export const formatPrice = (price, includeSymbol = true) => {
  if (price === null || price === undefined || isNaN(price)) {
    return includeSymbol ? '$0' : '0';
  }
  
  const formatted = new Intl.NumberFormat('es-CL', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
  
  return formatted;
};

// Formatear número de teléfono chileno
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Limpiar número
  const cleaned = phone.replace(/[^\d]/g, '');
  
  // Remover código de país si está presente
  const local = cleaned.startsWith('56') ? cleaned.slice(2) : cleaned;
  
  // Formatear según longitud
  if (local.length === 8) {
    return `${local.slice(0, 4)}-${local.slice(4)}`;
  } else if (local.length === 9) {
    return `${local.slice(0, 1)} ${local.slice(1, 5)}-${local.slice(5)}`;
  }
  
  return phone; // Retornar original si no se puede formatear
};

// Formatear fecha en español chileno
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: REGION_CONFIG.timezone
  };
  
  return new Intl.DateTimeFormat('es-CL', { ...defaultOptions, ...options }).format(dateObj);
};

// Formatear hora
export const formatTime = (time) => {
  if (!time) return '';
  
  if (typeof time === 'string') {
    return time.slice(0, 5); // HH:MM
  }
  
  const dateObj = typeof time === 'string' ? new Date(time) : time;
  return dateObj.toLocaleTimeString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

// Formatear fecha relativa (hace X tiempo)
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now - dateObj;
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  } else if (diffInDays < 7) {
    const days = Math.floor(diffInDays);
    return `hace ${days} día${days !== 1 ? 's' : ''}`;
  } else {
    return formatDate(dateObj, { month: 'short', day: 'numeric' });
  }
};

// ================================
// FUNCIONES DE VALIDACIÓN
// ================================

// Validar email
export const isValidEmail = (email) => {
  if (!email) return false;
  return VALIDATION.EMAIL_PATTERN.test(email);
};

// Validar teléfono chileno
export const isValidPhone = (phone) => {
  if (!phone) return false;
  return VALIDATION.PHONE_PATTERN.test(phone);
};

// Validar contraseña
export const isValidPassword = (password) => {
  if (!password) return false;
  return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
};

// Validar nombre
export const isValidName = (name) => {
  if (!name) return false;
  return name.length >= VALIDATION.NAME_MIN_LENGTH && 
         name.length <= VALIDATION.NAME_MAX_LENGTH;
};

// Validar archivo de imagen
export const isValidImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) return { valid: false, error: 'No se seleccionó archivo' };
  
  // Verificar tipo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no válido. Use JPG, PNG o WebP.' };
  }
  
  // Verificar tamaño
  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    return { valid: false, error: `El archivo debe ser menor a ${maxMB}MB` };
  }
  
  return { valid: true };
};

// ================================
// FUNCIONES DE MANIPULACIÓN DE DATOS
// ================================

// Filtrar y ordenar barberos
export const filterAndSortBarbers = (barbers, filters = {}, sortBy = 'distance') => {
  let filtered = [...barbers];
  
  // Aplicar filtros
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(barber =>
      barber.name?.toLowerCase().includes(searchTerm) ||
      barber.description?.toLowerCase().includes(searchTerm) ||
      barber.specialties?.some(spec => spec.toLowerCase().includes(searchTerm))
    );
  }
  
  if (filters.rating) {
    filtered = filtered.filter(barber => (barber.rating || 0) >= filters.rating);
  }
  
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    filtered = filtered.filter(barber => {
      if (!barber.services?.length) return false;
      const prices = barber.services.map(s => s.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      return avgPrice >= min && avgPrice <= max;
    });
  }
  
  if (filters.serviceType) {
    filtered = filtered.filter(barber =>
      barber.serviceTypes?.includes(filters.serviceType)
    );
  }
  
  if (filters.available) {
    filtered = filtered.filter(barber =>
      barber.status === 'available' || barber.availability?.immediateBooking
    );
  }
  
  // Ordenar
  return sortBarbers(filtered, sortBy);
};

// Ordenar barberos
export const sortBarbers = (barbers, sortBy) => {
  const sorted = [...barbers];
  
  switch (sortBy) {
    case 'distance':
      return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    case 'price_low':
      return sorted.sort((a, b) => {
        const aMin = a.services?.length ? Math.min(...a.services.map(s => s.price)) : 0;
        const bMin = b.services?.length ? Math.min(...b.services.map(s => s.price)) : 0;
        return aMin - bMin;
      });
    
    case 'price_high':
      return sorted.sort((a, b) => {
        const aMax = a.services?.length ? Math.max(...a.services.map(s => s.price)) : 0;
        const bMax = b.services?.length ? Math.max(...b.services.map(s => s.price)) : 0;
        return bMax - aMax;
      });
    
    case 'reviews':
      return sorted.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
    
    case 'name':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    default:
      return sorted;
  }
};

// ================================
// FUNCIONES DE GEOLOCALIZACIÓN
// ================================

// Calcular distancia entre dos puntos
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Convertir grados a radianes
export const degreesToRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Formatear distancia
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else {
    return `${distance.toFixed(1)}km`;
  }
};

// ================================
// FUNCIONES DE UTILIDAD GENERAL
// ================================

// Debounce para búsquedas
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generar ID único
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Capitalizar primera letra
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Truncar texto
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

// Obtener iniciales del nombre
export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ================================
// FUNCIONES DE ESTADO Y COLORES
// ================================

// Obtener color por estado de reserva
export const getBookingStatusColor = (status) => {
  return BOOKING_STATUS_COLORS[status] || '#6b7280';
};

// Obtener color por estado de barbero
export const getBarberStatusColor = (status) => {
  return BARBER_STATUS_COLORS[status] || '#6b7280';
};

// Generar color de avatar basado en nombre
export const getAvatarColor = (name) => {
  if (!name) return '#6b7280';
  
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// ================================
// FUNCIONES DE CACHE LOCAL
// ================================

// Guardar en localStorage
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Obtener de localStorage
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// Remover de localStorage
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// ================================
// FUNCIONES DE URL Y NAVEGACIÓN
// ================================

// Construir query string
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      searchParams.append(key, params[key]);
    }
  });
  
  return searchParams.toString();
};

// Parsear query string
export const parseQueryString = (queryString) => {
  const params = {};
  const searchParams = new URLSearchParams(queryString);
  
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  
  return params;
};

// ================================
// FUNCIONES DE ARRAYS Y OBJETOS
// ================================

// Agrupar array por propiedad
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

// Remover duplicados de array
export const removeDuplicates = (array, key) => {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// Deep clone objeto
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    Object.keys(obj).forEach(key => {
      clonedObj[key] = deepClone(obj[key]);
    });
    return clonedObj;
  }
};

// ================================
// FUNCIONES DE TIEMPO
// ================================

// Verificar si una fecha es hoy
export const isToday = (date) => {
  const today = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
};

// Verificar si una fecha es en el futuro
export const isFuture = (date) => {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > now;
};

// Obtener días entre dos fechas
export const getDaysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = typeof date1 === 'string' ? new Date(date1) : date1;
  const secondDate = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

export default {
  formatPrice,
  formatPhoneNumber,
  formatDate,
  formatTime,
  formatRelativeTime,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidName,
  isValidImageFile,
  filterAndSortBarbers,
  sortBarbers,
  calculateDistance,
  formatDistance,
  debounce,
  generateId,
  capitalize,
  truncateText,
  getInitials,
  getBookingStatusColor,
  getBarberStatusColor,
  getAvatarColor,
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  buildQueryString,
  parseQueryString,
  groupBy,
  removeDuplicates,
  deepClone,
  isToday,
  isFuture,
  getDaysBetween
};
