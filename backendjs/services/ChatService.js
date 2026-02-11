function ChatService(roomService) {
  async function saveMessage(roomId, messageDTO) {
    const room = await roomService.findByRoomId(roomId);

    if (room != null) {
      const message = {};
      message.content = messageDTO?.content ?? messageDTO?.getContent?.();
      message.sender = messageDTO?.sender ?? messageDTO?.getSender?.();
      message.timeStamp = new Date();

      const messages = room.messages ?? room.getMessages?.();
      if (Array.isArray(messages)) {
        messages.push(message);
        if (room.setMessages) room.setMessages(messages);
        else room.messages = messages;
      } else {
        room.messages = [message];
      }

      await roomService.save(room);
      return message;
    }

    return null;
  }

  return {
    saveMessage,
  };
}

module.exports = ChatService;
