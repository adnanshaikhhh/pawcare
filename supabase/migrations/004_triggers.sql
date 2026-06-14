-- =====================================================================
-- PawCare — Triggers
-- Auto-update updated_at, auto-create reminders, predict heat cycles
-- =====================================================================

-- =====================================================================
-- GENERIC: auto-update updated_at
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['profiles', 'pets', 'vet_visits', 'medications', 'inventory_items'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%I_set_updated_at ON public.%I;
      CREATE TRIGGER trg_%I_set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
    ', t, t, t, t);
  END LOOP;
END $$;

-- =====================================================================
-- AUTH: auto-create profile on signup
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- VACCINATIONS: auto-create reminder when next_due_date is set
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_vaccination_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet_name TEXT;
  v_owner_id UUID;
  v_family_id UUID;
  v_reminder_date TIMESTAMPTZ;
BEGIN
  IF NEW.next_due_date IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name, owner_id, family_group_id
    INTO v_pet_name, v_owner_id, v_family_id
  FROM public.pets WHERE id = NEW.pet_id;

  v_reminder_date := (NEW.next_due_date::timestamp - (NEW.reminder_days_before || ' days')::interval);

  INSERT INTO public.reminders (
    pet_id, family_group_id, type, title, description,
    due_date, reminder_at, created_by
  ) VALUES (
    NEW.pet_id, v_family_id, 'vaccine',
    v_pet_name || ' — ' || NEW.vaccine_name || ' due',
    'Next dose of ' || NEW.vaccine_name || ' scheduled.',
    NEW.next_due_date::timestamp,
    v_reminder_date,
    v_owner_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vaccination_reminder ON public.vaccinations;
CREATE TRIGGER trg_vaccination_reminder
  AFTER INSERT OR UPDATE OF next_due_date ON public.vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_vaccination_reminder();

-- =====================================================================
-- DEWORMING: auto-create reminder 3 days before next_due_date
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_deworming_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet_name TEXT;
  v_owner_id UUID;
  v_family_id UUID;
BEGIN
  IF NEW.next_due_date IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name, owner_id, family_group_id
    INTO v_pet_name, v_owner_id, v_family_id
  FROM public.pets WHERE id = NEW.pet_id;

  INSERT INTO public.reminders (
    pet_id, family_group_id, type, title, description,
    due_date, reminder_at, created_by
  ) VALUES (
    NEW.pet_id, v_family_id, 'deworming',
    v_pet_name || ' — deworming due',
    'Next deworming with ' || NEW.product_name,
    NEW.next_due_date::timestamp,
    (NEW.next_due_date::timestamp - interval '3 days'),
    v_owner_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deworming_reminder ON public.deworming_records;
CREATE TRIGGER trg_deworming_reminder
  AFTER INSERT OR UPDATE OF next_due_date ON public.deworming_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deworming_reminder();

-- =====================================================================
-- HEAT CYCLES: auto-predict next based on species
-- Cats: 21 days, Dogs: 180 days
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_heat_cycle_predict()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_species species;
  v_interval INTEGER;
BEGIN
  SELECT species INTO v_species FROM public.pets WHERE id = NEW.pet_id;

  v_interval := CASE v_species
    WHEN 'cat' THEN 21
    WHEN 'dog' THEN 180
    ELSE 60
  END;

  NEW.predicted_next := (NEW.start_date::date + v_interval);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_heat_cycle_predict ON public.heat_cycles;
CREATE TRIGGER trg_heat_cycle_predict
  BEFORE INSERT ON public.heat_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_heat_cycle_predict();

-- After insert: create a heat reminder 3 days before predicted_next
CREATE OR REPLACE FUNCTION public.handle_heat_cycle_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet_name TEXT;
  v_owner_id UUID;
  v_family_id UUID;
BEGIN
  IF NEW.predicted_next IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name, owner_id, family_group_id
    INTO v_pet_name, v_owner_id, v_family_id
  FROM public.pets WHERE id = NEW.pet_id;

  INSERT INTO public.reminders (
    pet_id, family_group_id, type, title, description,
    due_date, reminder_at, created_by
  ) VALUES (
    NEW.pet_id, v_family_id, 'heat',
    v_pet_name || ' — predicted heat cycle',
    'Predicted next heat cycle based on history.',
    NEW.predicted_next::timestamp,
    (NEW.predicted_next::timestamp - interval '3 days'),
    v_owner_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_heat_cycle_reminder ON public.heat_cycles;
CREATE TRIGGER trg_heat_cycle_reminder
  AFTER INSERT ON public.heat_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_heat_cycle_reminder();

-- =====================================================================
-- INVENTORY: low-stock alert reminder
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_inventory_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_name TEXT;
BEGIN
  v_item_name := NEW.item_name;

  IF NEW.estimated_days_remaining IS NOT NULL
     AND NEW.alert_enabled = TRUE
     AND NEW.estimated_days_remaining <= NEW.alert_days_before
  THEN
    INSERT INTO public.reminders (
      family_group_id, type, title, description,
      due_date, reminder_at, created_by
    ) VALUES (
      NEW.family_group_id, 'inventory',
      v_item_name || ' running low',
      'Only ' || NEW.estimated_days_remaining || ' day(s) of stock left.',
      now() + interval '1 day',
      now(),
      NEW.owner_id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_alert ON public.inventory_items;
CREATE TRIGGER trg_inventory_alert
  AFTER UPDATE OF estimated_days_remaining ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_inventory_alert();
