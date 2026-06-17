#!/usr/bin/env bash
set -e
cd "C:/Users/ADNAN/Documents/Codex/Projects/pawcare"
SUPABASE_TOKEN=$(cat .supabase-token)
export SUPABASE_TOKEN
echo "Token length: ${#SUPABASE_TOKEN}"
echo "---login---"
echo "$SUPABASE_TOKEN" | npx --no-install supabase login --token "$SUPABASE_TOKEN" 2>&1 | tail -3
echo "---migration list---"
npx --no-install supabase migration list --project-ref ktezkiifvstroujfjxqw 2>&1 | head -40
