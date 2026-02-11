function RefundRepository(prisma) {
  async function findAll() {
    return await prisma.refundModel.findMany({ orderBy: { id: 'desc' } });
  }

  async function findByStatus(status) {
    return await prisma.refundModel.findMany({ where: { status }, orderBy: { id: 'desc' } });
  }

  async function findByOwnerMail(ownerMail) {
    return await prisma.refundModel.findMany({ where: { ownerMail }, orderBy: { id: 'desc' } });
  }

  async function findByUserEmail(userEmail) {
    return await prisma.refundModel.findMany({ where: { userEmail }, orderBy: { id: 'desc' } });
  }

  async function findByBookingId(bookingId) {
    return await prisma.refundModel.findMany({ where: { bookingId: Number(bookingId) }, orderBy: { id: 'desc' } });
  }

  async function findById(id) {
    if (id == null) return null;
    return await prisma.refundModel.findUnique({ where: { id: Number(id) } });
  }

  async function existsById(id) {
    const r = await prisma.refundModel.findUnique({ where: { id: Number(id) }, select: { id: true } });
    return r != null;
  }

  async function save(refund) {
    const id = refund.id ?? refund.getId?.();

    const data = {
      userEmail: refund.userEmail ?? refund.getUserEmail?.() ?? null,
      ownerMail: refund.ownerMail ?? refund.getOwnerMail?.() ?? null,
      amount: refund.amount ?? refund.getAmount?.() ?? null,
      bookingId: refund.bookingId ?? refund.getBookingId?.() ?? null,
      status: refund.status ?? refund.getStatus?.() ?? null,
    };

    if (id == null) {
      return await prisma.refundModel.create({ data });
    }

    return await prisma.refundModel.update({ where: { id: Number(id) }, data });
  }

  async function deleteById(id) {
    return await prisma.refundModel.delete({ where: { id: Number(id) } });
  }

  return {
    findAll,
    findByStatus,
    findByOwnerMail,
    findByUserEmail,
    findByBookingId,
    findById,
    existsById,
    save,
    deleteById,
  };
}

module.exports = RefundRepository;
