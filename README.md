# 🔸 CÓRTATE.CL - Backend API

## 📋 Descripción

Backend robusto para **Córtate.cl**, la plataforma de reservas de cortes de pelo más completa de Chile. Sistema tipo Uber/Rappi especializado en conectar clientes con barberos profesionales, ofreciendo servicios tanto a domicilio como en local.

## 🌟 Características Principales

### 🎯 **Sistema de Usuarios**
- Registro y autenticación JWT segura
- Roles diferenciados: Cliente, Barbero, Admin
- Perfiles completos con verificación de email
- Sistema de favoritos y preferencias

### 💼 **Gestión de Barberos**
- Perfiles profesionales completos
- Galería de trabajos realizados
- Servicios y precios personalizables
- Dashboard con métricas y analytics
- Sistema de disponibilidad en tiempo real
- Penalizaciones automáticas por incumplimientos

### 📅 **Sistema de Reservas**
- Reservas programadas y express
- Confirmación automática por WhatsApp
- Gestión de cancelaciones y reprogramaciones
- Simulación de pagos integrada
- Historial completo de servicios

### ⭐ **Reseñas y Calificaciones**
- Sistema de reseñas con fotos
- Calificaciones por aspectos específicos
- Respuestas de barberos
- Moderación automática y manual
- Reseñas destacadas

### 🗺️ **Integración Google Places**
- Búsqueda de barberías cercanas
- Mapas interactivos con filtros
- Reclamación de lugares de Google
- Reseñas combinadas (internas + Google)

### ⚠️ **Sistema de Penalizaciones**
- Penalizaciones automáticas por no-show
- Cálculo inteligente basado en historial
- Sistema de apelaciones
- Escalamiento por reincidencia

## 🛠️ Tecnologías Utilizadas

### **Core**
- **Node.js** v16+ - Runtime de JavaScript
- **Express.js** - Framework web minimalista
- **MongoDB Atlas** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB

### **Seguridad**
- **JWT** - Autenticación y autorización
- **bcryptjs** - Hasheo de contraseñas
- **Helmet** - Headers de seguridad
- **express-rate-limit** - Limitación de requests
- **express-mongo-sanitize** - Prevención de NoSQL injection

### **Utilidades**
- **Multer + Sharp** - Manejo y procesamiento de imágenes
- **Axios** - Cliente HTTP para Google Places API
- **Moment.js** - Manejo de fechas y horarios
- **Nodemailer** - Envío de emails
- **Winston** - Sistema de logging

### **Desarrollo**
- **Nodemon** - Recarga automática en desarrollo
- **Jest + Supertest** - Testing
- **ESLint + Prettier** - Linting y formateo
- **Swagger** - Documentación de API

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js v16 o superior
- npm v8 o superior
- Cuenta de MongoDB Atlas
- API Key de Google Places

### **1. Clonar el repositorio**
```bash
git clone https://github.com/cortate-cl/backend.git
cd backend
```

### **2. Instalar dependencias**
```bash
npm install
```

### **3. Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Base de datos
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/cortate_cl

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# Google Places API
GOOGLE_PLACES_API_KEY=tu_google_places_api_key

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### **4. Ejecutar en desarrollo**
```bash
npm run dev
```

### **5. Ejecutar tests**
```bash
npm test
```

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   ├── database.js          # Configuración MongoDB
│   └── config.js            # Configuraciones generales
├── controllers/
│   ├── authController.js    # Autenticación y usuarios
│   ├── barberController.js  # Gestión de barberos
│   ├── bookingController.js # Sistema de reservas
│   ├── reviewController.js  # Reseñas y calificaciones
│   ├── penaltyController.js # Sistema de penalizaciones
│   └── googlePlacesController.js # Integración Google Places
├── middleware/
│   ├── auth.js             # Autenticación JWT
│   ├── validateBarber.js   # Validaciones barberos
│   ├── uploadMiddleware.js # Manejo de archivos
│   └── errorHandler.js     # Manejo de errores
├── models/
│   ├── User.js             # Modelo de usuario
│   ├── Barber.js           # Modelo de barbero
│   ├── Booking.js          # Modelo de reserva
│   ├── Review.js           # Modelo de reseña
│   ├── Penalty.js          # Modelo de penalización
│   └── GooglePlace.js      # Modelo de lugar Google
├── routes/
│   ├── auth.js             # Rutas de autenticación
│   ├── barbers.js          # Rutas de barberos
│   ├── bookings.js         # Rutas de reservas
│   ├── reviews.js          # Rutas de reseñas
│   ├── penalties.js        # Rutas de penalizaciones
│   └── places.js           # Rutas de Google Places
├── utils/
│   ├── googlePlaces.js     # Utilidades Google Places API
│   ├── whatsappFormatter.js # Formateo mensajes WhatsApp
│   ├── penaltyCalculator.js # Cálculo de penalizaciones
│   ├── timeUtils.js        # Utilidades de tiempo
│   └── validators.js       # Validadores generales
├── uploads/                # Archivos subidos
├── logs/                   # Logs del sistema
├── .env.example           # Variables de entorno ejemplo
├── server.js              # Punto de entrada
└── package.json           # Dependencias y scripts
```

## 🔌 API Endpoints

### **Autenticación**
```
POST   /api/auth/register/client    # Registro cliente
POST   /api/auth/register/barber    # Registro barbero
POST   /api/auth/login              # Iniciar sesión
POST   /api/auth/logout             # Cerrar sesión
GET    /api/auth/profile            # Obtener perfil
PUT    /api/auth/profile            # Actualizar perfil
```

### **Barberos**
```
GET    /api/barbers                 # Listar barberos
GET    /api/barbers/nearby          # Barberos cercanos
GET    /api/barbers/:id             # Perfil de barbero
PUT    /api/barbers/me/profile      # Actualizar perfil barbero
PUT    /api/barbers/me/services     # Actualizar servicios
PUT    /api/barbers/me/availability # Actualizar disponibilidad
```

### **Reservas**
```
POST   /api/bookings               # Crear reserva
GET    /api/bookings/me            # Mis reservas (cliente)
GET    /api/bookings/barber/me     # Mis reservas (barbero)
PUT    /api/bookings/:id/accept    # Aceptar reserva
PUT    /api/bookings/:id/complete  # Completar servicio
PUT    /api/bookings/:id/cancel    # Cancelar reserva
```

### **Reseñas**
```
POST   /api/reviews                # Crear reseña
GET    /api/reviews/barber/:id     # Reseñas de barbero
PUT    /api/reviews/:id            # Editar reseña
POST   /api/reviews/:id/respond    # Responder reseña (barbero)
DELETE /api/reviews/:id            # Eliminar reseña
```

### **Google Places**
```
GET    /api/places/search          # Buscar lugares cercanos
GET    /api/places/:id/details     # Detalles de lugar
POST   /api/places/:id/claim       # Reclamar lugar
```

## 📊 Modelos de Datos

### **Usuario**
```javascript
{
  email: String,
  password: String,
  role: ['client', 'barber', 'admin'],
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String,
    dateOfBirth: Date
  },
  preferences: {
    serviceType: String,
    maxDistance: Number,
    priceRange: Object
  },
  favorites: [ObjectId],
  stats: {
    totalBookings: Number,
    totalReviews: Number,
    averageRatingGiven: Number
  }
}
```

### **Barbero**
```javascript
{
  userId: ObjectId,
  businessName: String,
  description: String,
  services: {
    corteHombre: { price: Number, duration: Number },
    corteBarba: { price: Number, duration: Number }
  },
  location: {
    address: String,
    coordinates: [Number, Number],
    city: String
  },
  availability: {
    0: { isOpen: Boolean, openTime: String, closeTime: String }
  },
  stats: {
    rating: Number,
    totalReviews: Number,
    totalBookings: Number,
    completionRate: Number,
    reliabilityScore: Number
  },
  profile: {
    avatar: String,
    gallery: [String],
    specialties: [String],
    experience: Number,
    contact: {
      whatsapp: String,
      instagram: String
    }
  }
}
```

### **Reserva**
```javascript
{
  bookingNumber: String,
  clientId: ObjectId,
  barberId: ObjectId,
  service: {
    type: String,
    duration: Number,
    price: Number
  },
  scheduledFor: Date,
  location: {
    type: ['local', 'home'],
    address: String,
    coordinates: [Number, Number]
  },
  status: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
  payment: {
    amount: Number,
    method: String,
    status: String
  },
  notes: String,
  createdAt: Date
}
```

## 🔧 Configuración de Producción

### **Variables de Entorno Producción**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secret_production_muy_seguro
GOOGLE_PLACES_API_KEY=...
FRONTEND_URL=https://cortate.cl
```

### **Deploy en Render.com**

1. **Conectar repositorio** en Render.com
2. **Configurar build command**: `npm install`
3. **Configurar start command**: `npm start`
4. **Agregar variables de entorno** en el dashboard
5. **Deploy automático** desde rama `main`

### **Configuración de MongoDB Atlas**

1. **Crear cluster** en MongoDB Atlas
2. **Configurar IP whitelist** (0.0.0.0/0 para producción)
3. **Crear usuario** con permisos de lectura/escritura
4. **Obtener connection string** para `MONGODB_URI`

## 📈 Monitoreo y Logs

### **Sistema de Logging**
```javascript
// Configuración Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

### **Métricas Importantes**
- Tiempo de respuesta promedio
- Tasa de reservas completadas
- Errores 4xx y 5xx
- Uso de API Google Places
- Penalizaciones aplicadas

## 🧪 Testing

### **Ejecutar Tests**
```bash
# Todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage
npm test -- --coverage
```

### **Estructura de Tests**
```
__tests__/
├── auth.test.js          # Tests de autenticación
├── barbers.test.js       # Tests de barberos
├── bookings.test.js      # Tests de reservas
├── reviews.test.js       # Tests de reseñas
└── utils.test.js         # Tests de utilidades
```

## 🛡️ Seguridad

### **Medidas Implementadas**
- **Rate Limiting** - 100 requests/15min por IP
- **CORS** configurado para dominios específicos
- **Helmet** para headers de seguridad
- **Sanitización** de inputs MongoDB
- **Validación** estricta de datos
- **JWT** con expiración automática
- **Bcrypt** para hasheo de contraseñas

### **Headers de Seguridad**
```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
```

## 📚 Documentación API

### **Swagger UI**
La documentación interactiva está disponible en:
```
http://localhost:5000/api-docs
```

### **Generar Documentación**
```bash
npm run docs
```

## 🔄 Scripts Disponibles

```bash
npm start          # Ejecutar en producción
npm run dev        # Ejecutar en desarrollo
npm test           # Ejecutar tests
npm run lint       # Verificar código
npm run lint:fix   # Corregir errores de linting
npm run format     # Formatear código
npm run seed       # Poblar base de datos
npm run backup     # Backup de base de datos
npm run docs       # Generar documentación
```

## 🤝 Contribución

### **Flujo de Desarrollo**
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### **Estándares de Código**
- **ESLint** configurado con Airbnb style guide
- **Prettier** para formateo automático
- **Conventional Commits** para mensajes
- **Husky** para pre-commit hooks

## 📞 Soporte

### **Contacto**
- **Email**: dev@cortate.cl
- **GitHub Issues**: [Reportar bug](https://github.com/cortate-cl/backend/issues)
- **Documentación**: [Wiki](https://github.com/cortate-cl/backend/wiki)

### **FAQ**

**Q: ¿Cómo resetear la base de datos?**
A: Ejecutar `npm run seed -- --reset`

**Q: ¿Cómo configurar Google Places API?**
A: Obtener API key en Google Cloud Console y agregarla a `.env`

**Q: ¿Error de conexión a MongoDB?**
A: Verificar `MONGODB_URI` y whitelist de IPs en Atlas

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🔮 Roadmap

### **v1.1 - Próximamente**
- [ ] Chat en tiempo real
- [ ] Push notifications
- [ ] Integración con Transbank
- [ ] Analytics avanzados
- [ ] API para mobile app

### **v1.2 - Futuro**
- [ ] Inteligencia artificial para recomendaciones
- [ ] Sistema de fidelización
- [ ] Marketplace de productos
- [ ] Multi-idioma

---

**Desarrollado con ❤️ para la comunidad chilena de barberos y clientes que buscan el mejor servicio.**

**🔸 Córtate.cl - Tu corte perfecto, a un clic de distancia**
