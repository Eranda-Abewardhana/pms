const nodemailer = require('nodemailer');

/**
 * Send an email using configured SMTP or fallback to console (dev mode).
 *
 * @param {Object} opts
 * @param {string} opts.to      - Recipient email
 * @param {string} opts.subject - Email subject
 * @param {string} opts.html    - HTML body
 * @param {string} [opts.text]  - Plain-text fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  // If no SMTP configured, just print to console (safe for development)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n═══════════════════════════════════════════════');
    console.log('[sendEmail] ⚠️  SMTP not configured — logging email to console');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:\n${text || html}`);
    console.log('═══════════════════════════════════════════════\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Metro Medi Care" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[sendEmail] Message sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
