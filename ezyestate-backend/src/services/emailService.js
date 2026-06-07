const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const info = await getTransporter().sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email send failed: ${err.message}`);
    // Don't throw — email failure shouldn't break primary flow
  }
};

const templates = {
  listingApproved: (ownerName, listingTitle) => ({
    subject: '✅ Your EzyEstate listing is now LIVE!',
    html: `<h2>Hi ${ownerName},</h2>
      <p>Your property listing <strong>${listingTitle}</strong> has been reviewed and approved by our team.</p>
      <p>It is now <strong>live on EzyEstate</strong> and our team has started promoting it to potential buyers.</p>
      <p>You can track enquiries and buyer activity from your dashboard.</p>
      <br><p>— Team EzyEstate</p>`,
  }),

  paymentSuccess: (name, amount, type) => ({
    subject: '✅ Payment Confirmed — EzyEstate',
    html: `<h2>Hi ${name},</h2>
      <p>Your payment of <strong>₹${(amount / 100).toLocaleString()}</strong> for <strong>${type}</strong> has been received.</p>
      <p>Thank you for choosing EzyEstate!</p>`,
  }),

  enquiryReceived: (sellerName, buyerName, propertyTitle) => ({
    subject: `🔔 New buyer interest — ${propertyTitle}`,
    html: `<h2>Hi ${sellerName},</h2>
      <p>A potential buyer (<strong>${buyerName}</strong>) has expressed interest in your property <strong>${propertyTitle}</strong>.</p>
      <p>Our team will contact both of you shortly to facilitate a site visit.</p>`,
  }),

  listingExpiringSoon: (ownerName, listingTitle, daysLeft) => ({
    subject: `⚠️ Your listing expires in ${daysLeft} days`,
    html: `<h2>Hi ${ownerName},</h2>
      <p>Your listing <strong>${listingTitle}</strong> will expire in <strong>${daysLeft} days</strong>.</p>
      <p>Log in to renew your listing and continue receiving buyer enquiries.</p>`,
  }),
};

module.exports = { sendEmail, templates };
