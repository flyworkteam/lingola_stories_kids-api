/**
 * Lingola Kids Notification Scheduler
 *
 * Cron job ile zamanlanmış bildirimleri yönetir
 * 3 Aktivite Katmanı:
 *   - Aktif      (bugün açmış)      → Akşam 19:30 – haftada 3-4 gün
 *   - Yarı-Aktif (24-48 saat)       → Öğleden sonra 15:00 + Akşam 19:30
 *   - Pasif      (3-5 gün)          → Akşam 19:30 (tek, yumuşak ton)
 */

const cron = require('node-cron');
const notificationService = require('../services/notificationService');

let scheduledJobs = {};

/**
 * Tüm zamanlanmış görevleri başlat
 */
const startScheduler = () => {
  console.log('🕐 Lingola Kids bildirim scheduler başlatılıyor...');

  // ─── AKTİF KULLANICI ────────────────────────────────────────
  // Akşam 19:30 – haftada 3-4 gün (Pazar/Salı/Perşembe/Cumartesi)
  // Gün filtresi servis katmanında uygulanır
  scheduledJobs['active_evening'] = cron.schedule('30 19 * * 0,2,4,6', async () => {
    console.log('⏰ [active_evening] Aktif kullanıcı akşam bildirimleri...');
    try {
      const result = await notificationService.sendActiveEveningNotifications();
      console.log('✅ [active_evening]', result);
    } catch (error) {
      console.error('❌ [active_evening]', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
  });

  // ─── YARI-AKTİF KULLANICI ───────────────────────────────────
  // Öğleden sonra 15:00 – her gün
  scheduledJobs['semi_active_afternoon'] = cron.schedule('0 15 * * *', async () => {
    console.log('⏰ [semi_active_afternoon] Yarı-aktif öğleden sonra bildirimleri...');
    try {
      const result = await notificationService.sendSemiActiveAfternoonNotifications();
      console.log('✅ [semi_active_afternoon]', result);
    } catch (error) {
      console.error('❌ [semi_active_afternoon]', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
  });

  // Akşam 19:30 – her gün
  scheduledJobs['semi_active_evening'] = cron.schedule('30 19 * * *', async () => {
    console.log('⏰ [semi_active_evening] Yarı-aktif akşam bildirimleri...');
    try {
      const result = await notificationService.sendSemiActiveEveningNotifications();
      console.log('✅ [semi_active_evening]', result);
    } catch (error) {
      console.error('❌ [semi_active_evening]', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
  });

  // ─── PASİF KULLANICI ─────────────────────────────────────────
  // Akşam 19:30 – her gün
  scheduledJobs['passive_evening'] = cron.schedule('30 19 * * *', async () => {
    console.log('⏰ [passive_evening] Pasif kullanıcı akşam bildirimleri...');
    try {
      const result = await notificationService.sendPassiveEveningNotifications();
      console.log('✅ [passive_evening]', result);
    } catch (error) {
      console.error('❌ [passive_evening]', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
  });

  console.log('✅ Lingola Kids Scheduler aktif:');
  console.log('   - active_evening       → Her Pzr/Sal/Per/Cmt saat 19:30');
  console.log('   - semi_active_afternoon → Her gün saat 15:00');
  console.log('   - semi_active_evening   → Her gün saat 19:30');
  console.log('   - passive_evening       → Her gün saat 19:30');
};

/**
 * Tüm zamanlanmış görevleri durdur
 */
const stopScheduler = () => {
  console.log('🛑 Lingola Kids scheduler durduruluyor...');
  Object.keys(scheduledJobs).forEach(key => {
    if (scheduledJobs[key]) {
      scheduledJobs[key].stop();
      console.log(`   - ${key} durduruldu`);
    }
  });
  scheduledJobs = {};
  console.log('✅ Scheduler durduruldu.');
};

/**
 * Belirli bir job'u yeniden başlat
 */
const restartJob = (jobKey) => {
  if (scheduledJobs[jobKey]) {
    scheduledJobs[jobKey].stop();
    scheduledJobs[jobKey].start();
    console.log(`🔄 ${jobKey} yeniden başlatıldı`);
  }
};

/**
 * Scheduler durumunu al
 */
const getSchedulerStatus = () => {
  const status = {};
  Object.keys(scheduledJobs).forEach(key => {
    status[key] = { running: !!scheduledJobs[key] };
  });
  return status;
};

module.exports = {
  startScheduler,
  stopScheduler,
  restartJob,
  getSchedulerStatus
};
