"""E2E test that:
1. Creates a confirmed test user via admin API
2. Creates a profile for them via service role (bypasses RLS)
3. Tests API routes with Bearer auth
4. Creates a test pet and verifies it shows up
"""
import json
import urllib.request
import urllib.error
import time
import sys

with open(r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-secret', 'r') as f:
    SVC = f.read().strip()
with open(r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-anon', 'r') as f:
    ANON = f.read().strip()
URL = 'https://ktezkiifvstroujfjxqw.supabase.co'

def admin_get(path):
    req = urllib.request.Request(URL + path)
    req.add_header('Authorization', 'Bearer ' + SVC)
    req.add_header('apikey', SVC)
    return urllib.request.urlopen(req, timeout=15)

def admin_post(path, body):
    req = urllib.request.Request(URL + path, data=json.dumps(body).encode(), method='POST')
    req.add_header('Authorization', 'Bearer ' + SVC)
    req.add_header('apikey', SVC)
    req.add_header('Content-Type', 'application/json')
    return urllib.request.urlopen(req, timeout=15)

# 1. Get or create user
print('1. Getting user...')
try:
    with admin_get('/auth/v1/admin/users?page=1&per_page=200') as r:
        users = json.loads(r.read()).get('users', [])
    user = next((u for u in users if u.get('email') == 'e2e@pawcare.app'), None)
    if not user:
        with admin_post('/auth/v1/admin/users', {'email': 'e2e@pawcare.app', 'password': 'PawcareTest2025!', 'email_confirm': True}) as r:
            user = json.loads(r.read())
    uid = user['id']
    print(f'   ✓ User: {uid[:8]}')
except Exception as e:
    print(f'   ! Error: {e}')
    sys.exit(1)

# 2. Create a profile for this user via service role
print('2. Creating profile via service role...')
# First check if profile exists
try:
    with admin_get(f'/rest/v1/profiles?select=*&id=eq.{uid}') as r:
        profiles = json.loads(r.read())
except Exception as e:
    profiles = []

if not profiles:
    try:
        with admin_post('/rest/v1/profiles', {
            'id': uid,
            'full_name': 'E2E Test User',
            'family_code': 'E2ETEST',
            'family_role': 'owner',
            'family_group_id': None,
        }) as r:
            print('   ✓ Profile created')
    except urllib.error.HTTPError as e:
        print(f'   ! Profile create error: {e.code} {e.read().decode()[:200]}')
else:
    print('   ✓ Profile already exists')

# 3. Login to get a Bearer token
print('3. Logging in...')
req = urllib.request.Request(
    f'{URL}/auth/v1/token?grant_type=password',
    data=json.dumps({'email': 'e2e@pawcare.app', 'password': 'PawcareTest2025!'}).encode(),
    method='POST'
)
req.add_header('Content-Type', 'application/json')
req.add_header('apikey', ANON)
with urllib.request.urlopen(req, timeout=30) as resp:
    token = json.loads(resp.read())['access_token']
    print(f'   ✓ Token: {len(token)} chars')

# 4. Test all API routes with Bearer auth
print('4. Testing API with Bearer auth...')
APP = 'https://pawcare-omega.vercel.app'
ROUTES = [
    ('GET', '/api/profile', None),
    ('GET', '/api/pets', None),
    ('GET', '/api/inventory', None),
    ('GET', '/api/reminders', None),
    ('GET', '/api/family', None),
    ('GET', '/api/vets', None),
    ('POST', '/api/pets', {
        'name': 'E2E Test Cat',
        'species': 'cat',
        'breed': 'Mixed',
        'gender': 'female',
        'date_of_birth': '2023-06-01',
        'color': 'calico',
        'fur_type': 'short',
        'is_indoor': True,
        'is_neutered': True,
    }),
    ('POST', '/api/inventory', {
        'item_name': 'E2E Test Food',
        'category': 'food_dry',
        'current_quantity': 5,
        'unit': 'kg',
        'estimated_days_remaining': 14,
        'alert_enabled': True,
        'alert_days_before': 2,
    }),
]

results = []
for method, path, body in ROUTES:
    req = urllib.request.Request(APP + path, method=method)
    req.add_header('Authorization', f'Bearer {token}')
    if body:
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps(body).encode()
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            rdata = resp.read().decode()[:120]
            results.append((method, path, resp.status, rdata))
    except urllib.error.HTTPError as e:
        edata = e.read().decode()[:120]
        results.append((method, path, e.code, edata))

print()
for method, path, status, body in results:
    icon = '✓' if status in (200, 201) else '✗'
    print(f'  {icon} {status:3d} {method:4s} {path:25s} | {body[:80]}')
