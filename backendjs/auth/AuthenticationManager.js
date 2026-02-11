function AuthenticationManager(userRepository, bCryptPasswordEncoder) {
  async function authenticate(email, password) {
    const user = await userRepository.findById(email);

    if (user == null) {
      return { authenticated: false, isAuthenticated: () => false };
    }

    const ok = await bCryptPasswordEncoder.matches(password, user.password);
    return { authenticated: ok, isAuthenticated: () => ok };
  }

  return { authenticate };
}

module.exports = AuthenticationManager;
