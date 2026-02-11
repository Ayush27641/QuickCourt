const express = require('express');

/**
 * Java equivalent: FacilityEarningsController
 * Base mapping: /api/earnings
 */
function FacilityEarningsController(repo) {
  const router = express.Router();

  async function getMonthlyEarnings(req, res, next) {
    try {
      const email = req.params.email;

      const months = new Array(12).fill(0);

      const maybe = await repo.findById(email);
      if (maybe != null) {
        const monthlyEarnings = maybe.monthlyEarnings || maybe.getMonthlyEarnings?.() || [];
        for (const m of monthlyEarnings) {
          if (m == null) continue;
          const idx = m.month ?? m.getMonth?.();
          if (idx == null) continue;
          if (idx >= 0 && idx < 12) {
            const earning = m.earning ?? m.getEarning?.();
            const value = earning == null ? 0 : earning;
            months[idx] = months[idx] + value;
          }
        }
      }

      return res.status(200).json(months);
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotation exactly
  router.get('/api/earnings/:email/monthly', getMonthlyEarnings);

  return router;
}

module.exports = FacilityEarningsController;
