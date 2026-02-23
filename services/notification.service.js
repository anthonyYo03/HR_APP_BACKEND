import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

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

    await Notification.insertMany(notifications);

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