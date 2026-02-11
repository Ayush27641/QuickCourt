const express = require('express');

/**
 * Java equivalent: UserGameProfileController
 * Base mapping: /api/user-profiles
 */
function UserGameProfileController(service) {
  const router = express.Router();

  async function createProfile(req, res, next) {
    try {
      const email = req.params.email;
      const created = await service.createUserProfileIfNotExist(email);
      const userEmail = created?.userEmail ?? created?.getUserEmail?.();
      res.set('Location', `/api/user-profiles/${userEmail}`);
      return res.status(201).json(created);
    } catch (err) {
      return next(err);
    }
  }

  async function getProfile(req, res, next) {
    try {
      const email = req.params.email;
      const maybe = await service.getUserProfile(email);
      if (maybe != null) return res.status(200).json(maybe);
      return res.sendStatus(404);
    } catch (err) {
      return next(err);
    }
  }

  async function getJoinedIds(req, res, next) {
    try {
      const email = req.params.email;
      const result = await service.getJoinedGameIdsForUser(email);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotations exactly
  router.post('/api/user-profiles/:email', createProfile);
  router.get('/api/user-profiles/:email', getProfile);
  router.get('/api/user-profiles/:email/game-ids', getJoinedIds);

  return router;
}

module.exports = UserGameProfileController;
