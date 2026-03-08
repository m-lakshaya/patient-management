-- 🛠️ PATCH SCRIPT to fix the Query Status Check Constraint Error
-- Run this if you kept your existing queries table and data.

-- 1. Drop the existing constraint
ALTER TABLE public.queries DROP CONSTRAINT IF EXISTS queries_status_check;

-- 2. Update any existing data to match the new format
UPDATE public.queries SET status = 'open' WHERE lower(status) = 'open' OR status IS NULL;
UPDATE public.queries SET status = 'in_progress' WHERE lower(status) IN ('in_progress', 'in progress', 'pending');
UPDATE public.queries SET status = 'completed' WHERE lower(status) IN ('completed', 'resolved', 'closed');

-- 3. Add the updated flexible constraint
ALTER TABLE public.queries ADD CONSTRAINT queries_status_check 
CHECK (status IN ('open', 'in_progress', 'completed'));
