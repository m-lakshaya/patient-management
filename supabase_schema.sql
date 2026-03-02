-- 1️⃣ Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'staff', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2️⃣ Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3️⃣ Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4️⃣ Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5️⃣ Treatments Table
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  diagnosis TEXT,
  prescription TEXT,
  treatment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6️⃣ Medical Reports Table
CREATE TABLE IF NOT EXISTS medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7️⃣ Queries Table
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved')) DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id), -- staff id
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Using DROP IF EXISTS to make it re-runnable)

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'staff')
);

-- Patients
DROP POLICY IF EXISTS "Patients view their own info" ON patients;
CREATE POLICY "Patients view their own info" ON patients FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Patients update their own info" ON patients;
CREATE POLICY "Patients update their own info" ON patients FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Staff view all patients" ON patients;
CREATE POLICY "Staff view all patients" ON patients FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin'))
);

-- Appointments
DROP POLICY IF EXISTS "Patients view their own appointments" ON appointments;
CREATE POLICY "Patients view their own appointments" ON appointments FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Staff/Admin manage all appointments" ON appointments;
CREATE POLICY "Staff/Admin manage all appointments" ON appointments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin'))
);

-- Treatments
DROP POLICY IF EXISTS "Patients view their own treatments" ON treatments;
CREATE POLICY "Patients view their own treatments" ON treatments FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Staff/Admin manage all treatments" ON treatments;
CREATE POLICY "Staff/Admin manage all treatments" ON treatments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin'))
);

-- Medical Reports
DROP POLICY IF EXISTS "Patients view their own reports" ON medical_reports;
CREATE POLICY "Patients view their own reports" ON medical_reports FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Patients insert their own reports" ON medical_reports;
CREATE POLICY "Patients insert their own reports" ON medical_reports FOR INSERT WITH CHECK (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Staff/Admin view all reports" ON medical_reports;
CREATE POLICY "Staff/Admin view all reports" ON medical_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin'))
);

-- Queries
DROP POLICY IF EXISTS "Patients view their own queries" ON queries;
CREATE POLICY "Patients view their own queries" ON queries FOR SELECT USING (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Patients create their own queries" ON queries;
CREATE POLICY "Patients create their own queries" ON queries FOR INSERT WITH CHECK (
  patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Staff/Admin manage all queries" ON queries;
CREATE POLICY "Staff/Admin manage all queries" ON queries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin'))
);

-- FUNCTIONS & TRIGGERS
-- Ensure patients table has a unique constraint on user_id to prevent duplicates
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_user_id_key;
ALTER TABLE patients ADD CONSTRAINT patients_user_id_key UNIQUE (user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'No Name'), 
    new.email, 
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'admin' THEN 'admin'
      WHEN (new.raw_user_meta_data->>'role') = 'staff' THEN 'staff'
      ELSE 'patient'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert into patients table only if role is patient
  IF (COALESCE(new.raw_user_meta_data->>'role', 'patient') = 'patient') THEN
    INSERT INTO public.patients (user_id) 
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
