const FacilityEarningsController = require('../controllers/FacilityEarningsController');

function facilityEarningsRoutes(deps) {
  return FacilityEarningsController(deps.facilityEarningsRepository);
}

module.exports = facilityEarningsRoutes;
