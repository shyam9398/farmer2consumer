-- =============================================================================
-- Mandi Direct (SIH 2026 Problem Statement 26033)
-- Phase 4: Add Produce & Produce Management
-- Database Schema & Row Level Security (RLS) Policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: produce_listings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produce_listings (
    id VARCHAR(36) PRIMARY KEY,
    farmer_profile_id VARCHAR(36) NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
    farm_id VARCHAR(36) NOT NULL REFERENCES public.farms(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'VEGETABLE' CHECK (category IN ('VEGETABLE', 'FRUIT', 'GRAIN', 'PULSE', 'SPICE', 'OILSEED', 'OTHER')),
    variety VARCHAR(100),
    description TEXT,
    total_quantity NUMERIC(12, 2) NOT NULL CHECK (total_quantity > 0),
    available_quantity NUMERIC(12, 2) NOT NULL CHECK (available_quantity >= 0),
    reserved_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    sold_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
    quantity_unit VARCHAR(20) NOT NULL DEFAULT 'KG' CHECK (quantity_unit IN ('KG', 'QUINTAL', 'TON')),
    quality_grade VARCHAR(30) NOT NULL DEFAULT 'UNGRADED' CHECK (quality_grade IN ('PREMIUM', 'GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED')),
    harvest_date DATE NOT NULL,
    available_from DATE NOT NULL,
    available_until DATE,
    expected_price NUMERIC(10, 2) NOT NULL CHECK (expected_price > 0),
    price_unit VARCHAR(20) NOT NULL DEFAULT 'PER_KG' CHECK (price_unit IN ('PER_KG', 'PER_QUINTAL', 'PER_TON')),
    minimum_order_quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (minimum_order_quantity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'LISTED', 'PARTIALLY_SOLD', 'SOLD_OUT', 'EXPIRED', 'ARCHIVED')),
    verification_notes TEXT,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_produce_listings_farmer_profile_id ON public.produce_listings(farmer_profile_id);
CREATE INDEX IF NOT EXISTS ix_produce_listings_farm_id ON public.produce_listings(farm_id);
CREATE INDEX IF NOT EXISTS ix_produce_listings_product_name ON public.produce_listings(product_name);
CREATE INDEX IF NOT EXISTS ix_produce_listings_status ON public.produce_listings(status);
CREATE INDEX IF NOT EXISTS ix_produce_listings_category_status ON public.produce_listings(category, status);

-- -----------------------------------------------------------------------------
-- 2. Table: produce_images
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produce_images (
    id VARCHAR(36) PRIMARY KEY,
    produce_listing_id VARCHAR(36) NOT NULL REFERENCES public.produce_listings(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_produce_images_produce_listing_id ON public.produce_images(produce_listing_id);

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Enablement
-- -----------------------------------------------------------------------------
ALTER TABLE public.produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce_images ENABLE ROW LEVEL SECURITY;

-- Farmers can view their own produce listings
CREATE POLICY "Farmers can view their own produce listings"
ON public.produce_listings
FOR SELECT
TO authenticated
USING (
    farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

-- Farmers can insert their own produce listings
CREATE POLICY "Farmers can insert their own produce listings"
ON public.produce_listings
FOR INSERT
TO authenticated
WITH CHECK (
    farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

-- Farmers can update their own draft/rejected produce listings
CREATE POLICY "Farmers can update their own produce listings"
ON public.produce_listings
FOR UPDATE
TO authenticated
USING (
    farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

-- Farmers can delete their own draft produce listings
CREATE POLICY "Farmers can delete their own draft produce listings"
ON public.produce_listings
FOR DELETE
TO authenticated
USING (
    status = 'DRAFT' AND
    farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

-- Admins can view and moderate all produce listings
CREATE POLICY "Admins can view and manage all produce listings"
ON public.produce_listings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()::text AND role = 'ADMIN'
    )
);

-- Produce Images RLS
CREATE POLICY "Farmers can view their own produce images"
ON public.produce_images
FOR SELECT
TO authenticated
USING (
    produce_listing_id IN (
        SELECT pl.id FROM public.produce_listings pl
        JOIN public.farmer_profiles fp ON pl.farmer_profile_id = fp.id
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

CREATE POLICY "Farmers can insert images for their own produce"
ON public.produce_images
FOR INSERT
TO authenticated
WITH CHECK (
    produce_listing_id IN (
        SELECT pl.id FROM public.produce_listings pl
        JOIN public.farmer_profiles fp ON pl.farmer_profile_id = fp.id
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

CREATE POLICY "Farmers can delete images for their own produce"
ON public.produce_images
FOR DELETE
TO authenticated
USING (
    produce_listing_id IN (
        SELECT pl.id FROM public.produce_listings pl
        JOIN public.farmer_profiles fp ON pl.farmer_profile_id = fp.id
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

-- -----------------------------------------------------------------------------
-- 4. Supabase Storage: produce-images Bucket
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('produce-images', 'produce-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Allow authenticated farmers to upload produce photos
CREATE POLICY "Allow authenticated users to upload produce photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'produce-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS: Allow authenticated users to update produce photos
CREATE POLICY "Allow authenticated users to update produce photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'produce-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS: Public read access to produce photos
CREATE POLICY "Allow public access to view produce photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'produce-images');
