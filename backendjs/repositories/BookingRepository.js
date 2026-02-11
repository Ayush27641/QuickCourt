function BookingRepository(prisma) {
  async function save(booking) {
    const id = booking.id ?? booking.getId?.();

    const data = {
      sportId: booking.sportId ?? booking.getSportId?.() ?? null,
      venueId: booking.venueId ?? booking.getVenueId?.() ?? null,
      facilityOwnerEmail: booking.facilityOwnerEmail ?? booking.getFacilityOwnerEmail?.() ?? null,
      userEmail: booking.userEmail ?? booking.getUserEmail?.() ?? null,
      status: booking.status ?? booking.getStatus?.() ?? 'CONFIRMED',
      totalPrice: booking.totalPrice ?? booking.getTotalPrice?.() ?? 0,
      createdAt: booking.createdAt ?? booking.getCreatedAt?.() ?? undefined,
      updatedAt: booking.updatedAt ?? booking.getUpdatedAt?.() ?? undefined,
    };

    const slots = booking.slots ?? booking.getSlots?.() ?? [];

    if (id == null) {
      return await prisma.booking.create({
        data: {
          ...data,
          slots: {
            create: slots.map((s) => ({
              startDateTime: new Date(s.startDateTime ?? s.getStartDateTime?.()),
              endDateTime: new Date(s.endDateTime ?? s.getEndDateTime?.()),
              price: s.price ?? s.getPrice?.() ?? null,
            })),
          },
        },
        include: { slots: true },
      });
    }

    // Update + replace slots (closest to JPA element-collection semantics)
    await prisma.bookingSlot.deleteMany({ where: { bookingId: Number(id) } });

    return await prisma.booking.update({
      where: { id: Number(id) },
      data: {
        ...data,
        slots: {
          create: slots.map((s) => ({
            startDateTime: new Date(s.startDateTime ?? s.getStartDateTime?.()),
            endDateTime: new Date(s.endDateTime ?? s.getEndDateTime?.()),
            price: s.price ?? s.getPrice?.() ?? null,
          })),
        },
      },
      include: { slots: true },
    });
  }

  async function findById(id) {
    if (id == null) return null;
    return await prisma.booking.findUnique({ where: { id: Number(id) }, include: { slots: true } });
  }

  async function findByVenueIdAndSportId(venueId, sportId) {
    return await prisma.booking.findMany({
      where: { venueId: venueId == null ? undefined : Number(venueId), sportId: sportId == null ? undefined : Number(sportId) },
      include: { slots: true },
    });
  }

  async function findByUserEmail(userEmail) {
    return await prisma.booking.findMany({ where: { userEmail }, include: { slots: true } });
  }

  async function findByFacilityOwnerEmail(ownerEmail) {
    return await prisma.booking.findMany({ where: { facilityOwnerEmail: ownerEmail }, include: { slots: true } });
  }

  /**
   * Checks whether any active booking (CONFIRMED or RESERVED) for the given
   * venue+sport has a slot that overlaps with the provided time range.
   *
   * Overlap condition (standard interval overlap):
   *   existing.start < newEnd  AND  existing.end > newStart
   */
  async function hasOverlappingSlot(venueId, sportId, startDateTime, endDateTime, tx) {
    const client = tx || prisma;
    const count = await client.bookingSlot.count({
      where: {
        booking: {
          venueId: Number(venueId),
          sportId: Number(sportId),
          status: { in: ['CONFIRMED', 'RESERVED'] },
        },
        startDateTime: { lt: new Date(endDateTime) },
        endDateTime:   { gt: new Date(startDateTime) },
      },
    });
    return count > 0;
  }

  return {
    save,
    findById,
    findByVenueIdAndSportId,
    findByUserEmail,
    findByFacilityOwnerEmail,
    hasOverlappingSlot,
  };
}

module.exports = BookingRepository;
