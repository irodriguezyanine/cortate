import { placesAPI } from './api';

// Servicio para manejar Google Maps y Places
class GoogleMapsService {
  constructor() {
    this.isLoaded = false;
    this.loadPromise = null;
    this.geocoder = null;
    this.placesService = null;
    this.directionsService = null;
    this.defaultLocation = { lat: -33.4489, lng: -70.6693 }; // Santiago, Chile
  }

  // Cargar Google Maps API
  async loadGoogleMaps() {
    if (this.isLoaded) {
      return window.google;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        this.isLoaded = true;
        this.initializeServices();
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        reject(new Error('Google Maps API key no configurada'));
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&region=CL`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        this.initializeServices();
        resolve(window.google);
      };

      script.onerror = () => {
        reject(new Error('Error al cargar Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  // Inicializar servicios de Google Maps
  initializeServices() {
    if (window.google && window.google.maps) {
      this.geocoder = new window.google.maps.Geocoder();
      this.directionsService = new window.google.maps.DirectionsService();
      
      // Crear un div temporal para el PlacesService
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      this.placesService = new window.google.maps.places.PlacesService(map);
    }
  }

  // Obtener ubicación actual del usuario
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.warn('Error obteniendo ubicación:', error);
          // Retornar ubicación por defecto en caso de error
          resolve(this.defaultLocation);
        },
        options
      );
    });
  }

  // Geocodificar dirección
  async geocodeAddress(address) {
    try {
      await this.loadGoogleMaps();
      
      return new Promise((resolve, reject) => {
        this.geocoder.geocode(
          { 
            address: address,
            region: 'CL',
            componentRestrictions: { country: 'CL' }
          },
          (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const result = results[0];
              resolve({
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
                formattedAddress: result.formatted_address,
                addressComponents: result.address_components
              });
            } else {
              reject(new Error('No se pudo geocodificar la dirección'));
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Error en geocodificación: ${error.message}`);
    }
  }

  // Geocodificación inversa (coordenadas a dirección)
  async reverseGeocode(lat, lng) {
    try {
      await this.loadGoogleMaps();
      
      return new Promise((resolve, reject) => {
        this.geocoder.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const result = results[0];
              resolve({
                address: result.formatted_address,
                addressComponents: result.address_components,
                placeId: result.place_id
              });
            } else {
              reject(new Error('No se pudo obtener la dirección'));
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Error en geocodificación inversa: ${error.message}`);
    }
  }

  // Buscar lugares cercanos usando Google Places
  async searchNearbyPlaces(lat, lng, type = 'hair_care', radius = 5000) {
    try {
      await this.loadGoogleMaps();
      
      return new Promise((resolve, reject) => {
        const request = {
          location: new window.google.maps.LatLng(lat, lng),
          radius: radius,
          type: type,
          keyword: 'barbería peluquería'
        };

        this.placesService.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const places = results.map(place => this.formatPlaceResult(place, lat, lng));
            resolve(places);
          } else {
            reject(new Error('Error en búsqueda de lugares'));
          }
        });
      });
    } catch (error) {
      throw new Error(`Error buscando lugares: ${error.message}`);
    }
  }

  // Obtener detalles de un lugar
  async getPlaceDetails(placeId) {
    try {
      await this.loadGoogleMaps();
      
      return new Promise((resolve, reject) => {
        const request = {
          placeId: placeId,
          fields: [
            'name', 'formatted_address', 'geometry', 'place_id',
            'formatted_phone_number', 'website', 'rating', 'reviews',
            'photos', 'opening_hours', 'types', 'price_level'
          ]
        };

        this.placesService.getDetails(request, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(this.formatPlaceDetails(place));
          } else {
            reject(new Error('No se pudieron obtener los detalles del lugar'));
          }
        });
      });
    } catch (error) {
      throw new Error(`Error obteniendo detalles: ${error.message}`);
    }
  }

  // Formatear resultado de lugar
  formatPlaceResult(place, userLat, userLng) {
    const distance = this.calculateDistance(
      userLat, 
      userLng,
      place.geometry.location.lat(),
      place.geometry.location.lng()
    );

    return {
      id: place.place_id,
      name: place.name,
      address: place.vicinity || place.formatted_address,
      location: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      rating: place.rating || 0,
      totalReviews: place.user_ratings_total || 0,
      priceLevel: place.price_level,
      photos: place.photos ? place.photos.slice(0, 3).map(photo => ({
        url: photo.getUrl({ maxWidth: 400, maxHeight: 300 })
      })) : [],
      isOpen: place.opening_hours ? place.opening_hours.open_now : null,
      distance: distance,
      types: place.types || [],
      isGooglePlace: true,
      hasProfile: false
    };
  }

  // Formatear detalles completos de lugar
  formatPlaceDetails(place) {
    return {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating || 0,
      totalReviews: place.user_ratings_total || 0,
      priceLevel: place.price_level,
      photos: place.photos ? place.photos.map(photo => ({
        url: photo.getUrl({ maxWidth: 800, maxHeight: 600 }),
        attribution: photo.html_attributions
      })) : [],
      reviews: place.reviews ? place.reviews.map(review => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.relative_time_description,
        profilePhoto: review.profile_photo_url
      })) : [],
      openingHours: place.opening_hours ? {
        isOpen: place.opening_hours.open_now,
        periods: place.opening_hours.periods,
        weekdayText: place.opening_hours.weekday_text
      } : null,
      types: place.types || [],
      isGooglePlace: true,
      hasProfile: false
    };
  }

  // Calcular distancia entre dos puntos
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  }

  // Convertir grados a radianes
  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Obtener ruta entre dos puntos
  async getDirections(origin, destination, travelMode = 'DRIVING') {
    try {
      await this.loadGoogleMaps();
      
      return new Promise((resolve, reject) => {
        const request = {
          origin: origin,
          destination: destination,
          travelMode: window.google.maps.TravelMode[travelMode],
          unitSystem: window.google.maps.UnitSystem.METRIC,
          region: 'CL'
        };

        this.directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            const route = result.routes[0];
            const leg = route.legs[0];
            
            resolve({
              distance: leg.distance.text,
              duration: leg.duration.text,
              steps: leg.steps.map(step => ({
                instruction: step.instructions,
                distance: step.distance.text,
                duration: step.duration.text
              })),
              polyline: route.overview_polyline
            });
          } else {
            reject(new Error('No se pudo calcular la ruta'));
          }
        });
      });
    } catch (error) {
      throw new Error(`Error calculando ruta: ${error.message}`);
    }
  }

  // Buscar barbería/peluquería por texto
  async searchBarberShops(query, location) {
    try {
      const response = await placesAPI.search(query, location);
      
      if (response.success) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        return {
          success: false,
          data: [],
          message: response.message || 'Error en búsqueda'
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

  // Obtener barberías cercanas desde el backend
  async getNearbyBarberShops(lat, lng, radius = 10) {
    try {
      const response = await placesAPI.getBarberShops(lat, lng, radius);
      
      if (response.success) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        return {
          success: false,
          data: [],
          message: response.message || 'Error obteniendo barberías'
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

  // Crear marcador personalizado para el mapa
  createCustomMarker(map, position, options = {}) {
    const {
      title = '',
      icon = null,
      color = '#dc2626',
      onClick = null,
      hasProfile = false
    } = options;

    const marker = new window.google.maps.Marker({
      position: position,
      map: map,
      title: title,
      icon: icon || this.createColoredIcon(color, hasProfile)
    });

    if (onClick) {
      marker.addListener('click', onClick);
    }

    return marker;
  }

  // Crear icono coloreado para marcadores
  createColoredIcon(color, hasProfile = false) {
    const fillOpacity = hasProfile ? 1 : 0.7;
    const strokeColor = hasProfile ? '#ffffff' : '#000000';
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: fillOpacity,
      scale: 8,
      strokeColor: strokeColor,
      strokeWeight: 2
    };
  }

  // Ajustar mapa para mostrar todos los marcadores
  fitMapToMarkers(map, markers) {
    if (markers.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    
    markers.forEach(marker => {
      bounds.extend(marker.getPosition());
    });

    map.fitBounds(bounds);
    
    // Ajustar zoom máximo
    const listener = window.google.maps.event.addListener(map, 'idle', () => {
      if (map.getZoom() > 16) map.setZoom(16);
      window.google.maps.event.removeListener(listener);
    });
  }

  // Crear info window personalizada
  createInfoWindow(content) {
    return new window.google.maps.InfoWindow({
      content: content,
      maxWidth: 300
    });
  }

  // Verificar si las coordenadas están en Chile
  isInChile(lat, lng) {
    // Aproximación de los límites de Chile
    return lat >= -56 && lat <= -17 && lng >= -75 && lng <= -66;
  }

  // Obtener configuración de mapa por defecto
  getDefaultMapConfig() {
    return {
      center: this.defaultLocation,
      zoom: 12,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    };
  }
}

// Crear instancia singleton
const googleMapsService = new GoogleMapsService();

export default googleMapsService;
