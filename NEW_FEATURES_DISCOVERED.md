# NEW_FEATURES_DISCOVERED.md

PawCare v2 expansion + pre-existing core. Generated 2026-06-17 by
the regression squad. Both Squad A (web) and Squad B (mobile) work
from this list.

## Source of truth

- Local HEAD: `6c30810` (or whatever the latest commit hash is)
- Vercel live: same (deployed 34m before this report)
- Live URL: https://pawcare-omega.vercel.app
- GitHub: https://github.com/adnanshaikhhh/pawcare

## 25-feature v2 expansion (commits f93aca7..6c30810)

### New API routes (19, all in `apps/web/app/api/*/route.ts`)

| # | Route | Methods | Auth | Table(s) |
|---|---|---|---|---|
| 1 | `/api/stories` | GET | Bearer | pet_stories |
| 2 | `/api/expenses` | GET POST DELETE | Bearer | pet_expenses |
| 3 | `/api/dental` | GET POST | Bearer | dental_records |
| 4 | `/api/labs` | GET POST | Bearer | lab_results |
| 5 | `/api/birthday` | GET | Bearer | birthday_cards |
| 6 | `/api/behavior-alerts` | GET PATCH | Bearer | behavior_alerts |
| 7 | `/api/medication-interactions` | GET | Bearer | medication_interactions |
| 8 | `/api/responsibilities` | GET POST DELETE | Bearer | responsibilities |
| 9 | `/api/smart-reminders` | GET PATCH | Bearer | smart_reminder_suggestions |
| 10 | `/api/vet-prep` | GET POST | Bearer (pet_id req) | vet_visit_prep_briefs |
| 11 | `/api/weight-goals` | GET POST | Bearer | weight_goal_progress |
| 12 | `/api/year-review` | GET POST | Bearer (pet_id+year) | pet_year_reviews |
| 13 | `/api/daily-mood-summary` | GET | Bearer (computed) | mood_logs |
| 14 | `/api/monthly-spend` | GET | Bearer | monthly_spend_summary |
| 15 | `/api/symptom-correlations` | GET POST | Bearer | symptom_correlations |
| 16 | `/api/vet-handoff` | GET POST PATCH | Bearer | vet_visit_handoffs |
| 17 | `/api/timeline` | GET | Bearer | activity_timeline |
| 18 | `/api/community` | GET POST | Anon read / Bearer write | community_posts |
| 19 | `/api/indian-vets` | GET | Anon (public) | indian_vets |

### New web pages (17, all in `apps/web/app/(app)/*/page.tsx`)

stories, behavior-alerts, dental, birthday, labs, medication-interactions,
weight-goals, year-review, daily-mood-summary, monthly-spend,
symptom-correlations, vet-handoff, vet-prep, responsibilities,
smart-reminders, community, indian-vets

### New web components (5, in `apps/web/components/v2/`)

- BehaviorAlertBanner.tsx
- CatEconomicsWidget.tsx
- MoodWeatherCard.tsx
- StoriesCarousel.tsx
- WhoFedWhoTimeline.tsx

### New mobile components (7, in `apps/mobile/components/v2/`)

- BehaviorAlertBanner.tsx
- CatEconomicsWidget.tsx
- DailyMoodSummary.tsx
- MoodWeatherCard.tsx
- QuickMoodFAB.tsx
- StoriesCarousel.tsx
- WeightGoalTracker.tsx

### New mobile screen

- `apps/mobile/app/(tabs)/insights.tsx` — new "Insights" tab
  (tab bar order: Home | Pets | **Insights** | SOS | Stock | Me)

### New infra files

- `apps/web/lib/v2-ai.ts` (575 lines) — OpenAI-compatible client;
  uses NVIDIA NIM via env vars `NVIDIA_NIM_API_KEY` /
  `NVIDIA_NIM_BASE_URL` / `NVIDIA_NIM_MODEL`, falls back to
  `OPENAI_API_KEY`, falls back to rule-based
- `apps/mobile/nativewind-env.ts` — className type augmentation
  for ViewProps / TextProps / PressableProps / TextInputProps / etc.
- `apps/web/components/layout/AppShell.tsx` — added 17 v2 nav
  links in a "✨ V2 Features" section

### New env vars (set in Vercel)

- `NVIDIA_NIM_API_KEY` (the user-supplied NIM key)
- `NVIDIA_NIM_BASE_URL` = `https://integrate.api.nvidia.com/v1`
- `NVIDIA_NIM_MODEL` = `meta/llama-3.1-70b-instruct`

### New database migrations (applied to live DB)

- `supabase/migrations/006_v2_features.sql` — 29 v2 tables
- `supabase/migrations/007_v2_rls_grants.sql` — anon SELECT on
  community_posts / indian_vets / profiles / pets
- `supabase/migrations/008_fix_vet_handoff_pet_id.sql` — adds
  pet_id column + FK to vet_visit_handoffs (live E2E fix)

### Pre-existing core (regression targets)

API routes (Squad A regression):
- /api/pets, /api/pets/[id]
- /api/medications, /api/medication-logs
- /api/vaccinations
- /api/reminders
- /api/medical/[type]/[petId]
- /api/inventory, /api/inventory-purchases
- /api/emergency/vets
- /api/cron/send-notifications (CRON_SECRET protected)
- /api/family
- /api/profile
- /api/notifications/subscribe
- /api/auth/login, /api/auth/signup, /api/auth/signout
- /api/export/[petId]

Pages (regression):
- /dashboard, /pets, /pets/new, /pets/[id], /pets/[id]/edit
- /reminders, /family, /inventory
- /symptoms (AI symptom checker)
- /emergency
- /auth/login, /auth/signup
- /settings

## Tables the regression squad must verify

Existing + new tables (all should have RLS + service_role grants):
- profiles, family_groups, family_members
- pets, pet_photos
- vet_visits, medications, medication_logs, vaccinations
- deworming_records, heat_cycles
- weight_logs, mood_logs, symptom_checks
- inventory_items, inventory_purchases
- reminders
- vet_contacts
- + all 29 v2 tables (see migration 006)
