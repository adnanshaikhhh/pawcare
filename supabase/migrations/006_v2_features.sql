-- ============================================================================
-- PawCare V2 Schema — All 25 Features
-- Adds tables for: Stories, Vet Prep, Multi-Pet Symptoms, Behavior Detection,
-- Who Fed Who, Medication Interactions, Weight Goals, Dental, Birthdays,
-- Lab Results, Cat Economics, Feeding Schedules, Mood Weather, etc.
-- ============================================================================

-- ============================================================================
-- 1. PET STORIES (Feature #1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pet_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES family_groups(id),
  created_by UUID REFERENCES profiles(id),
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'photo', -- photo | video
  caption TEXT,
  detected_pet_id UUID REFERENCES pets(id), -- AI-detected cat
  ai_confidence REAL,
  expires_at TIMESTAMP NOT NULL, -- 24h story expiry
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pet_stories_pet ON pet_stories(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_stories_family ON pet_stories(family_group_id);
CREATE INDEX IF NOT EXISTS idx_pet_stories_expires ON pet_stories(expires_at);

CREATE TABLE IF NOT EXISTS pet_story_views (
  story_id UUID REFERENCES pet_stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id),
  viewed_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

-- ============================================================================
-- 2. VET VISIT PREP (Feature #7)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vet_visit_prep_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_visit_id UUID REFERENCES vet_visits(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES family_groups(id),
  generated_at TIMESTAMP DEFAULT now(),
  ai_summary TEXT NOT NULL,
  weight_trend TEXT,
  appetite_summary TEXT,
  mood_summary TEXT,
  suggested_questions TEXT[], -- Array of strings
  baseline_comparison TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  shared_with_vet BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vet_prep_visit ON vet_visit_prep_briefs(vet_visit_id);

-- ============================================================================
-- 3. MULTI-PET SYMPTOM CORRELATION (Feature #6)
-- ============================================================================
CREATE TABLE IF NOT EXISTS symptom_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  symptom_signature TEXT NOT NULL, -- hashed signature of symptoms
  affected_pet_ids UUID[] NOT NULL,
  onset_window_days INTEGER,
  correlation_strength REAL, -- 0-1
  possible_causes TEXT[],
  shared_environment TEXT, -- kitchen, living room, etc.
  ai_analysis TEXT,
  resolved BOOLEAN DEFAULT false,
  detected_at TIMESTAMP DEFAULT now(),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_symptom_corr_family ON symptom_correlations(family_group_id);

-- ============================================================================
-- 4. BEHAVIOR CHANGE DETECTION (Feature #8)
-- ============================================================================
CREATE TABLE IF NOT EXISTS behavior_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES family_groups(id),
  metric_type TEXT NOT NULL, -- sleep | water_intake | appetite | activity | weight
  baseline_value REAL,
  current_value REAL,
  percent_change REAL,
  severity TEXT DEFAULT 'monitor', -- monitor | watch | concern | urgent
  ai_summary TEXT,
  suggested_action TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES profiles(id),
  detected_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_behavior_alerts_pet ON behavior_alerts(pet_id);
CREATE INDEX IF NOT EXISTS idx_behavior_alerts_severity ON behavior_alerts(severity);

-- ============================================================================
-- 5. WHO FED WHO TIMELINE (Feature #13)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL, -- fed | medication | walk | play | groom | vet | custom
  details JSONB DEFAULT '{}'::jsonb,
  photo_url TEXT,
  notes TEXT,
  occurred_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_family ON activity_timeline(family_group_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_pet ON activity_timeline(pet_id, occurred_at DESC);

-- ============================================================================
-- 6. MEDICATION INTERACTION CHECKER (Feature #17)
-- ============================================================================
CREATE TABLE IF NOT EXISTS medication_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  medication_a_id UUID REFERENCES medications(id),
  medication_b_id UUID REFERENCES medications(id),
  pet_a_id UUID REFERENCES pets(id),
  pet_b_id UUID REFERENCES pets(id),
  interaction_type TEXT NOT NULL, -- duplicate | contraindicated | caution | cross_pet_risk
  severity TEXT NOT NULL, -- info | warning | danger
  description TEXT,
  recommendation TEXT,
  acknowledged BOOLEAN DEFAULT false,
  detected_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 7. WEIGHT GOALS (Feature #18)
-- ============================================================================
ALTER TABLE pets ADD COLUMN IF NOT EXISTS target_weight_kg REAL;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS weight_goal_set_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS weight_goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  start_weight_kg REAL NOT NULL,
  target_weight_kg REAL NOT NULL,
  current_weight_kg REAL,
  weekly_change_rate REAL,
  estimated_completion_date DATE,
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 8. DENTAL HEALTH TRACKING (Feature #19)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dental_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  cleaning_date DATE NOT NULL,
  procedure_type TEXT, -- cleaning | extraction | xray | other
  vet_name TEXT,
  grade TEXT, -- 1-4 per veterinary dental grading
  notes TEXT,
  next_due_date DATE,
  logged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dental_pet ON dental_records(pet_id);

-- ============================================================================
-- 9. CAT BIRTHDAY CARDS (Feature #20)
-- ============================================================================
CREATE TABLE IF NOT EXISTS birthday_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES family_groups(id),
  year INTEGER NOT NULL,
  generated_at TIMESTAMP DEFAULT now(),
  share_token TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 16),
  card_data JSONB NOT NULL, -- generated card content
  shared_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(pet_id, year)
);

-- ============================================================================
-- 10. CAT MOOD WEATHER (Feature #21)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_mood_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  summary_date DATE NOT NULL,
  pet_mood_breakdown JSONB NOT NULL, -- {pet_id: {mood: count}}
  dominant_mood TEXT,
  total_logs INTEGER,
  vibes_score REAL, -- 0-100
  generated_at TIMESTAMP DEFAULT now(),
  UNIQUE(family_group_id, summary_date)
);

-- ============================================================================
-- 11. YEAR IN REVIEW (Feature #22)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pet_year_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES family_groups(id),
  year INTEGER NOT NULL,
  review_data JSONB NOT NULL, -- stats, photos, milestones
  generated_at TIMESTAMP DEFAULT now(),
  UNIQUE(pet_id, year)
);

-- ============================================================================
-- 12. CAT ECONOMICS (Feature #24)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pet_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  pet_id UUID REFERENCES pets(id),
  category TEXT NOT NULL, -- food | vet | medication | grooming | toys | other
  amount_inr REAL NOT NULL,
  description TEXT,
  receipt_url TEXT,
  purchase_date DATE NOT NULL,
  logged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pet_expenses_family ON pet_expenses(family_group_id, purchase_date DESC);

CREATE TABLE IF NOT EXISTS monthly_spend_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  month_year TEXT NOT NULL, -- '2026-06'
  total_inr REAL NOT NULL,
  by_category JSONB NOT NULL, -- {category: amount}
  by_pet JSONB NOT NULL,
  trend_pct REAL,
  generated_at TIMESTAMP DEFAULT now(),
  UNIQUE(family_group_id, month_year)
);

-- ============================================================================
-- 13. RESPONSIBILITY BOARD (Feature #14)
-- ============================================================================
CREATE TABLE IF NOT EXISTS responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  assignee_id UUID REFERENCES profiles(id),
  pet_id UUID REFERENCES pets(id),
  task_type TEXT NOT NULL, -- feeding | medication | litter | cleaning | walk | custom
  recurrence TEXT, -- daily | weekly | weekdays | custom
  time_of_day TIME,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS responsibility_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsibility_id UUID REFERENCES responsibilities(id) ON DELETE CASCADE,
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 14. LAB RESULTS OCR (Feature #16)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES family_groups(id),
  test_date DATE NOT NULL,
  lab_name TEXT,
  source_image_url TEXT,
  ai_extracted_values JSONB NOT NULL, -- {test_name: {value, unit, range, status}}
  flagged_abnormalities TEXT[],
  ai_summary TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lab_results_pet ON lab_results(pet_id, test_date DESC);

-- ============================================================================
-- 15. WEAR OS / LOCK SCREEN SHORTCUTS (Feature #10/12)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quick_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  pet_id UUID REFERENCES pets(id),
  action_type TEXT NOT NULL, -- mood_log | feed | medication | check_in
  source TEXT NOT NULL, -- watch | siri | lockscreen | widget
  logged_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quick_action_user ON quick_action_log(user_id, logged_at DESC);

-- ============================================================================
-- 16. VET VISIT HANDOFF (Feature #15)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vet_visit_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_visit_id UUID REFERENCES vet_visits(id) ON DELETE CASCADE,
  family_group_id UUID REFERENCES family_groups(id),
  traveler_id UUID REFERENCES profiles(id), -- person going
  started_at TIMESTAMP DEFAULT now(),
  estimated_return TIMESTAMP,
  ended_at TIMESTAMP,
  live_updates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 17. MEDICATION REMINDER CHOREOGRAPHY (Feature #9)
-- ============================================================================
CREATE TABLE IF NOT EXISTS smart_reminder_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  pet_id UUID REFERENCES pets(id),
  reminder_type TEXT NOT NULL,
  context_data JSONB NOT NULL,
  message TEXT NOT NULL,
  suggested_at TIMESTAMP DEFAULT now(),
  acted_upon BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 18. REMINDER BULK ACTIONS (Feature #24 multi-pet)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bulk_reminder_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  action_type TEXT NOT NULL,
  pet_ids UUID[] NOT NULL,
  details JSONB,
  executed_by UUID REFERENCES profiles(id),
  executed_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 19. INDIAN PET FOOD INTEGRATION (Feature #25)
-- ============================================================================
CREATE TABLE IF NOT EXISTS indian_pet_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  product_name TEXT NOT NULL,
  species TEXT NOT NULL, -- cat | dog | both
  category TEXT NOT NULL,
  weight_kg REAL,
  price_inr REAL,
  amazon_in_url TEXT,
  flipkart_url TEXT,
  supertails_url TEXT,
  image_url TEXT,
  pet_lifestage TEXT, -- kitten | adult | senior
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pet_product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id),
  family_group_id UUID REFERENCES family_groups(id),
  product_id UUID REFERENCES indian_pet_products(id),
  purchased_at TIMESTAMP DEFAULT now(),
  amount_inr REAL,
  retailer TEXT, -- amazon_in | flipkart | supertails | local
  logged_by UUID REFERENCES profiles(id)
);

-- ============================================================================
-- 20. INDIAN VET DIRECTORY (Feature #25)
-- ============================================================================
CREATE TABLE IF NOT EXISTS indian_vets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  clinic_name TEXT,
  city TEXT NOT NULL,
  area TEXT,
  address TEXT,
  phone TEXT,
  google_maps_url TEXT,
  rating REAL,
  species_served TEXT[], -- cat | dog | bird | exotic
  emergency_24h BOOLEAN DEFAULT false,
  home_visit BOOLEAN DEFAULT false,
  consultation_fee_inr INTEGER,
  languages TEXT[],
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_indian_vets_city ON indian_vets(city);

-- ============================================================================
-- 21. INDIAN PET COMMUNITIES (Feature #25)
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id),
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT,
  category TEXT, -- question | story | advice | lost_found
  city TEXT,
  pet_id UUID REFERENCES pets(id),
  upvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_city ON community_posts(city, created_at DESC);

-- ============================================================================
-- 22. LIGHT BEHAVIOR DETECTION TABLES (for behavior change cron)
-- ============================================================================
CREATE TABLE IF NOT EXISTS behavior_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  sleep_minutes INTEGER,
  water_bowl_visits INTEGER,
  meal_count INTEGER,
  active_minutes INTEGER,
  litter_visits INTEGER,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(pet_id, metric_date)
);

-- ============================================================================
-- 23. FEEDING SCHEDULE OPTIMIZATION (Feature #24)
-- ============================================================================
CREATE TABLE IF NOT EXISTS feeding_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  time_of_day TIME NOT NULL,
  food_type TEXT, -- dry | wet | raw | mixed
  portion_grams REAL,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 24. LOCK SCREEN / WATCH WIDGET STATE (Feature #10)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_widget_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_type TEXT, -- ios_widget | android_widget | watch
  config JSONB NOT NULL,
  last_updated TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, device_type)
);

-- ============================================================================
-- 25. ASSISTANT COMMAND LOG (Feature #11)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assistant_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  source TEXT, -- siri | google_assistant | alexa
  raw_command TEXT,
  parsed_intent TEXT,
  executed_action JSONB,
  success BOOLEAN,
  executed_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES FOR ALL NEW TABLES
-- ============================================================================

-- Stories
ALTER TABLE pet_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stories_select_family ON pet_stories;
CREATE POLICY stories_select_family ON pet_stories FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);
DROP POLICY IF EXISTS stories_insert ON pet_stories;
CREATE POLICY stories_insert ON pet_stories FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- Vet Prep
ALTER TABLE vet_visit_prep_briefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vet_prep_select ON vet_visit_prep_briefs;
CREATE POLICY vet_prep_select ON vet_visit_prep_briefs FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Symptom Correlations
ALTER TABLE symptom_correlations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS symptom_corr_select ON symptom_correlations;
CREATE POLICY symptom_corr_select ON symptom_correlations FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Behavior Alerts
ALTER TABLE behavior_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS behavior_alerts_select ON behavior_alerts;
CREATE POLICY behavior_alerts_select ON behavior_alerts FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Activity Timeline
ALTER TABLE activity_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS timeline_select ON activity_timeline;
CREATE POLICY timeline_select ON activity_timeline FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);
DROP POLICY IF EXISTS timeline_insert ON activity_timeline;
CREATE POLICY timeline_insert ON activity_timeline FOR INSERT WITH CHECK (
  actor_id = auth.uid()
);

-- Medication Interactions
ALTER TABLE medication_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS med_int_select ON medication_interactions;
CREATE POLICY med_int_select ON medication_interactions FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Weight Goals
ALTER TABLE weight_goal_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS weight_goal_select ON weight_goal_progress;
CREATE POLICY weight_goal_select ON weight_goal_progress FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid()))
);

-- Dental
ALTER TABLE dental_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dental_select ON dental_records;
CREATE POLICY dental_select ON dental_records FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid()))
);
DROP POLICY IF EXISTS dental_insert ON dental_records;
CREATE POLICY dental_insert ON dental_records FOR INSERT WITH CHECK (
  pet_id IN (SELECT id FROM pets WHERE family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid()))
);

-- Birthday cards
ALTER TABLE birthday_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS birthday_select ON birthday_cards;
CREATE POLICY birthday_select ON birthday_cards FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Mood summary
ALTER TABLE daily_mood_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mood_summary_select ON daily_mood_summary;
CREATE POLICY mood_summary_select ON daily_mood_summary FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Year reviews
ALTER TABLE pet_year_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS year_review_select ON pet_year_reviews;
CREATE POLICY year_review_select ON pet_year_reviews FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Expenses
ALTER TABLE pet_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expenses_select ON pet_expenses;
CREATE POLICY expenses_select ON pet_expenses FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);
DROP POLICY IF EXISTS expenses_insert ON pet_expenses;
CREATE POLICY expenses_insert ON pet_expenses FOR INSERT WITH CHECK (
  logged_by = auth.uid()
);

-- Responsibilities
ALTER TABLE responsibilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS resp_select ON responsibilities;
CREATE POLICY resp_select ON responsibilities FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Lab results
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lab_select ON lab_results;
CREATE POLICY lab_select ON lab_results FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Vet handoffs
ALTER TABLE vet_visit_handoffs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS handoff_select ON vet_visit_handoffs;
CREATE POLICY handoff_select ON vet_visit_handoffs FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Behavior metrics
ALTER TABLE behavior_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS behavior_metrics_select ON behavior_metrics;
CREATE POLICY behavior_metrics_select ON behavior_metrics FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid()))
);

-- Feeding schedules
ALTER TABLE feeding_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feeding_select ON feeding_schedules;
CREATE POLICY feeding_select ON feeding_schedules FOR SELECT USING (
  pet_id IN (SELECT id FROM pets WHERE family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid()))
);

-- Community posts (public read)
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_select_all ON community_posts;
CREATE POLICY community_select_all ON community_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS community_insert ON community_posts;
CREATE POLICY community_insert ON community_posts FOR INSERT WITH CHECK (
  author_id = auth.uid()
);

-- Smart reminder suggestions
ALTER TABLE smart_reminder_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS smart_reminder_select ON smart_reminder_suggestions;
CREATE POLICY smart_reminder_select ON smart_reminder_suggestions FOR SELECT USING (
  family_group_id = (SELECT family_group_id FROM profiles WHERE id = auth.uid())
);

-- Grant service_role full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
