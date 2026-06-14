-- =====================================================================
-- PawCare — Initial Schema
-- All tables, enums, constraints, and base triggers
-- Run order: 001 → 002 → 003 → 004 → 005
-- =====================================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- ENUMS
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE species AS ENUM ('cat', 'dog', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_t AS ENUM ('male', 'female', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fur_type AS ENUM ('short', 'long', 'medium', 'hairless', 'curly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE family_role_t AS ENUM ('owner', 'caregiver', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE medicine_type_t AS ENUM ('tablet', 'syrup', 'injection', 'topical', 'drops', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE frequency_t AS ENUM ('once', 'daily', 'twice_daily', 'weekly', 'monthly', 'as_needed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vaccine_type_t AS ENUM ('core', 'non_core', 'booster', 'rabies', 'combo', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mood_t AS ENUM ('happy', 'playful', 'calm', 'tired', 'anxious', 'aggressive', 'sick', 'normal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appetite_t AS ENUM ('excellent', 'good', 'poor', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE energy_t AS ENUM ('high', 'normal', 'low', 'very_low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE urgency_t AS ENUM ('monitor', 'see_vet_soon', 'emergency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_category_t AS ENUM (
    'food_dry', 'food_wet', 'food_treats', 'litter',
    'medicine', 'grooming', 'accessories', 'toys', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_unit_t AS ENUM ('kg', 'g', 'packs', 'liters', 'pieces', 'bags');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_type_t AS ENUM (
    'vaccine', 'deworming', 'vet_visit', 'medication',
    'heat', 'inventory', 'custom', 'grooming', 'birthday'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recurrence_t AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- TABLE: profiles (extends auth.users)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  family_code TEXT UNIQUE,
  family_role family_role_t NOT NULL DEFAULT 'owner',
  family_group_id UUID,
  notification_token TEXT,
  web_push_subscription JSONB,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  is_premium BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: family_groups
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from profiles.family_group_id now that family_groups exists
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_family_group_id_fkey
    FOREIGN KEY (family_group_id) REFERENCES public.family_groups(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- TABLE: family_members
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role family_role_t NOT NULL DEFAULT 'caregiver',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(family_group_id, user_id)
);

-- =====================================================================
-- TABLE: pets
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  species species NOT NULL,
  breed TEXT,
  gender gender_t NOT NULL DEFAULT 'unknown',
  color TEXT,
  fur_type fur_type,
  date_of_birth DATE,
  adoption_date DATE,
  is_birthday_known BOOLEAN NOT NULL DEFAULT TRUE,
  weight_kg REAL,
  microchip_number TEXT,
  insurance_policy TEXT,
  photo_url TEXT,
  banner_photo_url TEXT,
  bio TEXT,
  is_neutered BOOLEAN NOT NULL DEFAULT FALSE,
  neutered_date DATE,
  neutered_notes TEXT,
  is_indoor BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: pet_photos
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.pet_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  taken_at DATE,
  is_profile_photo BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: vet_visits
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.vet_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  vet_name TEXT,
  clinic_name TEXT,
  clinic_address TEXT,
  clinic_phone TEXT,
  reason TEXT,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  follow_up_date DATE,
  cost_inr REAL,
  documents_urls TEXT[],
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: medications
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  medicine_type medicine_type_t,
  dosage TEXT,
  purpose TEXT,
  prescribed_by TEXT,
  start_date DATE,
  end_date DATE,
  frequency frequency_t NOT NULL DEFAULT 'daily',
  reminder_time TIME,
  is_ongoing BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  side_effects_noted TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: medication_logs
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  given_at TIMESTAMPTZ NOT NULL,
  given_by UUID REFERENCES public.profiles(id),
  dose_given TEXT,
  notes TEXT,
  skipped BOOLEAN NOT NULL DEFAULT FALSE,
  skip_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: vaccinations
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  vaccine_type vaccine_type_t NOT NULL DEFAULT 'core',
  date_given DATE NOT NULL,
  batch_number TEXT,
  administered_by TEXT,
  clinic_name TEXT,
  next_due_date DATE,
  reminder_days_before INTEGER NOT NULL DEFAULT 7,
  notes TEXT,
  certificate_url TEXT,
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: deworming_records
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.deworming_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  date_given DATE NOT NULL,
  next_due_date DATE,
  administered_by TEXT,
  weight_at_time REAL,
  notes TEXT,
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: heat_cycles
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.heat_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  duration_days INTEGER,
  symptoms TEXT,
  notes TEXT,
  predicted_next DATE,
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: weight_logs
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  weight_kg REAL NOT NULL CHECK (weight_kg > 0),
  measured_at DATE NOT NULL,
  notes TEXT,
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: mood_logs
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood mood_t NOT NULL,
  appetite appetite_t,
  energy_level energy_t,
  notes TEXT,
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pet_id, logged_date)
);

-- =====================================================================
-- TABLE: symptom_checks
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.symptom_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  symptoms_described TEXT NOT NULL,
  ai_assessment TEXT,
  urgency_level urgency_t,
  ai_suggestions TEXT,
  checked_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: inventory_items
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category inventory_category_t NOT NULL,
  brand TEXT,
  unit inventory_unit_t NOT NULL DEFAULT 'pieces',
  current_quantity REAL,
  minimum_quantity REAL,
  estimated_days_remaining INTEGER,
  last_purchased_date DATE,
  last_purchased_quantity REAL,
  last_purchased_cost_inr REAL,
  affiliate_link TEXT,
  notes TEXT,
  alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  alert_days_before INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: inventory_purchases
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.inventory_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL,
  quantity REAL,
  cost_inr REAL,
  purchased_from TEXT,
  notes TEXT,
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: reminders
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
  type reminder_type_t NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  reminder_at TIMESTAMPTZ NOT NULL,
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  recurrence recurrence_t NOT NULL DEFAULT 'none',
  recurrence_interval INTEGER,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- TABLE: vet_contacts
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.vet_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  clinic_name TEXT,
  phone TEXT,
  address TEXT,
  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  is_24_hours BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  latitude REAL,
  longitude REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
