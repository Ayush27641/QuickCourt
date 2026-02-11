const express = require('express');

/**
 * Java equivalent: BookingController
 * Base mapping: /api/bookings
 *
 * This controller is written as a factory so you can inject dependencies
 * (same idea as the Java constructor injection).
 */
function BookingController(bookingService, earningsRepository) {
  const router = express.Router();

  async function create(req, res, next) {
    try {
      const request = req.body;
      const result = await bookingService.createBooking(request);
      return res.status(200).json(result);
    } catch (err) {
      // Surface 409 Conflict for overlapping slot errors
      if (err.status === 409) {
        return res.status(409).json({ message: err.message });
      }
      return next(err);
    }
  }

  async function getBookedSlots(req, res, next) {
    try {
      const venueId = req.query.venueId != null ? Number(req.query.venueId) : undefined;
      const sportId = req.query.sportId != null ? Number(req.query.sportId) : undefined;
      const result = await bookingService.getBookedSlotsForVenueSport(venueId, sportId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function getByOwner(req, res, next) {
    try {
      const ownerEmail = req.query.ownerEmail;
      const result = await bookingService.getBookingsByOwner(ownerEmail);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function get(req, res, next) {
    try {
      const id = req.params.id;
      const result = await bookingService.getBookingsByUser(id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function getMonthlyTrends(req, res, next) {
    try {
      const ownerEmail = req.query.ownerEmail;
      const result = await bookingService.getMonthlyTrends(ownerEmail);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function getMonthlyTrendsofAmonth(req, res, next) {
    try {
      const ownerEmail = req.query.ownerEmail;
      const result = await bookingService.getMonthlyTrendsofAmonth(ownerEmail);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function getBookingByDates(req, res, next) {
    try {
      const ownerEmail = req.query.ownerEmail;
      const result = await bookingService.getBookingByDate(ownerEmail);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function cancelBooking(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const result = await bookingService.cancelBooking(id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function confirmBooking(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const result = await bookingService.confirmBooking(id);
      return res.status(200).json(result);
    } catch (err) {
      if (err.status === 404 || err.status === 400) {
        return res.status(err.status).json({ message: err.message });
      }
      return next(err);
    }
  }

  async function releaseBooking(req, res, next) {
    try {
      const id = req.params.id != null ? Number(req.params.id) : undefined;
      const result = await bookingService.releaseBooking(id);
      return res.status(200).json({ released: result });
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ message: err.message });
      }
      return next(err);
    }
  }

  // Mirrors the Spring annotations exactly (same endpoints)
  router.post('/api/bookings', create);
  router.get('/api/bookings/slots', getBookedSlots);
  router.get('/api/bookings/getByOwner', getByOwner);
  router.get('/api/bookings/user/:id', get);
  router.get('/api/bookings/monthlyTrends', getMonthlyTrends);
  router.get('/api/bookings/monthlyTrendsofAMonth', getMonthlyTrendsofAmonth);
  router.get('/api/bookings/getBookingByDates', getBookingByDates);
  router.put('/api/bookings/:id/confirm', confirmBooking);
  router.delete('/api/bookings/:id/release', releaseBooking);
  router.post('/api/bookings/:id/release', releaseBooking);   // POST alias for navigator.sendBeacon
  router.delete('/api/bookings/cancelBooking/:id', cancelBooking);

  // Keep parity with Java constructor fields (even if unused here)
  void earningsRepository;

  return router;
}

module.exports = BookingController;
