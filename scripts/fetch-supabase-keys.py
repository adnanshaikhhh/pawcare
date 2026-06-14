"""Fetch anon + service_role keys from Supabase using the dashboard SQL endpoint trick.

The actual Supabase project has a public `anon` and `service_role` key in the
postgrest configuration. We can read them via the project's PostgREST introspection
OR via the `supabase_keys` Postgres function (only available on hosted plans).
"""
import pg8000
import ssl
import os
import json

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_NAME = 'postgres'
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

conn = pg8000.connect(
    host=DB_HOST, port=DB_PORT, database=DB_NAME,
    user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=30
)
cur = conn.cursor()

# Read the current database settings for supabase URLs and keys
queries = {
    'project_url': "select current_setting('app.settings.supabase_url', true)",
    'jwt_secret': "select current_setting('app.settings.jwt_secret', true)",
    'anon_key': "select current_setting('app.settings.anon_key', true)",
    'service_role_key': "select current_setting('app.settings.service_role_key', true)",
}

for name, q in queries.items():
    try:
        cur.execute(q)
        result = cur.fetchone()
        print(f'{name}: {result[0] if result and result[0] else "(not in settings)"}')
    except Exception as e:
        print(f'{name}: query failed: {str(e)[:100]}')

# Try alternative: get the anon/service_role from pg_settings
print('\n--- Trying vault / secrets ---')
try:
    cur.execute("select name, decrypted_secret from vault.decrypted_secrets limit 20")
    for row in cur.fetchall():
        print(f'  {row[0]}: {row[1][:30] if row[1] else "(empty)"}...')
except Exception as e:
    print(f'vault: {str(e)[:200]}')

# The PostgREST server config often has the JWT secret
print('\n--- PostgREST / GoTrue settings ---')
try:
    cur.execute("select name, setting from pg_settings where name like '%jwt%' or name like '%supabase%' or name like '%gotrue%'")
    for row in cur.fetchall():
        print(f'  {row[0]}: {row[1][:60]}')
except Exception as e:
    print(f'settings: {e}')

# Get the project ref + region from server_version_num etc
print('\n--- Server info ---')
cur.execute("select version(), inet_server_addr(), inet_server_port()")
for row in cur.fetchall():
    print(f'  {row}')

conn.close()
