-- ==============================================================================
-- Mandi Direct: Phase 13 RLS & Permissions Setup (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Enable RLS on buyer_preferences table
ALTER TABLE buyer_preferences ENABLE ROW LEVEL SECURITY;

-- 2. Buyer Preferences RLS
CREATE POLICY "Buyers can view their own preferences"
  ON buyer_preferences FOR SELECT
  USING (buyer_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Buyers can insert their own preferences"
  ON buyer_preferences FOR INSERT
  WITH CHECK (buyer_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Buyers can update their own preferences"
  ON buyer_preferences FOR UPDATE
  USING (buyer_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Buyers can delete their own preferences"
  ON buyer_preferences FOR DELETE
  USING (buyer_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

-- Admins can view all preferences for auditing
CREATE POLICY "Admins can view all preferences"
  ON buyer_preferences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = auth.uid()::text AND role = 'ADMIN'
  ));
