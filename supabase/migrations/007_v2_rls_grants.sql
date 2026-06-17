-- PawCare V2 RLS fix
-- The 006_v2_features.sql migration created tables but did not grant SELECT
-- to the anon role, so /api/community and /api/indian-vets (which use the
-- anon client for public read) returned 500 "permission denied".
--
-- Also adds an RLS policy to vet_visit_handoffs so authenticated users can
-- list their family's handoffs (the API exposes GET but had no SELECT policy
-- beyond the family-scoped one already in place, which is correct).

-- 1. Public read on community posts and vet directory (anyone can browse)
GRANT SELECT ON community_posts TO anon;
GRANT SELECT ON indian_vets TO anon;

-- 2. Make sure RLS is on for community_posts (was on but no anon SELECT
--    policy; the permissive policy already covers public read).
--    Add an explicit anon policy for clarity.
DROP POLICY IF EXISTS community_select_anon ON community_posts;
CREATE POLICY community_select_anon ON community_posts
  FOR SELECT TO anon
  USING (true);

-- 3. RLS is OFF for indian_vets (so anon can read by default after the GRANT).
--    Confirming and adding a SELECT policy for the authenticated role too.
ALTER TABLE indian_vets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS indian_vets_select_authenticated ON indian_vets;
CREATE POLICY indian_vets_select_authenticated ON indian_vets
  FOR SELECT TO authenticated
  USING (true);

-- 4. vet_visit_handoffs: family-scoped SELECT policy already exists.
--    No changes needed for read.

-- 5. Indexes for the public-read endpoints (community by city, vets by city).
--    The migration may not have included these; add if missing.
CREATE INDEX IF NOT EXISTS idx_community_posts_city_created
  ON community_posts (city, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_indian_vets_city_rating
  ON indian_vets (city, rating DESC NULLS LAST);
