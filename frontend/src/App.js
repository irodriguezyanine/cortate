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
  Save
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
import { Alert, AlertDescription } from './components/ui/alert';
import { Textarea } from './components/ui/textarea';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function App() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  useEffect(() => {
    checkAuthStatus();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (user && user.user_type === 'client') {
      loadBarbershops();
      loadClientHistory();
    } else if (user && user.user_type === 'barber') {
      loadBarberData();
    }
  }, [user]);

  useEffect(() => {
    if (barbershops.length > 0 && user && user.user_type === 'client') {
      initializeMap();
    }
  }, [barbershops, user]);

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
      const [appointmentsRes, requestsRes, barbershopRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/bookings/barber`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/quick-cuts/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/barbershops/my`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
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
      const response = await axios.get(`${BACKEND_URL}/api/bookings/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookingHistory(response.data.bookings || []);
    } catch (error) {
      console.error('Error loading client history:', error);
    }
  };

  const initializeMap = async () => {
    if (!barbershops.length) {
      console.log('No barbershops to show');
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('No Google Maps API key');
      return;
    }

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry"]
    });

    try {
      // Load Google Maps
      const google = await loader.load();
      
      const mapInstance = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
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
          }
        ]
      });

      setMap(mapInstance);

      // Add markers for barbershops
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
        }
      });

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
      await axios.post(`${BACKEND_URL}/api/quick-cuts/request`, {
        service: selectedService,
        max_price: priceLimit[0],
        lat: userLocation.lat,
        lng: userLocation.lng
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });

      setSuccess('Buscando barberos disponibles... Esto puede tomar hasta 15 minutos.');
    } catch (error) {
      clearInterval(timer);
      clearInterval(matchInterval);
      setQuickCutStatus('idle');
      setError('Error al enviar solicitud');
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email, password
      });
      
      localStorage.setItem('auth_token', response.data.access_token);
      setUser(response.data.user);
      setShowLogin(false);
      setSuccess('Inicio de sesión exitoso');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
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
      
      // Si es barbero, mostrar modal para crear barbería
      if (userData.userType === 'barber') {
        setTimeout(() => {
          setShowCreateBarbershop(true);
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

  // Form Components
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
            required
          />
          <Input
            placeholder="Teléfono"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
        </div>

        <Input
          placeholder="Dirección completa"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          required
        />

        <Textarea
          placeholder="Describe tu barbería y tus especialidades..."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="min-h-[80px]"
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
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  value={service.price}
                  onChange={(e) => updateService(index, 'price', parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="Min"
                  value={service.duration}
                  onChange={(e) => updateService(index, 'duration', parseInt(e.target.value) || 0)}
                  className="w-16"
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
            <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700">
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
                  Presupuesto máximo: ${priceLimit[0].toLocaleString()}
                </label>
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
                  <span>$25.000</span>
                </div>
              </div>

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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
                <h3 className="text-white text-xl font-semibold mb-2">Buscando barbero...</h3>
                <p className="text-gray-400 mb-4">
                  Estamos notificando a barberos cercanos disponibles
                </p>
                <div className="text-amber-400 text-lg font-mono">
                  Tiempo restante: {formatTime(searchTimeLeft)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Servicio:</span>
                  <span>{selectedService}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Presupuesto:</span>
                  <span>${priceLimit[0].toLocaleString()}</span>
                </div>
              </div>

              <Button 
                onClick={() => setQuickCutStatus('idle')}
                variant="outline"
                className="w-full border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
              >
                Cancelar Búsqueda
              </Button>
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
                  setQuickCutStatus('idle');
                  setMatchedBarber(null);
                  setSuccess('¡Gracias por usar CÓRTATE.CL!');
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
              bookingHistory.map((booking, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium">{booking.service}</h4>
                        <p className="text-gray-400 text-sm">{booking.barbershop_name}</p>
                        <p className="text-amber-400 text-sm">${booking.price?.toLocaleString()}</p>
                      </div>
                      <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
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
              className="rounded-md border border-gray-700"
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

  const QuickCutRequests = () => (
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
          quickCutRequests.map((request) => (
            <Card key={request.id} className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{request.service}</h3>
                      <p className="text-gray-400">Cliente: {request.client_name}</p>
                      <p className="text-amber-400">Presupuesto: ${request.max_price?.toLocaleString()}</p>
                    </div>
                    <Badge variant="outline">
                      <MapPin className="w-3 h-3 mr-1" />
                      {request.distance} km
                    </Badge>
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
    </div>
  );
}

export default App;