-- ==============================================================================
-- Mandi Direct: Phase 14 RLS & Permissions Setup (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Enable RLS on notifications and notification_preferences tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- 2. Notifications RLS Policies
-- Users can view only their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (recipient_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

-- Users can update only their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their own notifications read status"
  ON notifications FOR UPDATE
  USING (recipient_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ))
  WITH CHECK (recipient_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

-- Admins can view notifications for platform auditing and debugging
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid()::text AND role = 'ADMIN'
  ));

-- 3. Notification Preferences RLS Policies
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

-- Admins can view all preferences for auditing
CREATE POLICY "Admins can view all notification preferences"
  ON notification_preferences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid()::text AND role = 'ADMIN'
  ));
