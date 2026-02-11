function UserRegistrationService(userRepository, emailService, facilityOwnerProfileRepository) {
  async function findRegistrationByUsername(username) {
    return await userRepository.findById(username);
  }

  async function register(userRegistrationModel) {
    const userRegistrationsModel = await userRepository.save(userRegistrationModel);

    const role =
      userRegistrationModel?.role
      ?? userRegistrationModel?.getRole?.();

    if (role === 'ROLE_FACILITY_OWNER' || role?.name === 'ROLE_FACILITY_OWNER') {
      const subject = 'QuickCourt Registration - Verification Pending';
      const body =
        'Hello ' + (userRegistrationsModel.fullName ?? userRegistrationsModel.getFullName?.()) + ',\n\n'
        + 'Thank you for registering as a Facility Owner. Your account is now pending verification from our admin team. We will notify you once your account has been approved.\n\n'
        + 'Best regards,\n'
        + 'The QuickCourt Team';

      await emailService.sendSimpleEmail(
        userRegistrationsModel.email ?? userRegistrationsModel.getEmail?.(),
        subject,
        body
      );

      const fp = {};
      fp.facilityIds = [];
      fp.email = userRegistrationsModel.email ?? userRegistrationsModel.getEmail?.();
      await facilityOwnerProfileRepository.save(fp);
    } else {
      const subject = 'Welcome to QuickCourt!';
      const body =
        'Hello ' + (userRegistrationsModel.fullName ?? userRegistrationsModel.getFullName?.()) + ',\n\n'
        + 'Thank you for registering with QuickCourt! You can now start booking sports facilities and joining matches.\n\n'
        + 'Best regards,\n'
        + 'The QuickCourt Team';

      await emailService.sendSimpleEmail(
        userRegistrationsModel.email ?? userRegistrationsModel.getEmail?.(),
        subject,
        body
      );
    }

    return userRegistrationsModel;
  }

  async function updateRegistration(userRegistrationModel) {
    return await userRepository.save(userRegistrationModel);
  }

  async function verifyFacilityProvider(email) {
    const opt = await userRepository.findByEmail(email);
    const userRegistrationModel = opt?.orElse ? opt.orElse(null) : opt;

    if (userRegistrationModel != null) {
      const role = userRegistrationModel.role ?? userRegistrationModel.getRole?.();
      if (role === 'ROLE_FACILITY_OWNER' || role?.name === 'ROLE_FACILITY_OWNER') {
        const subject = 'QuickCourt Registration - Verification Successful';
        const body =
          'Hello ' + (userRegistrationModel.fullName ?? userRegistrationModel.getFullName?.()) + ',\n\n'
          + 'Thank you for registering as a Facility Owner. Your account is now verified from our admin team. We will notify you once your account has been approved.\n\n'
          + 'Best regards,\n'
          + 'The QuickCourt Team';

        await emailService.sendSimpleEmail(
          userRegistrationModel.email ?? userRegistrationModel.getEmail?.(),
          subject,
          body
        );

        if (userRegistrationModel.setVerified) userRegistrationModel.setVerified(true);
        else userRegistrationModel.verified = true;

        return await userRepository.save(userRegistrationModel);
      }
    }

    return null;
  }

  async function getAllRegistrations() {
    return await userRepository.findAll();
  }

  async function banUser(username) {
    const opt = await userRepository.findById(username);
    const user = opt?.orElse ? opt.orElse(null) : opt;

    if (user != null) {
      if (user.setPassword) user.setPassword('@@@@');
      else user.password = '@@@@';
      await userRepository.save(user);
      return true;
    }

    return false;
  }

  async function getName(username) {
    const opt = await userRepository.findById(username);
    const user = opt?.orElse ? opt.orElse(null) : opt;
    return user?.fullName ?? user?.getFullName?.() ?? null;
  }

  return {
    findRegistrationByUsername,
    register,
    updateRegistration,
    verifyFacilityProvider,
    getAllRegistrations,
    banUser,
    getName,
  };
}

module.exports = UserRegistrationService;
