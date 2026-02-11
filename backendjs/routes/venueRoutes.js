const VenueController = require('../controllers/VenueController');

function venueRoutes(deps) {
  return VenueController(deps.venueService);
}

module.exports = venueRoutes;
