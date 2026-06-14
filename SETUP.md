# PawCare — Complete Setup Guide

This walkthrough gets PawCare from a fresh repo to a fully deployed production app on web (Vercel) and mobile (Expo Go / EAS APK).

**Estimated time:** 30-45 minutes (excluding the ~10-15 min Vercel/Supabase provisioning).

---

## 0. Prerequisites

- **Node.js 18+** and **npm 10+**
- A **Supabase** account (free tier) — https://supabase.com
- A **Vercel** account (free tier) — https://vercel.com
- A **GitHub** account (recommended for Vercel + EAS)
- Optional: **OpenAI** API key, **Google Places** API key

---

## 1. Set up Supabase (10 min)

### 1.1 Create project
1. Go to https://supabase.com/dashboard → **New project**
2. Name: `pawcare`, set a strong DB password, pick a region close to you
3. Wait ~2 minutes for provisioning

### 1.2 Run migrations
1. In your Supabase dashboard, go to **SQL Editor** → **New query**
2. Open `supabase/migrations/001_initial_schema.sql` from this repo, paste, **Run**
3. Repeat for `002_rls_policies.sql`, `003_indexes.sql`, `004_triggers.sql`, `005_functions.sql` — **in order**

If you see "type already exists" errors on a re-run, that's harmless — the migrations are idempotent.

### 1.3 Enable Google OAuth (optional, 2 min)
1. **Authentication → Providers → Google** → toggle on
2. Get a Google OAuth client from https://console.cloud.google.com/apis/credentials
3. Paste Client ID + Secret into Supabase
4. Add redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`

### 1.4 Get your credentials
From **Project Settings → API**:
- **Project URL** (e.g. `https://abcxyz.supabase.co`)
- **anon public key** (starts with `eyJ...`)
- **service_role secret key** (starts with `eyJ...` — keep this PRIVATE, server-side only)

---

## 2. Set up the web app (5 min)

```bash
cd pawcare
npm install
cp .env.example apps/web/.env.local
```

Edit `apps/web/.env.local` and fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
# Optional:
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_GOOGLE_PLACES_KEY=...
```

Run locally to test:
```bash
cd apps/web
npm run dev
# Open http://localhost:3000
```

You should see the landing page. Click **Get Started Free**, create an account, then:
- Add a pet
- Log a vaccine
- Check the dashboard

If everything works, proceed to deploy.

---

## 3. Deploy web to Vercel (5 min)

### Option A: Vercel CLI
```bash
npm install -g vercel
cd apps/web
vercel
# Follow prompts — set the root to "apps/web"
# When asked about env vars, paste them from your .env.local
vercel --prod
```

### Option B: GitHub integration (recommended)
1. Push the repo to GitHub
2. https://vercel.com/new → import the repo
3. **Root Directory:** `apps/web`
4. **Build command:** `next build`
5. **Output directory:** (leave default `.next`)
6. Add env vars from your `.env.local` (mark `SUPABASE_SERVICE_ROLE_KEY` as sensitive)
7. Click **Deploy**

After deploy, update your Supabase auth settings:
- **Authentication → URL Configuration** → add your Vercel URL to **Site URL** and **Redirect URLs**

Your web app is now live. Test it.

---

## 4. Set up the mobile app (10 min)

### 4.1 Configure env
Create `apps/mobile/.env` (not `.env.local`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_API_URL=https://<your-app>.vercel.app
```

Also paste these into `apps/mobile/app.json` under `extra` (replace the empty strings):
```json
"EXPO_PUBLIC_SUPABASE_URL": "https://<your-project>.supabase.co",
"EXPO_PUBLIC_SUPABASE_ANON_KEY": "<your-anon-key>",
"EXPO_PUBLIC_API_URL": "https://<your-app>.vercel.app"
```

### 4.2 Run on your phone (fastest, no build needed)
1. Install **Expo Go** from the App Store (iOS) or Play Store (Android)
2. Make sure your phone is on the same Wi-Fi as your computer
3. From `apps/mobile/`:
   ```bash
   npm install
   npx expo start
   ```
4. Scan the QR code:
   - iOS: open Camera, point at QR
   - Android: open Expo Go, tap "Scan QR code"
5. The app loads with all features

**Note:** Push notifications work in Expo Go on iOS via a limited testing flow, but full notifications work best in a built APK.

### 4.3 Build an Android APK (for real push notifications)
```bash
cd apps/mobile
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```
- EAS will build a `.apk` file in the cloud (~10-15 min)
- You'll get a download link
- Install on Android: download the APK → Settings → Apps → Special access → Install unknown apps → allow from your browser → open the APK

Share the APK with your partner via WhatsApp / Google Drive for family-sharing testing.

### 4.4 iOS TestFlight (optional, $99/year Apple Developer)
- Skip for now — Expo Go covers iOS testing for free
- When ready: `eas build -p ios --profile production` then submit to App Store Connect

---

## 5. Set up push notifications (5 min)

### 5.1 Deploy the edge function
```bash
# Install Supabase CLI
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy send-notifications --no-verify-jwt
supabase functions deploy process-reminders --no-verify-jwt
```

### 5.2 Set secrets
In Supabase dashboard → **Edge Functions → send-notifications → Secrets**:
- `SUPABASE_URL` = your project URL
- `SUPABASE_SERVICE_ROLE_KEY` = your service role key
- `CRON_TOKEN` = any random 32-char string (e.g. `openssl rand -hex 16`)

### 5.3 Schedule the cron
In **Supabase SQL editor**, run:
```sql
select cron.schedule(
  'send-pawcare-notifications',
  '*/15 * * * *',
  $$ select net.http_post(
       url:='https://<project-ref>.supabase.co/functions/v1/send-notifications',
       headers:=jsonb_build_object(
         'Authorization','Bearer <CRON_TOKEN>',
         'Content-Type','application/json'
       )
     ) $$);
```

(First enable the `pg_cron` and `pg_net` extensions under **Database → Extensions**.)

### 5.4 Web Push (optional)
Generate VAPID keys:
```bash
cd apps/web
npx web-push generate-vapid-keys
```
Add to `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<the public key>
VAPID_PRIVATE_KEY=<the private key>
VAPID_EMAIL=mailto:you@example.com
```

---

## 6. Test end-to-end

1. **Web:** Open your Vercel URL, sign up, add a pet
2. **Mobile:** Open the same account in Expo Go or your APK
3. **Family sharing:** on phone #1, go to Family → Create group → copy code. On phone #2, Family → Join with code. Add a pet on phone #2 — it appears on phone #1.
4. **AI checker:** Symptoms page → "vomiting blood" → expect emergency banner
5. **Emergency:** Emergency tab → allow location → see nearby 24/7 vets
6. **Inventory:** Add a cat food item, set quantity 0 → see red "Out" pill
7. **Reminders:** Add a vaccine with next_due_date = tomorrow → notification arrives on both devices within 15 min (or trigger manually: in Supabase SQL, `update reminders set reminder_at = now() where is_sent = false;`)

---

## 7. Security & best practices

### Environment variables
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the client. It's only used in API routes (server-side).
- All client-facing env vars start with `NEXT_PUBLIC_` (Next.js) or `EXPO_PUBLIC_` (Expo).

### Authentication
- Supabase Auth handles password hashing (bcrypt) and JWT issuance
- All API routes verify the JWT in `lib/supabase-server.ts → requireUser()`

### Database (RLS)
- Every table has RLS enabled — there's no way to read another user's data via the API
- Family sharing is enforced at the DB level via `public.pet_accessible()` helper
- Run this to audit RLS:
  ```sql
  select schemaname, tablename, rowsecurity
  from pg_tables
  where schemaname='public' and rowsecurity=false;
  ```
  (Should return 0 rows.)

### API rate limits (built in)
- AI symptom checker: 10/day per user
- Emergency vet search: 30/hour per IP
- Generic API: ~100/min per user (Supabase default)

### File uploads
- Pet photos: image MIME types only, 10MB max
- Medical docs: PDF + images, 20MB max
- Storage bucket policies enforce user-folder isolation

### Production checklist before going public
- [ ] Enable Supabase email confirmation
- [ ] Set up custom domain on Vercel
- [ ] Add `https://yourdomain.com` to Supabase redirect URLs
- [ ] Configure VAPID keys for web push (optional)
- [ ] Test family sharing with two real devices
- [ ] Run a security scan: `npm audit` and Supabase linter
- [ ] Set up Vercel Analytics
- [ ] Configure a backup schedule in Supabase (Pro tier)

---

## 8. Troubleshooting

| Problem | Solution |
|---|---|
| "Invalid API key" on web | Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, restart `npm run dev` |
| Mobile can't reach web API | Make sure `EXPO_PUBLIC_API_URL` is set and the Vercel deployment is live |
| Push notifications not arriving | Run `select * from reminders where is_sent = false;` — if rows exist, check edge function logs in Supabase. If empty, check `reminder_at` is in the past |
| RLS errors during testing | Run the migrations in order. If you re-run after partial setup, drop tables first: `drop schema public cascade; create schema public;` then re-run |
| Expo Go stuck on splash | Check `EXPO_PUBLIC_SUPABASE_URL` is set; also try `npx expo start -c` to clear cache |
| TypeScript errors in `packages/shared` | Run `npm install` from the root; the workspace symlinks packages |
| Vercel build fails: "Cannot find module @pawcare/shared" | Make sure `transpilePackages: ['@pawcare/shared']` is in `apps/web/next.config.js` (already set) |

---

## 9. Next steps

- [ ] Custom domain
- [ ] iOS App Store submission (TestFlight first)
- [ ] Stripe for premium tier (PDF export, AI checks, more pets)
- [ ] Affiliate links on inventory items
- [ ] Backup/export all data
- [ ] Multi-language support

That's it. Welcome to PawCare. 🐾
