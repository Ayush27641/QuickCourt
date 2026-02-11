function RefundModelService(refundRepository, emailService, bookingRepository) {
  async function getAllRefunds() {
    return await refundRepository.findAll();
  }

  async function getRefundsByStatus(status) {
    return await refundRepository.findByStatus(status);
  }

  async function getRefundsByOwner(ownerMail) {
    return await refundRepository.findByOwnerMail(ownerMail);
  }

  async function getRefundsByUser(userEmail) {
    return await refundRepository.findByUserEmail(userEmail);
  }

  async function getRefundById(id) {
    const opt = await refundRepository.findById(id);
    const refund = opt?.orElse ? opt.orElse(null) : opt;

    if (refund == null) {
      const err = new Error('Refund not found with id: ' + id);
      err.status = 404;
      throw err;
    }

    return refund;
  }

  async function createRefund(refund) {
    const status = refund?.status ?? refund?.getStatus?.();
    if (status == null) {
      if (refund.setStatus) refund.setStatus('pending');
      else refund.status = 'pending';
    }

    return await refundRepository.save(refund);
  }

  async function deleteRefund(id) {
    const exists = await refundRepository.existsById(id);
    if (!exists) {
      const err = new Error('Refund not found with id: ' + id);
      err.status = 404;
      throw err;
    }
    await refundRepository.deleteById(id);
  }

  async function processRefund(id) {
    const refund = await getRefundById(id);
    const status = refund?.status ?? refund?.getStatus?.();

    if (String(status).toLowerCase() === 'done') {
      return refund;
    }

    if (refund.setStatus) refund.setStatus('done');
    else refund.status = 'done';

    await emailService.sendSimpleEmail(
      refund.userEmail ?? refund.getUserEmail?.(),
      'Regarding Processing of Refund',
      'Dear User Your amount has been refunded...'
    );

    return await refundRepository.save(refund);
  }

  async function getBookingDetailsByRefundId(refundId) {
    const opt = await refundRepository.findById(refundId);
    const refund = opt?.orElse ? opt.orElse(null) : opt;

    if (refund != null) {
      const bookingOpt = await bookingRepository.findById(
        refund.bookingId ?? refund.getBookingId?.()
      );
      const booking = bookingOpt?.orElse ? bookingOpt.orElse(null) : bookingOpt;
      return booking ?? null;
    }

    return null;
  }

  return {
    getAllRefunds,
    getRefundsByStatus,
    getRefundsByOwner,
    getRefundsByUser,
    getRefundById,
    createRefund,
    deleteRefund,
    processRefund,
    getBookingDetailsByRefundId,
  };
}

module.exports = RefundModelService;
