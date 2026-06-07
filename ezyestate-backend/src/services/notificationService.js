const Notification = require('../models/Notification');
const { sendEmail, templates } = require('./emailService');
const logger = require('../utils/logger');
let io; // Socket.IO instance injected at startup

const setSocketIO = (socketIO) => { io = socketIO; };

const notify = async ({ recipientId, type, title, message, data = {}, channels = {} }) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      data,
      channels: { inApp: true, ...channels },
    });

    // Real-time push via socket
    if (io) {
      io.to(`user:${recipientId}`).emit('notification', {
        id: notification._id,
        type,
        title,
        message,
        data,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (err) {
    logger.error(`Notification failed: ${err.message}`);
  }
};

module.exports = { notify, setSocketIO };
