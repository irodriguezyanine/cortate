// cortate/backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const barberRoutes = require('./routes/barberRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
})
.then(() => {
	console.log('✅ MongoDB connected');
	// Start server
	const PORT = process.env.PORT || 5000;
	app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
.catch((err) => {
	console.error('❌ MongoDB connection error:', err);
});
