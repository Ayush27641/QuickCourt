function FacilityOwnerProfileRepository(prisma) {
  async function findById(email) {
    if (email == null) return null;
    return await prisma.facilityOwnerProfile.findUnique({ where: { email } });
  }

  async function findByEmail(email) {
    return await findById(email);
  }

  async function save(profile) {
    const email = profile.email ?? profile.getEmail?.();
    const facilityIds = profile.facilityIds ?? profile.getFacilityIds?.() ?? [];

    return await prisma.facilityOwnerProfile.upsert({
      where: { email },
      create: { email, facilityIds },
      update: { facilityIds },
    });
  }

  return { findById, findByEmail, save };
}

module.exports = FacilityOwnerProfileRepository;
