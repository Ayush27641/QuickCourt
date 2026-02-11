const OllamaController = require('../controllers/OllamaController');

function ollamaRoutes(deps) {
  return OllamaController(deps.ollamaService);
}

module.exports = ollamaRoutes;
