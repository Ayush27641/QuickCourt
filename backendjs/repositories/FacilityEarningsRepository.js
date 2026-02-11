function FacilityEarningsRepository(prisma) {
  async function findById(facilityOwnerEmail) {
    if (facilityOwnerEmail == null) return null;
    return await prisma.facilityEarnings.findUnique({
      where: { facilityOwnerEmail },
      include: { monthlyEarnings: true },
    });
  }

  async function save(entity) {
    const facilityOwnerEmail = entity.facilityOwnerEmail ?? entity.getFacilityOwnerEmail?.();

    const months = entity.monthlyEarnings ?? entity.getMonthlyEarnings?.() ?? [];

    // Upsert header
    await prisma.facilityEarnings.upsert({
      where: { facilityOwnerEmail },
      create: { facilityOwnerEmail },
      update: {},
    });

    // Replace element-collection rows
    await prisma.monthEarning.deleteMany({ where: { facilityOwnerEmail } });

    for (const m of months) {
      if (m == null) continue;
      await prisma.monthEarning.create({
        data: {
          facilityOwnerEmail,
          month: m.month ?? m.getMonth?.() ?? null,
          earning: m.earning ?? m.getEarning?.() ?? 0,
          recordedAt: new Date(m.recordedAt ?? m.getRecordedAt?.() ?? new Date()),
        },
      });
    }

    return await findById(facilityOwnerEmail);
  }

  return { findById, save };
}

module.exports = FacilityEarningsRepository;
