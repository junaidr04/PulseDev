import { Response } from 'express';
import db from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || 'anonymous';
    const list = (await db.notifications.find()).filter(
      (notification) => !notification.recipientId || notification.recipientId === userId
    );

    // Compute per-user read status so every team member gets their own unread notifications
    const enriched = list.map((n: any) => {
      const readBy: string[] = Array.isArray(n.readBy) ? n.readBy : [];
      const isReadForUser = readBy.includes(userId);
      return {
        ...n,
        read: isReadForUser,
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      notifications: enriched,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || 'anonymous';
    const existing: any = await db.notifications.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    if (existing.recipientId && existing.recipientId !== userId) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const readBy: string[] = Array.isArray(existing.readBy) ? existing.readBy : [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
    }

    const updated = await db.notifications.findByIdAndUpdate(id, { readBy } as any);
    res.json({ success: true, notification: { ...updated, read: true } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id || 'anonymous';
    const list = (await db.notifications.find()).filter(
      (notification) => !notification.recipientId || notification.recipientId === userId
    );
    for (const notif of list as any[]) {
      const readBy: string[] = Array.isArray(notif.readBy) ? notif.readBy : [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await db.notifications.findByIdAndUpdate(notif._id, { readBy } as any);
      }
    }
    const updatedList = (await db.notifications.find()).filter(
      (notification) => !notification.recipientId || notification.recipientId === userId
    );
    res.json({
      success: true,
      notifications: updatedList.map((n: any) => ({ ...n, read: true })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
