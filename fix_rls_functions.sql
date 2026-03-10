-- 🛠️ FINAL POWER SYNC & RLS REPAIR 🛠️
-- This script force-syncs your profiles and fixes the visibility bottleneck.

-- 1. Power Sync: Ensure every Auth user has a Profile and Patient record
INSERT INTO public.profiles (id, full_name, email, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'No Name'), 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'patient')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

INSERT INTO public.patients (user_id)
SELECT id FROM public.profiles 
WHERE role = 'patient'
ON CONFLICT (user_id) DO NOTHING;

-- 2. Drop existing functions with CASCADE to reset dependencies
DROP FUNCTION IF EXISTS public.check_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.check_role_in(text[]) CASCADE;

-- 3. Recreate functions with Dual-Check logic (Table + JWT fallback)
-- SECURITY DEFINER allows this to bypass RLS for the check itself.
CREATE OR REPLACE FUNCTION public.check_role(target_role text)
RETURNS boolean AS $$
DECLARE
  db_role text;
  jwt_role text;
BEGIN
  -- Check 1: Profiles table (Primary source for promoted users)
  SELECT role INTO db_role FROM public.profiles WHERE id = auth.uid();
  
  -- Check 2: JWT Metadata (Fallback for new/unsynced users)
  jwt_role := auth.jwt() ->> 'role';
  
  RETURN COALESCE(db_role, jwt_role, 'patient') = target_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_role_in(target_roles text[])
RETURNS boolean AS $$
DECLARE
  db_role text;
  jwt_role text;
BEGIN
  SELECT role INTO db_role FROM public.profiles WHERE id = auth.uid();
  jwt_role := auth.jwt() ->> 'role';
  
  RETURN COALESCE(db_role, jwt_role, 'patient') = ANY(target_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Restore all dependent policies
-- Profiles
DROP POLICY IF EXISTS "Admins full access profiles" ON public.profiles;
CREATE POLICY "Admins full access profiles" ON public.profiles FOR ALL USING (check_role('admin'));
DROP POLICY IF EXISTS "Staff view all profiles" ON public.profiles;
CREATE POLICY "Staff view all profiles" ON public.profiles FOR SELECT USING (check_role('staff'));

-- Patients
DROP POLICY IF EXISTS "Staff/Admin view all patients" ON public.patients;
CREATE POLICY "Staff/Admin view all patients" ON public.patients FOR SELECT USING (check_role_in(ARRAY['staff', 'admin']));

-- Appointments
DROP POLICY IF EXISTS "Staff/Admin manage all appointments" ON public.appointments;
CREATE POLICY "Staff/Admin manage all appointments" ON public.appointments FOR ALL USING (check_role_in(ARRAY['staff', 'admin']));

-- Treatments
DROP POLICY IF EXISTS "Staff/Admin manage all treatments" ON public.treatments;
CREATE POLICY "Staff/Admin manage all treatments" ON public.treatments FOR ALL USING (check_role_in(ARRAY['staff', 'admin']));

-- Medical Reports
DROP POLICY IF EXISTS "Staff/Admin view all reports" ON public.medical_reports;
CREATE POLICY "Staff/Admin view all reports" ON public.medical_reports FOR SELECT USING (check_role_in(ARRAY['staff', 'admin']));

-- Queries
DROP POLICY IF EXISTS "Staff/Admin manage all queries" ON public.queries;
CREATE POLICY "Staff/Admin manage all queries" ON public.queries FOR ALL USING (check_role_in(ARRAY['staff', 'admin']));

-- Doctors
DROP POLICY IF EXISTS "Admins manage doctors" ON public.doctors;
CREATE POLICY "Admins manage doctors" ON public.doctors FOR ALL 
USING (check_role('admin'))
WITH CHECK (check_role('admin'));

-- Verify permissions
GRANT EXECUTE ON FUNCTION public.check_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_role_in(text[]) TO authenticated;
