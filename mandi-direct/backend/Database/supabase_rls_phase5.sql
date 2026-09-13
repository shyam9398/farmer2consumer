-- =============================================================================
-- Mandi Direct — Phase 5: Product Photos & Media Management
-- Supabase Storage & PostgreSQL Row Level Security (RLS) Policies
-- =============================================================================

-- 1. Create Dedicated 'produce-images' Storage Bucket
-- Enables public read for marketplace buyers while isolating uploads per farmer user ID.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'produce-images',
    'produce-images',
    true,
    10485760, -- 10 MB per image maximum
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage Objects RLS Policies
-- Enforce path-based tenant isolation: produce-images/{user_id}/{produce_id}/{image_id}.ext

-- Allow public read access to produce images
CREATE POLICY "Public Read Access for Produce Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'produce-images');

-- Allow authenticated farmers to upload photos only into their own user folder
CREATE POLICY "Farmers Can Upload to Their Own Produce Folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'produce-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated farmers to update only photos in their own folder
CREATE POLICY "Farmers Can Update Their Own Produce Photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'produce-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated farmers to delete photos only from their own folder
CREATE POLICY "Farmers Can Delete Their Own Produce Photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'produce-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. PostgreSQL Table RLS Policies for 'produce_images'
ALTER TABLE public.produce_images ENABLE ROW LEVEL SECURITY;

-- Farmers can view images attached to their own produce lots
CREATE POLICY "Farmers Can View Their Own Produce Images"
ON public.produce_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.produce_listings pl
        JOIN public.farmer_profiles fp ON pl.farmer_profile_id = fp.id
        WHERE pl.id = produce_images.produce_listing_id
        AND fp.profile_id = auth.uid()
    )
    OR
    -- Or if the produce is approved/listed for public marketplace
    EXISTS (
        SELECT 1 FROM public.produce_listings pl
        WHERE pl.id = produce_images.produce_listing_id
        AND pl.status IN ('APPROVED', 'LISTED', 'PARTIALLY_SOLD')
    )
);

-- Farmers can insert images into their own produce listings
CREATE POLICY "Farmers Can Insert Produce Images For Own Listings"
ON public.produce_images FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.produce_listings pl
        JOIN public.farmer_profiles fp ON pl.farmer_profile_id = fp.id
        WHERE pl.id = produce_images.produce_listing_id
        AND fp.profile_id = auth.uid()
    )
);

-- Farmers can update image metadata for their own listings
CREATE POLICY "Farmers Can Update Produce Images For Own Listings"
ON public.produce_images FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.produce_listings pl
        JOIN public.farmer_profiles fp ON pl.farmer_profile_id = fp.id
        WHERE pl.id = produce_images.produce_listing_id
        AND fp.profile_id = auth.uid()
    )
);

-- Farmers can delete produce images from their own listings
CREATE POLICY "Farmers Can Delete Produce Images For Own Listings"
ON public.produce_images FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.produce_listings pl
        JOIN public.farmer_profiles fp ON pl.farmer_profile_id = fp.id
        WHERE pl.id = produce_images.produce_listing_id
        AND fp.profile_id = auth.uid()
    )
);
