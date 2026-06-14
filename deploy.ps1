# PawCare - One-command deploy driver (Windows / PowerShell)
# Usage: .\deploy.ps1
#
# Reads tokens from environment. Set them first with:
#   $env:VERCEL_TOKEN = "..."
#   $env:SUPABASE_TOKEN = "..."
#   $env:EXPO_TOKEN = "..."
#   $env:SUPABASE_PROJECT_REF = "abcdefghij"
#
# Or the script will prompt for missing values.

param(
    [string]$SupabaseUrl,
    [string]$SupabaseAnonKey,
    [string]$SupabaseServiceKey,
    [string]$SupabaseRef,
    [string]$CronToken
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\ADNAN\Documents\Codex\Projects\pawcare"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }
function Err($msg)  { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }

# Locate CLIs
$Vercel   = (Get-Command vercel.cmd -ErrorAction SilentlyContinue) ?? (Get-Command vercel -ErrorAction SilentlyContinue)
$Supabase = (Get-Command supabase.cmd -ErrorAction SilentlyContinue) ?? (Get-Command supabase -ErrorAction SilentlyContinue)
$Eas      = (Get-Command eas.cmd -ErrorAction SilentlyContinue) ?? (Get-Command eas -ErrorAction SilentlyContinue)

Step "Checking prerequisites"
$null -ne (Get-Command node)        ?? Err "node not found"
$null -ne (Get-Command npm)         ?? Err "npm not found"
$null -ne $Vercel                   ?? Err "vercel CLI not found (npm i -g vercel)"
$null -ne $Supabase                 ?? Err "supabase CLI not found (npm i -g supabase)"
$null -ne $Eas                      ?? Err "eas CLI not found (npm i -g eas-cli)"
Ok "All CLIs available"

# Tokens
$VERCEL_TOKEN = $env:VERCEL_TOKEN
$SUPABASE_TOKEN = $env:SUPABASE_TOKEN
$EXPO_TOKEN = $env:EXPO_TOKEN
$SUPABASE_PROJECT_REF = $env:SUPABASE_PROJECT_REF ?? $SupabaseRef

if (-not $VERCEL_TOKEN) { $VERCEL_TOKEN = Read-Host "Enter VERCEL_TOKEN" }
if (-not $SUPABASE_TOKEN) { $SUPABASE_TOKEN = Read-Host "Enter SUPABASE_TOKEN (as SecureString)" | ConvertFrom-SecureString -AsPlainText }
if (-not $EXPO_TOKEN) { $EXPO_TOKEN = Read-Host "Enter EXPO_TOKEN" }
if (-not $SUPABASE_PROJECT_REF) { $SUPABASE_PROJECT_REF = Read-Host "Enter SUPABASE_PROJECT_REF" }
if (-not $CronToken) {
    $bytes = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $CronToken = [BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}
if (-not $SupabaseUrl) { $SupabaseUrl = Read-Host "Enter NEXT_PUBLIC_SUPABASE_URL (e.g. https://$SUPABASE_PROJECT_REF.supabase.co)" }
if (-not $SupabaseAnonKey) { $SupabaseAnonKey = Read-Host "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY" }
if (-not $SupabaseServiceKey) { $SupabaseServiceKey = Read-Host "Enter SUPABASE_SERVICE_ROLE_KEY" }

Step "Logging in to Vercel"
& $Vercel.Path login --token $VERCEL_TOKEN | Select-Object -Last 3
Ok "Vercel authenticated"

Step "Logging in to Supabase"
& $Supabase.Path login --token $SUPABASE_TOKEN | Select-Object -Last 3
Ok "Supabase authenticated"

Step "Logging in to Expo"
& $Eas.Path login -s --token $EXPO_TOKEN 2>&1 | Select-Object -Last 3
Ok "Expo authenticated"

Step "Linking Supabase project"
Push-Location $ProjectRoot
& $Supabase.Path link --project-ref $SUPABASE_PROJECT_REF | Select-Object -Last 3
Ok "Supabase project linked"

Step "Pushing SQL migrations"
Get-ChildItem "$ProjectRoot\supabase\migrations\*.sql" | ForEach-Object {
    Write-Host "  Pushing $($_.Name)"
    & $Supabase.Path db push --file $_.FullName 2>&1 | Select-Object -Last 2
}
Ok "Migrations pushed (check Supabase dashboard for confirmation)"

Step "Deploying Supabase Edge Functions"
& $Supabase.Path functions deploy send-notifications --project-ref $SUPABASE_PROJECT_REF --no-verify-jwt | Select-Object -Last 3
& $Supabase.Path functions deploy process-reminders --project-ref $SUPABASE_PROJECT_REF --no-verify-jwt | Select-Object -Last 3
Ok "Edge functions deployed"

Step "Setting Edge Function secrets"
& $Supabase.Path secrets set `
    SUPABASE_URL=$SupabaseUrl `
    SUPABASE_SERVICE_ROLE_KEY=$SupabaseServiceKey `
    CRON_TOKEN=$CronToken `
    --project-ref $SUPABASE_PROJECT_REF | Select-Object -Last 3
Ok "Secrets set"

Step "Writing cron SQL to deploy-cron.sql"
$CronSql = @"
select cron.schedule(
  'send-pawcare-notifications', '*/15 * * * *',
  \$\$ select net.http_post(
       url:='${SupabaseUrl}/functions/v1/send-notifications',
       headers:=jsonb_build_object('Authorization','Bearer ${CronToken}','Content-Type','application/json')
     ) \$\$
);
"@
Set-Content -Path "$ProjectRoot\deploy-cron.sql" -Value $CronSql
Warn "Paste deploy-cron.sql into Supabase SQL editor to enable the cron"

Step "Deploying web app to Vercel"
Push-Location "$ProjectRoot\apps\web"
& $Vercel.Path link --yes --token $VERCEL_TOKEN 2>&1 | Select-Object -Last 3

& $Vercel.Path env add NEXT_PUBLIC_SUPABASE_URL production 2>&1 | Out-Null
$SupabaseUrl | & $Vercel.Path env add NEXT_PUBLIC_SUPABASE_URL production 2>&1 | Out-Null
$SupabaseAnonKey | & $Vercel.Path env add NEXT_PUBLIC_SUPABASE_ANON_KEY production 2>&1 | Out-Null
$SupabaseServiceKey | & $Vercel.Path env add SUPABASE_SERVICE_ROLE_KEY production 2>&1 | Out-Null

& $Vercel.Path deploy --prod --yes --token $VERCEL_TOKEN 2>&1 | Select-Object -Last 10
Ok "Web deployed to Vercel"

Step "Building Android APK"
Push-Location "$ProjectRoot\apps\mobile"
& $Eas.Path init --force 2>&1 | Select-Object -Last 3
& $Eas.Path build:configure --platform android 2>&1 | Select-Object -Last 3
& $Eas.Path build -p android --profile preview --non-interactive 2>&1 | Select-Object -Last 10
Ok "APK build submitted (check https://expo.dev/builds)"

Step "🎉 DEPLOYMENT COMPLETE"
Write-Host ""
Write-Host "Web URL:  https://pawcare.vercel.app"
Write-Host "APK:      https://expo.dev/builds"
Write-Host "Supabase: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open deploy-cron.sql and paste into Supabase SQL editor → Run"
Write-Host "  2. Download the APK from the EAS URL and install on Android"
Write-Host "  3. For iOS testing: cd apps\mobile && npx expo start (scan with Expo Go)"
Write-Host "  4. Test family sharing on two devices"
Write-Host "  5. Add pets, log vaccines, watch the 15-min cron send push notifications"
