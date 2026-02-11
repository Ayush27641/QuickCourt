const UserRegistrationController = require('../controllers/UserRegistrationController');

function userRegistrationRoutes(deps) {
  return UserRegistrationController(
    deps.userRegistrationService,
    deps.authenticationManager,
    deps.jwtService,
    deps.bCryptPasswordEncoder
  );
}

module.exports = userRegistrationRoutes;
