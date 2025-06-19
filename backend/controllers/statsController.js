// cortate/backend/controllers/statsController.js

const Barber = require('../models/Barber');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const getDashboardStats = async (req, res) => {
	try {
		const totalBarberos = await Barber.countDocuments();
		const totalReservas = await Booking.countDocuments();
		const totalResenas = await Review.countDocuments();

		const ingresosTotales = await Barber.aggregate([
			{
				$group: {
					_id: null,
					total: { $sum: '$ingresosTotales' }
				}
			}
		]);

		res.status(200).json({
			barberos: totalBarberos,
			reservas: totalReservas,
			resenas: totalResenas,
			ingresos: ingresosTotales[0]?.total || 0
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: 'Error al obtener estadísticas globales.' });
	}
};

module.exports = {
	getDashboardStats
};
