#!/usr/bin/env bash
set -e
cd "C:/Users/ADNAN/Documents/Codex/Projects/pawcare"
SUPABASE_TOKEN=$(cat .supabase-token)
export SUPABASE_TOKEN
echo "Logging in..."
echo "$SUPABASE_TOKEN" | npx --no-install supabase login --token "$SUPABASE_TOKEN" > /dev/null 2>&1
echo "Linking project..."
npx --no-install supabase link --project-ref ktezkiifvstroujfjxqw --password "" > /dev/null 2>&1 || true
echo "Done. Trying query..."
npx --no-install supabase db query --linked --output json -f scripts/check_v2_tables.sql 2>&1 | head -100
