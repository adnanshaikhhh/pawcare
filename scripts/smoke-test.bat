@echo off
setlocal enabledelayedexpansion
echo === Smoke test: signup via deployed PawCare site ===
echo.
echo Test 1: signup with real Supabase URL
curl -s -X POST "https://ktezkiifvstroujfjxqw.supabase.co/auth/v1/signup" -H "Content-Type: application/json" -H "apikey: sb_publishable_8f8EOyugePnuapOXAz7OZA_-IH35QMq" -H "Authorization: Bearer *** -d "{\"email\":\"pawcare.smoke.2024@gmail.com\",\"password\":\"PawcareTest123\",\"data\":{\"full_name\":\"Smoke Test\"}}"
echo.
echo.
echo Test 2: GET pets via Vercel-deployed API (should be 401)
curl -s -i "https://pawcare-omega.vercel.app/api/pets" 2>&1 | findstr /B "HTTP"
echo.
echo Test 3: GET profile (no auth, should be 401)
curl -s -i "https://pawcare-omega.vercel.app/api/profile" 2>&1 | findstr /B "HTTP"
echo.
echo Test 4: GET landing page (should be 200)
curl -s -i "https://pawcare-omega.vercel.app/" 2>&1 | findstr /B "HTTP"
echo.
echo Test 5: GET auth login page (should be 200)
curl -s -i "https://pawcare-omega.vercel.app/auth/login" 2>&1 | findstr /B "HTTP"
echo.
echo Test 6: GET dashboard (should be 200 - auth check is client-side)
curl -s -i "https://pawcare-omega.vercel.app/dashboard" 2>&1 | findstr /B "HTTP"
