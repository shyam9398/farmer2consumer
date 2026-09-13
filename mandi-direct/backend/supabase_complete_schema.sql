-- ==============================================================================
-- MANDI DIRECT — COMPLETE PRODUCTION DATABASE SCHEMA & RLS SETUP
-- SIH 2026 Problem Statement 26033: Farm-to-Consumer Wholesale Platform
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. CORE PROFILES TABLE (Linked with Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'FARMER' CHECK (role IN ('FARMER', 'BUYER', 'ADMIN', 'FPO', 'LOGISTICS')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED')),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS ix_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS ix_profiles_role ON public.profiles(role);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. FARMER PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender TEXT CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER')),
    profile_photo_url TEXT,
    address TEXT,
    address_line TEXT,
    village TEXT NOT NULL,
    mandal TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating NUMERIC(3, 2),
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_farmer_profiles_profile_id ON public.farmer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS ix_farmer_profiles_verification_status ON public.farmer_profiles(verification_status);
CREATE INDEX IF NOT EXISTS ix_farmer_profiles_district_state ON public.farmer_profiles(district, state);

DROP TRIGGER IF EXISTS set_farmer_profiles_updated_at ON public.farmer_profiles;
CREATE TRIGGER set_farmer_profiles_updated_at
    BEFORE UPDATE ON public.farmer_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. FARMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_profile_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    total_area NUMERIC(10, 2) NOT NULL CHECK (total_area > 0),
    area_unit TEXT NOT NULL DEFAULT 'ACRE' CHECK (area_unit IN ('ACRE', 'HECTARE')),
    ownership_type TEXT NOT NULL DEFAULT 'OWNED' CHECK (ownership_type IN ('OWNED', 'LEASED', 'FAMILY', 'OTHER')),
    soil_type TEXT,
    irrigation_type TEXT,
    primary_crops JSONB,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    address TEXT,
    address_line TEXT,
    village TEXT NOT NULL,
    mandal TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_farms_farmer_profile_id ON public.farms(farmer_profile_id);
CREATE INDEX IF NOT EXISTS ix_farms_district_state ON public.farms(district, state);

DROP TRIGGER IF EXISTS set_farms_updated_at ON public.farms;
CREATE TRIGGER set_farms_updated_at
    BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. FPO ORGANIZATIONS & MEMBERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fpo_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    registration_number TEXT UNIQUE,
    description TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    village TEXT,
    mandal TEXT,
    district TEXT,
    state TEXT,
    pincode TEXT,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    verification_status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_fpo_organizations_name ON public.fpo_organizations(name);
CREATE INDEX IF NOT EXISTS ix_fpo_organizations_district ON public.fpo_organizations(district);
CREATE INDEX IF NOT EXISTS ix_fpo_organizations_state ON public.fpo_organizations(state);

CREATE TABLE IF NOT EXISTS public.fpo_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpo_id UUID NOT NULL REFERENCES public.fpo_organizations(id) ON DELETE CASCADE,
    farmer_profile_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
    membership_status TEXT NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fpo_farmer_member UNIQUE (fpo_id, farmer_profile_id)
);

CREATE INDEX IF NOT EXISTS ix_fpo_members_fpo_id ON public.fpo_members(fpo_id);
CREATE INDEX IF NOT EXISTS ix_fpo_members_farmer_profile_id ON public.fpo_members(farmer_profile_id);

-- ------------------------------------------------------------------------------
-- 7. PRODUCE LISTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produce_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_profile_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE RESTRICT,
    fpo_id UUID REFERENCES public.fpo_organizations(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('VEGETABLE', 'FRUIT', 'GRAIN', 'PULSE', 'SPICE', 'OILSEED', 'OTHER')),
    variety TEXT,
    description TEXT,
    total_quantity NUMERIC(12, 2) NOT NULL CHECK (total_quantity > 0),
    available_quantity NUMERIC(12, 2) NOT NULL CHECK (available_quantity >= 0),
    reserved_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    sold_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
    quantity_unit TEXT NOT NULL DEFAULT 'KG' CHECK (quantity_unit IN ('KG', 'QUINTAL', 'TON')),
    quality_grade TEXT NOT NULL DEFAULT 'UNGRADED' CHECK (quality_grade IN ('PREMIUM', 'GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED')),
    harvest_date DATE NOT NULL,
    available_from DATE NOT NULL,
    available_until DATE,
    expected_price NUMERIC(12, 2) NOT NULL CHECK (expected_price > 0),
    price_unit TEXT NOT NULL DEFAULT 'PER_KG' CHECK (price_unit IN ('PER_KG', 'PER_QUINTAL', 'PER_TON')),
    minimum_order_quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (minimum_order_quantity > 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'LISTED', 'PARTIALLY_SOLD', 'SOLD_OUT', 'EXPIRED', 'ARCHIVED')),
    verification_notes TEXT,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_available_not_exceed_total CHECK (available_quantity <= total_quantity)
);

CREATE INDEX IF NOT EXISTS ix_produce_listings_farmer_profile_id ON public.produce_listings(farmer_profile_id);
CREATE INDEX IF NOT EXISTS ix_produce_listings_farm_id ON public.produce_listings(farm_id);
CREATE INDEX IF NOT EXISTS ix_produce_listings_status ON public.produce_listings(status);
CREATE INDEX IF NOT EXISTS ix_produce_listings_product_name ON public.produce_listings(product_name);
CREATE INDEX IF NOT EXISTS ix_produce_listings_category ON public.produce_listings(category);
CREATE INDEX IF NOT EXISTS ix_produce_listings_available_qty ON public.produce_listings(available_quantity);
CREATE INDEX IF NOT EXISTS ix_produce_listings_harvest_date ON public.produce_listings(harvest_date);
CREATE INDEX IF NOT EXISTS ix_produce_listings_category_status ON public.produce_listings(category, status);

DROP TRIGGER IF EXISTS set_produce_listings_updated_at ON public.produce_listings;
CREATE TRIGGER set_produce_listings_updated_at
    BEFORE UPDATE ON public.produce_listings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 8. PRODUCE IMAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produce_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produce_listing_id UUID NOT NULL REFERENCES public.produce_listings(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    public_url TEXT,
    file_name TEXT NOT NULL DEFAULT 'photo.jpg',
    mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
    file_size INTEGER NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_produce_images_listing_id ON public.produce_images(produce_listing_id);

-- ------------------------------------------------------------------------------
-- 9. BUYER ADDRESSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buyer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    village TEXT,
    mandal TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    landmark TEXT,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_buyer_addresses_buyer_id ON public.buyer_addresses(buyer_user_id);
CREATE INDEX IF NOT EXISTS ix_buyer_addresses_buyer_default ON public.buyer_addresses(buyer_user_id, is_default);

-- ------------------------------------------------------------------------------
-- 10. SHOPPING CART & ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_shopping_carts_buyer_user_id ON public.shopping_carts(buyer_user_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.shopping_carts(id) ON DELETE CASCADE,
    produce_listing_id UUID NOT NULL REFERENCES public.produce_listings(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cart_items_produce UNIQUE (cart_id, produce_listing_id)
);

CREATE INDEX IF NOT EXISTS ix_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS ix_cart_items_produce_id ON public.cart_items(produce_listing_id);

-- ------------------------------------------------------------------------------
-- 11. ORDERS, ORDER ITEMS, & ORDER STATUS HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    buyer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED')),
    subtotal NUMERIC(12, 2) NOT NULL,
    delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    delivery_address_id UUID REFERENCES public.buyer_addresses(id) ON DELETE SET NULL,
    delivery_address_snapshot JSONB NOT NULL,
    buyer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS ix_orders_buyer_user_id ON public.orders(buyer_user_id);
CREATE INDEX IF NOT EXISTS ix_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS ix_orders_created_at ON public.orders(created_at);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    produce_listing_id UUID NOT NULL REFERENCES public.produce_listings(id) ON DELETE RESTRICT,
    farmer_profile_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    quantity_unit TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS ix_order_items_farmer_profile_id ON public.order_items(farmer_profile_id);
CREATE INDEX IF NOT EXISTS ix_order_items_produce_listing_id ON public.order_items(produce_listing_id);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_order_status_history_order_id ON public.order_status_history(order_id);

-- ------------------------------------------------------------------------------
-- 12. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
    buyer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),
    payment_method TEXT,
    provider TEXT,
    provider_payment_id TEXT,
    provider_order_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS ix_payments_buyer_user_id ON public.payments(buyer_user_id);
CREATE INDEX IF NOT EXISTS ix_payments_status ON public.payments(payment_status);

-- ------------------------------------------------------------------------------
-- 13. COLLECTION POINTS & LOGISTICS FLEET
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collection_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    village TEXT,
    mandal TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    fpo_id UUID REFERENCES public.fpo_organizations(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_collection_points_district ON public.collection_points(district);
CREATE INDEX IF NOT EXISTS ix_collection_points_is_active ON public.collection_points(is_active);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logistics_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_number TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL,
    capacity NUMERIC(10, 2) NOT NULL,
    capacity_unit TEXT NOT NULL DEFAULT 'KG',
    availability_status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'ASSIGNED', 'ON_DELIVERY', 'INACTIVE')),
    current_latitude NUMERIC(9, 6),
    current_longitude NUMERIC(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_vehicles_availability_status ON public.vehicles(availability_status);
CREATE INDEX IF NOT EXISTS ix_vehicles_logistics_user_id ON public.vehicles(logistics_user_id);

CREATE TABLE IF NOT EXISTS public.order_logistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    collection_type TEXT NOT NULL DEFAULT 'COLLECTION_POINT',
    collection_point_id UUID REFERENCES public.collection_points(id) ON DELETE SET NULL,
    pickup_address TEXT,
    pickup_latitude NUMERIC(9, 6),
    pickup_longitude NUMERIC(9, 6),
    delivery_address TEXT,
    delivery_latitude NUMERIC(9, 6),
    delivery_longitude NUMERIC(9, 6),
    assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    assigned_agent_name TEXT,
    assigned_agent_phone TEXT,
    booking_status TEXT NOT NULL DEFAULT 'BOOKING_REQUESTED',
    logistics_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    current_latitude NUMERIC(9, 6),
    current_longitude NUMERIC(9, 6),
    pickup_scheduled_at TIMESTAMPTZ,
    pickup_completed_at TIMESTAMPTZ,
    delivery_started_at TIMESTAMPTZ,
    delivery_completed_at TIMESTAMPTZ,
    estimated_delivery_at TIMESTAMPTZ,
    delivery_notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_order_logistics_order_id ON public.order_logistics(order_id);
CREATE INDEX IF NOT EXISTS ix_order_logistics_status ON public.order_logistics(status);
CREATE INDEX IF NOT EXISTS ix_order_logistics_booking_status ON public.order_logistics(booking_status);

CREATE TABLE IF NOT EXISTS public.logistics_location_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    logistics_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    accuracy NUMERIC,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_logistics_location_updates_order_id ON public.logistics_location_updates(order_id);

CREATE TABLE IF NOT EXISTS public.delivery_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_delivery_events_order_id ON public.delivery_events(order_id);
CREATE INDEX IF NOT EXISTS ix_delivery_events_event_type ON public.delivery_events(event_type);

-- ------------------------------------------------------------------------------
-- 14. FARMER REVIEWS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farmer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_profile_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
    buyer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_buyer_order_item_review UNIQUE (buyer_user_id, order_item_id)
);

CREATE INDEX IF NOT EXISTS ix_farmer_reviews_farmer_profile_id ON public.farmer_reviews(farmer_profile_id);
CREATE INDEX IF NOT EXISTS ix_farmer_reviews_rating ON public.farmer_reviews(rating);

-- ------------------------------------------------------------------------------
-- 15. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON public.notifications(is_read);

-- ------------------------------------------------------------------------------
-- 16. FINANCIAL: FARMER EARNINGS & PAYOUTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farmer_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_profile_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    quantity_unit TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    gross_amount NUMERIC(12, 2) NOT NULL,
    platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    logistics_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    other_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'PENDING_SETTLEMENT' CHECK (status IN ('EXPECTED', 'PENDING_SETTLEMENT', 'AVAILABLE', 'PAID', 'CANCELLED', 'REFUNDED')),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_farmer_earnings_farmer_profile_id ON public.farmer_earnings(farmer_profile_id);
CREATE INDEX IF NOT EXISTS ix_farmer_earnings_status ON public.farmer_earnings(status);

CREATE TABLE IF NOT EXISTS public.farmer_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_profile_id UUID NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE RESTRICT,
    payout_reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    payment_method TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    provider TEXT NOT NULL DEFAULT 'MANDI_DIRECT_PAY',
    provider_payout_id TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_farmer_payouts_farmer_profile_id ON public.farmer_payouts(farmer_profile_id);
CREATE INDEX IF NOT EXISTS ix_farmer_payouts_status ON public.farmer_payouts(status);

-- ------------------------------------------------------------------------------
-- 17. MARKET INTELLIGENCE & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    category TEXT,
    variety TEXT,
    quality_grade TEXT,
    price NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    price_unit TEXT NOT NULL,
    market_name TEXT,
    district TEXT,
    state TEXT,
    source_type TEXT NOT NULL CHECK (source_type IN ('MANDI_DIRECT_TRANSACTION', 'GOVERNMENT_DATA', 'EXTERNAL_API', 'ADMIN_IMPORT', 'OTHER')),
    source_name TEXT,
    source_reference TEXT,
    observation_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_price_observations_product_name ON public.price_observations(product_name);
CREATE INDEX IF NOT EXISTS ix_price_observations_date ON public.price_observations(observation_date);

CREATE TABLE IF NOT EXISTS public.demand_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    category TEXT,
    district TEXT,
    state TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    order_count INTEGER NOT NULL DEFAULT 0,
    quantity_sold NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unique_buyers INTEGER NOT NULL DEFAULT 0,
    demand_score NUMERIC(5, 2),
    demand_level TEXT,
    trend TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_demand_snapshots_product_name ON public.demand_snapshots(product_name);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS ix_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_verification_records_entity ON public.verification_records(entity_type, entity_id);

-- ==============================================================================
-- 18. SUPABASE STORAGE BUCKETS & POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('produce-images', 'produce-images', true),
    ('farmer-profiles', 'farmer-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: produce-images
DROP POLICY IF EXISTS "Public can view produce images" ON storage.objects;
CREATE POLICY "Public can view produce images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'produce-images');

DROP POLICY IF EXISTS "Farmers can upload own produce images" ON storage.objects;
CREATE POLICY "Farmers can upload own produce images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'produce-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Farmers can delete own produce images" ON storage.objects;
CREATE POLICY "Farmers can delete own produce images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'produce-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies: farmer-profiles
DROP POLICY IF EXISTS "Public can view farmer profile photos" ON storage.objects;
CREATE POLICY "Public can view farmer profile photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'farmer-profiles');

DROP POLICY IF EXISTS "Farmers can upload own profile photos" ON storage.objects;
CREATE POLICY "Farmers can upload own profile photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'farmer-profiles' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ==============================================================================
-- 19. ROW LEVEL SECURITY (RLS) POLICIES ON ALL TABLES
-- ==============================================================================

-- Enable RLS across all application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpo_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;

-- Helper function to check if caller is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()::text AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid()::text);

-- Farmer Profiles Policies
CREATE POLICY "Public can view verified farmer profile overview"
    ON public.farmer_profiles FOR SELECT
    TO public
    USING (verification_status = 'VERIFIED' OR profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text
    ) OR public.is_admin());

CREATE POLICY "Farmers can update own farmer profile"
    ON public.farmer_profiles FOR UPDATE
    TO authenticated
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text
    ));

-- Farms Policies
CREATE POLICY "Farmers can manage their own farms"
    ON public.farms FOR ALL
    TO authenticated
    USING (farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    ) OR public.is_admin());

-- Produce Listings Policies
CREATE POLICY "Public can view listed and approved produce"
    ON public.produce_listings FOR SELECT
    TO public
    USING (status IN ('APPROVED', 'LISTED', 'PARTIALLY_SOLD', 'SOLD_OUT') OR farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    ) OR public.is_admin());

CREATE POLICY "Farmers can manage own produce listings"
    ON public.produce_listings FOR ALL
    TO authenticated
    USING (farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    ) OR public.is_admin());

-- Produce Images Policies
CREATE POLICY "Public can view produce images"
    ON public.produce_images FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Farmers can manage own produce images"
    ON public.produce_images FOR ALL
    TO authenticated
    USING (produce_listing_id IN (
        SELECT pl.id FROM public.produce_listings pl
        JOIN public.farmer_profiles fp ON pl.farmer_profile_id = fp.id
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    ) OR public.is_admin());

-- Buyer Addresses Policies
CREATE POLICY "Buyers can manage own addresses"
    ON public.buyer_addresses FOR ALL
    TO authenticated
    USING (buyer_user_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text
    ) OR public.is_admin());

-- Shopping Cart & Items Policies
CREATE POLICY "Buyers can manage own shopping cart"
    ON public.shopping_carts FOR ALL
    TO authenticated
    USING (buyer_user_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text
    ));

CREATE POLICY "Buyers can manage own cart items"
    ON public.cart_items FOR ALL
    TO authenticated
    USING (cart_id IN (
        SELECT sc.id FROM public.shopping_carts sc
        JOIN public.profiles p ON sc.buyer_user_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    ));

-- Orders & Order Items Policies
CREATE POLICY "Buyers and Farmers can view their authorized orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (
        buyer_user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text)
        OR id IN (
            SELECT oi.order_id FROM public.order_items oi
            JOIN public.farmer_profiles fp ON oi.farmer_profile_id = fp.id
            JOIN public.profiles p ON fp.profile_id = p.id
            WHERE p.auth_user_id = auth.uid()::text
        )
        OR public.is_admin()
    );

CREATE POLICY "Order items visible to participating buyer and farmer"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        order_id IN (
            SELECT id FROM public.orders
            WHERE buyer_user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text)
        )
        OR farmer_profile_id IN (
            SELECT fp.id FROM public.farmer_profiles fp
            JOIN public.profiles p ON fp.profile_id = p.id
            WHERE p.auth_user_id = auth.uid()::text
        )
        OR public.is_admin()
    );

-- Vehicles & Logistics Policies
CREATE POLICY "Logistics users can manage their vehicles"
    ON public.vehicles FOR ALL
    TO authenticated
    USING (logistics_user_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text
    ) OR public.is_admin());

CREATE POLICY "Logistics bookings visible to assigned logistics or order buyer"
    ON public.order_logistics FOR SELECT
    TO authenticated
    USING (
        logistics_user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text)
        OR order_id IN (
            SELECT id FROM public.orders WHERE buyer_user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text)
        )
        OR public.is_admin()
    );

-- Farmer Reviews Policies
CREATE POLICY "Public can view farmer reviews"
    ON public.farmer_reviews FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Buyers can submit reviews for their delivered items"
    ON public.farmer_reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        buyer_user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text)
    );

-- Notifications Policies
CREATE POLICY "Users can access their own notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (user_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text
    ));

-- Farmer Earnings & Payouts Policies
CREATE POLICY "Farmers can view their own earnings"
    ON public.farmer_earnings FOR SELECT
    TO authenticated
    USING (farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    ) OR public.is_admin());

CREATE POLICY "Farmers can view and request their payouts"
    ON public.farmer_payouts FOR ALL
    TO authenticated
    USING (farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    ) OR public.is_admin());

-- Price Observations & Demand Snapshots
CREATE POLICY "Public can view price observations and demand trends"
    ON public.price_observations FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Public can view demand snapshots"
    ON public.demand_snapshots FOR SELECT
    TO public
    USING (true);

-- System Audit Logs & Verification Records
CREATE POLICY "Admins can view and manage audit logs"
    ON public.audit_logs FOR ALL
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can view and manage verification records"
    ON public.verification_records FOR ALL
    TO authenticated
    USING (public.is_admin());
