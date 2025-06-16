# 🚀 Córtate.cl - Frontend

Frontend de la plataforma líder en Chile para conectar hombres con barberos profesionales.

## 📋 Características

- ⚛️ **React 18** con hooks modernos
- 🎨 **Tailwind CSS** para estilos
- 🗺️ **Google Maps** integrado
- 📱 **Responsive Design** 
- 🔐 **Autenticación JWT**
- 💳 **Simulador de pagos**
- 📞 **Integración WhatsApp**
- ⭐ **Sistema de reseñas**
- 🔍 **Búsqueda y filtros avanzados**

## 🛠️ Tecnologías

- React 18
- React Router v6
- Tailwind CSS
- Axios
- Lucide React (iconos)
- Google Maps API
- Context API para estado global

## 🚀 Instalación y configuración

### Prerrequisitos

- Node.js 16.0.0 o superior
- npm 8.0.0 o superior

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tuusuario/cortate-frontend.git
cd cortate-frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key
REACT_APP_FRONTEND_URL=http://localhost:3000
```

4. **Iniciar en modo desarrollo**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 🌐 Scripts disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Construye la app para producción
- `npm test` - Ejecuta las pruebas
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código

## 📦 Despliegue en Render

### Configuración automática

1. **Conectar repositorio en Render**
   - Ve a [render.com](https://render.com)
   - Conecta tu repositorio de GitHub
   - Selecciona "Static Site"

2. **Configuración de build**
   ```
   Build Command: npm install && npm run build
   Publish Directory: build
   ```

3. **Variables de entorno en Render**
   ```
   REACT_APP_API_URL=https://tu-backend.onrender.com/api
   REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key
   REACT_APP_FRONTEND_URL=https://tu-frontend.onrender.com
   ```

### Configuración manual

1. **Crear archivo `render.yaml`** (opcional)
```yaml
services:
  - type: web
    name: cortate-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./build
    envVars:
      - key: REACT_APP_API_URL
        value: https://tu-backend.onrender.com/api
```

## 📁 Estructura del proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── common/         # Componentes comunes
│   ├── barbers/        # Componentes de barberos
│   ├── bookings/       # Componentes de reservas
│   ├── maps/           # Componentes de mapas
│   └── reviews/        # Componentes de reseñas
├── context/            # Context de React
├── pages/              # Páginas principales
├── services/           # Servicios de API
├── utils/              # Utilidades y helpers
└── styles/             # Estilos CSS
```

## 🔧 Configuración de Google Maps

1. **Obtener API Key**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita las APIs: Maps JavaScript API, Places API, Geocoding API
   - Crea credenciales (API Key)

2. **Configurar restricciones**
   - Restringe por dominio para producción
   - Restringe por IP para desarrollo local

3. **Agregar al .env**
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
   ```

## 🎨 Personalización de estilos

El proyecto usa Tailwind CSS. Para personalizar:

1. **Colores del tema** en `tailwind.config.js`
2. **Estilos globales** en `src/styles/index.css`
3. **Componentes** usando clases de Tailwind

## 🔐 Autenticación

El sistema de autenticación incluye:

- Login/registro diferenciado (cliente/barbero)
- JWT tokens
- Rutas protegidas
- Persistencia de sesión
- Refresh automático de tokens

## 📱 Funcionalidades principales

### Para Clientes
- Buscar barberos en mapa
- Filtrar por precio, calificación, distancia
- Reservar cortes
- Ver historial de reservas
- Dejar reseñas
- Gestionar favoritos

### Para Barberos
- Dashboard con estadísticas
- Gestionar perfil y servicios
- Ver reservas pendientes
- Responder reseñas
- Configurar disponibilidad

## 🐛 Solución de problemas

### Error: Cannot read package.json
```bash
# Asegúrate de estar en la carpeta correcta
cd frontend
npm install
```

### Error: Google Maps no carga
- Verifica que tengas la API key configurada
- Verifica que las APIs estén habilitadas en Google Cloud
- Revisa las restricciones de dominio

### Error de CORS
- Verifica que el backend esté configurado para aceptar requests del frontend
- Asegúrate de que las URLs sean correctas

### Build falla en Render
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de build en Render
- Asegúrate de que el comando de build sea correcto

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de consola del navegador
2. Verifica las variables de entorno
3. Asegúrate de que el backend esté ejecutándose
4. Revisa la documentación de las APIs utilizadas

## 🚀 Próximas funcionalidades

- [ ] Chat en tiempo real
- [ ] Notificaciones push
- [ ] App móvil con React Native
- [ ] Pagos reales con Transbank
- [ ] Sistema de promociones
- [ ] Analytics avanzado

## 📄 Licencia

Este proyecto es privado y propietario de Córtate.cl

---

**¿Necesitas ayuda?** Contacta al equipo de desarrollo.
