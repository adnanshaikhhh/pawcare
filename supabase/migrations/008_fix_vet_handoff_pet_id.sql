-- PawCare V2 migration 008: fix vet_visit_handoffs missing pet_id column + FK
-- Issue: the v2 migration 006 declared `pet_id UUID REFERENCES pets(id) ON DELETE CASCADE`
-- in CREATE TABLE IF NOT EXISTS, but the table already existed in the live DB from a
-- prior session WITHOUT that column. The IF NOT EXISTS skipped the create, so pet_id
-- was never added. Result: the GET /api/vet-handoff route's `pets(name)` FK join
-- fails with "Could not find a relationship between 'vet_visit_handoffs' and 'pets' in
-- the schema cache" because no FK exists.

-- 1. Add the column (nullable, since existing rows won't have it)
ALTER TABLE vet_visit_handoffs ADD COLUMN IF NOT EXISTS pet_id UUID;

-- 2. Add the FK constraint
ALTER TABLE vet_visit_handoffs
  DROP CONSTRAINT IF EXISTS vet_visit_handoffs_pet_id_fkey;
ALTER TABLE vet_visit_handoffs
  ADD CONSTRAINT vet_visit_handoffs_pet_id_fkey
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE;

-- 3. Index for the new join
CREATE INDEX IF NOT EXISTS idx_vet_visit_handoffs_pet
  ON vet_visit_handoffs (pet_id);

-- 4. Force PostgREST to reload its schema cache. The endpoint is
--    POST /rest/v1/rpc/admin_reload (no-op function call) or simply hitting
--    the root URL triggers a reload. We use the NOTIFY pgrst directly.
NOTIFY pgrst, 'reload schema';
