const GameController = require('../controllers/GameController');

function gameRoutes(deps) {
  return GameController(deps.joinGameService);
}

module.exports = gameRoutes;
