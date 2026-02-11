function GameRepository(prisma) {
  async function save(game) {
    const id = game.id ?? game.getId?.();

    const data = {
      gameName: game.gameName ?? game.getGameName?.() ?? null,
      location: game.location ?? game.getLocation?.() ?? null,
      timeDate: game.timeDate ?? game.getTimeDate?.() ?? null,
      venue: game.venue ?? game.getVenue?.() ?? null,
      playersRequired: game.playersRequired ?? game.getPlayersRequired?.() ?? 0,
      listOfUserEmailJoined: game.listOfUserEmailJoined ?? game.getListOfUserEmailJoined?.() ?? [],
    };

    if (id == null) {
      return await prisma.game.create({ data });
    }

    return await prisma.game.update({ where: { id: Number(id) }, data });
  }

  async function findAll() {
    return await prisma.game.findMany({ orderBy: { id: 'desc' } });
  }

  async function findById(id) {
    if (id == null) return null;
    return await prisma.game.findUnique({ where: { id: Number(id) } });
  }

  async function deleteById(id) {
    return await prisma.game.delete({ where: { id: Number(id) } });
  }

  return { save, findAll, findById, deleteById };
}

module.exports = GameRepository;
