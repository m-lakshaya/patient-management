# Patient Help Desk - Full Stack Application

A secure, role-based clinical help desk system for patients to access treatment history and medical reports.

## 🚀 Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, React Router, Lucide React
- **Backend:** Supabase (Auth, PostgreSQL, Storage, RLS)
- **State Management:** Custom Auth Hook & Context API
- **Charts:** Chart.js with React-Chartjs-2

## 🛠️ Setup Instructions

### 1. Database Setup
- Execute the SQL provided in `supabase_schema.sql` in your Supabase SQL Editor.
- This will create all tables, enums, triggers, and RLS policies.

### 2. Storage Setup
- Create a private bucket in Supabase Storage named `medical-reports`.
- RLS policies for storage are included in the SQL schema.

### 3. Environment Variables
- Create a `.env` file based on `.env.example`:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Install & Run
```bash
npm install
npm run dev
```

## 🔐 Security Features
- **Row Level Security (RLS):** Patients can only access their own records. Staff and Admins have tiered access.
- **Signed URLs:** Medical reports are accessed via short-lived secure links.
- **Protected Routes:** Unauthorized access to dashboards is blocked at the router level.
- **Triggers:** Automatic synchronization between Supabase Auth and the `profiles` table.

## 📁 Project Structure
- `/src/pages/patient`: Patient specific features (Dashboard, Treatments, Reports, Queries).
- `/src/pages/staff`: Staff management tools (Query response, Treatment logging).
- `/src/pages/admin`: Admin controls (User roles, System analytics).
- `/src/hooks`: Global authentication state.
