function RoomService(roomRepository) {
  async function findByRoomId(roomId) {
    return await roomRepository.findByRoomId(roomId);
  }

  async function createRoom(roomId, user1, user2) {
    const room = {};
    room.roomId = roomId;
    room.user1 = user1;
    room.user2 = user2;
    await roomRepository.save(room);
  }

  async function getMessagesByRoomId(roomId) {
    const room = await roomRepository.findByRoomId(roomId);
    return room?.messages ?? room?.getMessages?.();
  }

  async function getRoomIdByUser1AndUser2(User1, User2) {
    let room = await roomRepository.findRoomIdByUser1AndUser2(User1, User2);
    if (room == null) {
      room = await roomRepository.findRoomIdByUser1AndUser2(User2, User1);
    }
    if (room == null) return null;
    return room.roomId ?? room.getRoomId?.();
  }

  async function save(room) {
    await roomRepository.save(room);
  }

  return {
    findByRoomId,
    createRoom,
    getMessagesByRoomId,
    getRoomIdByUser1AndUser2,
    save,
  };
}

module.exports = RoomService;
