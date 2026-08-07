-- TNHS LIKHA-SIS Enrollment Module Migration
-- DepEd Order No. 015, s. 2026 Compliant

-- 1. Create Enum for Enrollment Request Status
CREATE TYPE enrollment_request_status AS ENUM (
  'pending_review',
  'confirmed',
  'rejected'
);

-- 2. Create enrollment_requests Table
CREATE TABLE enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_file_url TEXT NOT NULL,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status enrollment_request_status NOT NULL DEFAULT 'pending_review',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security on enrollment_requests
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for enrollment_requests
CREATE POLICY "Principal and ICT Coordinator can view all enrollment requests"
  ON enrollment_requests FOR SELECT
  USING (get_auth_user_role() IN ('principal', 'ict_coordinator'));

CREATE POLICY "ICT Coordinator can insert enrollment requests"
  ON enrollment_requests FOR INSERT
  WITH CHECK (get_auth_user_role() = 'ict_coordinator');

CREATE POLICY "ICT Coordinator can update enrollment requests"
  ON enrollment_requests FOR UPDATE
  USING (get_auth_user_role() = 'ict_coordinator')
  WITH CHECK (get_auth_user_role() = 'ict_coordinator');

CREATE POLICY "Submitting user can view own enrollment requests"
  ON enrollment_requests FOR SELECT
  USING (submitted_by = auth.uid());

-- 5. Create Private Storage Bucket 'sf10-uploads'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sf10-uploads',
  'sf10-uploads',
  false,
  10485760, -- 10 MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage RLS Policies for 'sf10-uploads' Bucket
CREATE POLICY "ICT Coordinator and Principal can read sf10-uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'sf10-uploads' 
    AND get_auth_user_role() IN ('ict_coordinator', 'principal')
  );

CREATE POLICY "ICT Coordinator and Principal can write sf10-uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sf10-uploads' 
    AND get_auth_user_role() IN ('ict_coordinator', 'principal')
  );

CREATE POLICY "ICT Coordinator and Principal can update sf10-uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'sf10-uploads' 
    AND get_auth_user_role() IN ('ict_coordinator', 'principal')
  )
  WITH CHECK (
    bucket_id = 'sf10-uploads' 
    AND get_auth_user_role() IN ('ict_coordinator', 'principal')
  );

CREATE POLICY "ICT Coordinator and Principal can delete sf10-uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'sf10-uploads' 
    AND get_auth_user_role() IN ('ict_coordinator', 'principal')
  );
