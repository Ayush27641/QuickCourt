const express = require('express');

/**
 * Java equivalent: GameController
 * Base mapping: /api/games
 */
function GameController(service) {
  const router = express.Router();

  async function create(req, res, next) {
    try {
      const reqBody = req.body;
      const saved = await service.createGame(reqBody);
      res.set('Location', `/api/games/${saved.id ?? saved.getId?.()}`);
      return res.status(201).json(saved);
    } catch (err) {
      return next(err);
    }
  }

  async function all(req, res, next) {
    try {
      const result = await service.getAllGames();
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function getOne(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const maybe = await service.getGame(id);
      if (maybe != null) return res.status(200).json(maybe);
      return res.sendStatus(404);
    } catch (err) {
      return next(err);
    }
  }

  async function update(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const reqBody = req.body;
      const maybe = await service.updateGame(id, reqBody);
      if (maybe != null) return res.status(200).json(maybe);
      return res.sendStatus(404);
    } catch (err) {
      return next(err);
    }
  }

  async function _delete(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const deleted = await service.deleteGame(id);
      return deleted ? res.sendStatus(204) : res.sendStatus(404);
    } catch (err) {
      return next(err);
    }
  }

  // join a game (idempotent)
  async function join(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const userEmail = req.query.userEmail;

      const maybe = await service.joinGame(userEmail, id);
      if (maybe != null) return res.status(200).json(maybe);
      return res.sendStatus(404);
    } catch (err) {
      return next(err);
    }
  }

  // leave a game (idempotent)
  async function leave(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const userEmail = req.query.userEmail;

      const maybe = await service.leaveGame(userEmail, id);
      if (maybe != null) return res.status(200).json(maybe);
      return res.sendStatus(404);
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotations exactly
  router.post('/api/games', create);
  router.get('/api/games', all);
  router.get('/api/games/:id', getOne);
  router.put('/api/games/:id', update);
  router.delete('/api/games/:id', _delete);
  router.post('/api/games/:id/join', join);
  router.post('/api/games/:id/leave', leave);

  return router;
}

module.exports = GameController;
