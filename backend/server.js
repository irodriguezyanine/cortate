// ====================================================================
// ======================> INICIO DE LA CORRECCIÓN <=====================
// ====================================================================

const path = require('path'); // ¡Línea 1 que faltaba! Para usar path.join
const fs = require('fs');     // ¡Línea 2 que faltaba! Para usar fs.existsSync

// ====================================================================
// ======================> FIN DE LA CORRECCIÓN <======================
// ====================================================================

// (Aquí iría el resto de tus importaciones y configuraciones de Express)
// Ejemplo:
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ... tus rutas de API ...
// const authRoutes = require('./routes/auth');

const app = express();

// ... tus middlewares (app.use(cors()), app.use(express.json()), etc.) ...

// ... tus rutas de API (app.use('/api/auth', authRoutes), etc.) ...


// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
    // Servir archivos estáticos del frontend build
    const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
    
    // Verificar que el directorio existe
    if (fs.existsSync(frontendPath)) {
        app.use(express.static(frontendPath));
        
        console.log('📦 Sirviendo frontend desde:', frontendPath);
        
        // Manejar todas las rutas del frontend (React Router)
        app.get('*', (req, res, next) => {
            // Si la ruta empieza con /api, /uploads o /health, continuar con las rutas del backend
            if (req.path.startsWith('/api') || 
                req.path.startsWith('/uploads') || 
                req.path === '/health') {
                return next();
            }
            
            // Para cualquier otra ruta, servir el index.html del frontend
            const indexPath = path.join(frontendPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).send('Frontend no encontrado. Por favor construye el proyecto.');
            }
        });
    } else {
        console.warn('⚠️  Frontend build no encontrado en:', frontendPath);
        console.warn('⚠️  Ejecuta "npm run build" en el directorio frontend');
    }
}

// ... El resto de tu archivo, como app.listen() ...
// Ejemplo:
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
