const ChatController = require('../controllers/ChatController');

/**
 * ChatController in Java is WebSocket/STOMP-based, not HTTP.
 * This helper exposes the same mapping strings + handler.
 */
function chatMappings(deps) {
  return ChatController(deps.chatService, deps.roomService);
}

module.exports = chatMappings;
