const express = require('express');

/**
 * Java equivalent: RefundController
 * Base mapping: /api/refunds
 */
function RefundController(refundService) {
  const router = express.Router();

  async function getAllRefunds(req, res, next) {
    try {
      const result = await refundService.getAllRefunds();
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function getPendingRefunds(req, res, next) {
    try {
      const result = await refundService.getRefundsByStatus('pending');
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // changed to request param
  async function getRefundsByOwner(req, res, next) {
    try {
      const ownerMail = req.query.ownerMail;
      const result = await refundService.getRefundsByOwner(ownerMail);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // changed to request param
  async function getRefundsByUser(req, res, next) {
    try {
      const userEmail = req.query.userEmail;
      const result = await refundService.getRefundsByUser(userEmail);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // changed to request param
  async function getById(req, res, next) {
    try {
      const id = req.query.id != null ? Number(req.query.id) : undefined;
      const result = await refundService.getRefundById(id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createRefund(req, res, next) {
    try {
      const refund = req.body;
      const created = await refundService.createRefund(refund);
      return res.status(201).json(created);
    } catch (err) {
      return next(err);
    }
  }

  async function processRefund(req, res, next) {
    try {
      const id = req.query.id != null ? Number(req.query.id) : undefined;
      const processed = await refundService.processRefund(id);
      return res.status(200).json(processed);
    } catch (err) {
      return next(err);
    }
  }

  async function deleteRefund(req, res, next) {
    try {
      const id = req.query.id != null ? Number(req.query.id) : undefined;
      await refundService.deleteRefund(id);
      return res.sendStatus(204);
    } catch (err) {
      return next(err);
    }
  }

  async function getBookingDetailsByRefundId(req, res, next) {
    try {
      const refundId = req.query.refundId != null ? Number(req.query.refundId) : undefined;
      return res.status(200).json(await refundService.getBookingDetailsByRefundId(refundId));
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotations exactly
  router.get('/api/refunds', getAllRefunds);
  router.get('/api/refunds/pending', getPendingRefunds);
  router.get('/api/refunds/owner', getRefundsByOwner);
  router.get('/api/refunds/user', getRefundsByUser);
  router.get('/api/refunds/byId', getById);
  router.post('/api/refunds', createRefund);
  router.post('/api/refunds/process', processRefund);
  router.delete('/api/refunds', deleteRefund);
  router.get('/api/refunds/bookingDetails', getBookingDetailsByRefundId);

  return router;
}

module.exports = RefundController;
