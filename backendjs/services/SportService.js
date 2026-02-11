function SportService(sportRepository, venueRepository, commentRepository) {
  async function addSportToVenue(venueId, sport) {
    const venueOpt = await venueRepository.findById(venueId);
    const venue = venueOpt?.orElse ? venueOpt.orElse(null) : venueOpt;
    if (venue == null) {
      throw new Error('Venue not found: ' + venueId);
    }

    if (sport?.setVenueId) sport.setVenueId(venueId);
    else sport.venueId = venueId;

    const sport1 = await sportRepository.save(sport);

    // In Java/JPA the same entity instance gets its id populated.
    // In JS+Prisma we need to copy the generated id onto the caller's object
    // before saving again, otherwise a 2nd row can be created.
    if (sport1?.id != null && sport.id == null) {
      sport.id = sport1.id;
    }

    const sportIds = venue.sportIds ?? venue.getSportIds?.();
    if (Array.isArray(sportIds)) {
      sportIds.push(sport1.id ?? sport1.getId?.());
      if (venue.setSportIds) venue.setSportIds(sportIds);
      else venue.sportIds = sportIds;
    } else if (sportIds?.add) {
      sportIds.add(sport1.id ?? sport1.getId?.());
    } else {
      venue.sportIds = [sport1.id ?? sport1.getId?.()];
    }

    // Java saves sport again (sportRepository.save(sport)) and returns sport
    await sportRepository.save(sport);
    return sport;
  }

  async function getSportsForVenue(venueId) {
    return await sportRepository.findByVenueId(venueId);
  }

  async function deleteSport(venueId, sportId, ownerEmail) {
    void ownerEmail;

    const venueOpt = await venueRepository.findById(venueId);
    const venue = venueOpt?.orElse ? venueOpt.orElse(null) : venueOpt;

    if (venue != null) {
      const sportIds = venue.sportIds ?? venue.getSportIds?.();
      if (Array.isArray(sportIds)) {
        const idx = sportIds.indexOf(sportId);
        if (idx !== -1) sportIds.splice(idx, 1);
        if (venue.setSportIds) venue.setSportIds(sportIds);
        else venue.sportIds = sportIds;
      } else if (sportIds?.delete) {
        sportIds.delete(sportId);
      }

      await venueRepository.save(venue);
      await sportRepository.deleteById(sportId);
      return true;
    }

    return false;
  }

  async function updateSport(sportId, req) {
    const opt = await sportRepository.findById(sportId);
    const sport = opt?.orElse ? opt.orElse(null) : opt;
    if (sport == null) return null;

    if (req.name != null) {
      if (sport.setName) sport.setName(req.name);
      else sport.name = req.name;
    }
    if (req.type != null) {
      if (sport.setType) sport.setType(req.type);
      else sport.type = req.type;
    }
    if (req.pricePerHour != null) {
      if (sport.setPricePerHour) sport.setPricePerHour(req.pricePerHour);
      else sport.pricePerHour = req.pricePerHour;
    }
    if (req.operatingHours != null) {
      if (sport.setOperatingHours) sport.setOperatingHours(req.operatingHours);
      else sport.operatingHours = req.operatingHours;
    }

    const saved = await sportRepository.save(sport);
    return saved;
  }

  async function getSport(id) {
    const opt = await sportRepository.findById(id);
    const sport = opt?.orElse ? opt.orElse(null) : opt;
    if (sport == null) return null;
    return sport.name ?? sport.getName?.() ?? null;
  }

  return {
    addSportToVenue,
    getSportsForVenue,
    deleteSport,
    updateSport,
    getSport,
    commentRepository,
  };
}

module.exports = SportService;
