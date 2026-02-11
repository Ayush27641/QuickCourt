/**
 * Java equivalent: ChatController
 *
 * NOTE: The original Java controller uses Spring WebSocket/STOMP annotations:
 * - @MessageMapping("/sendMessage/{roomId}")
 * - @SendTo("/topic/room/{roomId}")
 *
 * This module keeps the same mapping strings and handler signature.
 */
function ChatController(chatService, roomService) {
  async function sendMessage(messageDTO, roomId) {
    return await chatService.saveMessage(roomId, messageDTO);
  }

  return {
    messageMapping: '/sendMessage/{roomId}',
    sendTo: '/topic/room/{roomId}',
    sendMessage,
    chatService,
    roomService,
  };
}

module.exports = ChatController;
