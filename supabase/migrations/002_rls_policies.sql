-- =====================================================================
-- PawCare — Row Level Security Policies
-- Family-shared access model:
--   owner/caregiver: full read/write on family group data
--   viewer: read-only
--   Always: enforced at the database level, no cross-user leakage.
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deworming_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heat_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_contacts ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Returns family_group_id of the current user (NULL if none)
CREATE OR REPLACE FUNCTION public.current_family_group_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_group_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Returns the role of the current user in their family group
CREATE OR REPLACE FUNCTION public.current_family_role()
RETURNS family_role_t
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_role FROM public.profiles WHERE id = auth.uid();
$$;

-- True if user can write to family data (owner or caregiver)
CREATE OR REPLACE FUNCTION public.can_write_family()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND family_role IN ('owner', 'caregiver')
  );
$$;

-- Generic: pet is accessible if owner == me or in my family group
CREATE OR REPLACE FUNCTION public.pet_accessible(pet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.id = pet_id
      AND (
        p.owner_id = auth.uid()
        OR (
          p.family_group_id IS NOT NULL
          AND p.family_group_id = public.current_family_group_id()
        )
      )
  );
$$;

-- =====================================================================
-- PROFILES
-- =====================================================================

CREATE POLICY "profiles_select_own_or_family"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR family_group_id = public.current_family_group_id()
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- =====================================================================
-- FAMILY_GROUPS
-- =====================================================================

CREATE POLICY "family_groups_select_member"
  ON public.family_groups FOR SELECT
  USING (public.current_family_group_id() = id);

CREATE POLICY "family_groups_insert_any_auth"
  ON public.family_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "family_groups_update_owner"
  ON public.family_groups FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "family_groups_delete_owner"
  ON public.family_groups FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================================
-- FAMILY_MEMBERS
-- =====================================================================

CREATE POLICY "family_members_select_member"
  ON public.family_members FOR SELECT
  USING (family_group_id = public.current_family_group_id());

CREATE POLICY "family_members_insert_self_or_owner"
  ON public.family_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_groups fg
      WHERE fg.id = family_group_id AND fg.owner_id = auth.uid()
    )
  );

CREATE POLICY "family_members_delete_self_or_owner"
  ON public.family_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.family_groups fg
      WHERE fg.id = family_group_id AND fg.owner_id = auth.uid()
    )
  );

-- =====================================================================
-- PETS
-- =====================================================================

CREATE POLICY "pets_select_family"
  ON public.pets FOR SELECT
  USING (
    owner_id = auth.uid()
    OR family_group_id = public.current_family_group_id()
  );

CREATE POLICY "pets_insert_writer"
  ON public.pets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      public.can_write_family()
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "pets_update_writer"
  ON public.pets FOR UPDATE
  USING (
    public.can_write_family()
    AND (
      owner_id = auth.uid()
      OR family_group_id = public.current_family_group_id()
    )
  )
  WITH CHECK (
    public.can_write_family()
    AND (
      owner_id = auth.uid()
      OR family_group_id = public.current_family_group_id()
    )
  );

CREATE POLICY "pets_delete_owner"
  ON public.pets FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================================
-- PET_PHOTOS, VET_VISITS, MEDICATIONS, VACCINATIONS, DEWORMING,
-- HEAT_CYCLES, WEIGHT_LOGS, MOOD_LOGS, SYMPTOM_CHECKS
-- (all keyed by pet_id)
-- =====================================================================

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'pet_photos', 'vet_visits', 'medications', 'medication_logs',
    'vaccinations', 'deworming_records', 'heat_cycles',
    'weight_logs', 'mood_logs', 'symptom_checks'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      CREATE POLICY %I_select ON public.%I FOR SELECT
      USING (public.pet_accessible(pet_id));
    ', t || '_select', t);

    EXECUTE format('
      CREATE POLICY %I_insert ON public.%I FOR INSERT
      WITH CHECK (
        public.can_write_family() AND public.pet_accessible(pet_id)
      );
    ', t || '_insert', t);

    EXECUTE format('
      CREATE POLICY %I_update ON public.%I FOR UPDATE
      USING (
        public.can_write_family() AND public.pet_accessible(pet_id)
      )
      WITH CHECK (
        public.can_write_family() AND public.pet_accessible(pet_id)
      );
    ', t || '_update', t);

    EXECUTE format('
      CREATE POLICY %I_delete ON public.%I FOR DELETE
      USING (
        public.can_write_family() AND public.pet_accessible(pet_id)
      );
    ', t || '_delete', t);
  END LOOP;
END $$;

-- =====================================================================
-- INVENTORY_ITEMS, INVENTORY_PURCHASES
-- (keyed by owner_id / family_group_id)
-- =====================================================================

CREATE POLICY "inventory_items_select_family"
  ON public.inventory_items FOR SELECT
  USING (
    owner_id = auth.uid()
    OR family_group_id = public.current_family_group_id()
  );

CREATE POLICY "inventory_items_insert_writer"
  ON public.inventory_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND public.can_write_family() AND owner_id = auth.uid()
  );

CREATE POLICY "inventory_items_update_writer"
  ON public.inventory_items FOR UPDATE
  USING (public.can_write_family() AND owner_id = auth.uid())
  WITH CHECK (public.can_write_family() AND owner_id = auth.uid());

CREATE POLICY "inventory_items_delete_writer"
  ON public.inventory_items FOR DELETE
  USING (public.can_write_family() AND owner_id = auth.uid());

CREATE POLICY "inventory_purchases_select_family"
  ON public.inventory_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_items i
      WHERE i.id = item_id
        AND (i.owner_id = auth.uid()
             OR i.family_group_id = public.current_family_group_id())
    )
  );

CREATE POLICY "inventory_purchases_insert_writer"
  ON public.inventory_purchases FOR INSERT
  WITH CHECK (
    public.can_write_family()
    AND EXISTS (
      SELECT 1 FROM public.inventory_items i
      WHERE i.id = item_id
        AND (i.owner_id = auth.uid()
             OR i.family_group_id = public.current_family_group_id())
    )
  );

-- =====================================================================
-- REMINDERS
-- =====================================================================

CREATE POLICY "reminders_select_family"
  ON public.reminders FOR SELECT
  USING (
    (family_group_id IS NOT NULL AND family_group_id = public.current_family_group_id())
    OR (pet_id IS NOT NULL AND public.pet_accessible(pet_id))
  );

CREATE POLICY "reminders_insert_writer"
  ON public.reminders FOR INSERT
  WITH CHECK (
    public.can_write_family()
    AND (
      (pet_id IS NULL OR public.pet_accessible(pet_id))
      AND (family_group_id IS NULL OR family_group_id = public.current_family_group_id())
    )
  );

CREATE POLICY "reminders_update_writer"
  ON public.reminders FOR UPDATE
  USING (public.can_write_family())
  WITH CHECK (public.can_write_family());

CREATE POLICY "reminders_delete_writer"
  ON public.reminders FOR DELETE
  USING (public.can_write_family());

-- =====================================================================
-- VET_CONTACTS
-- =====================================================================

CREATE POLICY "vet_contacts_select_family"
  ON public.vet_contacts FOR SELECT
  USING (
    owner_id = auth.uid()
    OR family_group_id = public.current_family_group_id()
  );

CREATE POLICY "vet_contacts_insert_writer"
  ON public.vet_contacts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.can_write_family() AND owner_id = auth.uid());

CREATE POLICY "vet_contacts_update_writer"
  ON public.vet_contacts FOR UPDATE
  USING (public.can_write_family() AND owner_id = auth.uid())
  WITH CHECK (public.can_write_family() AND owner_id = auth.uid());

CREATE POLICY "vet_contacts_delete_writer"
  ON public.vet_contacts FOR DELETE
  USING (public.can_write_family() AND owner_id = auth.uid());
