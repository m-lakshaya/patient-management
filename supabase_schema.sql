-- 🚨 MASTER RESET SCRIPT 🚨
-- This script will wipe existing tables and recreate them correctly to fix type mismatches.

-- 1. Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Drop tables in correct order (children first)
DROP TABLE IF EXISTS queries;
DROP TABLE IF EXISTS medical_reports;
DROP TABLE IF EXISTS treatments;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS profiles;

-- 3. Drop the custom type if it exists
DROP TYPE IF EXISTS user_role;

-- 4. Helper Functions for RLS
DROP FUNCTION IF EXISTS public.check_role(text);
DROP FUNCTION IF EXISTS public.check_role_in(text[]);

CREATE OR REPLACE FUNCTION public.check_role(target_role text)
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = target_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_role_in(target_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = ANY(target_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate Tables
-- 1️⃣ Profiles Table (Using TEXT for role to avoid ENUM issues)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'staff', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2️⃣ Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3️⃣ Doctors Table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4️⃣ Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5️⃣ Treatments Table
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  diagnosis TEXT,
  prescription TEXT,
  treatment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6️⃣ Medical Reports Table
CREATE TABLE medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7️⃣ Queries Table
CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'completed')) DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id),
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- 6. RLS-- Use safer, non-recursive policies using JWT metadata roles
-- Profiles
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins full access profiles" ON profiles FOR ALL USING (check_role('admin'));
CREATE POLICY "Staff view all profiles" ON profiles FOR SELECT USING (check_role('staff'));

-- Patients
CREATE POLICY "Patients view own info" ON patients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Patients update own info" ON patients FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Staff/Admin view all patients" ON patients FOR SELECT USING (check_role_in(ARRAY['staff', 'admin']));

-- Appointments
CREATE POLICY "Patients view own appointments" ON appointments FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Patients create own appointments" ON appointments FOR INSERT WITH CHECK (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Staff/Admin manage all appointments" ON appointments FOR ALL USING (public.check_role_in(ARRAY['staff', 'admin']));

-- Treatments
CREATE POLICY "Patients view own treatments" ON treatments FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Staff/Admin manage all treatments" ON treatments FOR ALL USING (check_role_in(ARRAY['staff', 'admin']));

-- Medical Reports
CREATE POLICY "Patients view own reports" ON medical_reports FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Patients insert own reports" ON medical_reports FOR INSERT WITH CHECK (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Staff/Admin view all reports" ON medical_reports FOR SELECT USING (check_role_in(ARRAY['staff', 'admin']));

-- Queries
CREATE POLICY "Patients view own queries" ON queries FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Patients create own queries" ON queries FOR INSERT WITH CHECK (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
CREATE POLICY "Staff/Admin manage all queries" ON queries FOR ALL USING (check_role_in(ARRAY['staff', 'admin']));

-- Doctors
CREATE POLICY "Anyone can view doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Admins manage doctors" ON doctors FOR ALL 
USING (check_role('admin'))
WITH CHECK (check_role('admin'));

-- 7. Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'No Name'), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'patient')
  )
  ON CONFLICT (id) DO NOTHING;
  
  IF (COALESCE(new.raw_user_meta_data->>'role', 'patient') = 'patient') THEN
    INSERT INTO public.patients (user_id) 
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. 🛠️ SYNC EXISTING USERS (Run this to fix any users created during the error phase)
INSERT INTO public.profiles (id, full_name, email, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'No Name'), 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'patient')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.patients (user_id)
SELECT id FROM public.profiles 
WHERE role = 'patient'
ON CONFLICT (user_id) DO NOTHING;

-- 9. Storage Policies (Run these in the SQL Editor after creating the 'medical-reports' bucket)
-- Note: Buckets must be created manually in the Supabase Dashboard, or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('medical-reports', 'medical-reports', false);

-- Policy for Patients to upload their own reports
CREATE POLICY "Patients can upload own reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = (SELECT id::text FROM patients WHERE user_id = auth.uid())
);

-- Policy for Patients to view their own reports
CREATE POLICY "Patients can view own reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = (SELECT id::text FROM patients WHERE user_id = auth.uid())
);

-- Policy for Staff/Admins to view all reports
CREATE POLICY "Staff and Admins can view all reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('staff', 'admin')
);
