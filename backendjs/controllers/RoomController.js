const express = require('express');
const crypto = require('crypto');

/**
 * Java equivalent: RoomController
 * Base mapping: /rooms
 */
function RoomController(roomService) {
  const router = express.Router();

  async function generateRoomId() {
    let s = '0000000000000000';

    // Keep identical semantics: keep generating until unique
    // NOTE: roomService.findByRoomId is async in JS.
    while ((await roomService.findByRoomId(String(s))) != null) {
      const chars = [];
      for (let i = 0; i < 16; i++) {
        // Java: (rand.nextInt(94) + 33) => ASCII 33..126
        chars.push(String.fromCharCode(crypto.randomInt(33, 127)));
      }
      s = chars.join('');
    }

    return String(s);
  }

  // CREATING A ROOM
  async function createRoom(req, res, next) {
    try {
      res.set('Access-Control-Allow-Origin', '*');

      const userDTO = req.body;

      const user1 = userDTO?.user1 ?? userDTO?.getUser1?.();
      const user2 = userDTO?.user2 ?? userDTO?.getUser2?.();

      const existingRoomId = await roomService.getRoomIdByUser1AndUser2(user1, user2);
      if (existingRoomId != null) {
        return res.status(200).send('room already exists');
      }

      const s = await generateRoomId();

      console.log('Room id is :' + ' ' + s);
      await roomService.createRoom(String(s), user1, user2);
      return res.sendStatus(200);
    } catch (err) {
      return next(err);
    }
  }

  async function getAllMessages(req, res, next) {
    try {
      res.set('Access-Control-Allow-Origin', '*');

      const roomId = req.params.roomId;
      const room = await roomService.findByRoomId(roomId);

      if (room == null) {
        return res.status(200).json([]);
      }

      const messages = room.messages ?? room.getMessages?.();
      return res.status(200).json(messages);
    } catch (err) {
      return next(err);
    }
  }

  async function getRoomIdByUser1AndUser2(req, res, next) {
    try {
      res.set('Access-Control-Allow-Origin', '*');

      const userDTO = req.body;
      const user1 = userDTO?.user1 ?? userDTO?.getUser1?.();
      const user2 = userDTO?.user2 ?? userDTO?.getUser2?.();

      const roomId = await roomService.getRoomIdByUser1AndUser2(user1, user2);
      if (roomId != null) return res.status(200).json(roomId);

      return res.status(200).send('room not present');
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotations exactly
  router.post('/rooms', createRoom);
  router.get('/rooms/message/:roomId', getAllMessages);
  router.post('/rooms/getRoomId', getRoomIdByUser1AndUser2);

  return router;
}

module.exports = RoomController;
