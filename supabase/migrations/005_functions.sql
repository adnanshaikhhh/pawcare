-- =====================================================================
-- PawCare — Storage buckets + helper functions
-- =====================================================================

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================

-- Pet photos (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-photos', 'pet-photos', TRUE,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Medical documents (private, owner only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-documents', 'medical-documents', FALSE,
  20971520,  -- 20MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Avatars (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', TRUE,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================================
-- STORAGE POLICIES
-- =====================================================================

-- pet-photos: public read, authenticated write/delete to own folder
DROP POLICY IF EXISTS "pet_photos_read_public" ON storage.objects;
CREATE POLICY "pet_photos_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

DROP POLICY IF EXISTS "pet_photos_write_auth" ON storage.objects;
CREATE POLICY "pet_photos_write_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "pet_photos_delete_own" ON storage.objects;
CREATE POLICY "pet_photos_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- medical-documents: owner-only
DROP POLICY IF EXISTS "medical_docs_owner_read" ON storage.objects;
CREATE POLICY "medical_docs_owner_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "medical_docs_owner_write" ON storage.objects;
CREATE POLICY "medical_docs_owner_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "medical_docs_owner_delete" ON storage.objects;
CREATE POLICY "medical_docs_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars: public read, owner write
DROP POLICY IF EXISTS "avatars_read_public" ON storage.objects;
CREATE POLICY "avatars_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_write_own" ON storage.objects;
CREATE POLICY "avatars_write_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Get upcoming reminders (next N days) for current user/family
CREATE OR REPLACE FUNCTION public.get_upcoming_reminders(days_ahead INTEGER DEFAULT 7)
RETURNS SETOF public.reminders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.*
  FROM public.reminders r
  WHERE r.is_completed = FALSE
    AND r.due_date <= (now() + (days_ahead || ' days')::interval)
    AND (
      (r.family_group_id IS NOT NULL AND r.family_group_id = public.current_family_group_id())
      OR (r.pet_id IS NOT NULL AND public.pet_accessible(r.pet_id))
    )
  ORDER BY r.due_date ASC;
$$;

-- Get pet health summary
CREATE OR REPLACE FUNCTION public.get_pet_health_summary(pet_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_vaccination_overdue BOOLEAN;
  v_deworming_overdue BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.vaccinations
    WHERE pet_id = pet_uuid AND next_due_date < CURRENT_DATE
  ) INTO v_vaccination_overdue;

  SELECT EXISTS (
    SELECT 1 FROM public.deworming_records
    WHERE pet_id = pet_uuid AND next_due_date < CURRENT_DATE
  ) INTO v_deworming_overdue;

  result := jsonb_build_object(
    'vaccination_overdue', v_vaccination_overdue,
    'deworming_overdue', v_deworming_overdue
  );

  RETURN result;
END;
$$;

-- Monthly spend estimate by category
CREATE OR REPLACE FUNCTION public.get_monthly_spend_estimate(target_user UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', COALESCE(SUM(cost_inr), 0),
    'by_category', COALESCE(
      (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
          SELECT i.category, SUM(p.cost_inr) AS total_inr
          FROM public.inventory_purchases p
          JOIN public.inventory_items i ON i.id = p.item_id
          WHERE i.owner_id = target_user
            AND p.purchase_date >= (CURRENT_DATE - interval '90 days')
          GROUP BY i.category
        ) t
      ),
      '[]'::jsonb
    )
  )
  FROM public.inventory_purchases p
  JOIN public.inventory_items i ON i.id = p.item_id
  WHERE i.owner_id = target_user
    AND p.purchase_date >= (CURRENT_DATE - interval '90 days');
$$;

-- =====================================================
-- pg_cron: schedule notification dispatcher (optional)
-- Set up after migrations: see supabase/functions/send-notifications/README.md
-- =====================================================

-- GRANT EXECUTE on helper functions to authenticated
GRANT EXECUTE ON FUNCTION public.current_family_group_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_family_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_family() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pet_accessible(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_upcoming_reminders(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pet_health_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_spend_estimate(UUID) TO authenticated;
