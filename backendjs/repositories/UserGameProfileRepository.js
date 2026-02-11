function UserGameProfileRepository(prisma) {
  async function findById(userEmail) {
    if (userEmail == null) return null;
    return await prisma.userGameProfile.findUnique({ where: { userEmail } });
  }

  async function save(profile) {
    const userEmail = profile.userEmail ?? profile.getUserEmail?.();

    const ids = profile.idsOfGamesJoined ?? profile.getIdsOfGamesJoined?.() ?? [];
    const idsArr = ids instanceof Set ? Array.from(ids) : Array.isArray(ids) ? ids : [];

    return await prisma.userGameProfile.upsert({
      where: { userEmail },
      create: { userEmail, idsOfGamesJoined: idsArr },
      update: { idsOfGamesJoined: idsArr },
    });
  }

  async function findAllById(userEmails) {
    const emails = Array.isArray(userEmails) ? userEmails : [];
    return await prisma.userGameProfile.findMany({ where: { userEmail: { in: emails } } });
  }

  return { findById, save, findAllById };
}

module.exports = UserGameProfileRepository;
