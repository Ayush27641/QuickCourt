function VenueService(venueRepository, profileRepository) {
  async function createVenueForOwner(venue, ownerEmail) {
    const name = venue?.name ?? venue?.getName?.();
    if (name == null || String(name).trim() === '') {
      throw new Error('Venue.name is required');
    }

    const ownerOpt = await profileRepository.findById(ownerEmail);
    const owner = ownerOpt?.orElse ? ownerOpt.orElse(null) : ownerOpt;
    if (owner == null) {
      throw new Error('Owner not found: ' + ownerEmail);
    }

    if (venue?.setOwnerMail) venue.setOwnerMail(ownerEmail);
    else venue.ownerMail = ownerEmail;

    const venue1 = await venueRepository.save(venue);

    const facilityIds = owner.facilityIds ?? owner.getFacilityIds?.();
    if (Array.isArray(facilityIds)) {
      facilityIds.push(venue1.id ?? venue1.getId?.());
      if (owner.setFacilityIds) owner.setFacilityIds(facilityIds);
      else owner.facilityIds = facilityIds;
    } else if (facilityIds?.add) {
      facilityIds.add(venue1.id ?? venue1.getId?.());
    } else {
      owner.facilityIds = [venue1.id ?? venue1.getId?.()];
    }

    await profileRepository.save(owner);
    return venue1;
  }

  async function getVenue(id) {
    return await venueRepository.findById(id);
  }

  async function getVenuesByOwnerEmail(ownerEmail) {
    return await venueRepository.findByOwnerMail(ownerEmail);
  }

  async function deleteVenueByRemovingFromOwner(ownerEmail, venueId) {
    const ownerOpt = await profileRepository.findById(ownerEmail);
    const owner = ownerOpt?.orElse ? ownerOpt.orElse(null) : ownerOpt;
    if (owner == null) {
      throw new Error('Owner not found: ' + ownerEmail);
    }

    const facilityIds = owner.facilityIds ?? owner.getFacilityIds?.();
    if (Array.isArray(facilityIds)) {
      const idx = facilityIds.indexOf(venueId);
      if (idx !== -1) facilityIds.splice(idx, 1);
      if (owner.setFacilityIds) owner.setFacilityIds(facilityIds);
      else owner.facilityIds = facilityIds;
    } else if (facilityIds?.delete) {
      facilityIds.delete(venueId);
    }

    await profileRepository.save(owner);
    await venueRepository.deleteById(venueId);
  }

  async function updateVenue(venueId, req) {
    const opt = await venueRepository.findById(venueId);
    const venue = opt?.orElse ? opt.orElse(null) : opt;
    if (venue == null) return null;

    if (req.name != null) {
      if (venue.setName) venue.setName(req.name);
      else venue.name = req.name;
    }
    if (req.description != null) {
      if (venue.setDescription) venue.setDescription(req.description);
      else venue.description = req.description;
    }
    if (req.address != null) {
      if (venue.setAddress) venue.setAddress(req.address);
      else venue.address = req.address;
    }
    if (req.photoUrls != null) {
      const value = Array.isArray(req.photoUrls) ? [...req.photoUrls] : req.photoUrls;
      if (venue.setPhotoUrls) venue.setPhotoUrls(value);
      else venue.photoUrls = value;
    }
    if (req.amenities != null) {
      const value = Array.isArray(req.amenities) ? [...req.amenities] : req.amenities;
      if (venue.setAmenities) venue.setAmenities(value);
      else venue.amenities = value;
    }

    const saved = await venueRepository.save(venue);
    return saved;
  }

  async function getAllVenue() {
    return await venueRepository.findAll();
  }

  async function verify(venueId) {
    const opt = await venueRepository.findById(venueId);
    const venue = opt?.orElse ? opt.orElse(null) : opt;
    if (venue == null) return null;

    venue.isVerified = true;

    await venueRepository.save(venue);
    return venue;
  }

  return {
    createVenueForOwner,
    getVenue,
    getVenuesByOwnerEmail,
    deleteVenueByRemovingFromOwner,
    updateVenue,
    getAllVenue,
    verify,
  };
}

module.exports = VenueService;
