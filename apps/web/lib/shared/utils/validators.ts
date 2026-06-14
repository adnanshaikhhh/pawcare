import { z } from 'zod';

export const speciesSchema = z.enum(['cat', 'dog', 'other']);
export const genderSchema = z.enum(['male', 'female', 'unknown']);
export const furTypeSchema = z.enum(['short', 'long', 'medium', 'hairless', 'curly']);

export const petCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  species: speciesSchema,
  breed: z.string().max(100).optional().nullable(),
  gender: genderSchema.default('unknown'),
  color: z.string().max(100).optional().nullable(),
  fur_type: furTypeSchema.optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  adoption_date: z.string().optional().nullable(),
  is_birthday_known: z.boolean().default(true),
  weight_kg: z.number().positive().optional().nullable(),
  microchip_number: z.string().max(50).optional().nullable(),
  insurance_policy: z.string().max(100).optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  banner_photo_url: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  is_neutered: z.boolean().default(false),
  neutered_date: z.string().optional().nullable(),
  neutered_notes: z.string().max(500).optional().nullable(),
  is_indoor: z.boolean().default(true),
});

export const petUpdateSchema = petCreateSchema.partial();

export const vetVisitSchema = z.object({
  pet_id: z.string().uuid(),
  visit_date: z.string(),
  vet_name: z.string().max(100).optional().nullable(),
  clinic_name: z.string().max(150).optional().nullable(),
  clinic_address: z.string().max(300).optional().nullable(),
  clinic_phone: z.string().max(30).optional().nullable(),
  reason: z.string().max(300).optional().nullable(),
  diagnosis: z.string().max(500).optional().nullable(),
  treatment: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  cost_inr: z.number().nonnegative().optional().nullable(),
  documents_urls: z.array(z.string().url()).optional().nullable(),
});

export const medicationSchema = z.object({
  pet_id: z.string().uuid(),
  medicine_name: z.string().min(1).max(150),
  medicine_type: z.enum(['tablet', 'syrup', 'injection', 'topical', 'drops', 'other']).optional().nullable(),
  dosage: z.string().max(100).optional().nullable(),
  purpose: z.string().max(300).optional().nullable(),
  prescribed_by: z.string().max(150).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  frequency: z.enum(['once', 'daily', 'twice_daily', 'weekly', 'monthly', 'as_needed']).default('daily'),
  reminder_time: z.string().optional().nullable(),
  is_ongoing: z.boolean().default(false),
  is_active: z.boolean().default(true),
  notes: z.string().max(1000).optional().nullable(),
  side_effects_noted: z.string().max(500).optional().nullable(),
  effectiveness_rating: z.number().int().min(1).max(5).optional().nullable(),
});

export const medicationLogSchema = z.object({
  medication_id: z.string().uuid(),
  pet_id: z.string().uuid(),
  given_at: z.string().default(() => new Date().toISOString()),
  dose_given: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  skipped: z.boolean().default(false),
  skip_reason: z.string().max(300).optional().nullable(),
});

export const vaccinationSchema = z.object({
  pet_id: z.string().uuid(),
  vaccine_name: z.string().min(1).max(150),
  vaccine_type: z.enum(['core', 'non_core', 'booster', 'rabies', 'combo', 'other']).default('core'),
  date_given: z.string(),
  batch_number: z.string().max(100).optional().nullable(),
  administered_by: z.string().max(150).optional().nullable(),
  clinic_name: z.string().max(150).optional().nullable(),
  next_due_date: z.string().optional().nullable(),
  reminder_days_before: z.number().int().min(0).max(60).default(7),
  notes: z.string().max(500).optional().nullable(),
  certificate_url: z.string().url().optional().nullable(),
});

export const dewormingSchema = z.object({
  pet_id: z.string().uuid(),
  product_name: z.string().min(1).max(150),
  date_given: z.string(),
  next_due_date: z.string().optional().nullable(),
  administered_by: z.string().max(150).optional().nullable(),
  weight_at_time: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const weightLogSchema = z.object({
  pet_id: z.string().uuid(),
  weight_kg: z.number().positive(),
  measured_at: z.string(),
  notes: z.string().max(300).optional().nullable(),
});

export const moodLogSchema = z.object({
  pet_id: z.string().uuid(),
  logged_date: z.string().default(() => new Date().toISOString().split('T')[0]),
  mood: z.enum(['happy', 'playful', 'calm', 'tired', 'anxious', 'aggressive', 'sick', 'normal']),
  appetite: z.enum(['excellent', 'good', 'poor', 'none']).optional().nullable(),
  energy_level: z.enum(['high', 'normal', 'low', 'very_low']).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const heatCycleSchema = z.object({
  pet_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
  duration_days: z.number().int().positive().optional().nullable(),
  symptoms: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const inventoryItemSchema = z.object({
  item_name: z.string().min(1).max(150),
  category: z.enum([
    'food_dry',
    'food_wet',
    'food_treats',
    'litter',
    'medicine',
    'grooming',
    'accessories',
    'toys',
    'other',
  ]),
  brand: z.string().max(100).optional().nullable(),
  unit: z.enum(['kg', 'g', 'packs', 'liters', 'pieces', 'bags']).default('pieces'),
  current_quantity: z.number().nonnegative().optional().nullable(),
  minimum_quantity: z.number().nonnegative().optional().nullable(),
  estimated_days_remaining: z.number().int().nonnegative().optional().nullable(),
  last_purchased_date: z.string().optional().nullable(),
  last_purchased_quantity: z.number().nonnegative().optional().nullable(),
  last_purchased_cost_inr: z.number().nonnegative().optional().nullable(),
  affiliate_link: z.string().url().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  alert_enabled: z.boolean().default(true),
  alert_days_before: z.number().int().min(0).max(30).default(2),
});

export const inventoryPurchaseSchema = z.object({
  item_id: z.string().uuid(),
  purchase_date: z.string(),
  quantity: z.number().nonnegative().optional().nullable(),
  cost_inr: z.number().nonnegative().optional().nullable(),
  purchased_from: z.string().max(150).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const reminderSchema = z.object({
  pet_id: z.string().uuid().optional().nullable(),
  type: z.enum([
    'vaccine',
    'deworming',
    'vet_visit',
    'medication',
    'heat',
    'inventory',
    'custom',
    'grooming',
    'birthday',
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  due_date: z.string(),
  reminder_at: z.string(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']).default('none'),
  recurrence_interval: z.number().int().positive().optional().nullable(),
});

export const vetContactSchema = z.object({
  name: z.string().min(1).max(150),
  clinic_name: z.string().max(150).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  is_emergency: z.boolean().default(false),
  is_24_hours: z.boolean().default(false),
  notes: z.string().max(500).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const symptomCheckSchema = z.object({
  pet_id: z.string().uuid(),
  symptoms_described: z.string().min(5, 'Please describe the symptoms in more detail').max(2000),
});

export const familyJoinSchema = z.object({
  invite_code: z.string().length(8, 'Invite code must be 8 characters'),
});

export const familyCreateSchema = z.object({
  name: z.string().min(1).max(100),
});

export const notificationSubscribeSchema = z.object({
  expo_push_token: z.string().optional(),
  web_push_subscription: z.unknown().optional(),
});

export type PetCreateInput = z.infer<typeof petCreateSchema>;
export type PetUpdateInput = z.infer<typeof petUpdateSchema>;
export type VetVisitInput = z.infer<typeof vetVisitSchema>;
export type MedicationInput = z.infer<typeof medicationSchema>;
export type VaccinationInput = z.infer<typeof vaccinationSchema>;
export type DewormingInput = z.infer<typeof dewormingSchema>;
export type WeightLogInput = z.infer<typeof weightLogSchema>;
export type MoodLogInput = z.infer<typeof moodLogSchema>;
export type HeatCycleInput = z.infer<typeof heatCycleSchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type InventoryPurchaseInput = z.infer<typeof inventoryPurchaseSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
export type VetContactInput = z.infer<typeof vetContactSchema>;
export type SymptomCheckInput = z.infer<typeof symptomCheckSchema>;
