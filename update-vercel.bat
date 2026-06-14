@echo off
for /f "delims=" %%i in ('python -c "import json; print(json.load(open(r'C:\Users\ADNAN\AppData\Roaming\xdg.data\com.vercel.cli\auth.json'))['token'])"') do set TOKEN=%%i
echo Token first 20: %TOKEN:~0,20%
curl -s -X PATCH "https://api.vercel.com/v9/projects/prj_fhcfQDeGZiaizTvZVmnmThlAD3Ae" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"rootDirectory\":\"\",\"buildCommand\":\"cd apps/web ^&^& npm run build\",\"installCommand\":\"npm install --legacy-peer-deps\",\"outputDirectory\":\"apps/web/.next\",\"framework\":\"nextjs\"}"
