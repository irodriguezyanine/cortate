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
        bounds.exten
