import type { Pet, SymptomCheckResult, UrgencyLevel, MoodLog, Vaccination, WeightLog } from '@/lib/shared';

const EMERGENCY_KEYWORDS = [
  'unconscious', 'unresponsive', 'seizure', 'convuls', 'collapse', 'collapsed',
  'not breathing', 'stopped breathing', 'can\'t breathe', 'choking', 'bleeding heavily',
  'hit by car', 'poisoned', 'ate poison', 'swallowed', 'toxic', 'frothing',
  'blood in stool', 'blood in urine', 'vomiting blood', 'blue gums', 'pale gums',
  'paralysed', 'pale gums', 'severe pain', 'screaming', 'crying in pain',
];

const SOON_KEYWORDS = [
  'vomiting', 'vomit', 'diarrhea', 'diarrhoea', 'lethargic', 'lethargy', 'not eating',
  'refusing food', 'weight loss', 'limping', 'won\'t walk', 'can\'t walk',
  'blood', 'swelling', 'swollen', 'eye discharge', 'eye injury', 'limping',
  'coughing', 'sneezing blood', 'breathing fast', 'panting heavily',
  'urinating a lot', 'can\'t pee', 'straining to pee', 'dark urine',
];

const MONITOR_KEYWORDS = [
  'slight', 'mild', 'minor', 'small', 'a bit', 'occasional', 'sometimes',
  'scratching', 'itchy', 'licking paws', 'licking', 'slight limp',
  'mild sneezing', 'soft stool', 'eating less',
];

export function ruleBasedSymptomCheck(text: string): SymptomCheckResult {
  const lower = text.toLowerCase();

  let urgency: UrgencyLevel = 'monitor';
  if (EMERGENCY_KEYWORDS.some((k) => lower.includes(k))) urgency = 'emergency';
  else if (SOON_KEYWORDS.some((k) => lower.includes(k))) urgency = 'see_vet_soon';

  const causes: string[] = [];
  if (lower.includes('vomit')) causes.push('Gastritis, dietary indiscretion, infection, or obstruction');
  if (lower.includes('diarrh')) causes.push('Diet change, parasites, infection, or stress');
  if (lower.includes('letharg')) causes.push('Infection, pain, dehydration, or systemic illness');
  if (lower.includes('limp')) causes.push('Sprain, fracture, joint issue, or paw injury');
  if (lower.includes('breath')) causes.push('Respiratory infection, asthma (in cats), or heart issue');
  if (lower.includes('itch') || lower.includes('scratch')) causes.push('Fleas, allergies, or skin infection');
  if (causes.length === 0) causes.push('Various minor or behavioral causes');

  const actions: string[] = [];
  if (urgency === 'emergency') {
    actions.push('Call your nearest emergency vet clinic IMMEDIATELY');
    actions.push('Do not wait — drive to the clinic now');
    actions.push('Keep your pet warm and still during transport');
  } else if (urgency === 'see_vet_soon') {
    actions.push('Schedule a vet visit within 24-48 hours');
    actions.push('Monitor food and water intake');
    actions.push('Watch for any worsening symptoms');
  } else {
    actions.push('Monitor for 24-48 hours');
    actions.push('Log mood and appetite daily in PawCare');
    actions.push('See a vet if symptoms persist or worsen');
  }

  const tips = [
    'Keep your pet hydrated — fresh water always available',
    'Maintain a calm, quiet environment',
    'Note any changes in behavior, appetite, or stool',
  ];

  return {
    urgency,
    possible_causes: causes,
    recommended_actions: actions,
    home_care_tips: tips,
    when_to_go_to_vet:
      urgency === 'emergency'
        ? 'Go to the emergency vet RIGHT NOW.'
        : urgency === 'see_vet_soon'
        ? 'Visit a vet within 24-48 hours.'
        : 'See a vet if symptoms persist more than 48 hours or worsen.',
    disclaimer: 'PawCare AI is informational only. Always consult a licensed veterinarian for medical advice.',
  };
}

export async function aiSymptomCheck(
  symptoms: string,
  pet: Partial<Pet> & { name: string; species: string; breed?: string | null; date_of_birth?: string | null; is_neutered?: boolean; gender?: string },
  context?: { recentMedications?: string[]; recentVetVisits?: string[]; lastMood?: MoodLog | null }
): Promise<SymptomCheckResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return ruleBasedSymptomCheck(symptoms);
  }

  const ageStr = pet.date_of_birth ? calculateAgeFromDob(pet.date_of_birth) : 'unknown age';

  const systemPrompt = `You are a careful, conservative veterinary triage assistant. You NEVER replace a real vet. 
You analyze symptoms described by pet owners and classify urgency. Be honest about uncertainty. 
You always recommend professional vet care for anything beyond minor issues.`;

  const userPrompt = `Pet profile:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed ?? 'unknown'}
- Age: ${ageStr}
- Gender: ${pet.gender ?? 'unknown'}
- Neutered: ${pet.is_neutered ? 'yes' : 'no'}
${context?.recentMedications?.length ? `- Recent medications: ${context.recentMedications.join(', ')}` : ''}
${context?.lastMood ? `- Last mood: ${context.lastMood.mood}, appetite: ${context.lastMood.appetite ?? 'unspecified'}` : ''}

Symptoms described by owner: "${symptoms}"

Respond ONLY with a JSON object matching this schema (no markdown, no extra text):
{
  "urgency": "monitor" | "see_vet_soon" | "emergency",
  "possible_causes": string[],
  "recommended_actions": string[],
  "home_care_tips": string[],
  "when_to_go_to_vet": string,
  "disclaimer": string
}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!res.ok) throw new Error('OpenAI request failed');
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response');
    const parsed = JSON.parse(content) as SymptomCheckResult;
    if (!parsed.disclaimer) parsed.disclaimer = 'Always consult a licensed veterinarian.';
    return parsed;
  } catch (err) {
    console.warn('[ai] Falling back to rule-based check:', err);
    return ruleBasedSymptomCheck(symptoms);
  }
}

function calculateAgeFromDob(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (years <= 0 && months <= 0) {
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }
  return `${years} years ${months} months`;
}

export function generateHealthInsights(args: {
  pets: Pet[];
  vaccinations: Vaccination[];
  weightLogs: WeightLog[];
  moodLogs: MoodLog[];
}): Array<{ pet_id: string; pet_name: string; type: string; severity: 'info' | 'warning' | 'alert'; message: string }> {
  const insights: Array<{ pet_id: string; pet_name: string; type: string; severity: 'info' | 'warning' | 'alert'; message: string }> = [];

  for (const pet of args.pets) {
    const petVax = args.vaccinations.filter((v) => v.pet_id === pet.id);
    const overdueVax = petVax.find((v) => v.next_due_date && new Date(v.next_due_date) < new Date());
    if (overdueVax) {
      insights.push({
        pet_id: pet.id,
        pet_name: pet.name,
        type: 'vaccine',
        severity: 'alert',
        message: `${pet.name} is overdue for ${overdueVax.vaccine_name} (was due ${overdueVax.next_due_date}).`,
      });
    }

    const petWeights = args.weightLogs
      .filter((w) => w.pet_id === pet.id)
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
    if (petWeights.length >= 2) {
      const last = petWeights[petWeights.length - 1];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const earlier = [...petWeights].reverse().find((w) => new Date(w.measured_at) <= thirtyDaysAgo);
      if (earlier && earlier.weight_kg > 0) {
        const change = ((last.weight_kg - earlier.weight_kg) / earlier.weight_kg) * 100;
        if (Math.abs(change) > 10) {
          insights.push({
            pet_id: pet.id,
            pet_name: pet.name,
            type: 'weight',
            severity: 'warning',
            message: `${pet.name} has ${change > 0 ? 'gained' : 'lost'} ${Math.abs(change).toFixed(1)}% body weight in 30 days. Consider a vet check.`,
          });
        }
      }
    }

    const petMoods = args.moodLogs.filter((m) => m.pet_id === pet.id).slice(0, 3);
    const poorAppetiteCount = petMoods.filter((m) => m.appetite === 'poor' || m.appetite === 'none').length;
    if (poorAppetiteCount >= 2) {
      insights.push({
        pet_id: pet.id,
        pet_name: pet.name,
        type: 'mood',
        severity: 'warning',
        message: `${pet.name} has had poor appetite in ${poorAppetiteCount} of the last ${petMoods.length} logged days.`,
      });
    }
  }

  return insights;
}
