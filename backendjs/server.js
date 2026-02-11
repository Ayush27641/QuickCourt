const { createApp, getDeps } = require('./app');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`backendjs listening on port ${PORT}`);

  // Auto-cleanup: release expired RESERVED bookings every 60 seconds
  const deps = getDeps();
  if (deps?.bookingService?.cleanupExpiredReservations) {
    const CLEANUP_INTERVAL_MS = 60 * 1000;   // every 60 s
    const RESERVATION_TTL_MS  = 5 * 60 * 1000; // 5 min hold

    setInterval(async () => {
      try {
        await deps.bookingService.cleanupExpiredReservations(RESERVATION_TTL_MS);
      } catch (err) {
        console.error('[Reservation Cleanup] Error:', err.message);
      }
    }, CLEANUP_INTERVAL_MS);

    console.log(`[Reservation Cleanup] Running every ${CLEANUP_INTERVAL_MS / 1000}s, TTL = ${RESERVATION_TTL_MS / 1000}s`);
  }
});
