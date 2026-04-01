-- S 級升級：數據庫優化遷移腳本
-- 添加關鍵索引以提升查詢性能

-- 1. band_members 表索引
ALTER TABLE band_members ADD INDEX idx_name (name);

-- 2. band_events 表索引
ALTER TABLE band_events ADD INDEX idx_date (date);
ALTER TABLE band_events ADD INDEX idx_type (type);
ALTER TABLE band_events ADD INDEX idx_date_type (date, type);

-- 3. band_attendance 表索引（最重要）
ALTER TABLE band_attendance ADD INDEX idx_eventId (eventId);
ALTER TABLE band_attendance ADD INDEX idx_memberId (memberId);
ALTER TABLE band_attendance ADD INDEX idx_event_member (eventId, memberId);
ALTER TABLE band_attendance ADD INDEX idx_status (status);

-- 4. band_holidays 表索引
ALTER TABLE band_holidays ADD INDEX idx_date (date);

-- 5. band_system_data 表索引
ALTER TABLE band_system_data ADD INDEX idx_isSetup (isSetup);

-- 6. push_subscriptions 表索引（如果存在）
-- ALTER TABLE push_subscriptions ADD INDEX idx_user_id (user_id);
-- ALTER TABLE push_subscriptions ADD INDEX idx_endpoint (endpoint);

-- 驗證索引是否成功創建
SHOW INDEX FROM band_members;
SHOW INDEX FROM band_events;
SHOW INDEX FROM band_attendance;
SHOW INDEX FROM band_holidays;
SHOW INDEX FROM band_system_data;
