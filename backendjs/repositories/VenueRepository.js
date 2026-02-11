function VenueRepository(prisma) {
  async function save(venue) {
    const id = venue.id ?? venue.getId?.();

    const data = {
      name: venue.name ?? venue.getName?.(),
      description: venue.description ?? venue.getDescription?.() ?? null,
      address: venue.address ?? venue.getAddress?.() ?? null,
      isVerified: venue.isVerified ?? venue.getIsVerified?.() ?? venue.verified ?? venue.getVerified?.() ?? false,
      photoUrls: venue.photoUrls ?? venue.getPhotoUrls?.() ?? [],
      amenities: venue.amenities ?? venue.getAmenities?.() ?? [],
      rating: venue.rating ?? venue.getRating?.() ?? 0,
      ownerMail: venue.ownerMail ?? venue.getOwnerMail?.() ?? null,
      sportIds: venue.sportIds ?? venue.SportIds ?? venue.getSportIds?.() ?? [],
    };

    if (id == null) {
      return await prisma.venue.create({ data });
    }

    return await prisma.venue.update({ where: { id: Number(id) }, data });
  }

  async function findById(id) {
    if (id == null) return null;
    return await prisma.venue.findUnique({ where: { id: Number(id) } });
  }

  async function findByOwnerMail(ownerMail) {
    const list = await prisma.venue.findMany({ where: { ownerMail } });
    return list;
  }

  async function findAll() {
    return await prisma.venue.findMany();
  }

  async function deleteById(id) {
    return await prisma.venue.delete({ where: { id: Number(id) } });
  }

  return { save, findById, findByOwnerMail, findAll, deleteById };
}

module.exports = VenueRepository;
