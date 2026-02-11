const express = require('express');

/**
 * Java equivalent: VenueController
 * Base mapping: /api/venues
 */
function VenueController(venueService) {
  const router = express.Router();

  async function createVenue(req, res, next) {
    try {
      const venue = req.body;
      const ownerEmail = req.query.ownerEmail;

      const created = await venueService.createVenueForOwner(venue, ownerEmail);
      return res.status(200).json(created);
    } catch (err) {
      return next(err);
    }
  }

  async function getVenue(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const maybe = await venueService.getVenue(id);

      if (maybe != null) return res.status(200).json(maybe);
      return res.sendStatus(404);
    } catch (err) {
      return next(err);
    }
  }

  async function getAllVenue(req, res, next) {
    try {
      const result = await venueService.getAllVenue();
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function getAllVenues(req, res, next) {
    try {
      const ownerEmail = req.params.ownerEmail;
      const result = await venueService.getVenuesByOwnerEmail(ownerEmail);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function deleteVenue(req, res, next) {
    try {
      const email = req.params.email;
      const id = req.params.id != null ? Number(req.params.id) : undefined;

      await venueService.deleteVenueByRemovingFromOwner(email, id);
      return res.sendStatus(204);
    } catch (err) {
      return next(err);
    }
  }

  async function updateVenue(req, res, next) {
    try {
      const venueId = req.params.venueId != null ? Number(req.params.venueId) : undefined;
      const reqBody = req.body;

      const updated = await venueService.updateVenue(venueId, reqBody);
      if (updated != null) return res.status(200).json(updated);
      return res.sendStatus(404);
    } catch (err) {
      return next(err);
    }
  }

  async function verifyVenue(req, res, next) {
    try {
      const venueId = req.params.venueId != null ? Number(req.params.venueId) : undefined;
      const result = await venueService.verify(venueId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotations exactly
  router.post('/api/venues', createVenue);
  router.get('/api/venues/:id', getVenue);
  router.get('/api/venues', getAllVenue);
  router.get('/api/venues/allVenues/:ownerEmail', getAllVenues);
  router.delete('/api/venues/owners/:email/venues/:id', deleteVenue);
  router.put('/api/venues/:venueId', updateVenue);
  router.put('/api/venues/verify/:venueId', verifyVenue);

  return router;
}

module.exports = VenueController;
