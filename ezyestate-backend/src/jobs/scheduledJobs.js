const cron = require('node-cron');
const Listing = require('../models/Listing');
const Project = require('../models/Project');
const Enquiry = require('../models/Enquiry');
const { notify } = require('../services/notificationService');
const { sendEmail, templates } = require('../services/emailService');
const logger = require('../utils/logger');

// ─── Expire Listings ──────────────────────────────────────
// Runs daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('[CRON] Checking for expired listings...');
    const now = new Date();

    const expiredListings = await Listing.updateMany(
      { status: 'active', expiresAt: { $lte: now } },
      { $set: { status: 'expired' } }
    );

    logger.info(`[CRON] ${expiredListings.modifiedCount} listings expired.`);

    // Notify owners
    const listings = await Listing.find({ status: 'expired', expiresAt: { $lte: now } })
      .populate('owner')
      .limit(100);

    for (const listing of listings) {
      await notify({
        recipientId: listing.owner._id,
        type: 'listing_expired',
        title: 'Listing Expired',
        message: 'Your listing has expired. Renew to continue receiving enquiries.',
        data: { listingId: listing._id },
        channels: { whatsapp: true, email: true },
      });
    }
  } catch (err) {
    logger.error(`[CRON] Expire listings error: ${err.message}`);
  }
});

// ─── Expiring Soon Reminder ──────────────────────────────
// Runs daily at 10 AM
cron.schedule('0 10 * * *', async () => {
  try {
    logger.info('[CRON] Checking for listings expiring soon...');
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const expiringListings = await Listing.find({
      status: 'active',
      expiresAt: { $gte: now, $lte: sevenDaysFromNow },
    }).populate('owner');

    for (const listing of expiringListings) {
      const daysLeft = Math.ceil((listing.expiresAt - now) / (24 * 60 * 60 * 1000));

      if (listing.owner?.email) {
        await sendEmail({
          to: listing.owner.email,
          ...templates.listingExpiringSoon(
            listing.owner.fullName,
            `${listing.propertyType} in ${listing.location.city}`,
            daysLeft
          ),
        });
      }

      await notify({
        recipientId: listing.owner._id,
        type: 'listing_expiring_soon',
        title: 'Listing Expiring Soon',
        message: `Your listing expires in ${daysLeft} days. Renew now.`,
        data: { listingId: listing._id },
      });
    }

    logger.info(`[CRON] ${expiringListings.length} expiring soon reminders sent.`);
  } catch (err) {
    logger.error(`[CRON] Expiring soon reminder error: ${err.message}`);
  }
});

// ─── Follow-up Reminders ──────────────────────────────────
// Runs every hour
cron.schedule('0 * * * *', async () => {
  try {
    logger.info('[CRON] Checking for pending follow-ups...');
    const now = new Date();

    const pendingFollowUps = await Enquiry.find({
      nextFollowUp: { $lte: now },
      status: { $in: ['contacted', 'qualified', 'site_visit_scheduled'] },
    }).populate('assignedTo');

    for (const enquiry of pendingFollowUps) {
      if (enquiry.assignedTo) {
        await notify({
          recipientId: enquiry.assignedTo._id,
          type: 'admin_message',
          title: 'Follow-up Reminder',
          message: `Follow-up due for enquiry ${enquiry._id}`,
          data: { enquiryId: enquiry._id },
        });
      }
    }

    logger.info(`[CRON] ${pendingFollowUps.length} follow-up reminders sent.`);
  } catch (err) {
    logger.error(`[CRON] Follow-up reminder error: ${err.message}`);
  }
});

// ─── Cleanup Old OTPs ─────────────────────────────────────
// OTPs auto-expire via TTL index, but this cleans used ones
// Runs daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  try {
    const OTP = require('../models/OTP');
    const result = await OTP.deleteMany({
      $or: [
        { isUsed: true },
        { expiresAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    });
    logger.info(`[CRON] Cleaned ${result.deletedCount} old OTPs.`);
  } catch (err) {
    logger.error(`[CRON] OTP cleanup error: ${err.message}`);
  }
});

logger.info('[CRON] All scheduled jobs initialized.');
