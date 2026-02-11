function SportRepository(prisma) {
  async function save(sport) {
    const id = sport.id ?? sport.getId?.();

    const data = {
      name: sport.name ?? sport.getName?.(),
      type: sport.type ?? sport.getType?.() ?? null,
      pricePerHour: sport.pricePerHour ?? sport.getPricePerHour?.() ?? null,
      operatingHours: sport.operatingHours ?? sport.getOperatingHours?.() ?? null,
      averageRating: sport.averageRating ?? sport.getAverageRating?.() ?? 0,
      venueId: sport.venueId ?? sport.getVenueId?.() ?? null,
      commentIds: sport.commentIds ?? sport.getCommentIds?.() ?? [],
    };

    if (id == null) {
      return await prisma.sport.create({ data });
    }

    return await prisma.sport.update({ where: { id: Number(id) }, data });
  }

  async function findByVenueId(venueId) {
    return await prisma.sport.findMany({ where: { venueId: Number(venueId) } });
  }

  async function findById(id) {
    if (id == null) return null;
    return await prisma.sport.findUnique({ where: { id: Number(id) } });
  }

  async function deleteById(id) {
    return await prisma.sport.delete({ where: { id: Number(id) } });
  }

  return { save, findByVenueId, findById, deleteById };
}

module.exports = SportRepository;
