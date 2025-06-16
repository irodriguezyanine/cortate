const axios = require('axios');
const config = require('../config/config');

// Cliente HTTP configurado para Google Places API
const googlePlacesClient = axios.create({
    baseURL: 'https://maps.googleapis.com/maps/api/place',
    timeout: 10000,
    params: {
        key: config.GOOGLE_PLACES_API_KEY,
        language: 'es',
        region: 'cl'
    }
});

/**
 * Buscar lugares cercanos usando Google Places Nearby Search
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} params.lat - Latitud
 * @param {number} params.lng - Longitud
 * @param {number} params.radius - Radio en metros (máx 50000)
 * @param {string} params.keyword - Palabra clave
 * @param {string} params.type - Tipo de lugar (hair_care, beauty_salon)
 * @returns {Array} Array de lugares encontrados
 */
const searchNearbyPlaces = async ({ lat, lng, radius = 5000, keyword = 'barbería', type = 'hair_care' }) => {
    try {
        console.log(`🔍 Buscando lugares cerca de (${lat}, ${lng}) con radio ${radius}m`);
        
        const response = await googlePlacesClient.get('/nearbysearch/json', {
            params: {
                location: `${lat},${lng}`,
                radius: Math.min(radius, 50000), // Google limit
                keyword,
                type,
                fields: 'place_id,name,geometry,vicinity,formatted_address,rating,user_ratings_total,price_level,photos,opening_hours,types'
            }
        });

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Places API Error: ${response.data.status} - ${response.data.error_message}`);
        }

        const places = response.data.results || [];
        
        // Filtrar y enriquecer resultados
        const filteredPlaces = places
            .filter(place => {
                // Filtrar por relevancia y tipos
                const relevantTypes = ['hair_care', 'beauty_salon', 'establishment'];
                const hasRelevantType = place.types.some(type => relevantTypes.includes(type));
                const hasGoodName = /barber|peluqu|corte|cabello|hair|salon/i.test(place.name);
                
                return hasRelevantType || hasGoodName;
            })
            .map(place => ({
                place_id: place.place_id,
                name: place.name,
                vicinity: place.vicinity,
                formatted_address: place.formatted_address,
                geometry: place.geometry,
                rating: place.rating || 0,
                user_ratings_total: place.user_ratings_total || 0,
                price_level: place.price_level,
                photos: place.photos ? place.photos.map(photo => ({
                    photo_reference: photo.photo_reference,
                    width: photo.width,
                    height: photo.height,
                    url: getPhotoUrl(photo.photo_reference, 400)
                })) : [],
                opening_hours: place.opening_hours,
                types: place.types
            }));

        console.log(`✅ Google Places: ${filteredPlaces.length} lugares encontrados`);
        return filteredPlaces;

    } catch (error) {
        console.error('Error en búsqueda de Google Places:', error.message);
        
        // Si es error de API, lanzar error específico
        if (error.response?.status === 400) {
            throw new Error('Parámetros de búsqueda inválidos');
        } else if (error.response?.status === 403) {
            throw new Error('API Key de Google Places inválida o sin permisos');
        } else if (error.response?.status === 429) {
            throw new Error('Límite de requests de Google Places excedido');
        }
        
        // Para otros errores, devolver array vacío para no romper la app
        console.warn('Devolviendo resultados vacíos debido a error en Google Places');
        return [];
    }
};

/**
 * Obtener detalles completos de un lugar específico
 * @param {string} placeId - ID del lugar en Google Places
 * @returns {Object} Detalles completos del lugar
 */
const getPlaceDetails = async (placeId) => {
    try {
        console.log(`📍 Obteniendo detalles del lugar: ${placeId}`);
        
        const response = await googlePlacesClient.get('/details/json', {
            params: {
                place_id: placeId,
                fields: [
                    'place_id',
                    'name',
                    'formatted_address',
                    'geometry',
                    'formatted_phone_number',
                    'international_phone_number',
                    'website',
                    'rating',
                    'user_ratings_total',
                    'price_level',
                    'opening_hours',
                    'photos',
                    'reviews',
                    'types',
                    'vicinity',
                    'url'
                ].join(',')
            }
        });

        if (response.data.status !== 'OK') {
            throw new Error(`Google Places Details Error: ${response.data.status} - ${response.data.error_message}`);
        }

        const place = response.data.result;
        
        // Enriquecer datos
        const enrichedPlace = {
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            vicinity: place.vicinity,
            geometry: place.geometry,
            formatted_phone_number: place.formatted_phone_number,
            international_phone_number: place.international_phone_number,
            website: place.website,
            url: place.url,
            rating: place.rating || 0,
            user_ratings_total: place.user_ratings_total || 0,
            price_level: place.price_level,
            types: place.types || [],
            
            // Procesar horarios de apertura
            opening_hours: place.opening_hours ? {
                open_now: place.opening_hours.open_now,
                periods: place.opening_hours.periods || [],
                weekday_text: place.opening_hours.weekday_text || []
            } : null,
            
            // Procesar fotos
            photos: place.photos ? place.photos.slice(0, 10).map((photo, index) => ({
                photo_reference: photo.photo_reference,
                width: photo.width,
                height: photo.height,
                url: getPhotoUrl(photo.photo_reference, 600),
                thumbnail: getPhotoUrl(photo.photo_reference, 200),
                order: index
            })) : [],
            
            // Procesar reseñas de Google
            reviews: place.reviews ? place.reviews.slice(0, 5).map(review => ({
                author_name: review.author_name,
                author_url: review.author_url,
                profile_photo_url: review.profile_photo_url,
                rating: review.rating,
                text: review.text,
                time: review.time,
                relative_time_description: review.relative_time_description,
                source: 'google'
            })) : []
        };

        console.log(`✅ Detalles obtenidos para: ${place.name}`);
        return enrichedPlace;

    } catch (error) {
        console.error('Error obteniendo detalles del lugar:', error.message);
        throw error;
    }
};

/**
 * Buscar lugares por texto
 * @param {string} query - Texto de búsqueda
 * @param {Object} location - Ubicación opcional {lat, lng}
 * @param {number} radius - Radio de búsqueda en metros
 * @returns {Array} Array de lugares encontrados
 */
const searchPlacesByText = async (query, location = null, radius = 50000) => {
    try {
        console.log(`🔎 Búsqueda por texto: "${query}"`);
        
        const params = {
            query: `${query} barbería peluquería Chile`,
            fields: 'place_id,name,formatted_address,geometry,rating,user_ratings_total,photos,opening_hours,types'
        };

        // Agregar ubicación si se proporciona
        if (location && location.lat && location.lng) {
            params.location = `${location.lat},${location.lng}`;
            params.radius = radius;
        }

        const response = await googlePlacesClient.get('/textsearch/json', {
            params
        });

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Places Text Search Error: ${response.data.status}`);
        }

        const places = response.data.results || [];
        
        const processedPlaces = places
            .filter(place => {
                // Filtrar resultados relevantes para barberías
                const relevantTypes = ['hair_care', 'beauty_salon', 'establishment'];
                const hasRelevantType = place.types.some(type => relevantTypes.includes(type));
                const hasRelevantName = /barber|peluqu|corte|cabello|hair|salon/i.test(place.name);
                
                return hasRelevantType || hasRelevantName;
            })
            .slice(0, 20) // Limitar resultados
            .map(place => ({
                place_id: place.place_id,
                name: place.name,
                formatted_address: place.formatted_address,
                geometry: place.geometry,
                rating: place.rating || 0,
                user_ratings_total: place.user_ratings_total || 0,
                photos: place.photos ? place.photos.slice(0, 3).map(photo => ({
                    photo_reference: photo.photo_reference,
                    url: getPhotoUrl(photo.photo_reference, 300)
                })) : [],
                opening_hours: place.opening_hours,
                types: place.types,
                distance: location ? calculateDistance(
                    location.lat, location.lng,
                    place.geometry.location.lat, place.geometry.location.lng
                ) : null
            }));

        console.log(`✅ Búsqueda por texto: ${processedPlaces.length} resultados`);
        return processedPlaces;

    } catch (error) {
        console.error('Error en búsqueda por texto:', error.message);
        return [];
    }
};

/**
 * Obtener URL de foto de Google Places
 * @param {string} photoReference - Referencia de la foto
 * @param {number} maxWidth - Ancho máximo de la imagen
 * @returns {string} URL de la foto
 */
const getPhotoUrl = (photoReference, maxWidth = 400) => {
    if (!photoReference) return null;
    
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${config.GOOGLE_PLACES_API_KEY}`;
};

/**
 * Validar datos de lugar
 * @param {Object} placeData - Datos del lugar a validar
 * @returns {Object} Resultado de validación
 */
const validatePlaceData = (placeData) => {
    const errors = [];
    
    if (!placeData.place_id) {
        errors.push('place_id es requerido');
    }
    
    if (!placeData.name || placeData.name.trim().length < 2) {
        errors.push('Nombre del lugar es requerido y debe tener al menos 2 caracteres');
    }
    
    if (!placeData.geometry || !placeData.geometry.location) {
        errors.push('Ubicación geográfica es requerida');
    }
    
    // Validar coordenadas de Chile (aproximadamente)
    if (placeData.geometry && placeData.geometry.location) {
        const { lat, lng } = placeData.geometry.location;
        
        // Chile está aproximadamente entre estas coordenadas
        const chileBounds = {
            north: -17.5,
            south: -56,
            east: -66.4,
            west: -75.6
        };
        
        if (lat > chileBounds.north || lat < chileBounds.south || 
            lng > chileBounds.east || lng < chileBounds.west) {
            errors.push('Ubicación fuera de Chile');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Obtener lugares populares en una ciudad
 * @param {string} city - Nombre de la ciudad
 * @returns {Array} Lugares populares encontrados
 */
const getPopularPlacesInCity = async (city) => {
    try {
        const query = `mejores barberías ${city} Chile`;
        const places = await searchPlacesByText(query);
        
        // Ordenar por rating y número de reseñas
        return places
            .filter(place => place.rating >= 4.0 && place.user_ratings_total >= 10)
            .sort((a, b) => {
                const scoreA = a.rating * Math.log(a.user_ratings_total + 1);
                const scoreB = b.rating * Math.log(b.user_ratings_total + 1);
                return scoreB - scoreA;
            })
            .slice(0, 10);
            
    } catch (error) {
        console.error(`Error obteniendo lugares populares en ${city}:`, error.message);
        return [];
    }
};

/**
 * Calcular distancia entre dos puntos geográficos
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lon1 - Longitud punto 1
 * @param {number} lat2 - Latitud punto 2
 * @param {number} lon2 - Longitud punto 2
 * @returns {number} Distancia en metros
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
};

/**
 * Verificar si Google Places API está funcionando
 * @returns {Promise<boolean>} True si la API funciona
 */
const checkApiHealth = async () => {
    try {
        // Hacer una búsqueda simple en Santiago
        const response = await googlePlacesClient.get('/nearbysearch/json', {
            params: {
                location: '-33.4489,-70.6693', // Santiago centro
                radius: 1000,
                type: 'establishment'
            }
        });
        
        return response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS';
    } catch (error) {
        console.error('Google Places API health check failed:', error.message);
        return false;
    }
};

/**
 * Obtener ciudades principales con coordenadas
 * @returns {Array} Array de ciudades chilenas principales
 */
const getChileanCities = () => {
    return [
        { name: 'Santiago', lat: -33.4489, lng: -70.6693, region: 'Metropolitana' },
        { name: 'Valparaíso', lat: -33.0472, lng: -71.6127, region: 'Valparaíso' },
        { name: 'Viña del Mar', lat: -33.0243, lng: -71.5519, region: 'Valparaíso' },
        { name: 'Concepción', lat: -36.8201, lng: -73.0444, region: 'Biobío' },
        { name: 'La Serena', lat: -29.9027, lng: -71.2519, region: 'Coquimbo' },
        { name: 'Antofagasta', lat: -23.6509, lng: -70.3975, region: 'Antofagasta' },
        { name: 'Temuco', lat: -38.7359, lng: -72.5904, region: 'Araucanía' },
        { name: 'Iquique', lat: -20.2208, lng: -70.1431, region: 'Tarapacá' },
        { name: 'Rancagua', lat: -34.1694, lng: -70.7407, region: "O'Higgins" },
        { name: 'Talca', lat: -35.4264, lng: -71.6554, region: 'Maule' },
        { name: 'Arica', lat: -18.4783, lng: -70.3126, region: 'Arica y Parinacota' },
        { name: 'Puerto Montt', lat: -41.4693, lng: -72.9424, region: 'Los Lagos' },
        { name: 'Chillán', lat: -36.6067, lng: -72.1034, region: 'Ñuble' },
        { name: 'Calama', lat: -22.4667, lng: -68.9333, region: 'Antofagasta' },
        { name: 'Copiapó', lat: -27.3665, lng: -70.3316, region: 'Atacama' }
    ];
};

module.exports = {
    searchNearbyPlaces,
    getPlaceDetails,
    searchPlacesByText,
    getPhotoUrl,
    validatePlaceData,
    getPopularPlacesInCity,
    calculateDistance,
    checkApiHealth,
    getChileanCities
};
