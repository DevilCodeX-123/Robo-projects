import { dataService } from '../services/dataService.js';

export const processReturnReminders = async () => {
  const issuedRequests = await dataService.getRequests({ status: 'ISSUED' });
  const now = new Date();
  let overdueMarked = 0;
  let remindersCreated = 0;

  for (const reqDoc of issuedRequests) {
    if (!reqDoc.expectedReturnDate) continue;
    const due = new Date(reqDoc.expectedReturnDate);
    if (Number.isNaN(due.getTime())) continue;

    const reqId = reqDoc._id || reqDoc.id;
    const requester = await dataService.findUserById(reqDoc.user);
    const prefs = requester?.preferences || {};
    const reminderDays = Number(prefs.returnReminderDays) > 0 ? Number(prefs.returnReminderDays) : 2;
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / msPerDay);

    const existingNotifs = await dataService.getNotifications(reqDoc.user, 'MEMBER');
    const dueLink = `/my-requests?id=${reqId}`;

    if (daysLeft < 0) {
      await dataService.updateRequest(reqId, { status: 'OVERDUE' });
      overdueMarked += 1;

      const alreadyNotified = existingNotifs.some(
        n => n.link === dueLink && String(n.title || '').toLowerCase().includes('overdue')
      );
      if (!alreadyNotified) {
        await dataService.createNotification({
          user: reqDoc.user,
          title: 'Component Return Overdue',
          message: `Request ${reqDoc.requestCode} ("${reqDoc.projectName}") was due on ${due.toLocaleDateString()}. Please return components to Lab 304 immediately.`,
          link: dueLink,
          type: 'DANGER'
        });
        remindersCreated += 1;
      }
    } else if (daysLeft <= reminderDays && prefs.pendingReminder !== false) {
      const alreadyReminded = existingNotifs.some(
        n => n.link === dueLink && String(n.title || '').toLowerCase().includes('return reminder')
      );
      if (!alreadyReminded) {
        await dataService.createNotification({
          user: reqDoc.user,
          title: 'Upcoming Component Return Reminder',
          message: `Request ${reqDoc.requestCode} ("${reqDoc.projectName}") is due for return in ${daysLeft} day(s) on ${due.toLocaleDateString()}.`,
          link: dueLink,
          type: 'WARNING'
        });
        remindersCreated += 1;
      }
    }
  }

  return { checked: issuedRequests.length, overdueMarked, remindersCreated };
};

export const runReturnReminders = async (req, res) => {
  try {
    const summary = await processReturnReminders();
    res.json({ success: true, ...summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;
    const notifications = await dataService.getNotifications(userId, role);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await dataService.markNotificationRead(id);
    res.json({ success: true, notification: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await dataService.getAuditLogs(limit);
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
