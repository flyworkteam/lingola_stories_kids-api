/**
 * YogiFace Notification Controller
 * 
 * Bildirim API endpoint'leri
 */

const notificationService = require('../services/notificationService');

/**
 * Bildirim ayarlarını getir
 * GET /api/notifications/settings
 */
const getNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const settings = await notificationService.getNotificationSettings(userId);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Notification settings not found'
      });
    }

    res.json({
      success: true,
      data: {
        notificationsEnabled: !!settings.notifications_enabled,
        reminderInterval: settings.reminder_interval,
        quietHoursEnabled: !!settings.quiet_hours_enabled,
        quietHoursStart: settings.quiet_hours_start,
        quietHoursEnd: settings.quiet_hours_end,
        timezone: settings.timezone,
        lastNotificationAt: settings.last_notification_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bildirim ayarlarını güncelle
 * PUT /api/notifications/settings
 */
const updateNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      notificationsEnabled,
      reminderInterval,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      timezone
    } = req.body;

    // Interval validation
    const validIntervals = ['2h', '4h', '8h', '24h', 'off'];
    if (reminderInterval && !validIntervals.includes(reminderInterval)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder interval. Valid values: 2h, 4h, 8h, 24h, off'
      });
    }

    // Önce mevcut ayarları kontrol et, yoksa oluştur
    await notificationService.getNotificationSettings(userId);

    // Güncelle
    await notificationService.updateNotificationSettings(userId, {
      notificationsEnabled,
      reminderInterval,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      timezone
    });

    // Güncel ayarları döndür
    const updatedSettings = await notificationService.getNotificationSettings(userId);

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        notificationsEnabled: !!updatedSettings.notifications_enabled,
        reminderInterval: updatedSettings.reminder_interval,
        quietHoursEnabled: !!updatedSettings.quiet_hours_enabled,
        quietHoursStart: updatedSettings.quiet_hours_start,
        quietHoursEnd: updatedSettings.quiet_hours_end,
        timezone: updatedSettings.timezone
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bildirimleri aç/kapat
 * POST /api/notifications/toggle
 */
const toggleNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled field is required and must be a boolean'
      });
    }

    // Row yoksa önce oluştur
    await notificationService.getNotificationSettings(userId);

    await notificationService.updateNotificationSettings(userId, {
      notificationsEnabled: enabled
    });

    res.json({
      success: true,
      message: enabled ? 'Notifications enabled' : 'Notifications disabled',
      data: { notificationsEnabled: enabled }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bildirim aralığını güncelle
 * POST /api/notifications/interval
 */
const updateReminderInterval = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { interval } = req.body;

    const validIntervals = ['2h', '4h', '8h', '24h', 'off'];
    if (!interval || !validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interval. Valid values: 2h, 4h, 8h, 24h, off'
      });
    }

    // Row yoksa önce oluştur
    await notificationService.getNotificationSettings(userId);

    await notificationService.updateNotificationSettings(userId, {
      reminderInterval: interval
    });

    // Interval açıklamalarını hazırla
    const intervalDescriptions = {
      '2h': { tr: 'Her 2 saatte bir', en: 'Every 2 hours' },
      '4h': { tr: 'Her 4 saatte bir', en: 'Every 4 hours' },
      '8h': { tr: 'Her 8 saatte bir', en: 'Every 8 hours' },
      '24h': { tr: 'Günde bir', en: 'Once a day' },
      'off': { tr: 'Kapalı', en: 'Off' }
    };

    res.json({
      success: true,
      message: 'Reminder interval updated',
      data: {
        interval,
        description: intervalDescriptions[interval]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Egzersiz aktivitesini al
 * GET /api/notifications/activity
 */
const getExerciseActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const activity = await notificationService.getExerciseActivity(userId);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Egzersiz tamamlandığını kaydet
 * POST /api/notifications/exercise-completed
 */
const exerciseCompleted = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.updateExerciseActivity(userId);

    res.json({
      success: true,
      message: 'Exercise activity updated',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getNotificationHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const history = await notificationService.getNotificationHistory(userId, Math.min(limit, 100));

    res.json({
      success: true,
      data: history.map(h => ({
        id: h.id,
        type: h.notification_type,
        title: h.title,
        message: h.message,
        status: h.status,
        isRead: !!h.is_read,
        readAt: h.read_at,
        sentAt: h.sent_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test bildirimi gönder (sadece development)
 * POST /api/notifications/test
 */
const sendTestNotification = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'Test notifications only available in development mode'
      });
    }

    const userId = req.user.id;
    const { type = 'reminder_4h' } = req.body;

    const validTypes = ['reminder_2h', 'reminder_4h', 'reminder_8h', 'reminder_24h'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Valid values: ${validTypes.join(', ')}`
      });
    }

    const result = await notificationService.sendUserNotification(userId, type);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test notification sent successfully',
        data: { messageId: result.messageId }
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to send test notification: ${result.reason}`,
        error: result.error
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Zamanlanmış bildirimleri manuel tetikle (admin only)
 * POST /api/notifications/trigger-scheduled
 */
const triggerScheduledNotifications = async (req, res, next) => {
  try {
    // Admin kontrolü (basit implementasyon)
    // Gerçek projede proper admin authentication kullanılmalı
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { interval } = req.body;
    const validIntervals = ['2h', '4h', '8h', '24h'];

    if (!interval || !validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        message: `Invalid interval. Valid values: ${validIntervals.join(', ')}`
      });
    }

    const result = await notificationService.sendScheduledReminders(interval);

    res.json({
      success: true,
      message: `Scheduled ${interval} notifications processed`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mevcut bildirim aralıklarını ve açıklamalarını al
 * GET /api/notifications/intervals
 */
const getAvailableIntervals = async (req, res, next) => {
  try {
    const intervals = [
      {
        value: '2h',
        hours: 2,
        tone: 'gentle',
        name: { tr: 'Her 2 saatte bir', en: 'Every 2 hours' },
        description: {
          tr: 'Samimi ve yumuşak hatırlatmalar',
          en: 'Friendly and gentle reminders'
        }
      },
      {
        value: '4h',
        hours: 4,
        tone: 'curious',
        name: { tr: 'Her 4 saatte bir', en: 'Every 4 hours' },
        description: {
          tr: 'Merak uyandıran hatırlatmalar',
          en: 'Curiosity-inspiring reminders'
        }
      },
      {
        value: '8h',
        hours: 8,
        tone: 'supportive',
        name: { tr: 'Her 8 saatte bir', en: 'Every 8 hours' },
        description: {
          tr: 'Duygusal destek mesajları',
          en: 'Emotionally supportive messages'
        }
      },
      {
        value: '24h',
        hours: 24,
        tone: 'patient',
        name: { tr: 'Günde bir', en: 'Once a day' },
        description: {
          tr: '"Hâlâ buradayız" tonu',
          en: '"Still here" gentle tone'
        }
      },
      {
        value: 'off',
        hours: 0,
        tone: null,
        name: { tr: 'Kapalı', en: 'Off' },
        description: {
          tr: 'Hatırlatma bildirimi gönderilmez',
          en: 'No reminder notifications'
        }
      }
    ];

    res.json({
      success: true,
      data: intervals
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bildirimi okundu olarak işaretle
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const result = await notificationService.markNotificationAsRead(notificationId, userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tüm bildirimleri okundu olarak işaretle
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { markedCount: result.markedCount }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tek bildirimi sil
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const result = await notificationService.deleteNotification(notificationId, userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tüm bildirimleri sil
 * DELETE /api/notifications/all
 */
const deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.deleteAllNotifications(userId);

    res.json({
      success: true,
      message: 'All notifications deleted',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Okunmamış bildirim sayısını getir
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
  toggleNotifications,
  updateReminderInterval,
  getExerciseActivity,
  exerciseCompleted,
  getNotificationHistory,
  sendTestNotification,
  triggerScheduledNotifications,
  getAvailableIntervals,
  // New notification management functions
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
};
