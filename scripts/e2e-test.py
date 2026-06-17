"""Create a confirmed test user via Supabase admin API for E2E testing."""
import json
import urllib.request
import urllib.error

with open(r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-secret', 'r') as f:
    svc = f.read().strip()

# Try create user
req = urllib.request.Request(
    'https://ktezkiifvstroujfjxqw.supabase.co/auth/v1/admin/users',
    data=json.dumps({'email':'e2e@pawcare.app','password':'PawcareTest2025!','email_confirm':True}).encode(),
    method='POST'
)
req.add_header('Content-Type', 'application/json')
req.add_header('Authorization', 'Bearer ' + svc)
req.add_header('apikey', svc)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.loads(resp.read())
        print('Created user:', body.get('id', '?')[:8], '|', body.get('email'))
        user_id = body.get('id')
except urllib.error.HTTPError as e:
    body = e.read().decode()
    if 'already' in body.lower():
        # Find existing user
        list_req = urllib.request.Request('https://ktezkiifvstroujfjxqw.supabase.co/auth/v1/admin/users?page=1&per_page=50')
        list_req.add_header('Authorization', 'Bearer ' + svc)
        list_req.add_header('apikey', svc)
        with urllib.request.urlopen(list_req) as r:
            users = json.loads(r.read())
            for u in users.get('users', []):
                if u.get('email') == 'e2e@pawcare.app':
                    user_id = u['id']
                    print('Found existing user:', user_id[:8])
                    break
    else:
        print('Error:', e.code, body[:300])
        raise

# Login as that user
print('Logging in...')
login_req = urllib.request.Request(
    'https://ktezkiifvstroujfjxqw.supabase.co/auth/v1/token?grant_type=password',
    data=json.dumps({'email':'e2e@pawcare.app','password':'PawcareTest2025!'}).encode(),
    method='POST'
)
login_req.add_header('Content-Type', 'application/json')
login_req.add_header('apikey', svc)
with urllib.request.urlopen(login_req, timeout=30) as resp:
    login = json.loads(resp.read())
    token = login['access_token']
    print('Token:', len(token), 'chars')

# Test all API routes with the token
print('--- E2E API tests ---')
ROUTES = [
    ('GET', '/api/profile', None),
    ('GET', '/api/pets', None),
    ('GET', '/api/inventory', None),
    ('GET', '/api/reminders', None),
    ('GET', '/api/family', None),
    ('GET', '/api/vets', None),
    ('GET', '/api/vet-contacts', None),
    ('POST', '/api/pets', {'name': 'Test Pet', 'species': 'cat', 'breed': 'Mixed', 'gender': 'female', 'date_of_birth': '2022-01-15', 'color': 'black', 'fur_type': 'short', 'is_indoor': True, 'is_neutered': False}),
    ('POST', '/api/inventory', {'item_name': 'Test Food', 'category': 'food_dry', 'current_quantity': 5, 'unit': 'kg', 'estimated_days_remaining': 14, 'alert_enabled': True, 'alert_days_before': 2}),
]
for method, path, body in ROUTES:
    url = f'https://pawcare-omega.vercel.app{path}'
    req = urllib.request.Request(url, method=method)
    req.add_header('Authorization', f'Bearer {token}')
    if body:
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps(body).encode()
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            rdata = resp.read().decode()[:150]
            print(f'  {resp.status:3d} {method:4s} {path:30s} | {rdata[:80]}')
    except urllib.error.HTTPError as e:
        edata = e.read().decode()[:150]
        print(f'  {e.code:3d} {method:4s} {path:30s} | ERR: {edata[:80]}')
    except Exception as e:
        print(f'  ERR {method:4s} {path:30s}: {str(e)[:50]}')
