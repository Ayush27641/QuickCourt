const RoomController = require('../controllers/RoomController');

function roomRoutes(deps) {
  return RoomController(deps.roomService);
}

module.exports = roomRoutes;
