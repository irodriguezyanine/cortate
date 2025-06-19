// cortate/backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const barberRoutes = require('./routes/barberRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const penaltyRoutes = require('./routes/penaltyRoutes');
const statsRoutes = require('./routes/statsRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión MongoDB
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => console.log('🟢 MongoDB conectado'))
	.catch((err) => console.error('🔴 Error conectando MongoDB:', err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/barberos', barberRoutes);
app.use('/api/reservas', bookingRoutes);
app.use('/api/resenas', reviewRoutes);
app.use('/api/penalizaciones', penaltyRoutes);
app.use('/api/estadisticas', statsRoutes);

// Ruta base
app.get('/', (req, res) => {
	res.send('Servidor de Córtate.cl en funcionamiento 🚀');
});

// Lanzamiento del servidor
app.listen(PORT, () => {
	console.log(`⚙️ Servidor corriendo en http://localhost:${PORT}`);
});
