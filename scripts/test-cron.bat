@echo off
echo === Test 1: with full bearer header ===
curl -s "https://pawcare-omega.vercel.app/api/cron/send-notifications" -H "Authorization: Bearer pawcare_cron_secret_2025"
echo.
echo.
echo === Test 2: with no auth (should still work if isVercelCron detected) ===
curl -s "https://pawcare-omega.vercel.app/api/cron/send-notifications"
echo.
