-- Push Notification Infrastructure
-- Mobile push notification support with device management, notification history, and preferences

-- Device tokens for push delivery
CREATE TABLE IF NOT EXISTS push_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_name TEXT,
  device_id TEXT,
  os_version TEXT,
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push notification history
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'read', 'dismissed')),
  group_key TEXT,
  deep_link TEXT,
  data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

-- Notification preferences per user per company
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enabled BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  category_preferences JSONB DEFAULT '{}',
  priority_threshold TEXT DEFAULT 'low' CHECK (priority_threshold IN ('low', 'normal', 'high', 'critical')),
  badge_enabled BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_devices_company ON push_devices(company_id);
CREATE INDEX IF NOT EXISTS idx_push_devices_user ON push_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_push_devices_token ON push_devices(token);
CREATE INDEX IF NOT EXISTS idx_push_devices_active ON push_devices(company_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_push_notifications_company ON push_notifications(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_notifications_user ON push_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_notifications_category ON push_notifications(category);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_push_notifications_unread ON push_notifications(company_id, user_id) WHERE status IN ('pending', 'delivered');

CREATE INDEX IF NOT EXISTS idx_notification_preferences_company ON notification_preferences(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- RLS
ALTER TABLE push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'push_devices' AND policyname = 'users_own_push_devices') THEN
    CREATE POLICY users_own_push_devices ON push_devices
      FOR ALL USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'push_notifications' AND policyname = 'users_own_push_notifications') THEN
    CREATE POLICY users_own_push_notifications ON push_notifications
      FOR ALL USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'users_own_preferences') THEN
    CREATE POLICY users_own_preferences ON notification_preferences
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;
