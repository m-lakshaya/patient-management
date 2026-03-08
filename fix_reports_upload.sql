-- 🛠️ PATCH SCRIPT to fix Medical Report Uploads

-- 1. Ensure the medical-reports bucket exists 
-- (If the bucket doesn't exist, Supabase throws an RLS error)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-reports', 'medical-reports', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop the existing storage policies
DROP POLICY IF EXISTS "Patients can upload own reports" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own reports" ON storage.objects;
DROP POLICY IF EXISTS "Staff and Admins can view all reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Staff and Admins can view all files" ON storage.objects;

-- 3. Create simpler Storage Policies
-- Allow any authenticated user to upload to this bucket
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-reports');

-- Allow users to view files they uploaded (Supabase tracks this via the 'owner' column)
CREATE POLICY "Users can view their own uploaded files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'medical-reports' AND owner = auth.uid());

-- Allow staff and admins to view all files
CREATE POLICY "Staff and Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'admin')
);

-- 4. Ensure the database insert policy is applied
DROP POLICY IF EXISTS "Patients insert own reports" ON public.medical_reports;
CREATE POLICY "Patients insert own reports" ON public.medical_reports FOR INSERT
TO authenticated
WITH CHECK (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
