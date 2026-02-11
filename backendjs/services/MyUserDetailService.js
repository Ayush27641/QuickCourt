function MyUserDetailService(userRegistrationService, UserPrincipal) {
  async function loadUserByUsername(username) {
    const opt = await userRegistrationService.findRegistrationByUsername(username);

    const userRegistration = opt?.orElse ? opt.orElse(null) : opt;

    const isPresent = opt?.isPresent?.();
    if (isPresent === true) {
      const value = opt.get ? opt.get() : userRegistration;
      return new UserPrincipal(value);
    }

    if (userRegistration != null) {
      return new UserPrincipal(userRegistration);
    }

    console.log('Not found in User');
    const err = new Error('User 404');
    err.name = 'UsernameNotFoundException';
    throw err;
  }

  return {
    loadUserByUsername,
  };
}

module.exports = MyUserDetailService;
