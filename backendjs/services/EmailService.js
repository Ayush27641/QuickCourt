function EmailService(mailSender) {
  async function sendSimpleEmail(toEmail, subject, body) {
    const message = {
      to: toEmail,
      subject,
      text: body,
      from: 'edura.learningapp@gmail.com',
    };

    return await mailSender.send(message);
  }

  return {
    sendSimpleEmail,
  };
}

module.exports = EmailService;
