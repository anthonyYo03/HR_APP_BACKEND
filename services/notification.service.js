import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { getIo } from "../utils/socketManager.js";

export const sendNotification = async ({ recipients, type = "DEFAULT", title, message, relatedId = null, relatedModel = null }) => {
  try {
    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      type,
      title,
      message,
      relatedId,
      relatedModel
    }));

    const saved = await Notification.insertMany(notifications);

    const io = getIo();
    if (io) {
      saved.forEach((notification) => {
        io.to(notification.recipient.toString()).emit('new-notification', {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          relatedId: notification.relatedId,
          relatedModel: notification.relatedModel,
          isRead: notification.isRead,
          isHidden: notification.isHidden,
          createdAt: notification.createdAt,
        });
      });
    }

  } catch (error) {
    console.error("Notification error:", error);
  }
};

export const getAllEmployeeIds = async () => {
  const employees = await User.find({});
  return employees.map(emp => emp._id);
};

export const getAllHRIds = async () => {
  const hrUsers = await User.find({ role: "HR" }, "_id");
  return hrUsers.map(hr => hr._id);
};