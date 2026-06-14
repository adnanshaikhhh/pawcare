"""Update Vercel env vars with real Supabase credentials + deploy edge functions."""
import json
import os
import urllib.request
import urllib.error

# Read Vercel token
with open(r'C:\Users\ADNAN\AppData\Roaming\xdg.data\com.vercel.cli\auth.json') as f:
    vercel_token = json.load(f)['token']

project_id = 'prj_lnT3x57NYMiqxo4V2Iw3LXfhlOyk'

# Real Supabase creds
SUPABASE_URL = 'https://ktezkiifvstroujfjxqw.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZXpraWlmdnN0cm91amZqeHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzgwODgsImV4cCI6MjA5Njk1NDA4OH0.yTF3u3kh2D33irVp7O-K_eYaEIBSK9p1DsIE90u4Ri0'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZXpraWlmdnN0cm91amZqeHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM3ODA4OCwiZXhwIjoyMDk2OTU0MDg4fQ.gppnwuYLcWaXmS4cvpD_OngEh5lK9h_P-2e851vd8cE'

# Save these to a local env file so other scripts can use them
with open(r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-env', 'w') as f:
    f.write(f'SUPABASE_URL={SUPABASE_URL}\n')
    f.write(f'SUPABASE_ANON_KEY={SUPABASE_ANON_KEY}\n')
    f.write(f'SUPABASE_SERVICE_KEY={SUPABASE_SERVICE_KEY}\n')
print('Saved Supabase credentials to .supabase-env')

# First, delete the placeholder env vars
print('\n--- Removing placeholder env vars ---')
for env_id in ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']:
    # Get env var IDs to delete
    list_url = f'https://api.vercel.com/v9/projects/{project_id}/env'
    req = urllib.request.Request(list_url)
    req.add_header('Authorization', f'Bearer {vercel_token}')
    with urllib.request.urlopen(req) as resp:
        envs = json.loads(resp.read())
        for env in envs.get('envs', []):
            if env['key'] == env_id:
                del_url = f'https://api.vercel.com/v9/projects/{project_id}/env/{env["id"]}'
                del_req = urllib.request.Request(del_url, method='DELETE')
                del_req.add_header('Authorization', f'Bearer {vercel_token}')
                try:
                    with urllib.request.urlopen(del_req) as r:
                        print(f'  deleted {env_id} (id={env["id"][:8]}...)')
                except urllib.error.HTTPError as e:
                    print(f'  delete {env_id}: HTTP {e.code}')

# Now add the real ones
print('\n--- Adding real Supabase env vars ---')
new_envs = [
    {'key': 'NEXT_PUBLIC_SUPABASE_URL', 'value': SUPABASE_URL, 'type': 'plain', 'target': ['production', 'preview', 'development']},
    {'key': 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'value': SUPABASE_ANON_KEY, 'type': 'plain', 'target': ['production', 'preview', 'development']},
    {'key': 'SUPABASE_SERVICE_ROLE_KEY', 'value': SUPABASE_SERVICE_KEY, 'type': 'plain', 'target': ['production', 'preview', 'development']},
    {'key': 'NEXT_PUBLIC_APP_URL', 'value': 'https://pawcare-omega.vercel.app', 'type': 'plain', 'target': ['production', 'preview', 'development']},
    {'key': 'NEXT_PUBLIC_APP_NAME', 'value': 'PawCare', 'type': 'plain', 'target': ['production', 'preview', 'development']},
]

for env in new_envs:
    url = f'https://api.vercel.com/v10/projects/{project_id}/env'
    data = json.dumps(env).encode()
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f'Bearer {vercel_token}')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f'  + {env["key"]}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if 'already exists' in body or 'ENV_ALREADY_EXISTS' in body:
            print(f'  = {env["key"]} (already exists)')
        else:
            print(f'  ! {env["key"]}: HTTP {e.code}: {body[:200]}')

print('\nDone. Next: trigger a Vercel redeploy.')
