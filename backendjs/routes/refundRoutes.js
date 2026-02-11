const RefundController = require('../controllers/RefundController');

function refundRoutes(deps) {
  return RefundController(deps.refundService);
}

module.exports = refundRoutes;
