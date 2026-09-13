-- ==============================================================================
-- Mandi Direct: Phase 8 RLS & Permissions Setup (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Enable RLS on newly created Phase 8 tables
ALTER TABLE buyer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- 2. Buyer Addresses RLS
CREATE POLICY "Buyers can view their own saved addresses"
  ON buyer_addresses FOR SELECT
  USING (buyer_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Buyers can manage their own addresses"
  ON buyer_addresses FOR ALL
  USING (buyer_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

-- 3. Shopping Cart RLS
CREATE POLICY "Buyers can view their own shopping cart"
  ON shopping_carts FOR SELECT
  USING (buyer_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Buyers can manage their own shopping cart"
  ON shopping_carts FOR ALL
  USING (buyer_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Buyers can view and modify cart items"
  ON cart_items FOR ALL
  USING (cart_id IN (
    SELECT sc.id FROM shopping_carts sc
    JOIN profiles p ON sc.buyer_user_id = p.id
    WHERE p.auth_user_id = auth.uid()::text
  ));

-- 4. Orders & Order Items RLS
CREATE POLICY "Buyers can view their own orders"
  ON orders FOR SELECT
  USING (buyer_user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Farmers can view orders containing their produce"
  ON orders FOR SELECT
  USING (id IN (
    SELECT oi.order_id FROM order_items oi
    JOIN farmer_profiles fp ON oi.farmer_profile_id = fp.id
    JOIN profiles p ON fp.profile_id = p.id
    WHERE p.auth_user_id = auth.uid()::text
  ));

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE auth_user_id = auth.uid()::text AND role = 'ADMIN'
  ));

CREATE POLICY "Farmers can only view their own produce items in orders"
  ON order_items FOR SELECT
  USING (farmer_profile_id IN (
    SELECT fp.id FROM farmer_profiles fp
    JOIN profiles p ON fp.profile_id = p.id
    WHERE p.auth_user_id = auth.uid()::text
  ) OR order_id IN (
    SELECT o.id FROM orders o
    JOIN profiles p ON o.buyer_user_id = p.id
    WHERE p.auth_user_id = auth.uid()::text
  ));
