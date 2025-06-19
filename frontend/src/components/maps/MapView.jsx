import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  Layers,
  Filter,
  Locate,
  RefreshCw
} from 'lucide-react';
import googleMapsService from '../../services/googleMapsService';
import barberService from '../../services/barberService';
import { MAP_CONFIG, MAP_MARKER_COLORS } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';
import BarberCard from '../barbers/BarberCard';

const MapView = ({ 
  barbers = [], 
  onBarberSelect,
  selectedBarber = null,
  filters = {},
  userLocation = null,
  onLocationChange
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(userLocation || MAP_CONFIG.DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(false);

  // Inicializar mapa
  const initializeMap = useCallback(async () => {
    try {
      setIsLoading(true);
      setMapError(null);

      // Cargar Google Maps
      await googleMapsService.loadGoogleMaps();
      
      if (!mapRef.current) return;

      // Crear mapa
      const mapOptions = {
        center: currentLocation,
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        minZoom: MAP_CONFIG.MIN_ZOOM,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit.station',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false
      };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      
      // Crear InfoWindow
      infoWindowRef.current = new window.google.maps.InfoWindow({
        maxWidth: 300
      });

      // Event listeners
      mapInstanceRef.current.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
        onBarberSelect?.(null);
      });

      mapInstanceRef.current.addListener('center_changed', () => {
        const center = mapInstanceRef.current.getCenter();
        onLocationChange?.({
          lat: center.lat(),
          lng: center.lng()
        });
      });

      setIsMapLoaded(true);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, onBarberSelect, onLocationChange]);

  // Limpiar marcadores existentes
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  }, []);

  // Crear marcador personalizado
  const createMarker = useCallback((barber) => {
    if (!mapInstanceRef.current || !window.google) return null;

    const position = {
      lat: barber.location.lat,
      lng: barber.location.lng
    };

    // Determinar color del marcador
    let color = MAP_MARKER_COLORS.NO_PROFILE;
    if (barber.hasProfile) {
      if (barber.availability?.immediateBooking) {
        color = MAP_MARKER_COLORS.IMMEDIATE;
      } else if (barber.status === 'available') {
        color = MAP_MARKER_COLORS.AVAILABLE;
      } else {
        color = MAP_MARKER_COLORS.OFFLINE;
      }
    }

    // Crear marcador
    const marker = new window.google.maps.Marker({
      position: position,
      map: mapInstanceRef.current,
      title: barber.name,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: barber.hasProfile ? 1 : 0.7,
        scale: 10,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      zIndex: barber.hasProfile ? 100 : 50
    });

    // Event listener para click
    marker.addListener('click', () => {
      onBarberSelect?.(barber);
      showInfoWindow(marker, barber);
    });

    return marker;
  }, [onBarberSelect]);

  // Mostrar InfoWindow
  const showInfoWindow = useCallback((marker, barber) => {
    if (!infoWindowRef.current) return;

    const content = `
      <div class="p-3 max-w-xs">
        <div class="flex items-center space-x-3 mb-2">
          <div class="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            <span class="text-black font-semibold text-sm">
              ${barber.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">${barber.name}</h3>
            <p class="text-sm text-gray-600 truncate">${barber.address || 'Sin dirección'}</p>
          </div>
        </div>
        
        ${barber.hasProfile ? `
          <div class="space-y-1 mb-3">
            ${barber.rating ? `
              <div class="flex items-center space-x-1">
                <span class="text-yellow-500">★</span>
                <span class="text-sm font-medium">${barber.rating.toFixed(1)}</span>
                <span class="text-xs text-gray-500">(${barber.totalReviews || 0} reseñas)</span>
              </div>
            ` : ''}
            
            ${barber.services?.length ? `
              <div class="text-sm text-gray-600">
                Desde $${Math.min(...barber.services.map(s => s.price)).toLocaleString('es-CL')}
              </div>
            ` : ''}
          </div>
          
          <div class="flex space-x-2">
            <button 
              onclick="window.location.href='/barber/${barber.id}'"
              class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 text-center py-1 px-2 rounded text-sm transition-colors"
            >
              Ver perfil
            </button>
            <button 
              onclick="window.location.href='/booking/${barber.id}'"
              class="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black text-center py-1 px-2 rounded text-sm transition-colors"
            >
              Reservar
            </button>
          </div>
        ` : `
          <div class="text-sm text-gray-600 mb-3">
            Este barbero aún no tiene perfil registrado en Córtate.cl
          </div>
          <div class="bg-red-50 border border-red-200 rounded p-2">
            <span class="text-xs text-red-700 font-medium">No inscrito</span>
          </div>
        `}
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  }, []);

  // Actualizar marcadores
  const updateMarkers = useCallback(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;

    clearMarkers();

    barbers.forEach(barber => {
      if (barber.location?.lat && barber.location?.lng) {
        const marker = createMarker(barber);
        if (marker) {
          markersRef.current.push(marker);
        }
      }
    });

    // Ajustar vista si hay marcadores
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      
      // Ajustar el mapa para mostrar todos los marcadores
      mapInstanceRef.current.fitBounds(bounds);
      
      // Asegurar zoom mínimo
      const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current.getZoom() > MAP_CONFIG.MAX_ZOOM) {
          mapInstanceRef.current.setZoom(MAP_CONFIG.MAX_ZOOM);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [isMapLoaded, barbers, createMarker, clearMarkers]);

  // Obtener ubicación actual del usuario
  const getCurrentLocation = useCallback(() => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(location);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(MAP_CONFIG.DEFAULT_ZOOM);
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  // Controles de zoom
  const zoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(Math.min(currentZoom + 1, MAP_CONFIG.MAX_ZOOM));
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(Math.max(currentZoom - 1, MAP_CONFIG.MIN_ZOOM));
    }
  }, []);

  // Effects
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  useEffect(() => {
    if (selectedBarber && markersRef.current.length > 0) {
      const marker = markersRef.current.find(m => 
        m.getTitle() === selectedBarber.name
      );
      if (marker) {
        showInfoWindow(marker, selectedBarber);
        mapInstanceRef.current?.setCenter(marker.getPosition());
      }
    }
  }, [selectedBarber, showInfoWindow]);

  // Render
  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar el mapa
          </h3>
          <p className="text-gray-600 mb-4">{mapError}</p>
          <button
            onClick={initializeMap}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Mapa */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <LoadingSpinner size="lg" />
        </div>
      )}
      
      {/* Controles del mapa */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
        {/* Ubicación actual */}
        <button
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg border transition-colors disabled:opacity-50"
          title="Mi ubicación"
        >
          {isLocating ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Locate className="h-5 w-5" />
          )}
        </button>
        
        {/* Zoom in */}
        <button
          onClick={zoomIn}
          className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg border transition-colors"
          title="Acercar"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        
        {/* Zoom out */}
        <button
          onClick={zoomOut}
          className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg border transition-colors"
          title="Alejar"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
      </div>
      
      {/* Información de marcadores */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border p-3 z-20">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Inmediato</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Ocupado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
