// Core database types shared between web and mobile

export type Species = 'cat' | 'dog' | 'other';
export type Gender = 'male' | 'female' | 'unknown';
export type FurType = 'short' | 'long' | 'medium' | 'hairless' | 'curly';
export type FamilyRole = 'owner' | 'caregiver' | 'viewer';

export type MedicineType = 'tablet' | 'syrup' | 'injection' | 'topical' | 'drops' | 'other';
export type Frequency = 'once' | 'daily' | 'twice_daily' | 'weekly' | 'monthly' | 'as_needed';

export type VaccineType = 'core' | 'non_core' | 'booster' | 'rabies' | 'combo' | 'other';

export type Mood = 'happy' | 'playful' | 'calm' | 'tired' | 'anxious' | 'aggressive' | 'sick' | 'normal';
export type Appetite = 'excellent' | 'good' | 'poor' | 'none';
export type EnergyLevel = 'high' | 'normal' | 'low' | 'very_low';

export type UrgencyLevel = 'monitor' | 'see_vet_soon' | 'emergency';

export type InventoryCategory =
  | 'food_dry'
  | 'food_wet'
  | 'food_treats'
  | 'litter'
  | 'medicine'
  | 'grooming'
  | 'accessories'
  | 'toys'
  | 'other';

export type InventoryUnit = 'kg' | 'g' | 'packs' | 'liters' | 'pieces' | 'bags';

export type ReminderType =
  | 'vaccine'
  | 'deworming'
  | 'vet_visit'
  | 'medication'
  | 'heat'
  | 'inventory'
  | 'custom'
  | 'grooming'
  | 'birthday';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  family_code: string | null;
  family_role: FamilyRole;
  family_group_id: string | null;
  notification_token: string | null;
  web_push_subscription: unknown | null;
  timezone: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_group_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  family_group_id: string | null;
  name: string;
  species: Species;
  breed: string | null;
  gender: Gender;
  color: string | null;
  fur_type: FurType | null;
  date_of_birth: string | null;
  adoption_date: string | null;
  is_birthday_known: boolean;
  weight_kg: number | null;
  microchip_number: string | null;
  insurance_policy: string | null;
  photo_url: string | null;
  banner_photo_url: string | null;
  bio: string | null;
  is_neutered: boolean;
  neutered_date: string | null;
  neutered_notes: string | null;
  is_indoor: boolean;
  is_active: boolean;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetPhoto {
  id: string;
  pet_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string | null;
  is_profile_photo: boolean;
  uploaded_by: string | null;
  created_at: string;
}

export interface VetVisit {
  id: string;
  pet_id: string;
  visit_date: string;
  vet_name: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  reason: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  follow_up_date: string | null;
  cost_inr: number | null;
  documents_urls: string[] | null;
  logged_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  pet_id: string;
  medicine_name: string;
  medicine_type: MedicineType | null;
  dosage: string | null;
  purpose: string | null;
  prescribed_by: string | null;
  start_date: string | null;
  end_date: string | null;
  frequency: Frequency;
  reminder_time: string | null;
  is_ongoing: boolean;
  is_active: boolean;
  notes: string | null;
  side_effects_noted: string | null;
  effectiveness_rating: number | null;
  logged_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  pet_id: string;
  given_at: string;
  given_by: string | null;
  dose_given: string | null;
  notes: string | null;
  skipped: boolean;
  skip_reason: string | null;
  created_at: string;
}

export interface Vaccination {
  id: string;
  pet_id: string;
  vaccine_name: string;
  vaccine_type: VaccineType;
  date_given: string;
  batch_number: string | null;
  administered_by: string | null;
  clinic_name: string | null;
  next_due_date: string | null;
  reminder_days_before: number;
  notes: string | null;
  certificate_url: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface DewormingRecord {
  id: string;
  pet_id: string;
  product_name: string;
  date_given: string;
  next_due_date: string | null;
  administered_by: string | null;
  weight_at_time: number | null;
  notes: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface HeatCycle {
  id: string;
  pet_id: string;
  start_date: string;
  end_date: string | null;
  duration_days: number | null;
  symptoms: string | null;
  notes: string | null;
  predicted_next: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface WeightLog {
  id: string;
  pet_id: string;
  weight_kg: number;
  measured_at: string;
  notes: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface MoodLog {
  id: string;
  pet_id: string;
  logged_date: string;
  mood: Mood;
  appetite: Appetite | null;
  energy_level: EnergyLevel | null;
  notes: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface SymptomCheck {
  id: string;
  pet_id: string;
  symptoms_described: string;
  ai_assessment: string | null;
  urgency_level: UrgencyLevel | null;
  ai_suggestions: string | null;
  checked_by: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  family_group_id: string | null;
  owner_id: string;
  item_name: string;
  category: InventoryCategory;
  brand: string | null;
  unit: InventoryUnit;
  current_quantity: number | null;
  minimum_quantity: number | null;
  estimated_days_remaining: number | null;
  last_purchased_date: string | null;
  last_purchased_quantity: number | null;
  last_purchased_cost_inr: number | null;
  affiliate_link: string | null;
  notes: string | null;
  alert_enabled: boolean;
  alert_days_before: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryPurchase {
  id: string;
  item_id: string;
  purchase_date: string;
  quantity: number | null;
  cost_inr: number | null;
  purchased_from: string | null;
  notes: string | null;
  logged_by: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  pet_id: string | null;
  family_group_id: string | null;
  type: ReminderType;
  title: string;
  description: string | null;
  due_date: string;
  reminder_at: string;
  is_sent: boolean;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  recurrence: Recurrence;
  recurrence_interval: number | null;
  created_by: string | null;
  created_at: string;
}

export interface VetContact {
  id: string;
  family_group_id: string | null;
  owner_id: string;
  name: string;
  clinic_name: string | null;
  phone: string | null;
  address: string | null;
  is_emergency: boolean;
  is_24_hours: boolean;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface EmergencyVet {
  id: string;
  name: string;
  clinic_name: string | null;
  phone: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distance_km: number | null;
  is_open_now: boolean;
  rating: number | null;
  is_24_hours: boolean;
}

export interface SymptomCheckResult {
  urgency: UrgencyLevel;
  possible_causes: string[];
  recommended_actions: string[];
  home_care_tips: string[];
  when_to_go_to_vet: string;
  disclaimer: string;
}

export interface HealthInsight {
  pet_id: string;
  pet_name: string;
  type: 'weight' | 'mood' | 'vaccine' | 'general';
  severity: 'info' | 'warning' | 'alert';
  message: string;
  action_url?: string;
}

export interface MonthlySpendEstimate {
  total_estimated_inr: number;
  by_category: Array<{
    category: InventoryCategory;
    estimated_inr: number;
  }>;
  message: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: { message: string; code?: string };
}
