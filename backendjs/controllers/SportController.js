const express = require('express');

/**
 * Java equivalent: SportController
 * Base mapping: /api/sports
 */
function SportController(sportService) {
  const router = express.Router();

  async function addSport(req, res, next) {
    try {
      const venueId = req.params.venueId != null ? Number(req.params.venueId) : undefined;
      const sport = req.body;

      const saved = await sportService.addSportToVenue(venueId, sport);
      return res.status(200).json(saved);
    } catch (err) {
      return next(err);
    }
  }

  async function listByVenue(req, res, next) {
    try {
      const venueId = req.params.venueId != null ? Number(req.params.venueId) : undefined;
      const result = await sportService.getSportsForVenue(venueId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function deleteSport(req, res, next) {
    try {
      const venueId = req.params.venueId != null ? Number(req.params.venueId) : undefined;
      const sportId = req.params.sportId != null ? Number(req.params.sportId) : undefined;
      const ownerEmail = req.query.ownerEmail;

      await sportService.deleteSport(venueId, sportId, ownerEmail);
      return res.sendStatus(204); // always 204
    } catch (err) {
      return next(err);
    }
  }

  async function updateSport(req, res, next) {
    try {
      const sportId = req.params.sportId != null ? Number(req.params.sportId) : undefined;
      const reqBody = req.body;

      const updated = await sportService.updateSport(sportId, reqBody);
      if (updated != null) return res.status(200).json(updated);
      return res.sendStatus(404);
    } catch (err) {
      return next(err);
    }
  }

  async function getSport(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const result = await sportService.getSport(id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotations exactly
  router.post('/api/sports/venue/:venueId', addSport);
  router.get('/api/sports/venue/:venueId', listByVenue);
  router.delete('/api/sports/:sportId/venue/:venueId', deleteSport);
  router.put('/api/sports/:sportId/venue', updateSport);
  router.get('/api/sports/:id', getSport);

  return router;
}

module.exports = SportController;
