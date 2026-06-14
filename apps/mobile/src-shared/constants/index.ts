import type { Species, Mood, Appetite, EnergyLevel, InventoryCategory, ReminderType } from '../types';

export const SPECIES_LABELS: Record<Species, { label: string; emoji: string }> = {
  cat: { label: 'Cat', emoji: '🐱' },
  dog: { label: 'Dog', emoji: '🐶' },
  other: { label: 'Other', emoji: '🐾' },
};

export const MOOD_LABELS: Record<Mood, { label: string; emoji: string; color: string }> = {
  happy: { label: 'Happy', emoji: '😸', color: '#34C759' },
  playful: { label: 'Playful', emoji: '😺', color: '#FF9F0A' },
  calm: { label: 'Calm', emoji: '😌', color: '#5AC8FA' },
  tired: { label: 'Tired', emoji: '😴', color: '#8E8E93' },
  anxious: { label: 'Anxious', emoji: '😟', color: '#FF9500' },
  aggressive: { label: 'Aggressive', emoji: '😤', color: '#FF3B30' },
  sick: { label: 'Sick', emoji: '🤒', color: '#FF3B30' },
  normal: { label: 'Normal', emoji: '🙂', color: '#34C759' },
};

export const APPETITE_LABELS: Record<Appetite, { label: string; emoji: string }> = {
  excellent: { label: 'Excellent', emoji: '🍖' },
  good: { label: 'Good', emoji: '🍗' },
  poor: { label: 'Poor', emoji: '🥣' },
  none: { label: 'None', emoji: '🚫' },
};

export const ENERGY_LABELS: Record<EnergyLevel, { label: string; emoji: string }> = {
  high: { label: 'High', emoji: '⚡' },
  normal: { label: 'Normal', emoji: '🔋' },
  low: { label: 'Low', emoji: '🪫' },
  very_low: { label: 'Very Low', emoji: '🛌' },
};

export const INVENTORY_CATEGORIES: Array<{
  key: InventoryCategory;
  label: string;
  emoji: string;
  color: string;
}> = [
  { key: 'food_dry', label: 'Dry Food', emoji: '🍖', color: '#FF8E53' },
  { key: 'food_wet', label: 'Wet Food', emoji: '🍗', color: '#FF6B6B' },
  { key: 'food_treats', label: 'Treats', emoji: '🦴', color: '#FFB347' },
  { key: 'litter', label: 'Litter', emoji: '🪨', color: '#A0A0A0' },
  { key: 'medicine', label: 'Medicine', emoji: '💊', color: '#4FACFE' },
  { key: 'grooming', label: 'Grooming', emoji: '✂️', color: '#FF85A1' },
  { key: 'accessories', label: 'Accessories', emoji: '🎀', color: '#B084F6' },
  { key: 'toys', label: 'Toys', emoji: '🧸', color: '#FFD93D' },
  { key: 'other', label: 'Other', emoji: '📦', color: '#6E6E73' },
];

export const REMINDER_TYPE_LABELS: Record<ReminderType, { label: string; emoji: string }> = {
  vaccine: { label: 'Vaccine', emoji: '💉' },
  deworming: { label: 'Deworming', emoji: '🐛' },
  vet_visit: { label: 'Vet Visit', emoji: '🏥' },
  medication: { label: 'Medication', emoji: '💊' },
  heat: { label: 'Heat Cycle', emoji: '🔴' },
  inventory: { label: 'Inventory', emoji: '📦' },
  custom: { label: 'Custom', emoji: '📌' },
  grooming: { label: 'Grooming', emoji: '✂️' },
  birthday: { label: 'Birthday', emoji: '🎂' },
};

export const POPULAR_DOG_BREEDS = [
  'Labrador Retriever',
  'Golden Retriever',
  'German Shepherd',
  'Bulldog',
  'Poodle',
  'Beagle',
  'Rottweiler',
  'Siberian Husky',
  'Pomeranian',
  'Shih Tzu',
  'Indian Pariah',
  'Indie (Mixed)',
  'Indie',
  'Mixed Breed',
  'Other',
];

export const POPULAR_CAT_BREEDS = [
  'Persian',
  'Maine Coon',
  'British Shorthair',
  'Ragdoll',
  'Siamese',
  'Bengal',
  'Sphynx',
  'Himalayan',
  'Indian Billi',
  'Domestic Shorthair',
  'Domestic Long Hair',
  'Indie (Mixed)',
  'Mixed Breed',
  'Other',
];

export const COLORS = {
  brandPrimary: '#FF6B6B',
  brandSecondary: '#FF8E53',
  brandLight: '#FFF0EE',
  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF3B30',
  info: '#007AFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#6E6E73',
  textMuted: '#AEAEB2',
  bgPrimary: '#FAFAFA',
  bgCard: '#FFFFFF',
  border: '#E8E8ED',
  catAccent: '#FF6B6B',
  dogAccent: '#4FACFE',
};

export const URGENCY_COLORS = {
  emergency: { bg: '#FFE5E5', border: '#FF3B30', text: '#D70015', label: '🚨 Emergency — Go to vet now' },
  see_vet_soon: { bg: '#FFF3E0', border: '#FF9F0A', text: '#B35900', label: '⚠️ See a vet soon' },
  monitor: { bg: '#FFF9C4', border: '#FBC02D', text: '#8A6D00', label: '👀 Monitor at home' },
};

export const APP_NAME = 'PawCare';
export const APP_TAGLINE = 'Every pet. Every moment. Every detail.';
