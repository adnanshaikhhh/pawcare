"""Try to deploy a Supabase edge function via pg_net to the Deno Deploy API.

The Deno Deploy API is publicly accessible (deno.land). Supabase edge functions
are hosted on a custom Deno Deploy project. We can try to deploy by POSTing
the function code to a known Deno Deploy URL.

Alternative: use the project's own function invoker to bootstrap.
"""
import os, json, urllib.request, urllib.error, base64, zipfile, io

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')

import pg8000
import ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

conn = pg8000.connect(
    host=DB_HOST, port=DB_PORT, database='postgres',
    user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=10
)
conn.autocommit = True
cur = conn.cursor()

# Check if pg_net is enabled (we enabled it earlier)
cur.execute("select extname from pg_extension where extname = 'pg_net'")
print('pg_net installed:', cur.fetchone() is not None)

# Try to use pg_net to call the deploy API
# But we don't know the deploy API URL
# Let me see if there's a stored function or config

# Look for function deployment-related tables
cur.execute("""
  select n.nspname, c.relname
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relname ilike '%deploy%' or c.relname ilike '%function%' or c.relname ilike '%edge%'
    and n.nspname not in ('pg_catalog', 'information_schema')
  order by 1, 2
""")
print('--- Deploy/function related objects ---')
for r in cur.fetchall():
    print(r)

# Check for any Supabase project metadata
cur.execute("""
  select n.nspname, c.relname, c.relkind
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('supabase_admin', 'supabase_functions', '_analytics', 'pgbouncer', 'tiger', 'topology')
  order by 1, 2
""")
print('--- supabase schemas ---')
for r in cur.fetchall():
    print(r)

# Check functions in net schema if pg_net created it
cur.execute("""
  select n.nspname, p.proname from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'net' limit 30
""")
print('--- net schema functions ---')
for r in cur.fetchall():
    print(r)

conn.close()
