function BookingService(bookingRepository, earningsRepository, emailService, refundModelService, prisma) {
  function _now() {
    return new Date();
  }

  function _isAfter(a, b) {
    if (a == null || b == null) return false;
    return new Date(a).getTime() > new Date(b).getTime();
  }

  function _monthIndex(dateLike) {
    const d = dateLike != null ? new Date(dateLike) : _now();
    return d.getMonth(); // 0..11
  }

  function _toResponseDTO(b) {
    const dto = {};
    dto.id = b.id ?? b.getId?.();
    dto.sportId = b.sportId ?? b.getSportId?.();
    dto.venueId = b.venueId ?? b.getVenueId?.();
    dto.facilityOwnerEmail = b.facilityOwnerEmail ?? b.getFacilityOwnerEmail?.();
    dto.userEmail = b.userEmail ?? b.getUserEmail?.();
    dto.totalPrice = Number(b.totalPrice ?? b.getTotalPrice?.() ?? 0);
    dto.status = b.status ?? b.getStatus?.();
    dto.createdAt = b.createdAt ?? b.getCreatedAt?.();

    const slots = b.slots ?? b.getSlots?.() ?? [];
    dto.slots = slots.map((sp) => {
      const sd = {};
      sd.startDateTime = sp.startDateTime ?? sp.getStartDateTime?.();
      sd.endDateTime = sp.endDateTime ?? sp.getEndDateTime?.();
      sd.price = Number(sp.price ?? sp.getPrice?.() ?? 0);
      return sd;
    });

    return dto;
  }

  async function createBooking(request) {
    if (request?.slots == null || request.slots.length === 0) {
      throw new Error('At least one slot required.');
    }

    const venueId  = request.venueId  ?? request.getVenueId?.();
    const sportId  = request.sportId  ?? request.getSportId?.();

    // ---------- Parse & validate slots first (no DB needed) ----------
    const parsedSlots = [];
    let total = 0;

    for (const sd of request.slots) {
      const startDateTime = sd.startDateTime ?? sd.getStartDateTime?.();
      const endDateTime   = sd.endDateTime   ?? sd.getEndDateTime?.();

      if (startDateTime == null || endDateTime == null) {
        throw new Error('Slot start and end are required.');
      }
      if (!_isAfter(endDateTime, startDateTime)) {
        throw new Error('Each slot end must be after start.');
      }

      parsedSlots.push({
        startDateTime,
        endDateTime,
        price: sd.price ?? sd.getPrice?.(),
      });

      if (sd.price != null) total += sd.price;
    }

    // ---------- Serializable transaction: check-then-insert ----------
    const saved = await prisma.$transaction(async (tx) => {

      // 1. Overlap guard — runs inside the same serializable snapshot
      for (const slot of parsedSlots) {
        const overlaps = await bookingRepository.hasOverlappingSlot(
          venueId, sportId, slot.startDateTime, slot.endDateTime, tx
        );
        if (overlaps) {
          const err = new Error(
            `Slot ${slot.startDateTime} – ${slot.endDateTime} is already booked.`
          );
          err.status = 409;        // HTTP 409 Conflict
          throw err;
        }
      }

      // 2. No conflicts — persist the booking as RESERVED (temporary hold)
      const booking = {
        sportId,
        venueId,
        facilityOwnerEmail: request.facilityOwnerEmail ?? request.getFacilityOwnerEmail?.(),
        userEmail:          request.userEmail          ?? request.getUserEmail?.(),
        status:     'RESERVED',
        createdAt:  _now(),
        updatedAt:  _now(),
        totalPrice: total,
        slots:      parsedSlots,
      };

      // Use the tx-scoped Prisma client for the insert
      return await tx.booking.create({
        data: {
          sportId:            booking.sportId,
          venueId:            booking.venueId,
          facilityOwnerEmail: booking.facilityOwnerEmail,
          userEmail:          booking.userEmail,
          status:             booking.status,
          totalPrice:         booking.totalPrice,
          createdAt:          booking.createdAt,
          updatedAt:          booking.updatedAt,
          slots: {
            create: parsedSlots.map((s) => ({
              startDateTime: new Date(s.startDateTime),
              endDateTime:   new Date(s.endDateTime),
              price:         s.price ?? null,
            })),
          },
        },
        include: { slots: true },
      });

    }, {
      isolationLevel: 'Serializable',   // strongest isolation — prevents phantom reads
      timeout: 10000,                    // 10 s max for the transaction
    });

    // Earnings are NOT recorded yet — only when the booking is confirmed after payment
    return _toResponseDTO(saved);
  }

  async function getBookedSlotsForVenueSport(venueId, sportId) {
    const bookings = await bookingRepository.findByVenueIdAndSportId(venueId, sportId);
    const result = [];

    for (const b of bookings ?? []) {
      // Only show slots that are actively held (RESERVED or CONFIRMED)
      const status = b?.status ?? b?.getStatus?.();
      if (status !== 'RESERVED' && status !== 'CONFIRMED') continue;

      const slots = b?.slots ?? b?.getSlots?.() ?? [];
      for (const sp of slots) {
        const sd = {};
        sd.startDateTime = sp.startDateTime ?? sp.getStartDateTime?.();
        sd.endDateTime = sp.endDateTime ?? sp.getEndDateTime?.();
        sd.price = sp.price ?? sp.getPrice?.();
        result.push(sd);
      }
    }

    return result;
  }

  /**
   * Confirm a RESERVED booking after successful payment.
   * Transitions status from RESERVED → CONFIRMED and records earnings.
   */
  async function confirmBooking(bookingId) {
    const found = await bookingRepository.findById(bookingId);
    const booking = found?.orElse ? found.orElse(null) : found;

    if (booking == null) {
      const err = new Error('Booking not found.');
      err.status = 404;
      throw err;
    }

    const status = booking.status ?? booking.getStatus?.();
    if (status !== 'RESERVED') {
      const err = new Error(`Booking is ${status}, not RESERVED.`);
      err.status = 400;
      throw err;
    }

    // Update status to CONFIRMED
    booking.status = 'CONFIRMED';
    booking.updatedAt = _now();
    await bookingRepository.save(booking);

    // ---------- Record earnings (moved from createBooking) ----------
    const timestamp = booking.createdAt ?? booking.getCreatedAt?.() ?? _now();
    const monthIndex = _monthIndex(timestamp);
    const amount = Number(booking.totalPrice ?? booking.getTotalPrice?.() ?? 0);
    const ownerEmail = booking.facilityOwnerEmail ?? booking.getFacilityOwnerEmail?.();

    const earningsFound = await earningsRepository.findById(ownerEmail);
    const earnings = earningsFound?.orElse ? earningsFound.orElse(null) : earningsFound;

    if (earnings == null) {
      const f = {};
      f.facilityOwnerEmail = ownerEmail;
      const m = { month: monthIndex, earning: amount, recordedAt: timestamp };
      f.monthlyEarnings = [m];
      await earningsRepository.save(f);
    } else {
      let months = earnings.monthlyEarnings ?? earnings.getMonthlyEarnings?.();
      if (months == null) months = [];

      let target = null;
      for (const me of months) {
        const meMonth = me?.month ?? me?.getMonth?.();
        if (me != null && meMonth != null && Number(meMonth) === monthIndex) {
          target = me;
          break;
        }
      }

      if (target != null) {
        const current = target.earning ?? target.getEarning?.() ?? 0;
        if (target.setEarning) target.setEarning(current + amount);
        else target.earning = current + amount;

        if (target.setRecordedAt) target.setRecordedAt(timestamp);
        else target.recordedAt = timestamp;
      } else {
        months.push({ month: monthIndex, earning: amount, recordedAt: timestamp });
      }

      if (earnings.setMonthlyEarnings) earnings.setMonthlyEarnings(months);
      else earnings.monthlyEarnings = months;

      await earningsRepository.save(earnings);
    }

    return _toResponseDTO(booking);
  }

  /**
   * Release a RESERVED booking (payment failed/cancelled/abandoned).
   * Deletes the booking and its slots so the time becomes available again.
   */
  async function releaseBooking(bookingId) {
    const found = await bookingRepository.findById(bookingId);
    const booking = found?.orElse ? found.orElse(null) : found;

    if (booking == null) {
      // Already gone — that's fine (idempotent)
      return true;
    }

    const status = booking.status ?? booking.getStatus?.();
    if (status !== 'RESERVED') {
      // Don't delete confirmed/cancelled bookings via this endpoint
      const err = new Error(`Cannot release a ${status} booking.`);
      err.status = 400;
      throw err;
    }

    // Delete slots first, then booking
    await prisma.bookingSlot.deleteMany({ where: { bookingId: Number(bookingId) } });
    await prisma.booking.delete({ where: { id: Number(bookingId) } });

    return true;
  }

  /**
   * Auto-cleanup: delete RESERVED bookings older than `maxAgeMs` (default 5 min).
   * Called periodically by a setInterval in server.js.
   */
  async function cleanupExpiredReservations(maxAgeMs = 5 * 60 * 1000) {
    const cutoff = new Date(Date.now() - maxAgeMs);

    const expired = await prisma.booking.findMany({
      where: {
        status: 'RESERVED',
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });

    if (expired.length === 0) return 0;

    const ids = expired.map((b) => b.id);

    // Delete slots first, then bookings
    await prisma.bookingSlot.deleteMany({ where: { bookingId: { in: ids } } });
    await prisma.booking.deleteMany({ where: { id: { in: ids } } });

    console.log(`[Reservation Cleanup] Released ${ids.length} expired reservation(s).`);
    return ids.length;
  }

  async function getBookingsByUser(userEmail) {
    const bookings = await bookingRepository.findByUserEmail(userEmail);
    return (bookings ?? []).map(_toResponseDTO);
  }

  async function getBookingsByOwner(ownerEmail) {
    const bookings = await bookingRepository.findByFacilityOwnerEmail(ownerEmail);
    return (bookings ?? []).map(_toResponseDTO);
  }

  async function cancelBooking(id) {
    const found = await bookingRepository.findById(id);
    const booking = found?.orElse ? found.orElse(null) : found;

    if (booking == null) {
      return false;
    }

    const refundModel = {};
    refundModel.bookingId = id;
    refundModel.status = 'pending';
    refundModel.userEmail = booking.userEmail ?? booking.getUserEmail?.();
    refundModel.ownerMail =
      booking.facilityOwnerEmail ?? booking.getFacilityOwnerEmail?.();
    const totalPrice = booking.totalPrice ?? booking.getTotalPrice?.();
    refundModel.amount = String(totalPrice);

    await refundModelService.createRefund(refundModel);

    await emailService.sendSimpleEmail(
      booking.userEmail ?? booking.getUserEmail?.(),
      'Regarding Cancellation of Booking',
      'Dear User , Your Booking has been Cancelled and is in Pending state ,'
        + ' soon your Booking will be cancelled and refund will be initiated'
    );

    if (booking.setStatus) booking.setStatus('Cancelled');
    else booking.status = 'Cancelled';

    await bookingRepository.save(booking);
    return true;
  }

  async function getMonthlyTrends(ownerEmail) {
    const bookings = await bookingRepository.findByFacilityOwnerEmail(ownerEmail);

    const counts = new Array(12).fill(0);

    if (bookings == null || bookings.length === 0) {
      return counts;
    }

    for (const b of bookings) {
      if (b == null) continue;
      const createdAt = b.createdAt ?? b.getCreatedAt?.();
      if (createdAt == null) continue;

      const monthIndex = _monthIndex(createdAt);
      if (monthIndex >= 0 && monthIndex < 12) {
        counts[monthIndex] = counts[monthIndex] + 1;
      }
    }

    return counts;
  }

  async function getMonthlyTrendsofAmonth(ownerEmail) {
    const bookings = await bookingRepository.findByFacilityOwnerEmail(ownerEmail);

    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push([]);
    }

    if (bookings == null || bookings.length === 0) {
      return months;
    }

    for (const b of bookings) {
      if (b == null) continue;
      const createdAt = b.createdAt ?? b.getCreatedAt?.();
      if (createdAt == null) continue;

      const d = new Date(createdAt);
      const monthIndex = d.getMonth();
      const dayOfMonth = d.getDate();

      if (monthIndex >= 0 && monthIndex < 12) {
        months[monthIndex].push(dayOfMonth);
      }
    }

    return months;
  }

  async function getBookingByDate(ownerEmail) {
    void ownerEmail;
    return null;
  }

  return {
    createBooking,
    confirmBooking,
    releaseBooking,
    cleanupExpiredReservations,
    getBookedSlotsForVenueSport,
    getBookingsByUser,
    getBookingsByOwner,
    cancelBooking,
    getMonthlyTrends,
    getMonthlyTrendsofAmonth,
    getBookingByDate,
  };
}

module.exports = BookingService;
