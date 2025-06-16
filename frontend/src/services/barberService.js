import { barberAPI, placesAPI } from './api';

// Servicio para manejar operaciones de barberos
class BarberService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Obtener todos los barberos con filtros
  async getBarbers(filters = {}) {
    try {
      const cacheKey = `barbers_${JSON.stringify(filters)}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await barberAPI.getAll(filters);
      
      if (response.success) {
        const result = {
          success: true,
          data: response.data.barbers || response.data,
          pagination: response.data.pagination,
          total: response.data.total
        };
        
        this.setCache(cacheKey, result);
        return result;
      } else {
        return {
          success: false,
          data: [],
          message: response.message || 'Error al obtener barberos'
        };
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Obtener barbero por ID
  async getBarberById(id) {
    try {
      const cacheKey = `barber_${id}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await barberAPI.getById(id);
      
      if (response.success) {
        const result = {
          success: true,
          data: response.data
        };
        
        this.setCache(cacheKey, result);
        return result;
      } else {
        return {
          success: false,
          data: null,
          message: response.message || 'Barbero no encontrado'
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Obtener barberos cercanos
  async getNearbyBarbers(lat, lng, radius = 5, filters = {}) {
    try {
      const response = await barberAPI.getNearby(lat, lng, radius);
      
      if (response.success) {
        let barbers = response.data || [];
        
        // Aplicar filtros adicionales
        if (filters.service) {
          barbers = barbers.filter(barber => 
            barber.services.some(service => 
              service.name.toLowerCase().includes(filters.service.toLowerCase())
            )
          );
        }
        
        if (filters.priceRange) {
          const [min, max] = filters.priceRange;
          barbers = barbers.filter(barber => {
            const prices = barber.services.map(s => s.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            return minPrice >= min && maxPrice <= max;
          });
        }
        
        if (filters.rating) {
          barbers = barbers.filter(barber => 
            (barber.rating || 0) >= filters.rating
          );
        }
        
        if (filters.availability) {
          barbers = barbers.filter(barber => 
            barber.status === 'available' || barber.availability?.immediateBooking
          );
        }
        
        if (filters.serviceType) {
          barbers = barbers.filter(barber => 
            barber.serviceTypes.includes(filters.serviceType)
          );
        }
        
        return {
          success: true,
          data: barbers,
          total: barbers.length
        };
      } else {
        return {
          success: false,
          data: [],
          message: response.message || 'Error al obtener barberos cercanos'
        };
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Combinar barberos registrados con lugares de Google
  async getCombinedBarbers(lat, lng, radius = 10) {
    try {
      // Obtener barberos registrados
      const registeredResponse = await this.getNearbyBarbers(lat, lng, radius);
      const registeredBarbers = registeredResponse.data || [];

      // Obtener barberías de Google Places
      const placesResponse = await placesAPI.getBarberShops(lat, lng, radius);
      const googlePlaces = placesResponse.data || [];

      // Combinar y evitar duplicados
      const combined = this.combineAndDeduplicate(registeredBarbers, googlePlaces);

      return {
        success: true,
        data: combined,
        stats: {
          registered: registeredBarbers.length,
          googlePlaces: googlePlaces.length,
          total: combined.length
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.message || 'Error al obtener datos combinados'
      };
    }
  }

  // Combinar y eliminar duplicados entre barberos registrados y Google Places
  combineAndDeduplicate(registered, googlePlaces) {
    const combined = [...registered];
    const registeredNames = new Set(
      registered.map(b => b.name?.toLowerCase().trim())
    );
    const registeredAddresses = new Set(
      registered.map(b => b.address?.toLowerCase().trim())
    );

    // Agregar lugares de Google que no estén ya registrados
    googlePlaces.forEach(place => {
      const placeName = place.name?.toLowerCase().trim();
      const placeAddress = place.address?.toLowerCase().trim();
      
      const isDuplicate = registeredNames.has(placeName) || 
                         registeredAddresses.has(placeAddress);
      
      if (!isDuplicate) {
        combined.push({
          ...place,
          isGooglePlace: true,
          hasProfile: false,
          status: 'unregistered',
          badge: 'no inscrito'
        });
      }
    });

    return combined;
  }

  // Actualizar perfil de barbero
  async updateProfile(profileData, token) {
    try {
      const response = await barberAPI.updateProfile(profileData);
      
      if (response.success) {
        // Limpiar cache relacionado
        this.clearBarberCache();
        
        return {
          success: true,
          data: response.data,
          message: 'Perfil actualizado exitosamente'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Error al actualizar perfil'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Subir imágenes a galería
  async uploadGalleryImages(files, token) {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('gallery', file);
      });

      const response = await barberAPI.uploadGallery(formData);
      
      if (response.success) {
        this.clearBarberCache();
        
        return {
          success: true,
          data: response.data,
          message: 'Imágenes subidas exitosamente'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Error al subir imágenes'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al subir imágenes'
      };
    }
  }

  // Actualizar disponibilidad
  async updateAvailability(availability, token) {
    try {
      const response = await barberAPI.updateAvailability(availability);
      
      if (response.success) {
        this.clearBarberCache();
        
        return {
          success: true,
          data: response.data,
          message: 'Disponibilidad actualizada'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Error al actualizar disponibilidad'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Actualizar estado del barbero
  async updateStatus(status, token) {
    try {
      const response = await barberAPI.updateStatus(status);
      
      if (response.success) {
        this.clearBarberCache();
        
        return {
          success: true,
          data: response.data,
          message: `Estado cambiado a ${status}`
        };
      } else {
        return {
          success: false,
          message: response.message || 'Error al actualizar estado'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Obtener estadísticas del barbero
  async getStatistics(token) {
    try {
      const response = await barberAPI.getStatistics();
      
      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          data: null,
          message: response.message || 'Error al obtener estadísticas'
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Obtener reservas pendientes del barbero
  async getPendingBookings(token) {
    try {
      const response = await barberAPI.getPendingBookings();
      
      if (response.success) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        return {
          success: false,
          data: [],
          message: response.message || 'Error al obtener reservas pendientes'
        };
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.message || 'Error de conexión'
      };
    }
  }

  // Filtrar barberos
  filterBarbers(barbers, filters) {
    let filtered = [...barbers];

    // Filtro por texto (nombre o descripción)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(barber => 
        barber.name?.toLowerCase().includes(searchTerm) ||
        barber.description?.toLowerCase().includes(searchTerm) ||
        barber.specialties?.some(spec => spec.toLowerCase().includes(searchTerm))
      );
    }

    // Filtro por tipo de servicio
    if (filters.serviceType) {
      filtered = filtered.filter(barber => 
        barber.serviceTypes?.includes(filters.serviceType)
      );
    }

    // Filtro por precio
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      filtered = filtered.filter(barber => {
        if (!barber.services?.length) return false;
        const prices = barber.services.map(s => s.price);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        return avgPrice >= min && avgPrice <= max;
      });
    }

    // Filtro por calificación
    if (filters.rating) {
      filtered = filtered.filter(barber => 
        (barber.rating || 0) >= filters.rating
      );
    }

    // Filtro por disponibilidad
    if (filters.available) {
      filtered = filtered.filter(barber => 
        barber.status === 'available' || barber.availability?.immediateBooking
      );
    }

    // Filtro por servicios específicos
    if (filters.services?.length) {
      filtered = filtered.filter(barber =>
        filters.services.some(service =>
          barber.services?.some(barberService =>
            barberService.name.toLowerCase().includes(service.toLowerCase())
          )
        )
      );
    }

    return filtered;
  }

  // Ordenar barberos
  sortBarbers(barbers, sortBy = 'distance') {
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
  }

  // Obtener color de estado para el mapa
  getStatusColor(barber) {
    if (!barber.hasProfile) return '#dc2626'; // Rojo - sin perfil
    
    switch (barber.status) {
      case 'available':
        return barber.availability?.immediateBooking ? '#2563eb' : '#16a34a'; // Azul o Verde
      case 'busy':
        return '#f59e0b'; // Amarillo
      case 'offline':
      default:
        return '#6b7280'; // Gris
    }
  }

  // Métodos de cache
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearBarberCache() {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith('barber')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clearCache() {
    this.cache.clear();
  }
}

// Crear instancia singleton
const barberService = new BarberService();

export default barberService;
