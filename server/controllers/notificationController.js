import Notification from '../models/Notification.js';

const getNotifications = async (req, res) => {
  try {
      //Find all notifications where the recipient is the currently authenticated user
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar role')
      .populate('post', 'title')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {// Find the notification by its ID
    const notification = await Notification.findById(req.params.id);
// Check if the notification exists and if the recipient is the currently authenticated user
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    //if no authorization, return a 401 response
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getNotifications, markAsRead };