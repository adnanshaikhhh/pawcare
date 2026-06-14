"""Bootstrap the GoTrue instance creation by hitting its internal admin endpoint
via pg_net. This forces GoTrue to write its config to auth.instances."""

import pg8000
import ssl
import os

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

conn = pg8000.connect(
    host=DB_HOST, port=DB_PORT, database='postgres',
    user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=10
)
conn.autocommit = True
cur = conn.cursor()

# Enable pg_net
try:
    cur.execute("create extension if not exists pg_net")
    print('pg_net enabled')
except Exception as e:
    print(f'pg_net enable: {e}')

# Try to call the GoTrue internal admin endpoint to force initialization
# The GoTrue service typically runs at /auth/v1/admin
# But we need to know the internal port. It's usually 9999 on the same host.
# Or it could be exposed via the external REST endpoint

# Actually, the simplest way: call the public health endpoint of GoTrue
# This forces GoTrue to initialize its config
# Supabase's goTrue internal port is 9999 (for admin) on the auth service
# But that's inside Docker, not accessible from outside

# Let me try calling the public auth health endpoint which forces initialization
try:
    import urllib.request
    req = urllib.request.Request('https://ktezkiifvstroujfjxqw.supabase.co/auth/v1/health')
    req.add_header('apikey', 'placeholder')
    with urllib.request.urlopen(req, timeout=10) as resp:
        print(f'Auth health: HTTP {resp.status} {resp.read().decode()[:200]}')
except Exception as e:
    print(f'Auth health: {e}')

# After hitting the health endpoint, check if auth.instances is populated
import time
time.sleep(2)
cur.execute("select count(*) from auth.instances")
print(f'auth.instances count after health: {cur.fetchone()[0]}')

# Try the settings endpoint
try:
    req = urllib.request.Request('https://ktezkiifvstroujfjxqw.supabase.co/auth/v1/settings')
    req.add_header('apikey', 'placeholder')
    with urllib.request.urlopen(req, timeout=10) as resp:
        print(f'Auth settings: HTTP {resp.status} {resp.read().decode()[:300]}')
except urllib.error.HTTPError as e:
    print(f'Auth settings: HTTP {e.code} {e.read().decode()[:300]}')

# Try the .well-known/openid-configuration
try:
    req = urllib.request.Request('https://ktezkiifvstroujfjxqw.supabase.co/auth/v1/.well-known/openid-configuration')
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = resp.read().decode()
        print(f'OIDC config: HTTP {resp.status} {data[:500]}')
except Exception as e:
    print(f'OIDC: {e}')

# Check auth.instances again
cur.execute("select count(*) from auth.instances")
print(f'auth.instances count: {cur.fetchone()[0]}')

conn.close()
