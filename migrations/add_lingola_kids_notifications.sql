-- ============================================================
-- Migration: Lingola Kids Bildirim Altyapısı Kurulumu
-- 
-- 1. user_app_activity tablosu: kullanıcının son uygulama açılış zamanı
-- 2. notification_history.notification_type enum'unu güncelle
-- 3. notification_settings tablosundan kullanılmayan alanları düzenle
-- ============================================================

-- 1. Kullanıcı uygulama aktivite tablosu
-- Servis bu tabloyu sorgulayarak aktivite katmanını belirler.
CREATE TABLE IF NOT EXISTS `user_app_activity` (
  `id`           INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      INT(11) UNSIGNED NOT NULL,
  `last_open_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user` (`user_id`),
  KEY `idx_last_open` (`last_open_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Kullanıcının en son uygulamayı açtığı zaman (Lingola Kids)';

-- Foreign key (users tablosu mevcutsa)
ALTER TABLE `user_app_activity`
  ADD CONSTRAINT `fk_uaa_user`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- 2. notification_history tablosundaki notification_type enum'unu güncelle
ALTER TABLE `notification_history`
  MODIFY COLUMN `notification_type` ENUM(
    'lingola_active_evening',
    'lingola_semi_active_afternoon',
    'lingola_semi_active_evening',
    'lingola_passive_evening',
    'custom'
  ) NOT NULL;

-- 3. notification_settings tablosundan reminder_interval sütununu kaldır
--    (artık interval yerine aktivite katmanı kullanılıyor)
ALTER TABLE `notification_settings`
  DROP COLUMN IF EXISTS `reminder_interval`;

-- ============================================================
-- Otomatik doldurmak için mevcut users → user_app_activity
-- (opsiyonel: mevcut kullanıcılar için başlangıç verisi)
-- ============================================================
INSERT IGNORE INTO `user_app_activity` (`user_id`, `last_open_at`)
SELECT `id`, `last_login_at`
FROM `users`
WHERE `last_login_at` IS NOT NULL
  AND `is_active` = 1;
