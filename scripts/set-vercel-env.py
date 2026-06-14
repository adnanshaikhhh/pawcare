import json
import urllib.request
import urllib.error

with open(r'C:\Users\ADNAN\AppData\Roaming\xdg.data\com.vercel.cli\auth.json') as f:
    auth = json.load(f)
token = auth['token']
project_id = 'prj_lnT3x57NYMiqxo4V2Iw3LXfhlOyk'

# Add placeholder env vars to production env so the deploy doesn't fail at runtime
# even before real Supabase is configured. The app will show a "configure Supabase" message.
env_vars = [
    {'key': 'NEXT_PUBLIC_SUPABASE_URL', 'value': 'https://placeholder.supabase.co', 'type': 'plain', 'target': ['production', 'preview']},
    {'key': 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'value': 'placeholder-anon-key', 'type': 'plain', 'target': ['production', 'preview']},
    {'key': 'SUPABASE_SERVICE_ROLE_KEY', 'value': 'placeholder-service-role', 'type': 'plain', 'target': ['production', 'preview']},
    {'key': 'NEXT_PUBLIC_APP_URL', 'value': 'https://pawcare-ipbgpttgf-adnanshaikhhhs-projects.vercel.app', 'type': 'plain', 'target': ['production', 'preview']},
    {'key': 'NEXT_PUBLIC_APP_NAME', 'value': 'PawCare', 'type': 'plain', 'target': ['production', 'preview']},
]

for env in env_vars:
    url = f'https://api.vercel.com/v10/projects/{project_id}/env'
    data = json.dumps(env).encode()
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f'  + {env["key"]} -> {env["target"]}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if 'already exists' in body or 'ENV_ALREADY_EXISTS' in body:
            print(f'  = {env["key"]} (already exists)')
        else:
            print(f'  ! {env["key"]}: HTTP {e.code}: {body[:200]}')

print('\nDone. To use real Supabase, run in the project:')
print('  vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y')
print('  vercel env add NEXT_PUBLIC_SUPABASE_URL production')
print('  # (paste the real URL when prompted)')
