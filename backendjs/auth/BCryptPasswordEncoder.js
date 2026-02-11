const bcrypt = require('bcryptjs');

function BCryptPasswordEncoder(strength = 12) {
  async function encode(rawPassword) {
    const salt = await bcrypt.genSalt(strength);
    return await bcrypt.hash(String(rawPassword), salt);
  }

  async function matches(rawPassword, encodedPassword) {
    return await bcrypt.compare(String(rawPassword), String(encodedPassword));
  }

  return { encode, matches };
}

module.exports = BCryptPasswordEncoder;
