/**
 * V2 AI Engine — PawCare
 *
 * Implements AI features for the 25-feature V2 expansion:
 * - #6 Multi-Pet Symptom Correlation
 * - #7 Vet Visit Prep Brief
 * - #8 Behavior Change Detection
 * - #16 Lab Results OCR
 * - #17 Medication Interaction Checker
 *
 * Uses rule-based logic with OpenAI fallback.
 */

import OpenAI from 'openai';
import { addDays, differenceInDays, parseISO, subDays } from 'date-fns';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================================================================
// #7 VET VISIT PREP BRIEF
// ============================================================================
export interface VetPrepInput {
  pet: { id: string; name: string; species: string; breed?: string; date_of_birth?: string };
  weightLogs: Array<{ weight_kg: number; measured_at: string }>;
  moodLogs: Array<{ logged_date: string; mood: string; appetite?: string; energy_level?: string }>;
  medications: Array<{ medicine_name: string; purpose?: string; is_active?: boolean }>;
  recentVetVisits: Array<{ visit_date: string; reason?: string; diagnosis?: string }>;
  upcomingVaccines: Array<{ vaccine_name: string; next_due_date: string }>;
}

export async function generateVetPrepBrief(input: VetPrepInput): Promise<string> {
  const { pet, weightLogs, moodLogs, medications, recentVetVisits, upcomingVaccines } = input;

  // Compute weight trend
  let weightTrend = 'Stable weight.';
  if (weightLogs.length >= 2) {
    const recent = weightLogs.slice(-30);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    const delta = newest.weight_kg - oldest.weight_kg;
    const pct = ((delta / oldest.weight_kg) * 100).toFixed(1);
    if (Math.abs(delta) > 0.3) {
      weightTrend = `Weight ${delta > 0 ? 'gained' : 'lost'} ${Math.abs(delta).toFixed(2)}kg (${pct}%) over the last 30 days.`;
    }
  }

  // Appetite analysis (last 14 days)
  const recentMood = moodLogs.filter((m) => {
    const d = parseISO(m.logged_date);
    return differenceInDays(new Date(), d) <= 14;
  });
  const appetiteDays = recentMood.reduce((acc, m) => {
    if (m.appetite === 'poor' || m.appetite === 'none') acc++;
    return acc;
  }, 0);
  const appetiteSummary = appetiteDays > 0
    ? `Appetite concerns: ${appetiteDays} day(s) with poor/none appetite in last 14 days.`
    : 'Appetite has been consistently good.';

  // Mood summary
  const moodCounts: Record<string, number> = {};
  recentMood.forEach((m) => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1; });
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const moodSummary = dominantMood
    ? `Recent dominant mood: ${dominantMood}. ${recentMood.length} entries in 14 days.`
    : 'No recent mood data.';

  // Active medications
  const activeMeds = medications.filter((m) => m.is_active !== false);
  const medSummary = activeMeds.length > 0
    ? `Currently on: ${activeMeds.map((m) => m.medicine_name).join(', ')}.`
    : 'No active medications.';

  // Recent vet context
  const lastVisit = recentVetVisits[0];
  const recentVisitContext = lastVisit
    ? `Last visit (${lastVisit.visit_date}): ${lastVisit.reason || 'not specified'} → ${lastVisit.diagnosis || 'no diagnosis recorded'}.`
    : 'No recent vet visits on file.';

  // Suggested questions
  const questions: string[] = [];
  if (Math.abs(weightLogs.slice(-2).reduce((s, w) => s + w.weight_kg, 0) - weightLogs[0]?.weight_kg) > 0.3) {
    questions.push(`Why has ${pet.name}'s weight changed by ${Math.abs(weightLogs[weightLogs.length - 1].weight_kg - weightLogs[0].weight_kg).toFixed(1)}kg recently?`);
  }
  if (appetiteDays > 2) questions.push(`What could be causing the recent appetite changes?`);
  if (dominantMood === 'lethargic' || dominantMood === 'sick') questions.push(`Should we run bloodwork given the recent lethargy?`);
  if (activeMeds.length > 0) questions.push(`Are the current medications still appropriate given ${pet.name}'s recent data?`);
  if (upcomingVaccines.length > 0) questions.push(`Discuss timing of upcoming ${upcomingVaccines[0].vaccine_name}.`);

  const baseBrief = `Pre-visit brief for ${pet.name}:

📊 **Recent Trends:**
- ${weightTrend}
- ${appetiteSummary}
- ${moodSummary}

💊 **Medications:** ${medSummary}

📋 **History:** ${recentVisitContext}

❓ **Suggested questions for the vet:**
${questions.length > 0 ? questions.map((q) => `- ${q}`).join('\n') : '- Bring up any new behavioral changes'}`;

  // If OpenAI is available, enhance with AI insights
  if (openai && process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful veterinary assistant. Provide brief insights based on the pet data.',
          },
          {
            role: 'user',
            content: `${baseBrief}\n\nProvide 1-2 additional observations or concerns in 2-3 sentences.`,
          },
        ],
        max_tokens: 200,
      });
      const aiInsight = completion.choices[0]?.message?.content || '';
      return `${baseBrief}\n\n🤖 **AI Insight:**\n${aiInsight}`;
    } catch {
      return baseBrief;
    }
  }
  return baseBrief;
}

// ============================================================================
// #6 MULTI-PET SYMPTOM CORRELATION
// ============================================================================
export interface SymptomCorrelationInput {
  familyPets: Array<{ id: string; name: string }>;
  recentSymptomChecks: Array<{
    pet_id: string;
    created_at: string;
    symptoms_described: string;
    urgency_level?: string;
  }>;
  sharedEnvironment: string;
}

export async function detectSymptomCorrelations(
  input: SymptomCorrelationInput
): Promise<{
  hasCorrelation: boolean;
  affectedPetIds: string[];
  possibleCauses: string[];
  sharedEnvironment?: string;
  confidence: number;
}> {
  const { familyPets, recentSymptomChecks, sharedEnvironment } = input;

  // Group by symptom keyword signatures
  const sevenDaysAgo = subDays(new Date(), 7);
  const recentChecks = recentSymptomChecks.filter((s) =>
    parseISO(s.created_at) > sevenDaysAgo
  );

  if (recentChecks.length < 2) {
    return { hasCorrelation: false, affectedPetIds: [], possibleCauses: [], confidence: 0 };
  }

  // Extract symptom keywords
  const symptomsByPet: Record<string, string[]> = {};
  const keywords = ['sneez', 'cough', 'vomit', 'diarrh', 'letharg', 'not eating', 'hiding', 'scratch', 'eye', 'nose'];

  for (const check of recentChecks) {
    const lower = check.symptoms_described.toLowerCase();
    const found = keywords.filter((k) => lower.includes(k));
    if (found.length > 0) {
      symptomsByPet[check.pet_id] = (symptomsByPet[check.pet_id] || []).concat(found);
    }
  }

  const petsWithSymptoms = Object.keys(symptomsByPet);
  if (petsWithSymptoms.length < 2) {
    return { hasCorrelation: false, affectedPetIds: [], possibleCauses: [], confidence: 0 };
  }

  // Find common symptoms
  const allSymptoms = Object.values(symptomsByPet).flat();
  const symptomCounts: Record<string, number> = {};
  for (const s of allSymptoms) symptomCounts[s] = (symptomCounts[s] || 0) + 1;
  const commonSymptoms = Object.entries(symptomCounts).filter(([_, c]) => c >= 2).map(([s]) => s);

  if (commonSymptoms.length === 0) {
    return { hasCorrelation: false, affectedPetIds: petsWithSymptoms, possibleCauses: [], confidence: 0 };
  }

  // Possible causes based on shared symptoms
  const causeMap: Record<string, string[]> = {
    'sneez': ['Upper respiratory infection', 'Allergen (dust, pollen)', 'Shared environment irritant'],
    'cough': ['Airborne irritant', 'Hairball', 'Shared allergen'],
    'eye': ['Conjunctivitis (contagious)', 'Allergen', 'Upper respiratory'],
    'nose': ['URI', 'Allergen exposure'],
    'vomit': ['Dietary indiscretion', 'Toxin ingestion', 'Hairball'],
    'diarrh': ['Dietary change', 'Parasites', 'Stress'],
    'letharg': ['Systemic illness', 'Heat stress', 'Pain'],
    'not eating': ['Illness', 'Stress', 'Food aversion'],
    'hiding': ['Stress', 'Illness', 'Fear/anxiety'],
    'scratch': ['Fleas', 'Allergies', 'Skin infection'],
  };

  const possibleCauses = new Set<string>();
  commonSymptoms.forEach((s) => {
    (causeMap[s] || []).forEach((c) => possibleCauses.add(c));
  });

  const affectedPetIds = petsWithSymptoms;
  const confidence = Math.min(0.95, 0.4 + (commonSymptoms.length * 0.15) + (affectedPetIds.length * 0.05));

  return {
    hasCorrelation: true,
    affectedPetIds,
    possibleCauses: Array.from(possibleCauses),
    sharedEnvironment,
    confidence,
  };
}

// ============================================================================
// #8 BEHAVIOR CHANGE DETECTION
// ============================================================================
export interface BehaviorAnalysis {
  petId: string;
  metricType: 'sleep' | 'water' | 'appetite' | 'activity';
  baselineValue: number;
  currentValue: number;
  percentChange: number;
  severity: 'monitor' | 'watch' | 'concern' | 'urgent';
  aiSummary: string;
  suggestedAction: string;
}

export async function analyzeBehaviorPatterns(
  petId: string,
  metricType: 'sleep' | 'water' | 'appetite' | 'activity',
  recentValues: number[],
  baselineValues: number[]
): Promise<BehaviorAnalysis | null> {
  if (recentValues.length < 3 || baselineValues.length < 5) {
    return null;
  }

  const recentAvg = recentValues.reduce((s, v) => s + v, 0) / recentValues.length;
  const baselineAvg = baselineValues.reduce((s, v) => s + v, 0) / baselineValues.length;
  const percentChange = ((recentAvg - baselineAvg) / baselineAvg) * 100;

  // Severity rules
  let severity: BehaviorAnalysis['severity'] = 'monitor';
  let suggestedAction = 'Continue normal monitoring.';
  let aiSummary = `${metricType} is within normal range (${percentChange.toFixed(1)}% from baseline).`;

  const absChange = Math.abs(percentChange);

  // Direction matters: decreased water/appetite = concerning; increased water = concerning (kidney)
  const isConcerning = (metricType === 'water' || metricType === 'appetite') && percentChange < 0;
  const isConcerningIncrease = metricType === 'water' && percentChange > 30;
  const isLethargy = metricType === 'activity' && percentChange < -40;
  const isSleepChange = metricType === 'sleep' && absChange > 30;

  if (absChange > 50 || isLethargy) {
    severity = 'urgent';
    aiSummary = `⚠️ Significant ${metricType} change: ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}% from baseline. Cats hide illness — schedule a vet visit.`;
    suggestedAction = 'Schedule a vet visit within 24-48 hours.';
  } else if (absChange > 25 || isConcerning || isConcerningIncrease || isSleepChange) {
    severity = 'concern';
    aiSummary = `${metricType.charAt(0).toUpperCase() + metricType.slice(1)} has changed by ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}% from baseline.`;
    suggestedAction = 'Monitor closely for 3-5 days. If it persists or worsens, contact your vet.';
  } else if (absChange > 15) {
    severity = 'watch';
    aiSummary = `${metricType} is slightly ${percentChange > 0 ? 'higher' : 'lower'} than usual (${percentChange.toFixed(1)}%).`;
    suggestedAction = 'Continue normal monitoring.';
  }

  return {
    petId,
    metricType,
    baselineValue: Math.round(baselineAvg * 10) / 10,
    currentValue: Math.round(recentAvg * 10) / 10,
    percentChange: Math.round(percentChange * 10) / 10,
    severity,
    aiSummary,
    suggestedAction,
  };
}

// ============================================================================
// #17 MEDICATION INTERACTION CHECKER
// ============================================================================
const KNOWN_INTERACTIONS: Array<{
  pattern: RegExp;
  description: string;
  severity: 'warning' | 'danger';
  recommendation: string;
}> = [
  {
    pattern: /insulin|glipizide|metformin/i,
    description: 'Diabetes medications require consistent timing.',
    severity: 'warning',
    recommendation: 'Maintain strict 12-hour dosing schedule and monitor glucose.',
  },
  {
    pattern: /tramadol|gabapentin|opioid/i,
    description: 'Sedatives may compound with other CNS depressants.',
    severity: 'danger',
    recommendation: 'Do not combine with antihistamines without vet guidance.',
  },
  {
    pattern: /prednisolone|steroid|cortisone/i,
    description: 'Steroids interact with NSAIDs and some antibiotics.',
    severity: 'warning',
    recommendation: 'Avoid combining with meloxicam or carprofen.',
  },
  {
    pattern: /metronidazole|flagyl/i,
    description: 'Antibiotic — avoid in pregnant/nursing animals.',
    severity: 'warning',
    recommendation: 'Confirm pet is not pregnant/nursing before starting.',
  },
];

export async function checkMedicationInteractions(
  medications: Array<{ id: string; medicine_name: string; purpose?: string; pet_id: string }>
): Promise<Array<{
  type: string;
  severity: string;
  description: string;
  recommendation: string;
  pet_ids: string[];
}>> {
  const issues: Array<{
    type: string;
    severity: string;
    description: string;
    recommendation: string;
    pet_ids: string[];
  }> = [];

  // Cross-pet duplicate active ingredients (different pets, same med = cross-grooming risk)
  const medGroups: Record<string, typeof medications> = {};
  for (const med of medications) {
    const baseName = med.medicine_name.toLowerCase().split(/\s+/)[0];
    if (baseName.length > 3) {
      medGroups[baseName] = medGroups[baseName] || [];
      medGroups[baseName].push(med);
    }
  }
  for (const [baseName, meds] of Object.entries(medGroups)) {
    if (meds.length > 1) {
      const uniquePetIds = [...new Set(meds.map((m) => m.pet_id))];
      if (uniquePetIds.length > 1) {
        issues.push({
          type: 'cross_pet_risk',
          severity: 'warning',
          description: `Multiple pets are on "${baseName}". If they groom each other, this could lead to overdose.`,
          recommendation: 'Monitor for excessive grooming between these pets. Separate during medication times if needed.',
          pet_ids: uniquePetIds,
        });
      }
    }
  }

  // Same-pet known interactions
  for (const med of medications) {
    for (const pattern of KNOWN_INTERACTIONS) {
      if (pattern.pattern.test(med.medicine_name)) {
        issues.push({
          type: 'info',
          severity: pattern.severity,
          description: `${med.medicine_name}: ${pattern.description}`,
          recommendation: pattern.recommendation,
          pet_ids: [med.pet_id],
        });
      }
    }
  }

  return issues;
}

// ============================================================================
// #21 CAT MOOD WEATHER (Daily Summary)
// ============================================================================
export interface MoodWeather {
  vibesScore: number; // 0-100
  breakdown: Record<string, { playful: number; calm: number; hiding: number; sick: number; happy: number }>;
  dominantMood: string;
  totalLogs: number;
}

export function computeMoodWeather(
  todayMoodLogs: Array<{ pet_id: string; mood: string }>
): MoodWeather {
  if (todayMoodLogs.length === 0) {
    return { vibesScore: 50, breakdown: {}, dominantMood: 'unknown', totalLogs: 0 };
  }

  const breakdown: Record<string, Record<string, number>> = {};
  const overallCounts: Record<string, number> = {};

  for (const log of todayMoodLogs) {
    if (!breakdown[log.pet_id]) breakdown[log.pet_id] = {} as any;
    (breakdown[log.pet_id] as any)[log.mood] = ((breakdown[log.pet_id] as any)[log.mood] || 0) + 1;
    overallCounts[log.mood] = (overallCounts[log.mood] || 0) + 1;
  }

  // Cast for return type compatibility
  const breakdownTyped: Record<string, { playful: number; calm: number; hiding: number; sick: number; happy: number }> =
    breakdown as any;

  const dominantMood = Object.entries(overallCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  // Vibes score: 100 = all playful/happy, 0 = all sick/hiding
  const positiveMoods = ['happy', 'playful', 'calm', 'normal'];
  const negativeMoods = ['sick', 'hiding', 'anxious', 'aggressive', 'lethargic', 'tired'];
  let positive = 0;
  let negative = 0;
  for (const [mood, count] of Object.entries(overallCounts)) {
    if (positiveMoods.includes(mood)) positive += count;
    else if (negativeMoods.includes(mood)) negative += count;
  }
  const total = positive + negative || 1;
  const vibesScore = Math.round((positive / total) * 100);

  return { vibesScore, breakdown: breakdown as any, dominantMood, totalLogs: todayMoodLogs.length };
}

// ============================================================================
// #16 LAB RESULTS OCR (placeholder — real OCR via OpenAI Vision)
// ============================================================================
export async function parseLabResults(imageBase64: string): Promise<{
  tests: Array<{ name: string; value: number; unit: string; range: string; status: 'normal' | 'high' | 'low' }>;
  abnormalities: string[];
  summary: string;
}> {
  // Without OCR: return a placeholder result
  // With OpenAI Vision API: extract structured data from image
  if (!openai) {
    return {
      tests: [],
      abnormalities: [],
      summary: 'OCR requires OpenAI API key. Upload image to enable.',
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract lab test results from this image as JSON: array of {name, value, unit, range, status: normal|high|low}. Also list any abnormal values and a 1-sentence summary.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      tests: result.tests || [],
      abnormalities: result.abnormalities || [],
      summary: result.summary || '',
    };
  } catch {
    return { tests: [], abnormalities: [], summary: 'OCR failed.' };
  }
}

// ============================================================================
// #8 BEHAVIOR ALERT GENERATION (cron-callable)
// ============================================================================
export async function generateBehaviorAlertsForFamily(
  supabase: any,
  familyGroupId: string
): Promise<number> {
  // Get all pets in family
  const { data: pets } = await supabase
    .from('pets')
    .select('id, name')
    .eq('family_group_id', familyGroupId);

  if (!pets || pets.length === 0) return 0;

  let alertsCreated = 0;
  const fourteenDaysAgo = subDays(new Date(), 14);
  const thirtyDaysAgo = subDays(new Date(), 30);

  for (const pet of pets) {
    // Recent weight (last 14 days)
    const { data: recentWeight } = await supabase
      .from('weight_logs')
      .select('weight_kg, measured_at')
      .eq('pet_id', pet.id)
      .gte('measured_at', fourteenDaysAgo.toISOString().slice(0, 10))
      .order('measured_at', { ascending: false });

    // Baseline weight (30-14 days ago)
    const { data: baselineWeight } = await supabase
      .from('weight_logs')
      .select('weight_kg, measured_at')
      .eq('pet_id', pet.id)
      .gte('measured_at', thirtyDaysAgo.toISOString().slice(0, 10))
      .lt('measured_at', fourteenDaysAgo.toISOString().slice(0, 10));

    if (recentWeight && recentWeight.length > 0 && baselineWeight && baselineWeight.length > 0) {
      const recentAvg = recentWeight.reduce((s: number, w: any) => s + w.weight_kg, 0) / recentWeight.length;
      const baselineAvg = baselineWeight.reduce((s: number, w: any) => s + w.weight_kg, 0) / baselineWeight.length;
      const pctChange = ((recentAvg - baselineAvg) / baselineAvg) * 100;

      if (Math.abs(pctChange) > 5) {
        const severity = Math.abs(pctChange) > 10 ? 'concern' : 'watch';
        await supabase.from('behavior_alerts').insert({
          pet_id: pet.id,
          family_group_id: familyGroupId,
          metric_type: 'weight',
          baseline_value: Math.round(baselineAvg * 100) / 100,
          current_value: Math.round(recentAvg * 100) / 100,
          percent_change: Math.round(pctChange * 10) / 10,
          severity,
          ai_summary: `${pet.name}'s weight has ${pctChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(pctChange).toFixed(1)}% over the last 2 weeks.`,
          suggested_action: pctChange < -10 ? 'Consider scheduling a vet visit to rule out illness.' : 'Monitor feeding portions.',
        });
        alertsCreated++;
      }
    }

    // Mood pattern (lethargy detection)
    const { data: recentMood } = await supabase
      .from('mood_logs')
      .select('mood, energy_level, appetite')
      .eq('pet_id', pet.id)
      .gte('logged_date', fourteenDaysAgo.toISOString().slice(0, 10))
      .order('logged_date', { ascending: false });

    if (recentMood && recentMood.length >= 3) {
      const lethargic = recentMood.filter((m: any) =>
        m.energy_level === 'low' || m.energy_level === 'very_low' ||
        m.mood === 'lethargic' || m.mood === 'sick'
      ).length;
      const lethargyRatio = lethargic / recentMood.length;

      if (lethargyRatio >= 0.6) {
        await supabase.from('behavior_alerts').insert({
          pet_id: pet.id,
          family_group_id: familyGroupId,
          metric_type: 'activity',
          baseline_value: 0,
          current_value: lethargic,
          percent_change: lethargyRatio * 100,
          severity: lethargyRatio >= 0.8 ? 'urgent' : 'concern',
          ai_summary: `${pet.name} has shown low energy or lethargy in ${Math.round(lethargyRatio * 100)}% of recent entries. Cats hide illness — early detection matters.`,
          suggested_action: 'Schedule a vet visit. Mention the energy decline pattern.',
        });
        alertsCreated++;
      }
    }
  }

  return alertsCreated;
}
