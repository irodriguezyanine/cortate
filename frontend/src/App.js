import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import { 
  MapPin, 
  User, 
  Star, 
  Search, 
  DollarSign, 
  Clock, 
  Scissors, 
  Menu,
  LogIn,
  UserPlus,
  Filter,
  Calendar,
  Bell,
  CheckCircle,
  XCircle,
  MapIcon,
  Settings,
  LogOut,
  Plus,
  Upload,
  Camera,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  Users,
  TrendingUp,
  History,
  Edit3,
  Save,
  Navigation,
  Zap,
  Shield,
  Award,
  Gift,
  Target,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar';
import { Slider } from './components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Calendar as CalendarComponent } from './components/ui/calendar';
import { Textarea } from './components/ui/textarea';
import { Alert, AlertDescription } from './components/ui/alert';
import { LoadingSpinner } from './components/ui/loading-spinner';
import { Progress } from './components/ui/progress';
import { LocationTracker } from './components/advanced/LocationTracker';
import { BarbershopManagement } from './components/barber/BarbershopManagement';
import { useToast } from './hooks/useToast';
import { useGooglePlaces } from './hooks/useGooglePlaces';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Review Modal Component (moved outside App to prevent re-renders)
const ReviewModal = ({ 
  showReviewModal, 
  setShowReviewModal, 
  reviewData, 
  setReviewData, 
  completedQuickCut, 
  setCompletedQuickCut,
  setQuickCutStatus,
  setMatchedBarber,
  setSuccess,
  loadClientHistory,
  setError,
  loading,
  setLoading,
  BACKEND_URL 
}) => {
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    const uploadedImages = [];

    for (const file of files) {
      try {
        // Convert to base64 for preview
        const reader = new FileReader();
        reader.onload = () => {
          uploadedImages.push(reader.result);
          if (uploadedImages.length === files.length) {
            setReviewData({...reviewData, images: uploadedImages});
            setUploadingImages(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleSubmitReview = async () => {
    if (reviewData.rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    try {
      setLoading(true);
      
      // Submit review to backend
      const response = await axios.post(`${BACKEND_URL}/api/reviews`, {
        barbershop_id: completedQuickCut?.barber?.barbershop_id,
        rating: reviewData.rating,
        comment: reviewData.comment
      }, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      // Reset states
      setShowReviewModal(false);
      setQuickCutStatus('idle');
      setMatchedBarber(null);
      setCompletedQuickCut(null);
      setReviewData({ rating: 0, comment: '', images: [] });
      setSuccess('¡Gracias por tu reseña! El corte se ha agregado a tu historial.');
      
      // Refresh client history
      loadClientHistory();
      
    } catch (error) {
      console.error('Review error:', error);
      const errorMsg = error.response?.data?.detail || 'Error al enviar la reseña';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">¿Cómo estuvo tu corte?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Service info */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <p className="text-white font-medium">{completedQuickCut?.barber?.name}</p>
            <p className="text-gray-400 text-sm">{completedQuickCut?.service}</p>
            <p className="text-amber-400 text-sm">${completedQuickCut?.price?.toLocaleString()}</p>
          </div>

          {/* Rating stars */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Calificación *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewData({...reviewData, rating: star})}
                  className="text-2xl hover:scale-110 transition-transform"
                >
                  <Star 
                    className={star <= reviewData.rating ? "fill-amber-400 text-amber-400" : "text-gray-400"}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {reviewData.rating === 0 && "Selecciona tu calificación"}
              {reviewData.rating === 1 && "Muy malo"}
              {reviewData.rating === 2 && "Malo"}
              {reviewData.rating === 3 && "Regular"}
              {reviewData.rating === 4 && "Bueno"}
              {reviewData.rating === 5 && "Excelente"}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Comentario (opcional)</label>
            <Textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              placeholder="Cuéntanos cómo estuvo tu experiencia..."
              rows={3}
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Fotos (opcional)</label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="bg-gray-800 border-gray-700 text-white file:bg-amber-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                disabled={uploadingImages}
              />
              <Camera className="w-5 h-5 text-gray-400" />
            </div>
            {reviewData.images.length > 0 && (
              <div className="flex gap-2 mt-2">
                {reviewData.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Review ${index + 1}`}
                    className="w-12 h-12 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSubmitReview}
              disabled={reviewData.rating === 0 || loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {loading ? 'Enviando...' : 'Enviar Reseña'}
            </Button>
            <Button 
              onClick={() => {
                setShowReviewModal(false);
                setQuickCutStatus('idle');
                setMatchedBarber(null);
                setCompletedQuickCut(null);
              }}
              variant="outline"
              className="flex-1 text-white border-gray-600"
            >
              Omitir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function App() {
  // Initialize toast system
  const { toast, toasts } = useToast();

  // Real-time location tracking
  const handleLocationUpdate = (location) => {
    setCurrentLocation(location);
    if (realTimeTracking && matchedBarber) {
      updateBarberWithLocation(location);
    }
  };

  // Update barber with current location (for real-time tracking)
  const updateBarberWithLocation = async (location) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(`${BACKEND_URL}/api/quick-cuts/update-location`, {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Smart notifications system
  const showNotification = (title, message, type = 'info') => {
    toast({
      title,
      description: message,
      variant: type
    });

    // Browser notifications if enabled
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/logo192.png',
        badge: '/logo192.png'
      });
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  };

  // Dynamic pricing calculation
  const calculateDynamicPrice = (basePrice, demand, distance, timeOfDay, weather) => {
    if (!dynamicPricing) return basePrice;
    
    let multiplier = 1;
    
    // Demand surge pricing (like Uber)
    if (demand > 0.8) multiplier += 0.5;
    else if (demand > 0.6) multiplier += 0.3;
    else if (demand > 0.4) multiplier += 0.1;
    
    // Distance factor
    if (distance > 5) multiplier += 0.2;
    
    // Time of day (peak hours)
    const hour = new Date().getHours();
    if ((hour >= 17 && hour <= 20) || (hour >= 11 && hour <= 14)) {
      multiplier += 0.2;
    }
    
    return Math.round(basePrice * multiplier);
  };

  // AI-powered recommendations
  const generateSmartRecommendations = async () => {
    try {
      const userPreferences = {
        previousServices: bookingHistory.map(b => b.service),
        averageSpent: totalSpent / Math.max(totalCuts, 1),
        preferredTimes: bookingHistory.map(b => new Date(b.created_at).getHours()),
        location: userLocation
      };

      // Simulate AI recommendations (in real app, call ML API)
      const recommendations = [
        {
          type: 'service',
          title: 'Servicio Recomendado',
          description: 'Basado en tu historial, te recomendamos "Corte + Barba"',
          discount: 15,
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        {
          type: 'barber',
          title: 'Barbero Destacado',
          description: 'Juan Carlos tiene 98% de satisfacción en tu zona',
          badge: 'Top Rated'
        },
        {
          type: 'time',
          title: 'Mejor Horario',
          description: 'Los martes a las 3 PM tienes 40% menos tiempo de espera',
          savings: '15 min'
        }
      ];

      setSmartRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  // Loyalty program calculations
  const calculateLoyaltyRewards = (spent, cuts) => {
    const points = Math.floor(spent / 1000); // 1 point per $1000 spent
    let level = 'Bronze';
    
    if (cuts >= 50) level = 'Platinum';
    else if (cuts >= 25) level = 'Gold';
    else if (cuts >= 10) level = 'Silver';
    
    setLoyaltyPoints(points);
    setClientLevel(level);
    
    // Check for achievements
    const newAchievements = [];
    if (cuts === 1) newAchievements.push({ id: 'first_cut', name: 'Primer Corte', icon: '🎉' });
    if (cuts === 10) newAchievements.push({ id: 'loyal_client', name: 'Cliente Leal', icon: '💎' });
    if (cuts === 25) newAchievements.push({ id: 'vip_member', name: 'Miembro VIP', icon: '👑' });
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      newAchievements.forEach(achievement => {
        showNotification('¡Logro Desbloqueado!', `${achievement.icon} ${achievement.name}`, 'success');
      });
    }
  };

  // Real-time progress tracking
  const updateQuickCutProgress = (stage) => {
    const stages = {
      'searching': 20,
      'matched': 40,
      'barber_on_way': 60,
      'barber_arrived': 80,
      'cutting': 90,
      'completed': 100
    };
    
    setQuickCutProgress(stages[stage] || 0);
    
    // Update ETA based on stage
    if (stage === 'barber_on_way' && matchedBarber?.distance) {
      const eta = Math.ceil(matchedBarber.distance * 2); // 2 minutes per km estimate
      setEstimatedArrival(new Date(Date.now() + eta * 60 * 1000));
    }
  };
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [map, setMap] = useState(null);
  const [barbershops, setBarbershops] = useState([]);
  const [selectedBarbershop, setSelectedBarbershop] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: -33.4489, lng: -70.6693 });
  const [priceLimit, setPriceLimit] = useState([50000]);
  const [selectedService, setSelectedService] = useState('');
  // Quick cut states for real-time Uber-style matching
  const [quickCutStatus, setQuickCutStatus] = useState('idle'); // 'idle', 'searching', 'matched', 'pending', 'completed'
  const [matchedBarber, setMatchedBarber] = useState(null);
  const [quickCutTimer, setQuickCutTimer] = useState(0);
  const [searchTimeLeft, setSearchTimeLeft] = useState(900); // 15 minutes = 900 seconds
  const [maxDistance, setMaxDistance] = useState([5]); // km
  const [serviceLocation, setServiceLocation] = useState('local'); // 'local' or 'home'
  const [preferredTime, setPreferredTime] = useState('asap'); // 'asap', '30min', '1hour', '2hours'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Advanced features states
  const [realTimeTracking, setRealTimeTracking] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [quickCutProgress, setQuickCutProgress] = useState(0);
  const [barberRating, setBarberRating] = useState(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [clientLevel, setClientLevel] = useState('Bronze');
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalCuts, setTotalCuts] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  
  // Enterprise features
  const [analyticsData, setAnalyticsData] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [smartRecommendations, setSmartRecommendations] = useState([]);
  const [dynamicPricing, setDynamicPricing] = useState(false);

  // Barber specific states
  const [appointments, setAppointments] = useState([]);
  const [quickCutRequests, setQuickCutRequests] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [myBarbershop, setMyBarbershop] = useState(null);
  const [showCreateBarbershop, setShowCreateBarbershop] = useState(false);

  // Client specific states
  const [bookingHistory, setBookingHistory] = useState([]);
  const [userSettings, setUserSettings] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    address: '',
    hairPreference: '',
    notifications: {
      offers: true,
      reminders: true
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingBarbershop, setBookingBarbershop] = useState(null);
  
  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
    images: []
  });
  const [completedQuickCut, setCompletedQuickCut] = useState(null);

  useEffect(() => {
    checkAuthStatus();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (user && user.user_type === 'client') {
      loadBarbershops();
      loadClientHistory();
      
      // Initialize enterprise features for clients
      generateSmartRecommendations();
      calculateLoyaltyRewards(totalSpent, totalCuts);
      
      // Show welcome notification
      setTimeout(() => {
        showNotification(
          `¡Bienvenido, ${user.name}!`,
          `Nivel ${clientLevel} • ${loyaltyPoints} puntos disponibles`,
          'success'
        );
      }, 1000);
      
    } else if (user && user.user_type === 'barber') {
      loadBarberData();
      
      // Initialize barber analytics
      setTimeout(() => {
        showNotification(
          '🔥 Panel del Barbero',
          'Gestiona tus servicios y solicitudes',
          'info'
        );
      }, 1000);
    }
  }, [user]);

  // Enterprise features initialization
  useEffect(() => {
    // Initialize real-time updates
    if (realTimeUpdates && quickCutStatus === 'searching') {
      const interval = setInterval(() => {
        updateQuickCutProgress('searching');
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [quickCutStatus, realTimeUpdates]);

  // Dynamic pricing updates
  useEffect(() => {
    if (dynamicPricing && selectedService) {
      const demand = Math.random(); // Simulate demand
      const distance = maxDistance[0];
      const dynamicPrice = calculateDynamicPrice(priceLimit[0], demand, distance);
      
      if (dynamicPrice !== priceLimit[0]) {
        setPriceLimit([dynamicPrice]);
        showNotification(
          '💰 Precio Dinámico',
          `Precio ajustado a $${dynamicPrice.toLocaleString()} por demanda actual`,
          'info'
        );
      }
    }
  }, [selectedService, maxDistance, dynamicPricing]);

  useEffect(() => {
    if (user && user.user_type === 'client') {
      // Initialize map when in map tab, with a slight delay for DOM readiness
      if (activeTab === 'map') {
        setTimeout(() => {
          initializeMap();
        }, 1000); // Increased delay to ensure barbershops are loaded
      }
    }
  }, [barbershops, user, activeTab]);

  // Check if user is already logged in
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.log('Error getting location:', error);
        }
      );
    }
  };

  const loadBarbershops = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/barbershops`);
      setBarbershops(response.data.barbershops || []);
    } catch (error) {
      console.error('Error loading barbershops:', error);
    }
  };

  const loadBarberData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [appointmentsRes, requestsRes, barbershopRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/bookings/barber`, { headers }).catch(e => ({ data: { bookings: [] } })),
        axios.get(`${BACKEND_URL}/api/quick-cuts/requests`, { headers }).catch(e => ({ data: { requests: [] } })),
        axios.get(`${BACKEND_URL}/api/barbershops/my`, { headers }).catch(e => ({ data: { barbershop: null } }))
      ]);
      
      console.log('Barber data loaded:', {
        appointments: appointmentsRes.data.bookings?.length || 0,
        requests: requestsRes.data.requests?.length || 0,
        barbershop: barbershopRes.data.barbershop?.name || 'None'
      });
      
      setAppointments(appointmentsRes.data.bookings || []);
      setQuickCutRequests(requestsRes.data.requests || []);
      setMyBarbershop(barbershopRes.data.barbershop);
      
    } catch (error) {
      console.error('Error loading barber data:', error);
    }
  };

  const loadClientHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${BACKEND_URL}/api/client/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookingHistory(response.data.history || []);
    } catch (error) {
      console.error('Error loading client history:', error);
    }
  };

  const initializeMap = async () => {
    console.log('Initializing map...');
    console.log('Barbershops:', barbershops.length);
    console.log('User:', user?.user_type);
    console.log('API Key exists:', !!GOOGLE_MAPS_API_KEY);
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('No Google Maps API key');
      return;
    }

    // Check if the map div exists
    const mapDiv = document.getElementById("map");
    if (!mapDiv) {
      console.error('Map div not found');
      setTimeout(initializeMap, 1000); // Retry after 1 second
      return;
    }

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry"]
    });

    try {
      // Load Google Maps
      console.log('Loading Google Maps...');
      const google = await loader.load();
      console.log('Google Maps loaded successfully');
      
      const mapInstance = new google.maps.Map(mapDiv, {
        zoom: barbershops.length > 0 ? 12 : 10,
        center: userLocation,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#1a1a1a" }]
          },
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#2a2a2a" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0f1419" }]
          }
        ]
      });

      console.log('Map instance created');
      setMap(mapInstance);

      // Add markers for barbershops
      let markerCount = 0;
      barbershops.forEach(barbershop => {
        if (barbershop.lat && barbershop.lng) {
          const marker = new google.maps.Marker({
            position: { lat: barbershop.lat, lng: barbershop.lng },
            map: mapInstance,
            title: barbershop.name,
          });

          marker.addListener("click", () => {
            setSelectedBarbershop(barbershop);
          });
          markerCount++;
        }
      });
      
      console.log(`Added ${markerCount} markers to map`);

      // If we have barbershops, adjust map bounds to show all markers
      if (barbershops.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        barbershops.forEach(barbershop => {
          if (barbershop.lat && barbershop.lng) {
            bounds.extend(new google.maps.LatLng(barbershop.lat, barbershop.lng));
          }
        });
        mapInstance.fitBounds(bounds);
      }

    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  const handleQuickSearch = async () => {
    if (!selectedService) {
      setError('Por favor selecciona un servicio');
      return;
    }

    setQuickCutStatus('searching');
    setSearchTimeLeft(900); // 15 minutes
    setError('');

    // Start countdown timer
    const timer = setInterval(() => {
      setSearchTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setQuickCutStatus('idle');
          setError('Búsqueda expirada. No se encontraron barberos disponibles.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start polling for matches every 3 seconds
    const matchInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/quick-cuts/check-match`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        
        if (response.data.matched) {
          clearInterval(timer);
          clearInterval(matchInterval);
          setMatchedBarber(response.data.barber);
          setQuickCutStatus('matched');
          setSuccess('¡Barbero encontrado! Revisa los detalles.');
        }
      } catch (error) {
        console.log('Checking for matches...');
      }
    }, 3000);

    // Send initial request
    try {
      const response = await axios.post(`${BACKEND_URL}/api/quick-cuts/request`, {
        service: selectedService,
        max_price: priceLimit[0],
        max_distance: maxDistance[0],
        service_location: serviceLocation,
        preferred_time: preferredTime,
        lat: userLocation.lat,
        lng: userLocation.lng
      }, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const suitableCount = response.data.suitable_barbers_count || 0;
      setSuccess(`Buscando barberos disponibles... (${suitableCount} barberos notificados)`);
    } catch (error) {
      clearInterval(timer);
      clearInterval(matchInterval);
      setQuickCutStatus('idle');
      console.error('Quick search error:', error);
      const errorMsg = error.response?.data?.detail || 'Error al enviar solicitud';
      setError(errorMsg);
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email, password
      });
      
      // Store token and user data
      localStorage.setItem('auth_token', response.data.access_token);
      setUser(response.data.user);
      setShowLogin(false);
      setSuccess('Inicio de sesión exitoso');
      
      // Load specific data based on user type
      if (response.data.user.user_type === 'barber') {
        setTimeout(() => loadBarberData(), 1000);
      } else {
        setTimeout(() => {
          loadBarbershops();
          loadClientHistory();
        }, 1000);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Error en el inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
      localStorage.setItem('auth_token', response.data.access_token);
      setUser(response.data.user);
      setShowRegister(false);
      setSuccess('Registro exitoso');
      
      // Si es barbero, mostrar modal para crear barbería y cargar datos
      if (userData.userType === 'barber') {
        setTimeout(() => {
          loadBarberData();
          setShowCreateBarbershop(true);
        }, 1000);
      } else {
        setTimeout(() => {
          loadBarbershops();
          loadClientHistory();
        }, 1000);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setMyBarbershop(null);
    setActiveTab('map');
  };

  const handleQuickCutResponse = async (requestId, accept) => {
    try {
      await axios.post(`${BACKEND_URL}/api/quick-cuts/${requestId}/respond`, {
        accept
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      loadBarberData(); // Refresh data
      setSuccess(accept ? 'Solicitud aceptada' : 'Solicitud rechazada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error al responder la solicitud');
    }
  };

  const handleCreateBarbershop = async (barbershopData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/barbershops`, barbershopData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      
      setMyBarbershop(response.data);
      setShowCreateBarbershop(false);
      setSuccess('¡Barbería creada exitosamente! Ya apareces en el mapa.');
      setTimeout(() => setSuccess(''), 5000);
      
      // Reload barbershops para mostrar la nueva en el mapa
      loadBarbershops();
    } catch (error) {
      setError(error.response?.data?.detail || 'Error al crear barbería');
    }
  };

  // Booking Modal Component
  const BookingModal = () => {
    const [bookingData, setBookingData] = useState({
      service: '',
      date: '',
      time: '',
      notes: ''
    });

    const handleBooking = async () => {
      if (!bookingData.service || !bookingData.date || !bookingData.time) {
        setError('Por favor completa todos los campos obligatorios');
        return;
      }

      try {
        setLoading(true);
        const selectedService = bookingBarbershop.services.find(s => s.name === bookingData.service);
        
        const response = await axios.post(`${BACKEND_URL}/api/bookings`, {
          barbershop_id: bookingBarbershop.id,
          barber_id: bookingBarbershop.barber_id,
          service: bookingData.service,
          date: new Date(`${bookingData.date}T${bookingData.time}`).toISOString(),
          price: selectedService?.price || 0,
          notes: bookingData.notes
        }, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        setShowBooking(false);
        setBookingBarbershop(null);
        setBookingData({ service: '', date: '', time: '', notes: '' });
        setSuccess('Reserva enviada correctamente al barbero');
        
        // Refresh booking history
        loadClientHistory();
        
      } catch (error) {
        console.error('Booking error:', error);
        const errorMsg = error.response?.data?.detail || 'Error al enviar la reserva';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Reservar en {bookingBarbershop?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Servicio *</label>
              <Select value={bookingData.service} onValueChange={(value) => setBookingData({...bookingData, service: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {bookingBarbershop?.services?.map((service, index) => (
                    <SelectItem key={index} value={service.name}>
                      {service.name} - ${service.price?.toLocaleString()} ({service.duration}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Fecha *</label>
              <Input
                type="date"
                value={bookingData.date}
                onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Hora preferida *</label>
              <Input
                type="time"
                value={bookingData.time}
                onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Notas (opcional)</label>
              <Textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                placeholder="Alguna preferencia especial..."
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleBooking}
                disabled={!bookingData.service || !bookingData.date || !bookingData.time}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Enviar Reserva
              </Button>
              <Button 
                onClick={() => setShowBooking(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const LoginForm = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });

    return (
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <Button 
          onClick={() => handleLogin(formData.email, formData.password)}
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </Button>
      </div>
    );
  };

  const RegisterForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'client',
      address: '',
      phone: ''
    });

    return (
      <div className="space-y-4">
        <div>
          <label className="text-white text-sm font-medium mb-2 block">
            ¿Qué tipo de usuario eres? *
          </label>
          <Select
            value={formData.userType}
            onValueChange={(value) => setFormData({...formData, userType: value})}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente - Busco cortarme el pelo
                </div>
              </SelectItem>
              <SelectItem value="barber">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Barbero - Quiero ofrecer mis servicios
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="Nombre completo"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <Input
          type="password"
          placeholder="Confirmar contraseña"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />

        {formData.userType === 'barber' && (
          <>
            <Input
              placeholder="Teléfono (requerido para barberos)"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
            <Input
              placeholder="Dirección de tu barbería (Ej: Av. Providencia 1234, Santiago)"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
            <p className="text-gray-400 text-xs">
              Tu barbería aparecerá automáticamente en el mapa con esta dirección
            </p>
          </>
        )}

        <Button 
          onClick={() => handleRegister(formData)}
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </Button>
      </div>
    );
  };

  // Create Barbershop Form
  const CreateBarbershopForm = () => {
    const { isLoaded, inputRef, setupPlaceChangedListener } = useGooglePlaces(GOOGLE_MAPS_API_KEY);
    const [selectedPlace, setSelectedPlace] = useState(null);
    
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      address: user?.address || '',
      phone: user?.phone || '',
      services: [
        { name: 'Corte de pelo', price: 12000, duration: 30 },
        { name: 'Corte + barba', price: 18000, duration: 45 }
      ],
      working_hours: {
        monday: { open: '09:00', close: '18:00', isOpen: true },
        tuesday: { open: '09:00', close: '18:00', isOpen: true },
        wednesday: { open: '09:00', close: '18:00', isOpen: true },
        thursday: { open: '09:00', close: '18:00', isOpen: true },
        friday: { open: '09:00', close: '18:00', isOpen: true },
        saturday: { open: '09:00', close: '16:00', isOpen: true },
        sunday: { open: '10:00', close: '15:00', isOpen: false }
      }
    });

    // Set up Google Places listener when loaded
    useEffect(() => {
      if (isLoaded) {
        setupPlaceChangedListener((place) => {
          setSelectedPlace(place);
          setFormData(prev => ({
            ...prev,
            address: place.formatted_address,
            lat: place.lat,
            lng: place.lng
          }));
          
          showNotification(
            '📍 Ubicación Confirmada',
            `Dirección: ${place.formatted_address}`,
            'success'
          );
        });
      }
    }, [isLoaded, setupPlaceChangedListener]);

    const addService = () => {
      setFormData({
        ...formData,
        services: [...formData.services, { name: '', price: 0, duration: 30 }]
      });
    };

    const removeService = (index) => {
      const newServices = formData.services.filter((_, i) => i !== index);
      setFormData({ ...formData, services: newServices });
    };

    const updateService = (index, field, value) => {
      const newServices = [...formData.services];
      newServices[index] = { ...newServices[index], [field]: value };
      setFormData({ ...formData, services: newServices });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreateBarbershop(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            placeholder="Nombre de tu barbería"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            required
          />
          <Input
            placeholder="Teléfono"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            required
          />
        </div>

        {/* Google Places Autocomplete Address Input */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Dirección de tu barbería *</label>
          <div className="relative">
            <Input
              ref={inputRef}
              id="address-autocomplete"
              placeholder="Ingresa la dirección de tu barbería..."
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              required
            />
            <div className="absolute right-3 top-3 flex items-center gap-1">
              {selectedPlace && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-gray-400">
              {isLoaded ? 
                '💡 Escribe y selecciona de las sugerencias para obtener la ubicación exacta' :
                '⏳ Cargando Google Places...'
              }
            </p>
          </div>
          
          {selectedPlace && (
            <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-medium">Ubicación Confirmada</span>
              </div>
              <p className="text-green-200 text-xs">{selectedPlace.formatted_address}</p>
              <p className="text-green-300 text-xs mt-1">
                📍 {selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <Textarea
          placeholder="Describe tu barbería y tus especialidades..."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="min-h-[80px] bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium">Servicios</h4>
            <Button type="button" onClick={addService} size="sm" className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
          
          <div className="space-y-2">
            {formData.services.map((service, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Servicio"
                  value={service.name}
                  onChange={(e) => updateService(index, 'name', e.target.value)}
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={service.price}
                  onChange={(e) => updateService(index, 'price', parseInt(e.target.value) || 0)}
                  className="w-24 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
                <Input
                  type="number"
                  placeholder="Min"
                  value={service.duration}
                  onChange={(e) => updateService(index, 'duration', parseInt(e.target.value) || 0)}
                  className="w-16 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
                {formData.services.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeService(index)}
                    size="sm"
                    variant="outline"
                    className="border-red-400 text-red-400"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
          Crear Mi Barbería
        </Button>
      </form>
    );
  };

  // Client Interface Components
  const ClientInterface = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-900">
        <TabsTrigger value="map" className="text-white data-[state=active]:bg-amber-600">
          <MapPin className="w-4 h-4 mr-1" />
          Mapa
        </TabsTrigger>
        <TabsTrigger value="quick" className="text-white data-[state=active]:bg-amber-600">
          <Search className="w-4 h-4 mr-1" />
          Corte Rápido
        </TabsTrigger>
        <TabsTrigger value="profile" className="text-white data-[state=active]:bg-amber-600">
          <User className="w-4 h-4 mr-1" />
          Perfil
        </TabsTrigger>
      </TabsList>

      <TabsContent value="map">
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-0">
              <div id="map" className="w-full h-96 rounded-lg bg-gray-800 flex items-center justify-center">
                {!map && barbershops.length === 0 ? (
                  <div className="text-gray-400 text-center">
                    <Scissors className="w-12 h-12 mx-auto mb-2" />
                    <p>No hay barberías registradas para mostrar</p>
                  </div>
                ) : !map ? (
                  <div className="text-gray-400 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-2"></div>
                    <p>Cargando mapa...</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">Barberías Disponibles</h3>
            {barbershops.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Scissors className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">No hay barberías registradas aún</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {barbershops.map(barbershop => (
                  <BarbershopCard key={barbershop.id} barbershop={barbershop} />
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="quick">
        <QuickCutSection />
      </TabsContent>

      <TabsContent value="profile">
        <ClientProfile />
      </TabsContent>
    </Tabs>
  );

  // Barber Interface Components
  const BarberInterface = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-900">
        <TabsTrigger value="calendar" className="text-white data-[state=active]:bg-amber-600">
          <Calendar className="w-4 h-4 mr-1" />
          Calendario
        </TabsTrigger>
        <TabsTrigger value="requests" className="text-white data-[state=active]:bg-amber-600">
          <Bell className="w-4 h-4 mr-1" />
          Solicitudes ({quickCutRequests.length})
        </TabsTrigger>
        <TabsTrigger value="business" className="text-white data-[state=active]:bg-amber-600">
          <Settings className="w-4 h-4 mr-1" />
          Mi Negocio
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendar">
        <BarberCalendar />
      </TabsContent>

      <TabsContent value="requests">
        <QuickCutRequests />
      </TabsContent>

      <TabsContent value="business">
        <BarberBusiness />
      </TabsContent>
    </Tabs>
  );

  const BarbershopCard = ({ barbershop }) => (
    <Card className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 transition-colors cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={barbershop.profile_image} alt={barbershop.name} />
              <AvatarFallback>{barbershop.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{barbershop.name}</CardTitle>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm">{barbershop.rating || 0} ({barbershop.reviews_count || 0})</span>
              </div>
            </div>
          </div>
          <Badge className={barbershop.available ? "bg-green-600" : "bg-gray-600"}>
            {barbershop.available ? "Disponible" : "Ocupado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-gray-300 text-sm flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {barbershop.address}
          </p>
          {barbershop.services && barbershop.services.length > 0 && (
            <div>
              <p className="text-amber-400 font-medium">
                ${barbershop.services[0].price?.toLocaleString()} - ${barbershop.services[barbershop.services.length-1].price?.toLocaleString()}
              </p>
              <div className="flex gap-2 mt-2">
                {barbershop.services.slice(0, 2).map((service, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {service.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                setBookingBarbershop(barbershop);
                setShowBooking(true);
              }}
            >
              Reservar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => setSelectedBarbershop(barbershop)}
            >
              Ver Perfil
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickCutSection = () => {
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Corte Rápido</h2>
          <p className="text-gray-400">Encuentra un barbero disponible ahora mismo</p>
        </div>

        {quickCutStatus === 'idle' && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Servicio requerido
                </label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corte de pelo">Corte de pelo</SelectItem>
                    <SelectItem value="Corte + barba">Corte + barba</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Presupuesto máximo
                </label>
                <div className="flex gap-3 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPriceLimit([8000])}
                    className={priceLimit[0] === 8000 ? "bg-amber-600 text-white border-amber-600" : "text-white border-gray-600 hover:border-amber-600 hover:text-amber-600"}
                  >
                    $8.000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPriceLimit([12000])}
                    className={priceLimit[0] === 12000 ? "bg-amber-600 text-white border-amber-600" : "text-white border-gray-600 hover:border-amber-600 hover:text-amber-600"}
                  >
                    $12.000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPriceLimit([18000])}
                    className={priceLimit[0] === 18000 ? "bg-amber-600 text-white border-amber-600" : "text-white border-gray-600 hover:border-amber-600 hover:text-amber-600"}
                  >
                    $18.000
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPriceLimit([25000])}
                    className={priceLimit[0] === 25000 ? "bg-amber-600 text-white border-amber-600" : "text-white border-gray-600 hover:border-amber-600 hover:text-amber-600"}
                  >
                    $25.000+
                  </Button>
                </div>
                <div className="mt-2">
                  <Slider
                    value={priceLimit}
                    onValueChange={setPriceLimit}
                    max={25000}
                    min={5000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>$5.000</span>
                    <span className="text-amber-400">${priceLimit[0].toLocaleString()}</span>
                    <span>$25.000</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Distancia máxima: {maxDistance[0]} km
                </label>
                <div className="flex gap-2 mb-2">
                  {[1, 3, 5, 10].map(km => (
                    <Button
                      key={km}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMaxDistance([km])}
                      className={maxDistance[0] === km ? "bg-amber-600 text-white border-amber-600" : "text-white border-gray-600 hover:border-amber-600 hover:text-amber-600"}
                    >
                      {km}km
                    </Button>
                  ))}
                </div>
                <Slider
                  value={maxDistance}
                  onValueChange={setMaxDistance}
                  max={15}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Ubicación del servicio
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={serviceLocation === 'local' ? 'default' : 'outline'}
                    onClick={() => setServiceLocation('local')}
                    className={serviceLocation === 'local' ? "bg-amber-600 hover:bg-amber-700" : ""}
                  >
                    En el local
                  </Button>
                  <Button
                    type="button"
                    variant={serviceLocation === 'home' ? 'default' : 'outline'}
                    onClick={() => setServiceLocation('home')}
                    className={serviceLocation === 'home' ? "bg-amber-600 hover:bg-amber-700" : ""}
                  >
                    A domicilio
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  ¿Cuándo quieres cortarte?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={preferredTime === 'asap' ? 'default' : 'outline'}
                    onClick={() => setPreferredTime('asap')}
                    className={preferredTime === 'asap' ? "bg-amber-600 hover:bg-amber-700" : "text-white border-gray-600 hover:border-amber-600 hover:text-amber-600"}
                  >
                    Lo antes posible
                  </Button>
                  <Button
                    type="button"
                    variant={preferredTime === '30min' ? 'default' : 'outline'}
                    onClick={() => setPreferredTime('30min')}
                    className={preferredTime === '30min' ? "bg-amber-600 hover:bg-amber-700" : "text-white border-gray-600 hover:border-amber-600 hover:text-amber-600"}
                  >
                    En 30 minutos
                  </Button>
                  <Button
                    type="button"
                    variant={preferredTime === '1hour' ? 'default' : 'outline'}
                    onClick={() => setPreferredTime('1hour')}
                    className={preferredTime === '1hour' ? "bg-amber-600 hover:bg-amber-700" : "text-white border-gray-600 hover:border-amber-600 hover:text-amber-600"}
                  >
                    En 1 hora
                  </Button>
                  <Button
                    type="button"
                    variant={preferredTime === '2hours' ? 'default' : 'outline'}
                    onClick={() => setPreferredTime('2hours')}
                    className={preferredTime === '2hours' ? "bg-amber-600 hover:bg-amber-700" : "text-white border-gray-600 hover:border-amber-600 hover:text-amber-600"}
                  >
                    En 2 horas
                  </Button>
                </div>
              </div>

              {/* Advanced Features Section */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Características Avanzadas
                </h4>
                
                {/* Real-time tracking toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">Seguimiento en tiempo real</span>
                  </div>
                  <Button
                    size="sm"
                    variant={realTimeTracking ? "default" : "outline"}
                    onClick={() => setRealTimeTracking(!realTimeTracking)}
                    className={realTimeTracking ? "bg-blue-600 hover:bg-blue-700" : "text-white border-gray-600"}
                  >
                    {realTimeTracking ? 'Activado' : 'Activar'}
                  </Button>
                </div>

                {/* Location tracker component */}
                <LocationTracker 
                  onLocationUpdate={handleLocationUpdate}
                  enabled={realTimeTracking}
                />

                {/* Notifications toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-green-400" />
                    <span className="text-white text-sm">Notificaciones push</span>
                  </div>
                  <Button
                    size="sm"
                    variant={notificationsEnabled ? "default" : "outline"}
                    onClick={requestNotificationPermission}
                    className={notificationsEnabled ? "bg-green-600 hover:bg-green-700" : "text-white border-gray-600"}
                  >
                    {notificationsEnabled ? 'Activado' : 'Activar'}
                  </Button>
                </div>

                {/* Dynamic pricing indicator */}
                {dynamicPricing && (
                  <div className="flex items-center gap-2 p-2 bg-amber-900/30 rounded">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 text-sm">
                      Precio dinámico activo - Demanda: Alta
                    </span>
                  </div>
                )}
              </div>

              {/* Smart Recommendations */}
              {smartRecommendations.length > 0 && (
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg">
                  <h4 className="text-white font-medium flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-purple-400" />
                    Recomendaciones Inteligentes
                  </h4>
                  {smartRecommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className="bg-gray-800/50 p-3 rounded mb-2 last:mb-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{rec.title}</p>
                          <p className="text-gray-400 text-xs">{rec.description}</p>
                        </div>
                        {rec.discount && (
                          <Badge className="bg-purple-600 text-white">
                            -{rec.discount}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Loyalty Points Display */}
              {loyaltyPoints > 0 && (
                <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-white font-medium">Nivel {clientLevel}</p>
                        <p className="text-amber-300 text-sm">{loyaltyPoints} puntos</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-600 text-white">
                      {totalCuts} cortes
                    </Badge>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleQuickSearch}
                disabled={!selectedService}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Buscar Corte Rápido
                </div>
              </Button>
            </CardContent>
          </Card>
        )}

        {quickCutStatus === 'searching' && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <div className="relative">
                  <LoadingSpinner size="xl" className="text-amber-400 mx-auto mb-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-amber-400 rounded-full animate-pulse opacity-50"></div>
                  </div>
                </div>
                
                <h3 className="text-white text-xl font-semibold mb-2">Buscando barbero disponible...</h3>
                <p className="text-gray-400 mb-4">
                  Notificamos a {matchedBarber ? '1' : '3-5'} barberos cercanos
                </p>
                
                {/* Progress bar */}
                <div className="mb-4">
                  <Progress value={quickCutProgress} className="w-full" />
                  <p className="text-xs text-gray-500 mt-1">
                    {quickCutProgress < 20 ? 'Iniciando búsqueda...' :
                     quickCutProgress < 40 ? 'Localizando barberos...' :
                     quickCutProgress < 60 ? 'Enviando notificaciones...' :
                     quickCutProgress < 80 ? 'Esperando respuestas...' :
                     'Finalizando coincidencia...'}
                  </p>
                </div>
                
                <div className="text-amber-400 text-lg font-mono bg-gray-800 p-3 rounded-lg">
                  ⏰ Tiempo restante: {formatTime(searchTimeLeft)}
                </div>
              </div>
              
              {/* Enhanced search details */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <h4 className="text-white font-medium">Detalles de tu solicitud:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-amber-400" />
                    <span className="text-gray-300">Servicio:</span>
                  </div>
                  <span className="text-white">{selectedService}</span>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Presupuesto:</span>
                  </div>
                  <span className="text-white">${priceLimit[0].toLocaleString()}</span>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">Distancia:</span>
                  </div>
                  <span className="text-white">Hasta {maxDistance[0]} km</span>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">Tiempo:</span>
                  </div>
                  <span className="text-white">
                    {preferredTime === 'asap' ? 'Lo antes posible' :
                     preferredTime === '30min' ? 'En 30 minutos' :
                     preferredTime === '1hour' ? 'En 1 hora' :
                     'En 2 horas'}
                  </span>
                </div>
              </div>

              {/* Real-time updates */}
              {realTimeUpdates && (
                <div className="bg-blue-900/20 border border-blue-700 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span className="text-blue-300 text-sm font-medium">Actualizaciones en tiempo real</span>
                  </div>
                  <div className="text-xs text-blue-200 space-y-1">
                    <p>• {new Date().toLocaleTimeString()}: Búsqueda iniciada</p>
                    <p>• {new Date(Date.now() - 5000).toLocaleTimeString()}: 3 barberos notificados</p>
                    {matchedBarber && <p>• {new Date(Date.now() - 2000).toLocaleTimeString()}: Barbero encontrado</p>}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => setQuickCutStatus('idle')}
                  variant="outline"
                  className="flex-1 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                
                <Button 
                  onClick={() => {
                    setSearchTimeLeft(900);
                    updateQuickCutProgress('searching');
                  }}
                  variant="outline"
                  className="flex-1 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar más
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {quickCutStatus === 'matched' && matchedBarber && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <h3 className="text-white text-xl font-semibold mb-2">¡Barbero Encontrado!</h3>
                <p className="text-gray-400">Tu barbero ha aceptado el corte</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar>
                    <AvatarImage src={matchedBarber.image} />
                    <AvatarFallback>{matchedBarber.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-white font-medium">{matchedBarber.name}</h4>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm text-gray-400">{matchedBarber.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Servicio:</span>
                    <span className="text-white">{selectedService}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Precio:</span>
                    <span className="text-amber-400">${matchedBarber.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Distancia:</span>
                    <span className="text-white">{matchedBarber.distance} km</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-900/20 border border-amber-400/30 p-4 rounded-lg">
                <h5 className="text-amber-400 font-medium mb-2">📍 Dirección de la Barbería:</h5>
                <p className="text-white">{matchedBarber.address}</p>
                <p className="text-gray-400 text-sm mt-2">
                  Dirígete a esta dirección para tu corte
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setQuickCutStatus('pending')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Ir al Local
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {quickCutStatus === 'pending' && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-amber-400" />
                <h3 className="text-white text-xl font-semibold mb-2">Corte Pendiente</h3>
                <p className="text-gray-400">Tu barbero te está esperando</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h5 className="text-white font-medium mb-2">Estado del corte:</h5>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-amber-400">En progreso</span>
                </div>
              </div>

              <Button 
                onClick={() => {
                  setCompletedQuickCut({
                    barber: matchedBarber,
                    service: selectedService,
                    price: matchedBarber.price
                  });
                  setShowReviewModal(true);
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Marcar como Completado
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const ClientProfile = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4">
          <AvatarFallback className="text-2xl">{user?.name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold mb-2 text-white">{user?.name}</h2>
        <p className="text-gray-400 mb-6">{user?.email}</p>
      </div>

      <div className="max-w-sm mx-auto space-y-4">
        <Button 
          onClick={() => setShowHistory(true)}
          variant="outline" 
          className="w-full"
        >
          <History className="w-4 h-4 mr-2" />
          Historial de Cortes
        </Button>
        <Button 
          onClick={() => setShowSettings(true)}
          variant="outline" 
          className="w-full"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configuración
        </Button>
        <Button 
          variant="outline" 
          className="w-full text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Historial Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Historial de Cortes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {bookingHistory.length === 0 ? (
              <div className="text-center py-8">
                <Scissors className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">No tienes cortes registrados aún</p>
              </div>
            ) : (
              bookingHistory.map((item, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium">{item.service}</h4>
                          <Badge 
                            variant="outline" 
                            className={item.type === 'quick_cut' ? "text-amber-400 border-amber-400" : "text-blue-400 border-blue-400"}
                          >
                            {item.type === 'quick_cut' ? '⚡ Corte Rápido' : '📅 Reserva'}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {item.barbershop?.name || item.barbershop_name || 'Barbería'}
                        </p>
                        <p className="text-amber-400 text-sm">${item.price?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.created_at || item.date).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    
                    {/* Show review if exists */}
                    {item.review && (
                      <div className="bg-gray-700 p-3 rounded-lg mt-3">
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= item.review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`}
                            />
                          ))}
                          <span className="text-white text-sm ml-2">Tu reseña</span>
                        </div>
                        {item.review.comment && (
                          <p className="text-gray-300 text-sm">{item.review.comment}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Configuración del Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Nombre</label>
              <Input
                value={editingProfile ? userSettings.name : user?.name || ''}
                onChange={(e) => setUserSettings({...userSettings, name: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                readOnly={!editingProfile}
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Email</label>
              <Input
                value={user?.email || ''}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                readOnly
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Teléfono</label>
              <Input
                value={editingProfile ? userSettings.phone : user?.phone || ''}
                onChange={(e) => setUserSettings({...userSettings, phone: e.target.value})}
                placeholder="Ej: +56 9 1234 5678"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                readOnly={!editingProfile}
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Edad (opcional)</label>
              <Input
                type="number"
                value={editingProfile ? userSettings.age : user?.age || ''}
                onChange={(e) => setUserSettings({...userSettings, age: e.target.value})}
                placeholder="Ej: 25"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                readOnly={!editingProfile}
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Dirección/Comuna (opcional)</label>
              <Input
                value={editingProfile ? userSettings.address : user?.address || ''}
                onChange={(e) => setUserSettings({...userSettings, address: e.target.value})}
                placeholder="Ej: Las Condes, Santiago"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                readOnly={!editingProfile}
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Preferencia de Corte</label>
              {editingProfile ? (
                <Select
                  value={userSettings.hairPreference}
                  onValueChange={(value) => setUserSettings({...userSettings, hairPreference: value})}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecciona tu estilo preferido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corto">Corto</SelectItem>
                    <SelectItem value="degrade">Degradé</SelectItem>
                    <SelectItem value="largo">Largo</SelectItem>
                    <SelectItem value="teñido">Con teñido</SelectItem>
                    <SelectItem value="clasico">Clásico</SelectItem>
                    <SelectItem value="moderno">Moderno</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={user?.hairPreference || 'No especificado'}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  readOnly
                />
              )}
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Notificaciones</label>
              <div className="space-y-2">
                <label className="flex items-center text-white text-sm">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={userSettings.notifications?.offers || true}
                    onChange={(e) => setUserSettings({
                      ...userSettings, 
                      notifications: {
                        ...userSettings.notifications,
                        offers: e.target.checked
                      }
                    })}
                    disabled={!editingProfile}
                  />
                  Recibir ofertas especiales
                </label>
                <label className="flex items-center text-white text-sm">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={userSettings.notifications?.reminders || true}
                    onChange={(e) => setUserSettings({
                      ...userSettings, 
                      notifications: {
                        ...userSettings.notifications,
                        reminders: e.target.checked
                      }
                    })}
                    disabled={!editingProfile}
                  />
                  Recordatorios de citas
                </label>
              </div>
            </div>
            
            <div className="flex gap-2">
              {!editingProfile ? (
                <Button 
                  onClick={() => {
                    setEditingProfile(true);
                    setUserSettings({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      age: user?.age || '',
                      address: user?.address || '',
                      hairPreference: user?.hairPreference || '',
                      notifications: user?.notifications || { offers: true, reminders: true }
                    });
                  }}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={async () => {
                      try {
                        // Save changes to backend
                        await axios.put(`${BACKEND_URL}/api/auth/profile`, userSettings, {
                          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
                        });
                        setEditingProfile(false);
                        setSuccess('Perfil actualizado correctamente');
                        // Update local user state
                        setUser({...user, ...userSettings});
                      } catch (error) {
                        setError('Error al actualizar perfil');
                      }
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                  <Button 
                    onClick={() => setEditingProfile(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const BarberCalendar = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Mis Citas Agendadas</h2>
        <p className="text-gray-400">Gestiona tus reservas y horarios</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border border-gray-700 bg-gray-800 text-white [&_.rdp-button]:text-white [&_.rdp-day_selected]:bg-amber-600 [&_.rdp-day_selected]:text-white [&_.rdp-head_cell]:text-gray-400 [&_.rdp-nav_button]:text-white hover:[&_.rdp-day]:bg-gray-700"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Citas para {selectedDate?.toLocaleDateString('es-CL')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No hay citas para este día
                </p>
              ) : (
                appointments.map((appointment, index) => (
                  <div key={index} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{appointment.service}</p>
                        <p className="text-gray-400 text-sm">{appointment.client_name}</p>
                        <p className="text-amber-400 text-sm">${appointment.price?.toLocaleString()}</p>
                      </div>
                      <Badge variant="outline">{appointment.time}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const QuickCutRequests = () => {
    const getTimeLeft = (createdAt, expiresAt) => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const timeLeft = Math.max(0, Math.floor((expires - now) / 1000));
      
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Solicitudes de Corte Rápido</h2>
          <p className="text-gray-400">Responde a las solicitudes de clientes cercanos</p>
        </div>

        <div className="space-y-4">
          {quickCutRequests.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">No hay solicitudes pendientes</p>
              </CardContent>
            </Card>
          ) : (
            quickCutRequests.map((request, index) => (
              <Card key={request.id} className={`bg-gray-900 border-gray-700 ${index === 0 ? 'ring-2 ring-amber-400' : ''}`}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{request.service}</h3>
                          {index === 0 && (
                            <Badge className="bg-amber-600 text-white animate-pulse">
                              ¡NUEVO!
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400">Cliente: {request.client_name}</p>
                        <p className="text-amber-400">Presupuesto: ${request.max_price?.toLocaleString()}</p>
                        {request.preferred_time && (
                          <p className="text-blue-400 text-sm">
                            ⏱️ {
                              request.preferred_time === 'asap' ? 'Lo antes posible' :
                              request.preferred_time === '30min' ? 'En 30 minutos' :
                              request.preferred_time === '1hour' ? 'En 1 hora' :
                              request.preferred_time === '2hours' ? 'En 2 horas' :
                              'Horario flexible'
                            }
                          </p>
                        )}
                        {request.service_location === 'home' && (
                          <Badge variant="outline" className="text-blue-400 border-blue-400 mt-1">
                            🏠 A domicilio
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          <MapPin className="w-3 h-3 mr-1" />
                          {request.distance} km de distancia
                        </Badge>
                        <div className="text-red-400 font-mono text-lg mb-1">
                          ⏰ {getTimeLeft(request.created_at, request.expires_at)}
                        </div>
                        <p className="text-xs text-gray-400">Tiempo para responder</p>
                        {request.lat && request.lng && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 Zona: {request.lat.toFixed(3)}, {request.lng.toFixed(3)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional details */}
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <h4 className="text-white text-sm font-medium mb-2">Detalles de la Solicitud:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Solicitud creada:</span>
                          <p className="text-white">{new Date(request.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Máx. distancia:</span>
                          <p className="text-white">{request.max_distance || 5} km</p>
                        </div>
                        {request.preferred_time !== 'asap' && (
                          <div>
                            <span className="text-gray-400">Tiempo deseado:</span>
                            <p className="text-white">
                              {request.preferred_time === '30min' ? '30 min' :
                               request.preferred_time === '1hour' ? '1 hora' :
                               request.preferred_time === '2hours' ? '2 horas' : 'Flexible'}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Estado:</span>
                          <p className="text-green-400">Pendiente</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleQuickCutResponse(request.id, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aceptar
                      </Button>
                      <Button 
                        onClick={() => handleQuickCutResponse(request.id, false)}
                        variant="outline"
                        className="flex-1 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  const BarberBusiness = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Mi Negocio</h2>
        <p className="text-gray-400">Gestiona tu barbería y servicios</p>
      </div>

      {!myBarbershop ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <Scissors className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-white text-xl mb-2">¡Crea tu barbería!</h3>
            <p className="text-gray-400 mb-4">
              Registra tu barbería para aparecer en el mapa y recibir clientes
            </p>
            <Button 
              onClick={() => setShowCreateBarbershop(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Mi Barbería
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                {myBarbershop.name}
                <Badge className="bg-green-600">Activa</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-300">{myBarbershop.description}</p>
                <p className="text-gray-400 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {myBarbershop.address}
                </p>
                <p className="text-gray-400 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {myBarbershop.phone}
                </p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-white">{myBarbershop.rating || 0} ({myBarbershop.reviews_count || 0} reseñas)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {myBarbershop.services?.map((service, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                    <span className="text-white">{service.name}</span>
                    <div className="text-amber-400">
                      ${service.price?.toLocaleString()} - {service.duration}min
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              <Edit3 className="w-4 h-4 mr-2" />
              Editar Información
            </Button>
            <Button variant="outline" className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Subir Fotos
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-sm mx-auto space-y-4">
        <Button 
          variant="outline" 
          className="w-full text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Create Barbershop Modal */}
      <Dialog open={showCreateBarbershop} onOpenChange={setShowCreateBarbershop}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Crear Mi Barbería</DialogTitle>
          </DialogHeader>
          <CreateBarbershopForm />
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-amber-400">CÓRTATE.CL</h1>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-400">
                    {user.user_type === 'client' ? 'Cliente' : 'Barbero'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Dialog open={showLogin} onOpenChange={setShowLogin}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <LogIn className="w-4 h-4 mr-1" />
                      Ingresar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Iniciar Sesión</DialogTitle>
                    </DialogHeader>
                    <LoginForm />
                  </DialogContent>
                </Dialog>

                <Dialog open={showRegister} onOpenChange={setShowRegister}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                      <UserPlus className="w-4 h-4 mr-1" />
                      Registrarse
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-white">Crear Cuenta</DialogTitle>
                    </DialogHeader>
                    <RegisterForm />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <Alert className="mx-4 mt-4 border-red-400 bg-red-900/20">
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mx-4 mt-4 border-green-400 bg-green-900/20">
          <AlertDescription className="text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <main className="p-4">
        {!user ? (
          <div className="text-center py-20">
            <Scissors className="w-24 h-24 mx-auto mb-8 text-amber-400" />
            <h1 className="text-4xl font-bold mb-4 text-white">Bienvenido a CÓRTATE.CL</h1>
            <p className="text-xl text-gray-400 mb-8">
              Encuentra y reserva las mejores barberías de Chile
            </p>
            <div className="space-x-4">
              <Button onClick={() => setShowLogin(true)} size="lg" variant="outline">
                Iniciar Sesión
              </Button>
              <Button onClick={() => setShowRegister(true)} size="lg" className="bg-amber-600 hover:bg-amber-700">
                Registrarse
              </Button>
            </div>
          </div>
        ) : user.user_type === 'client' ? (
          <ClientInterface />
        ) : (
          <BarberInterface />
        )}
      </main>

      {/* Booking Modal */}
      {bookingBarbershop && <BookingModal />}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal 
          showReviewModal={showReviewModal}
          setShowReviewModal={setShowReviewModal}
          reviewData={reviewData}
          setReviewData={setReviewData}
          completedQuickCut={completedQuickCut}
          setCompletedQuickCut={setCompletedQuickCut}
          setQuickCutStatus={setQuickCutStatus}
          setMatchedBarber={setMatchedBarber}
          setSuccess={setSuccess}
          loadClientHistory={loadClientHistory}
          setError={setError}
          loading={loading}
          setLoading={setLoading}
          BACKEND_URL={BACKEND_URL}
        />
      )}

      {/* Selected Barbershop Modal */}
      {selectedBarbershop && (
        <Dialog open={!!selectedBarbershop} onOpenChange={() => setSelectedBarbershop(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedBarbershop.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedBarbershop.profile_image} alt={selectedBarbershop.name} />
                  <AvatarFallback>{selectedBarbershop.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedBarbershop.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-white">{selectedBarbershop.rating || 0} ({selectedBarbershop.reviews_count || 0} reseñas)</span>
                  </div>
                  <p className="text-gray-400">{selectedBarbershop.address}</p>
                  {selectedBarbershop.phone && (
                    <p className="text-gray-400 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedBarbershop.phone}
                    </p>
                  )}
                </div>
              </div>
              
              {selectedBarbershop.description && (
                <p className="text-gray-300">{selectedBarbershop.description}</p>
              )}

              {selectedBarbershop.services && selectedBarbershop.services.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-2">Servicios</h4>
                  <div className="space-y-2">
                    {selectedBarbershop.services.map((service, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-800 rounded">
                        <span className="text-white">{service.name}</span>
                        <div className="text-amber-400">
                          ${service.price?.toLocaleString()} - {service.duration}min
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700">
                  Reservar Cita
                </Button>
                <Button variant="outline" className="flex-1">
                  Ver Reseñas
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Toast Notifications System */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              p-4 rounded-lg shadow-lg border transition-all duration-300 transform animate-in slide-in-from-right-full
              ${toast.variant === 'success' ? 'bg-green-900 border-green-700 text-green-100' :
                toast.variant === 'destructive' ? 'bg-red-900 border-red-700 text-red-100' :
                toast.variant === 'info' ? 'bg-blue-900 border-blue-700 text-blue-100' :
                'bg-gray-900 border-gray-700 text-gray-100'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {toast.variant === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                {toast.variant === 'destructive' && <XCircle className="w-5 h-5 text-red-400" />}
                {toast.variant === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                {toast.variant === 'default' && <AlertCircle className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1">
                {toast.title && <p className="font-medium text-sm">{toast.title}</p>}
                {toast.description && <p className="text-sm opacity-90 mt-1">{toast.description}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;