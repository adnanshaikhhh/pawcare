#!/usr/bin/env bash
# PawCare - One-command deploy driver
# Usage: ./deploy.sh
#
# Reads tokens from environment:
#   VERCEL_TOKEN       - vercel.com/account/tokens
#   SUPABASE_TOKEN     - supabase.com/dashboard/account/tokens
#   EXPO_TOKEN         - expo.dev/accounts/[name]/settings/access-tokens
#   SUPABASE_PROJECT_REF  - the project reference (e.g. abcdefghij)
#   VERCEL_TEAM_ID     - optional, your Vercel team ID
#
# What it does:
#   1. Verifies all three CLIs are installed
#   2. Logs in to Vercel / Supabase / Expo via tokens
#   3. Links the Supabase project
#   4. Pushes the 5 SQL migrations
#   5. Deploys the 2 Edge Functions
#   6. Deploys the web app to Vercel
#   7. Triggers an Android APK build via EAS
#
# This is the script that finishes PawCare once the auth handoff is done.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "\n${BLUE}==>${NC} ${1}"; }
ok() { echo -e "${GREEN}✓${NC} ${1}"; }
warn() { echo -e "${YELLOW}!${NC} ${1}"; }
err() { echo -e "${RED}✗${NC} ${1}"; exit 1; }

# ----- 1. Verify prerequisites -----
step "Checking prerequisites"
command -v node >/dev/null && ok "node $(node --version)" || err "node not found"
command -v npm >/dev/null && ok "npm $(npm --version)" || err "npm not found"
command -v vercel >/dev/null || command -v vercel.cmd >/dev/null || err "vercel CLI not found (npm i -g vercel)"
command -v supabase >/dev/null || command -v supabase.cmd >/dev/null || err "supabase CLI not found (npm i -g supabase)"
command -v eas >/dev/null || command -v eas.cmd >/dev/null || err "eas CLI not found (npm i -g eas-cli)"

# ----- 2. Verify tokens are present -----
step "Verifying auth tokens"
[[ -n "${VERCEL_TOKEN:-}" ]] || err "VERCEL_TOKEN not set"
[[ -n "${SUPABASE_TOKEN:-}" ]] || err "SUPABASE_TOKEN not set"
[[ -n "${EXPO_TOKEN:-}" ]] || err "EXPO_TOKEN not set"
[[ -n "${SUPABASE_PROJECT_REF:-}" ]] || err "SUPABASE_PROJECT_REF not set"
ok "All tokens present"

# ----- 3. Login to each service -----
step "Logging in to Vercel"
echo "$VERCEL_TOKEN" | vercel login --token "$VERCEL_TOKEN" 2>&1 | tail -3
ok "Vercel authenticated"

step "Logging in to Supabase"
supabase login --token "$SUPABASE_TOKEN" 2>&1 | tail -3
ok "Supabase authenticated"

step "Logging in to Expo"
echo "$EXPO_TOKEN" | eas login --token "$EXPO_TOKEN" 2>&1 | tail -3 || eas login -s --token "$EXPO_TOKEN" 2>&1 | tail -3
ok "Expo authenticated"

# ----- 4. Link Supabase project -----
step "Linking Supabase project"
cd /c/Users/ADNAN/Documents/Codex/Projects/pawcare
supabase link --project-ref "$SUPABASE_PROJECT_REF" 2>&1 | tail -3
ok "Supabase project linked"

# ----- 5. Push database migrations -----
step "Pushing SQL migrations to Supabase"
for f in supabase/migrations/*.sql; do
  echo "  Pushing $f"
  supabase db push --file "$f" 2>&1 | tail -2 || \
    echo "  (db push requires dashboard run; manual paste needed for: $f)"
done
ok "Migrations pushed (or queued for manual run)"

# ----- 6. Deploy Edge Functions -----
step "Deploying Supabase Edge Functions"
supabase functions deploy send-notifications --project-ref "$SUPABASE_PROJECT_REF" --no-verify-jwt 2>&1 | tail -3
supabase functions deploy process-reminders --project-ref "$SUPABASE_PROJECT_REF" --no-verify-jwt 2>&1 | tail -3
ok "Edge functions deployed"

# ----- 7. Set Supabase function secrets -----
step "Setting Edge Function secrets"
read -p "  Enter your SUPABASE_URL (e.g. https://$SUPABASE_PROJECT_REF.supabase.co): " SUPA_URL
read -p "  Enter your SUPABASE_SERVICE_ROLE_KEY: " SUPA_KEY
read -p "  Enter a random CRON_TOKEN (32+ chars, or press Enter to generate): " CRON_TOKEN
CRON_TOKEN="${CRON_TOKEN:-$(openssl rand -hex 16 2>/dev/null || echo "pawcare-$(date +%s)")}"

supabase secrets set \
  SUPABASE_URL="$SUPA_URL" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPA_KEY" \
  CRON_TOKEN="$CRON_TOKEN" \
  --project-ref "$SUPABASE_PROJECT_REF" 2>&1 | tail -3
ok "Edge function secrets set"

# ----- 8. Schedule the cron in Supabase -----
step "Scheduling notification cron (pg_cron)"
SCHED_SQL="select cron.schedule(
  'send-pawcare-notifications', '*/15 * * * *',
  \$\$ select net.http_post(
       url:='${SUPA_URL}/functions/v1/send-notifications',
       headers:=jsonb_build_object('Authorization','Bearer ${CRON_TOKEN}','Content-Type','application/json')
     ) \$\$
);"
echo "$SCHED_SQL" > /tmp/pawcare_cron.sql
warn "Cron SQL written to /tmp/pawcare_cron.sql — run it in Supabase SQL editor (one-time)"

# ----- 9. Deploy web to Vercel -----
step "Deploying web app to Vercel"
cd apps/web
vercel link --yes --token "$VERCEL_TOKEN" 2>&1 | tail -3

read -p "  Enter your NEXT_PUBLIC_SUPABASE_URL (default: $SUPA_URL): " WEB_SUPA_URL
WEB_SUPA_URL="${WEB_SUPA_URL:-$SUPA_URL}"
read -p "  Enter your NEXT_PUBLIC_SUPABASE_ANON_KEY: " WEB_ANON_KEY
read -p "  Enter SUPABASE_SERVICE_ROLE_KEY (default: $SUPA_KEY): " WEB_SVC_KEY
WEB_SVC_KEY="${WEB_SVC_KEY:-$SUPA_KEY}"

vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$WEB_SUPA_URL" 2>&1 | tail -2
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$WEB_ANON_KEY" 2>&1 | tail -2
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$WEB_SVC_KEY" 2>&1 | tail -2
vercel env add NEXT_PUBLIC_APP_URL production <<< "https://pawcare.vercel.app" 2>&1 | tail -2 || true

vercel deploy --prod --yes --token "$VERCEL_TOKEN" 2>&1 | tail -10
ok "Web deployed to Vercel"

# ----- 10. Build Android APK -----
step "Building Android APK via EAS"
cd ../mobile
read -p "  Enter your Expo username (or slug): " EXPO_USER
eas init --force 2>&1 | tail -3 || true
eas build:configure --platform android 2>&1 | tail -3 || true
eas build -p android --profile preview --non-interactive 2>&1 | tail -10
ok "APK build submitted (check https://expo.dev/builds for the download link)"

# ----- 11. Print final report -----
step "🎉 DEPLOYMENT COMPLETE"
echo ""
echo "Web URL:  https://pawcare.vercel.app  (also shown in Vercel output above)"
echo "APK:      https://expo.dev/accounts/$EXPO_USER/projects/pawcare/builds"
echo "Supabase: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF"
echo "Cron SQL: cat /tmp/pawcare_cron.sql   (paste into Supabase SQL editor)"
echo ""
echo "Next steps:"
echo "  1. Paste /tmp/pawcare_cron.sql into Supabase SQL editor → Run"
echo "  2. Download the APK from the EAS build URL and install on Android"
echo "  3. For iOS: install Expo Go and scan the QR from 'npx expo start' in apps/mobile"
echo "  4. Test family sharing: sign up on two devices, create group on one, join on the other"
echo "  5. Verify push: log a vaccine with next_due_date = tomorrow, wait 15 min for the cron"
