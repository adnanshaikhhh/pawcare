@echo off
setlocal enabledelayedexpansion
set "URL=https://ktezkiifvstroujfjxqw.supabase.co/auth/v1/signup"
set "ANON=sb_publishable_8f8EOyugePnuapOXAz7OZA_-IH35QMq"
set "SVC=sb_secret_REDACTED"

echo === Test 1: anon as apikey + JSON signup ===
curl -s -X POST "%URL%" -H "Content-Type: application/json" -H "apikey: %ANON%" -H "Authorization: Bearer %ANON%" -d "{\"email\":\"smoke@test.local\",\"password\":\"Smoketest123!\"}"
echo.
echo === Test 2: legacy JWT anon ===
curl -s -X POST "%URL%" -H "Content-Type: application/json" -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZXpraWlmdnN0cm91amZqeHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzgwODgsImV4cCI6MjA5Njk1NDA4OH0.yTF3u3kh2D33irVp7O-K_eYaEIBSK9p1DsIE90u4Ri0" -d "{\"email\":\"smoke@test.local\",\"password\":\"Smoketest123!\"}"
echo.
echo === Test 3: service_role as apikey ===
curl -s -X POST "%URL%" -H "Content-Type: application/json" -H "apikey: %SVC%" -H "Authorization: Bearer %SVC%" -d "{\"email\":\"smoke@test.local\",\"password\":\"Smoketest123!\"}"
echo.
