const UserGameProfileController = require('../controllers/UserGameProfileController');

function userGameProfileRoutes(deps) {
  return UserGameProfileController(deps.joinGameService);
}

module.exports = userGameProfileRoutes;
