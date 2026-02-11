function RoomRepository(prisma) {
  async function findByRoomId(roomId) {
    if (roomId == null) return null;

    return await prisma.room.findUnique({
      where: { roomId },
      include: { messages: true },
    });
  }

  async function findRoomIdByUser1AndUser2(user1, user2) {
    return await prisma.room.findFirst({
      where: { user1, user2 },
      include: { messages: true },
    });
  }

  async function save(room) {
    const id = room.id ?? room.getId?.();

    const roomId = room.roomId ?? room.getRoomId?.();

    const data = {
      roomId,
      user1: room.user1 ?? room.getUser1?.() ?? null,
      user2: room.user2 ?? room.getUser2?.() ?? null,
    };

    // Persist room
    const savedRoom = id == null
      ? await prisma.room.upsert({ where: { roomId }, create: data, update: data })
      : await prisma.room.update({ where: { id: Number(id) }, data });

    // Replace messages element-collection
    const msgs = room.messages ?? room.getMessages?.() ?? [];
    await prisma.message.deleteMany({ where: { roomDbId: savedRoom.id } });

    for (const m of msgs) {
      if (m == null) continue;
      await prisma.message.create({
        data: {
          roomDbId: savedRoom.id,
          sender: m.sender ?? m.getSender?.() ?? null,
          content: m.content ?? m.getContent?.() ?? null,
          timeStamp: new Date(m.timeStamp ?? m.getTimeStamp?.() ?? new Date()),
        },
      });
    }

    return await findByRoomId(savedRoom.roomId);
  }

  return { findByRoomId, findRoomIdByUser1AndUser2, save };
}

module.exports = RoomRepository;
