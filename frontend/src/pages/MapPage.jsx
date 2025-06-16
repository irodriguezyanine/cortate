import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  List, 
  Search, 
  MapPin, 
  Sliders,
  RefreshCw,
  X
} from 'lucide-react';
import MapView from '../components/maps/MapView';
import BarberCard from '../components/barbers/BarberCard';
import MapFilters from '../components/maps/MapFilters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import barberService from '../services/barberService';
import googleMapsService from '../services/googleMapsService';
import { useAuth } from '../context/AuthContext';
import { filterAndSortBarbers } from '../utils/helpers';

const MapPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados principales
  const [barbers, setBarbers] = useState([]);
  const [filteredBarbers, setFilteredBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'split'

  // Filtros
  const [filters, setFilters] = useState({
    rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')) : null,
    priceRange: searchParams.get('priceRange') ? searchParams.get('priceRange').split(',').map(Number) : null,
    serviceType: searchParams.get('serviceType') || null,
    services: searchParams.get('services') ? searchParams.get('services').split(',') : [],
    available: searchParams.get('available') === 'true',
    distance: searchParams.get('distance') ? parseInt(searchParams.get('distance')) : 10,
    sortBy: searchParams.get('sortBy') || 'distance'
  });

  // Obtener ubicación del usuario
  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await googleMapsService.getCurrentLocation();
      setUserLocation(location);
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      // Usar ubicación por defecto (Santiago)
      const defaultLocation = { lat: -33.4489, lng: -70.6693 };
      setUserLocation(defaultLocation);
      return defaultLocation;
    }
  }, []);

  // Cargar barberos
  const loadBarbers = useCallback(async (location = userLocation) => {
    if (!location) return;

    setIsLoading(true);
    setError(null);

    try {
      // Obtener barberos combinados (registrados + Google Places)
      const result = await barberService.getCombinedBarbers(
        location.lat, 
        location.lng, 
        filters.distance
      );

      if (result.success) {
        setBarbers(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar barberos');
      setBarbers([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, filters.distance]);

  // Aplicar filtros y búsqueda
  useEffect(() => {
    const searchFilters = { ...filters };
    if (searchQuery) {
      searchFilters.search = searchQuery;
    }

    const filtered = filterAndSortBarbers(barbers, searchFilters, filters.sortBy);
    setFilteredBarbers(filtered);
  }, [barbers, filters, searchQuery]);

  // Actualizar URL con parámetros de búsqueda
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (filters.rating) params.set('rating', filters.rating.toString());
    if (filters.priceRange) params.set('priceRange', filters.priceRange.join(','));
    if (filters.serviceType) params.set('serviceType', filters.serviceType);
    if (filters.services.length > 0) params.set('services', filters.services.join(','));
    if (filters.available) params.set('available', 'true');
    if (filters.distance !== 10) params.set('distance', filters.distance.toString());
    if (filters.sortBy !== 'distance') params.set('sortBy', filters.sortBy);

    setSearchParams(params, { replace: true });
  }, [filters, searchQuery, setSearchParams]);

  // Inicializar página
  useEffect(() => {
    const initializePage = async () => {
      const location = await getCurrentLocation();
      await loadBarbers(location);
    };

    initializePage();
  }, [getCurrentLocation, loadBarbers]);

  // Manejar cambio de filtros
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Manejar cambio de ubicación en el mapa
  const handleLocationChange = (newLocation) => {
    setUserLocation(newLocation);
  };

  // Manejar selección de barbero
  const handleBarberSelect = (barber) => {
    setSelectedBarber(barber);
    if (barber && viewMode !== 'split') {
      setShowSidebar(true);
    }
  };

  // Manejar favoritos (placeholder)
  const handleFavoriteToggle = (barberId) => {
    // TODO: Implementar lógica de favoritos
    console.log('Toggle favorite:', barberId);
  };

  // Recargar datos
  const handleRefresh = () => {
    loadBarbers();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header de búsqueda */}
      <div className="bg-gray-900 border-b border-gray-700 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            {/* Buscador */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar barberos, servicios..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setShowFilters(true)}
              className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg border border-gray-600 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:block">Filtros</span>
            </button>

            {/* Selector de vista */}
            <div className="hidden md:flex bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  viewMode === 'map' 
                    ? 'bg-yellow-400 text-black' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <MapPin className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  viewMode === 'split' 
                    ? 'bg-yellow-400 text-black' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Botón de recargar */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg border border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Información de resultados */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {filteredBarbers.length} barbero{filteredBarbers.length !== 1 ? 's' : ''} encontrado{filteredBarbers.length !== 1 ? 's' : ''}
              {userLocation && ` cerca de tu ubicación`}
            </span>
            
            {/* Filtros activos */}
            <div className="flex items-center space-x-2">
              {Object.values(filters).some(Boolean) && (
                <button
                  onClick={() => setFilters({
                    rating: null,
                    priceRange: null,
                    serviceType: null,
                    services: [],
                    available: false,
                    distance: 10,
                    sortBy: 'distance'
                  })}
                  className="text-yellow-400 hover:text-yellow-300 text-xs"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Vista de mapa */}
        {viewMode === 'map' && (
          <div className="flex-1 relative">
            {error ? (
              <div className="h-full flex items-center justify-center bg-gray-900">
                <div className="text-center space-y-4">
                  <div className="text-red-400">
                    <MapPin className="w-12 h-12 mx-auto mb-2" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Error al cargar el mapa</h3>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                      onClick={handleRefresh}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <MapView
                barbers={filteredBarbers}
                selectedBarber={selectedBarber}
                onBarberSelect={handleBarberSelect}
                userLocation={userLocation}
                onLocationChange={handleLocationChange}
                filters={filters}
              />
            )}

            {/* Sidebar con información del barbero seleccionado */}
            {showSidebar && selectedBarber && (
              <div className="absolute top-4 right-4 w-80 max-h-[calc(100vh-200px)] overflow-y-auto bg-gray-900 rounded-lg shadow-xl border border-gray-700">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Información del barbero</h3>
                    <button
                      onClick={() => setShowSidebar(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <BarberCard
                    barber={selectedBarber}
                    onFavoriteToggle={handleFavoriteToggle}
                    layout="card"
                    showDistance={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vista dividida */}
        {viewMode === 'split' && (
          <>
            {/* Lista de barberos */}
            <div className="w-1/3 bg-gray-900 border-r border-gray-700 overflow-y-auto">
              <div className="p-4 space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-800 rounded-lg h-32"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredBarbers.length > 0 ? (
                  filteredBarbers.map((barber) => (
                    <div
                      key={barber.id}
                      className={`cursor-pointer transition-all ${
                        selectedBarber?.id === barber.id ? 'ring-2 ring-yellow-400' : ''
                      }`}
                      onClick={() => handleBarberSelect(barber)}
                    >
                      <BarberCard
                        barber={barber}
                        onFavoriteToggle={handleFavoriteToggle}
                        layout="list"
                        showDistance={true}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No se encontraron barberos</h3>
                    <p className="text-gray-400">Prueba ajustando los filtros o ampliando la zona de búsqueda</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mapa */}
            <div className="flex-1">
              <MapView
                barbers={filteredBarbers}
                selectedBarber={selectedBarber}
                onBarberSelect={handleBarberSelect}
                userLocation={userLocation}
                onLocationChange={handleLocationChange}
                filters={filters}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal de filtros */}
      {showFilters && (
        <MapFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFilters(false)}
          barbersCount={filteredBarbers.length}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
            <LoadingSpinner size="lg" text="Buscando barberos..." />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
