import Notification from "../models/notification.model.js";




const getNotification = async (req, res) => {
  const userId = req.userId;
  try {
    const notifications = await Notification.find({ recipient:userId, isHidden: false })
      .sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
};

//Get unread notification count (only visible)
const notificationCounter = async (req, res) => {
  const userId = req.userId;
  try {
    const count = await Notification.countDocuments({
      recipient:userId,
      isRead: false,
      isHidden: false
    });
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notification count", error });
  }
};

//Mark a single notification as read (only if visible)
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await Notification.updateOne(
      { _id: id, recipient:userId, isHidden: false },
      { isRead: true }
    );

    if (result.modifiedCount === 0) {
      return res.status(200).json({ message: "Notification not found, hidden, or already read" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking notification as read", error });
  }
};

//Clear all notifications (mark as hidden)
const clearNotifications = async (req, res) => {
  const userId = req.userId;

  try {
    const result = await Notification.updateMany(
      { recipient:userId, isHidden: false },
      { isHidden: true }
    );

    if (result.matchedCount === 0) {
      return res.status(200).json({ message: "No notifications found" });
    }

    res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing notifications", error });
  }
};

export const NotificationControllers={
  getNotification,
  notificationCounter,
  markAsRead,
  clearNotifications,

};

