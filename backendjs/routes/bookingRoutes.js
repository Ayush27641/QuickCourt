const BookingController = require('../controllers/BookingController');

function bookingRoutes(deps) {
  return BookingController(deps.bookingService, deps.earningsRepository);
}

module.exports = bookingRoutes;
