const SportController = require('../controllers/SportController');

function sportRoutes(deps) {
  return SportController(deps.sportService);
}

module.exports = sportRoutes;
