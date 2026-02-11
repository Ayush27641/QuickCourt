function UserRepository(prisma) {
  async function findById(email) {
    if (email == null) return null;
    return await prisma.userRegistrationsModel.findUnique({ where: { email } });
  }

  async function findByEmail(email) {
    return await findById(email);
  }

  async function save(user) {
    const email = user.email ?? user.getEmail?.();

    const data = {
      email,
      password: user.password ?? user.getPassword?.(),
      fullName: user.fullName ?? user.getFullName?.(),
      avatarUrl: user.avatarUrl ?? user.getAvatarUrl?.() ?? null,
      role: user.role ?? user.getRole?.(),
      verified: user.verified ?? user.getVerified?.() ?? null,
    };

    return await prisma.userRegistrationsModel.upsert({
      where: { email },
      create: data,
      update: data,
    });
  }

  async function findAll() {
    return await prisma.userRegistrationsModel.findMany();
  }

  return { findById, findByEmail, save, findAll };
}

module.exports = UserRepository;
