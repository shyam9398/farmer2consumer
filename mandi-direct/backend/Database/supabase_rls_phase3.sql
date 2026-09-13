-- =============================================================================
-- Mandi Direct (SIH 2026 Problem Statement 26033)
-- Phase 3: Farmer Profile + Farm Management
-- Database Schema & Row Level Security (RLS) Policies
-- =============================================================================

-- Enable pgcrypto / uuid-ossp if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Table: farmer_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
    id VARCHAR(36) PRIMARY KEY,
    profile_id VARCHAR(36) NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(32) CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER')),
    profile_photo_url TEXT,
    address_line TEXT NOT NULL,
    village VARCHAR(100) NOT NULL,
    mandal VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verification_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_farmer_profiles_profile_id ON public.farmer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS ix_farmer_profiles_verification_status ON public.farmer_profiles(verification_status);
CREATE INDEX IF NOT EXISTS ix_farmer_profiles_district_state ON public.farmer_profiles(district, state);

-- -----------------------------------------------------------------------------
-- 2. Table: farms
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farms (
    id VARCHAR(36) PRIMARY KEY,
    farmer_profile_id VARCHAR(36) NOT NULL REFERENCES public.farmer_profiles(id) ON DELETE CASCADE,
    farm_name VARCHAR(150) NOT NULL,
    total_area NUMERIC(10, 2) NOT NULL CHECK (total_area > 0),
    area_unit VARCHAR(20) NOT NULL DEFAULT 'ACRE' CHECK (area_unit IN ('ACRE', 'HECTARE')),
    ownership_type VARCHAR(20) NOT NULL DEFAULT 'OWNED' CHECK (ownership_type IN ('OWNED', 'LEASED', 'FAMILY', 'OTHER')),
    soil_type VARCHAR(30) CHECK (soil_type IS NULL OR soil_type IN ('RED', 'BLACK', 'ALLUVIAL', 'LOAMY', 'SANDY', 'CLAY', 'OTHER')),
    irrigation_type VARCHAR(30) CHECK (irrigation_type IS NULL OR irrigation_type IN ('RAINFED', 'BOREWELL', 'CANAL', 'DRIP', 'SPRINKLER', 'OTHER')),
    primary_crops JSONB DEFAULT '[]'::jsonb,
    latitude NUMERIC(9, 6) CHECK (latitude IS NULL OR (latitude >= -90.0 AND latitude <= 90.0)),
    longitude NUMERIC(9, 6) CHECK (longitude IS NULL OR (longitude >= -180.0 AND longitude <= 180.0)),
    address_line TEXT,
    village VARCHAR(100) NOT NULL,
    mandal VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_farms_farmer_profile_id ON public.farms(farmer_profile_id);
CREATE INDEX IF NOT EXISTS ix_farms_district_state ON public.farms(district, state);

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Enablement
-- -----------------------------------------------------------------------------
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Farmer Profile Policies
CREATE POLICY "Farmers can view their own farmer profile"
ON public.farmer_profiles
FOR SELECT
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text
    )
);

CREATE POLICY "Farmers can create their own farmer profile"
ON public.farmer_profiles
FOR INSERT
TO authenticated
WITH CHECK (
    profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text
    )
);

CREATE POLICY "Farmers can update their own farmer profile"
ON public.farmer_profiles
FOR UPDATE
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text
    )
);

CREATE POLICY "Admins can view and manage all farmer profiles"
ON public.farmer_profiles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE auth_user_id = auth.uid()::text AND role = 'ADMIN'
    )
);

-- Farms Policies
CREATE POLICY "Farmers can view their own farms"
ON public.farms
FOR SELECT
TO authenticated
USING (
    farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

CREATE POLICY "Farmers can insert their own farms"
ON public.farms
FOR INSERT
TO authenticated
WITH CHECK (
    farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

CREATE POLICY "Farmers can update their own farms"
ON public.farms
FOR UPDATE
TO authenticated
USING (
    farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

CREATE POLICY "Farmers can delete their own farms"
ON public.farms
FOR DELETE
TO authenticated
USING (
    farmer_profile_id IN (
        SELECT fp.id FROM public.farmer_profiles fp
        JOIN public.profiles p ON fp.profile_id = p.id
        WHERE p.auth_user_id = auth.uid()::text
    )
);

CREATE POLICY "Admins can view all farms"
ON public.farms
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE auth_user_id = auth.uid()::text AND role = 'ADMIN'
    )
);

-- -----------------------------------------------------------------------------
-- 4. Supabase Storage: farmer-profiles Bucket
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('farmer-profiles', 'farmer-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Allow authenticated farmers to upload their photo
CREATE POLICY "Allow authenticated users to upload avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'farmer-profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS: Allow authenticated users to update their avatar
CREATE POLICY "Allow authenticated users to update avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'farmer-profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS: Allow public access to view profile images
CREATE POLICY "Allow public access to view farmer avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'farmer-profiles');
