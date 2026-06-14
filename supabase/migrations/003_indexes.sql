-- =====================================================================
-- PawCare — Indexes for query performance
-- =====================================================================

-- PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_family_group ON public.profiles(family_group_id);
CREATE INDEX IF NOT EXISTS idx_profiles_family_code ON public.profiles(family_code);

-- FAMILY_GROUPS
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON public.family_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_groups_owner ON public.family_groups(owner_id);

-- FAMILY_MEMBERS
CREATE INDEX IF NOT EXISTS idx_family_members_group ON public.family_members(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);

-- PETS
CREATE INDEX IF NOT EXISTS idx_pets_owner ON public.pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_family ON public.pets(family_group_id);
CREATE INDEX IF NOT EXISTS idx_pets_active ON public.pets(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_pets_species ON public.pets(species);
CREATE INDEX IF NOT EXISTS idx_pets_display_order ON public.pets(owner_id, display_order);

-- PET_PHOTOS
CREATE INDEX IF NOT EXISTS idx_pet_photos_pet ON public.pet_photos(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_photos_taken ON public.pet_photos(taken_at DESC);

-- VET_VISITS
CREATE INDEX IF NOT EXISTS idx_vet_visits_pet_date ON public.vet_visits(pet_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_vet_visits_follow_up ON public.vet_visits(follow_up_date)
  WHERE follow_up_date IS NOT NULL;

-- MEDICATIONS
CREATE INDEX IF NOT EXISTS idx_medications_pet ON public.medications(pet_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.medications(pet_id, is_active) WHERE is_active = TRUE;

-- MEDICATION_LOGS
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication ON public.medication_logs(medication_id, given_at DESC);
CREATE INDEX IF NOT EXISTS idx_medication_logs_pet_date ON public.medication_logs(pet_id, given_at DESC);

-- VACCINATIONS
CREATE INDEX IF NOT EXISTS idx_vaccinations_pet_date ON public.vaccinations(pet_id, date_given DESC);
CREATE INDEX IF NOT EXISTS idx_vaccinations_next_due ON public.vaccinations(next_due_date)
  WHERE next_due_date IS NOT NULL;

-- DEWORMING
CREATE INDEX IF NOT EXISTS idx_deworming_pet_date ON public.deworming_records(pet_id, date_given DESC);
CREATE INDEX IF NOT EXISTS idx_deworming_next_due ON public.deworming_records(next_due_date)
  WHERE next_due_date IS NOT NULL;

-- HEAT_CYCLES
CREATE INDEX IF NOT EXISTS idx_heat_cycles_pet_date ON public.heat_cycles(pet_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_heat_cycles_predicted ON public.heat_cycles(predicted_next)
  WHERE predicted_next IS NOT NULL;

-- WEIGHT_LOGS
CREATE INDEX IF NOT EXISTS idx_weight_logs_pet_date ON public.weight_logs(pet_id, measured_at DESC);

-- MOOD_LOGS
CREATE INDEX IF NOT EXISTS idx_mood_logs_pet_date ON public.mood_logs(pet_id, logged_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mood_logs_pet_date ON public.mood_logs(pet_id, logged_date);

-- SYMPTOM_CHECKS
CREATE INDEX IF NOT EXISTS idx_symptom_checks_pet ON public.symptom_checks(pet_id, created_at DESC);

-- INVENTORY
CREATE INDEX IF NOT EXISTS idx_inventory_items_owner ON public.inventory_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_family ON public.inventory_items(family_group_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON public.inventory_items(owner_id, is_active) WHERE is_active = TRUE;

-- INVENTORY_PURCHASES
CREATE INDEX IF NOT EXISTS idx_inventory_purchases_item_date ON public.inventory_purchases(item_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_purchases_date ON public.inventory_purchases(purchase_date DESC);

-- REMINDERS
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.reminders(due_date) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON public.reminders(reminder_at)
  WHERE is_sent = FALSE AND is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminders_pet ON public.reminders(pet_id);
CREATE INDEX IF NOT EXISTS idx_reminders_family ON public.reminders(family_group_id);

-- VET_CONTACTS
CREATE INDEX IF NOT EXISTS idx_vet_contacts_owner ON public.vet_contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_vet_contacts_family ON public.vet_contacts(family_group_id);
CREATE INDEX IF NOT EXISTS idx_vet_contacts_emergency ON public.vet_contacts(is_emergency) WHERE is_emergency = TRUE;
