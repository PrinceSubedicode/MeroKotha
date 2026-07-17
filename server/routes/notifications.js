import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications: Retrieve notifications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notificationsColl = db.collection('notifications');
    const list = await notificationsColl.find({ userId: req.user._id });
    
    // Sort by newest first
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(list);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/notifications/read-all: Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const notificationsColl = db.collection('notifications');
    await notificationsColl.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/notifications/:id/read: Mark specific notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationsColl = db.collection('notifications');
    const notif = await notificationsColl.findById(req.params.id);

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (String(notif.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized action.' });
    }

    const updated = await notificationsColl.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Notification marked as read.', notification: updated });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
