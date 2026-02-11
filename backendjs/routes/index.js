const express = require('express');

const BookingController = require('../controllers/BookingController');
const FacilityEarningsController = require('../controllers/FacilityEarningsController');
const RoomController = require('../controllers/RoomController');
const ChatController = require('../controllers/ChatController');
const CommentController = require('../controllers/CommentController');
const SportController = require('../controllers/SportController');
const VenueController = require('../controllers/VenueController');
const GameController = require('../controllers/GameController');
const UserGameProfileController = require('../controllers/UserGameProfileController');
const RefundController = require('../controllers/RefundController');
const UserRegistrationController = require('../controllers/UserRegistrationController');
const OllamaController = require('../controllers/OllamaController');

/**
 * Registers all HTTP routes by composing controller routers.
 *
 * Controllers already include the full endpoint paths (e.g. '/api/bookings').
 * So these routers should be mounted at '/'.
 */
function createRoutes(deps) {
  const router = express.Router();

  if (deps?.bookingService) {
    router.use(BookingController(deps.bookingService, deps.earningsRepository));
  }

  if (deps?.facilityEarningsRepository) {
    router.use(FacilityEarningsController(deps.facilityEarningsRepository));
  }

  if (deps?.roomService) {
    router.use(RoomController(deps.roomService));
  }

  if (deps?.commentService) {
    router.use(CommentController(deps.commentService));
  }

  if (deps?.sportService) {
    router.use(SportController(deps.sportService));
  }

  if (deps?.venueService) {
    router.use(VenueController(deps.venueService));
  }

  if (deps?.joinGameService) {
    router.use(GameController(deps.joinGameService));
    router.use(UserGameProfileController(deps.joinGameService));
  }

  if (deps?.refundService) {
    router.use(RefundController(deps.refundService));
  }

  if (
    deps?.userRegistrationService
    && deps?.authenticationManager
    && deps?.jwtService
    && deps?.bCryptPasswordEncoder
  ) {
    router.use(
      UserRegistrationController(
        deps.userRegistrationService,
        deps.authenticationManager,
        deps.jwtService,
        deps.bCryptPasswordEncoder
      )
    );
  }

  if (deps?.ollamaService) {
    router.use(OllamaController(deps.ollamaService));
  }

  return router;
}

/**
 * WebSocket/STOMP mappings from ChatController.
 * This is not an HTTP router; it exposes the same mapping strings
 * so your WS layer can bind it.
 */
function createChatMappings(deps) {
  return ChatController(deps.chatService, deps.roomService);
}

module.exports = {
  createRoutes,
  createChatMappings,
};
