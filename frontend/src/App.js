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
  Plus
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
  const [isSearching, setIsSearching] = useState(false);
  const [availableBarbers, setAvailableBarbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Barber specific states
  const [appointments, setAppointments] = useState([]);
  const [quickCutRequests, setQuickCutRequests] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateBarbershop, setShowCreateBarbershop] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (user && user.user_type === 'client') {
      loadBarbershops();
      initializeMap();
    } else if (user && user.user_type === 'barber') {
      loadBarberData();
    }
  }, [user]);

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
      const [appointmentsRes, requestsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/bookings/barber`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/quick-cuts/requests`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setAppointments(appointmentsRes.data.bookings || []);
      setQuickCutRequests(requestsRes.data.requests || []);
    } catch (error) {
      console.error('Error loading barber data:', error);
    }
  };

  const initializeMap = async () => {
    if (!barbershops.length) return;

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry"]
    });

    try {
      await loader.load();
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

      const mapInstance = new Map(document.getElementById("map"), {
        zoom: 12,
        center: userLocation,
        mapId: "DEMO_MAP_ID",
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

      barbershops.forEach(barbershop => {
        const marker = new AdvancedMarkerElement({
          map: mapInstance,
          position: { lat: barbershop.lat, lng: barbershop.lng },
          title: barbershop.name,
        });

        marker.addListener("click", () => {
          setSelectedBarbershop(barbershop);
        });
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

    setIsSearching(true);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/quick-cuts/request`, {
        service: selectedService,
        max_price: priceLimit[0],
        lat: userLocation.lat,
        lng: userLocation.lng
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });

      setSuccess('Solicitud enviada a barberos cercanos. Espera confirmación...');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Error al enviar solicitud');
    } finally {
      setIsSearching(false);
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

  const LoginForm = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });

    return (
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
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
      userType: 'client'
    });

    return (
      <div className="space-y-4">
        <Input
          placeholder="Nombre completo"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <Input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        <Input
          type="password"
          placeholder="Confirmar contraseña"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
        />
        <Select
          value={formData.userType}
          onValueChange={(value) => setFormData({...formData, userType: value})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Cliente</SelectItem>
            <SelectItem value="barber">Barbero</SelectItem>
          </SelectContent>
        </Select>
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
              <div id="map" className="w-full h-96 rounded-lg"></div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">Barberías Disponibles</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {barbershops.map(barbershop => (
                <BarbershopCard key={barbershop.id} barbershop={barbershop} />
              ))}
            </div>
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
        <TabsTrigger value="profile" className="text-white data-[state=active]:bg-amber-600">
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

      <TabsContent value="profile">
        <BarberProfile />
      </TabsContent>
    </Tabs>
  );

  const BarbershopCard = ({ barbershop }) => (
    <Card className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 transition-colors cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={barbershop.image} alt={barbershop.name} />
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
          <p className="text-amber-400 font-medium">{barbershop.price_range}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700">
              Reservar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const QuickCutSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Corte Rápido</h2>
        <p className="text-gray-400">Encuentra un barbero disponible ahora mismo</p>
      </div>

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
            disabled={isSearching || !selectedService}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando solicitud...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Buscar Corte Rápido
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const ClientProfile = () => (
    <div className="text-center py-12">
      <Avatar className="w-24 h-24 mx-auto mb-4">
        <AvatarFallback className="text-2xl">{user?.name?.[0] || 'U'}</AvatarFallback>
      </Avatar>
      <h2 className="text-2xl font-bold mb-2 text-white">{user?.name}</h2>
      <p className="text-gray-400 mb-6">{user?.email}</p>
      <div className="space-y-4 max-w-sm mx-auto">
        <Button variant="outline" className="w-full">
          Historial de Cortes
        </Button>
        <Button variant="outline" className="w-full">
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

  const BarberProfile = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4">
          <AvatarFallback className="text-2xl">{user?.name?.[0] || 'B'}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold mb-2 text-white">{user?.name}</h2>
        <p className="text-gray-400 mb-6">{user?.email}</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <Button 
          onClick={() => setShowCreateBarbershop(true)}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear/Editar Mi Barbería
        </Button>
        <Button variant="outline" className="w-full">
          Ver Estadísticas
        </Button>
        <Button variant="outline" className="w-full">
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
                  <DialogContent className="bg-gray-900 border-gray-700">
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
                  <AvatarImage src={selectedBarbershop.image} alt={selectedBarbershop.name} />
                  <AvatarFallback>{selectedBarbershop.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedBarbershop.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-white">{selectedBarbershop.rating || 0} ({selectedBarbershop.reviews_count || 0} reseñas)</span>
                  </div>
                  <p className="text-amber-400 font-medium">{selectedBarbershop.price_range}</p>
                </div>
              </div>
              
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