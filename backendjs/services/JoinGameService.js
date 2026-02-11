function JoinGameService(gameRepository, profileRepository) {
  // --- Game CRUD ---

  async function createGame(req) {
    const g = {};
    g.gameName = req.gameName;
    g.location = req.location;
    g.timeDate = req.timeDate;
    g.venue = req.venue;
    g.playersRequired = req.playersRequired;
    return await gameRepository.save(g);
  }

  async function getAllGames() {
    return await gameRepository.findAll();
  }

  async function getGame(id) {
    return await gameRepository.findById(id);
  }

  async function updateGame(id, req) {
    const opt = await gameRepository.findById(id);
    const game = opt?.orElse ? opt.orElse(null) : opt;
    if (game == null) return null;

    if (req.gameName != null) game.gameName = req.gameName;
    if (req.location != null) game.location = req.location;
    if (req.timeDate != null) game.timeDate = req.timeDate;
    if (req.playersRequired != null) game.playersRequired = req.playersRequired;

    return await gameRepository.save(game);
  }

  async function deleteGame(id) {
    const opt = await gameRepository.findById(id);
    const game = opt?.orElse ? opt.orElse(null) : opt;
    if (game == null) return false;

    const list = game.listOfUserEmailJoined ?? game.getListOfUserEmailJoined?.() ?? [];

    if (list.length > 0) {
      const profiles = await profileRepository.findAllById(list);
      const gameId = game.id ?? game.getId?.();
      for (const p of profiles ?? []) {
        const ids = p.idsOfGamesJoined ?? p.getIdsOfGamesJoined?.();
        if (ids != null) {
          let removed = false;
          if (ids.delete) {
            removed = ids.delete(gameId);
          } else if (Array.isArray(ids)) {
            const idx = ids.indexOf(gameId);
            if (idx !== -1) {
              ids.splice(idx, 1);
              removed = true;
            }
          }

          if (removed) {
            await profileRepository.save(p);
          }
        }
      }
    }

    await gameRepository.deleteById(id);
    return true;
  }

  // --- User profile management (create/get) ---

  async function createUserProfileIfNotExist(email) {
    const opt = await profileRepository.findById(email);
    const existing = opt?.orElse ? opt.orElse(null) : opt;

    if (existing != null) return existing;

    const p = {};
    p.userEmail = email;
    p.idsOfGamesJoined = new Set();
    return await profileRepository.save(p);
  }

  async function getUserProfile(email) {
    return await profileRepository.findById(email);
  }

  // --- Join / Leave logic ---

  async function joinGame(userEmail, gameId) {
    const opt = await gameRepository.findById(gameId);
    const game = opt?.orElse ? opt.orElse(null) : opt;
    if (game == null) return null;

    const list = game.listOfUserEmailJoined ?? game.getListOfUserEmailJoined?.();
    if (Array.isArray(list) === false) {
      game.listOfUserEmailJoined = [];
    }

    const joinedCount = (game.listOfUserEmailJoined ?? []).length;

    if (game.playersRequired > 0 && joinedCount >= game.playersRequired) {
      return game;
    }

    if (!(game.listOfUserEmailJoined ?? []).includes(userEmail)) {
      game.listOfUserEmailJoined.push(userEmail);
      await gameRepository.save(game);
    }

    const profile = await createUserProfileIfNotExist(userEmail);
    if (!(profile.idsOfGamesJoined instanceof Set)) {
      profile.idsOfGamesJoined = new Set(profile.idsOfGamesJoined ?? []);
    }

    if (!profile.idsOfGamesJoined.has(gameId)) {
      profile.idsOfGamesJoined.add(gameId);
      await profileRepository.save(profile);
    }

    return game;
  }

  async function leaveGame(userEmail, gameId) {
    const opt = await gameRepository.findById(gameId);
    const game = opt?.orElse ? opt.orElse(null) : opt;
    if (game == null) return null;

    const list = game.listOfUserEmailJoined ?? game.getListOfUserEmailJoined?.();
    if (Array.isArray(list) === false) {
      game.listOfUserEmailJoined = [];
    }

    const before = (game.listOfUserEmailJoined ?? []).length;
    game.listOfUserEmailJoined = (game.listOfUserEmailJoined ?? []).filter(
      (email) => email !== userEmail
    );

    if ((game.listOfUserEmailJoined ?? []).length !== before) {
      await gameRepository.save(game);
    }

    const profileOpt = await profileRepository.findById(userEmail);
    const profile = profileOpt?.orElse ? profileOpt.orElse(null) : profileOpt;

    if (profile != null) {
      if (!(profile.idsOfGamesJoined instanceof Set)) {
        profile.idsOfGamesJoined = new Set(profile.idsOfGamesJoined ?? []);
      }

      if (profile.idsOfGamesJoined.delete(gameId)) {
        await profileRepository.save(profile);
      }
    }

    return game;
  }

  async function getJoinedGameIdsForUser(userEmail) {
    const opt = await profileRepository.findById(userEmail);
    const profile = opt?.orElse ? opt.orElse(null) : opt;

    if (profile == null) return [];

    const ids = profile.idsOfGamesJoined ?? profile.getIdsOfGamesJoined?.();
    if (ids instanceof Set) {
      return Array.from(ids);
    }

    return Array.isArray(ids) ? [...ids] : [];
  }

  return {
    createGame,
    getAllGames,
    getGame,
    updateGame,
    deleteGame,
    createUserProfileIfNotExist,
    getUserProfile,
    joinGame,
    leaveGame,
    getJoinedGameIdsForUser,
  };
}

module.exports = JoinGameService;
