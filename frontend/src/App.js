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
  Filter
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
  const [userLocation, setUserLocation] = useState({ lat: -33.4489, lng: -70.6693 }); // Santiago, Chile
  const [priceLimit, setPriceLimit] = useState([50000]);
  const [selectedService, setSelectedService] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [availableBarbers, setAvailableBarbers] = useState([]);

  // Sample data for barbershops
  const sampleBarbershops = [
    {
      id: 1,
      name: "Barbería Moderna",
      barber_name: "Carlos Pérez",
      address: "Las Condes, Santiago",
      lat: -33.4260,
      lng: -70.5682,
      rating: 4.8,
      reviews_count: 120,
      price_range: "$8,000 - $15,000",
      services: ["Corte de pelo", "Corte + barba"],
      available: true,
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop&crop=face",
      gallery: [
        "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=300&h=300&fit=crop"
      ]
    },
    {
      id: 2,
      name: "Barbería Elegante",
      barber_name: "Juan Martínez",
      address: "Providencia, Santiago",
      lat: -33.4378,
      lng: -70.6304,
      rating: 4.9,
      reviews_count: 250,
      price_range: "$10,000 - $18,000",
      services: ["Corte de pelo", "Corte + barba"],
      available: true,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face",
      gallery: [
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1621607512214-68297480165e?w=300&h=300&fit=crop"
      ]
    },
    {
      id: 3,
      name: "Barbershop Classic",
      barber_name: "Miguel Rodriguez",
      address: "Ñuñoa, Santiago",
      lat: -33.4569,
      lng: -70.5975,
      rating: 4.7,
      reviews_count: 85,
      price_range: "$6,000 - $12,000",
      services: ["Corte de pelo", "Corte + barba"],
      available: false,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=face",
      gallery: [
        "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&h=300&fit=crop"
      ]
    }
  ];

  useEffect(() => {
    setBarbershops(sampleBarbershops);
    initializeMap();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.log('Error getting location:', error);
          // Keep Santiago as default
        }
      );
    }
  };

  const initializeMap = async () => {
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

      // Add markers for barbershops
      sampleBarbershops.forEach(barbershop => {
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

  const handleQuickSearch = () => {
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      const availableOptions = sampleBarbershops.filter(shop => 
        shop.available && 
        parseInt(shop.price_range.split(' - ')[0].replace('$', '').replace(',', '')) <= priceLimit[0]
      );
      setAvailableBarbers(availableOptions);
      setIsSearching(false);
    }, 2000);
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email, password
      });
      setUser(response.data.user);
      setShowLogin(false);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (userData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
      setUser(response.data.user);
      setShowRegister(false);
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button 
          onClick={() => handleLogin(email, password)}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          Iniciar Sesión
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
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          Registrarse
        </Button>
      </div>
    );
  };

  const BarbershopCard = ({ barbershop }) => (
    <Card className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 transition-colors cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={barbershop.image} alt={barbershop.barber_name} />
              <AvatarFallback>{barbershop.barber_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{barbershop.name}</CardTitle>
              <p className="text-amber-400 text-sm">{barbershop.barber_name}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm">{barbershop.rating} ({barbershop.reviews_count})</span>
              </div>
            </div>
          </div>
          {barbershop.available ? (
            <Badge className="bg-green-600">Disponible</Badge>
          ) : (
            <Badge variant="secondary">Ocupado</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-gray-300 text-sm flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {barbershop.address}
          </p>
          <p className="text-amber-400 font-medium">{barbershop.price_range}</p>
          <div className="flex gap-2">
            {barbershop.services.map((service, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {service}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700">
              Reservar
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              Ver Perfil
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
                <SelectItem value="corte">Corte de pelo</SelectItem>
                <SelectItem value="corte_barba">Corte + barba</SelectItem>
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
                Buscando barberos...
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

      {availableBarbers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Barberos Disponibles</h3>
          <div className="space-y-3">
            {availableBarbers.map(barber => (
              <BarbershopCard key={barber.id} barbershop={barber} />
            ))}
          </div>
        </div>
      )}
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
                <span className="text-sm">{user.name}</span>
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

      {/* Main Content */}
      <main className="p-4">
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
                <h3 className="text-lg font-semibold mb-3">Barberías Cercanas</h3>
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
            <div className="text-center py-12">
              {user ? (
                <div>
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarFallback className="text-2xl">{user.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
                  <p className="text-gray-400 mb-6">{user.email}</p>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full">
                      Historial de Cortes
                    </Button>
                    <Button variant="outline" className="w-full">
                      Configuración
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                      onClick={() => setUser(null)}
                    >
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <User className="w-24 h-24 mx-auto mb-4 text-gray-400" />
                  <h2 className="text-2xl font-bold mb-2">Inicia Sesión</h2>
                  <p className="text-gray-400 mb-6">Para acceder a tu perfil y historial</p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setShowLogin(true)}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      Iniciar Sesión
                    </Button>
                    <Button 
                      onClick={() => setShowRegister(true)}
                      variant="outline" 
                      className="w-full"
                    >
                      Crear Cuenta
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
                  <AvatarImage src={selectedBarbershop.image} alt={selectedBarbershop.barber_name} />
                  <AvatarFallback>{selectedBarbershop.barber_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedBarbershop.barber_name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-white">{selectedBarbershop.rating} ({selectedBarbershop.reviews_count} reseñas)</span>
                  </div>
                  <p className="text-amber-400 font-medium">{selectedBarbershop.price_range}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedBarbershop.gallery.map((image, index) => (
                  <img 
                    key={index}
                    src={image}
                    alt={`Trabajo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
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