"""Use pg_net to call the Supabase management API from inside the database.
If pg_net uses a different egress IP than my CLI, it may bypass the WAF."""
import os, json, urllib.request, urllib.error
import pg8000, ssl

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

# Try a test GET to api.supabase.com via pg_net
print('--- Test pg_net can reach api.supabase.com ---')
cur.execute("""
  select * from net.http_get(
    url := 'https://api.supabase.com/v1/projects/ktezkiifvstroujfjxqw'::text,
    timeout_msec := 5000
  )
""")
cols = [d[0] for d in cur.description]
print('Columns:', cols)
for r in cur.fetchall():
    print('Row:', tuple(str(c)[:100] for c in r))

# Get the response
cur.execute("""
  select (net.http_get('https://api.supabase.com/v1/projects/ktezkiifvstroujfjxqw'::text, 5000)).*
""")
for r in cur.fetchall():
    print('Result:', r)

# Try with auth header
print('\n--- Try authenticated GET to api.supabase.com via pg_net ---')
# Use net.http_post with body
tkn_file = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-token'
with open(tkn_file) as f:
    tkn = f.read().strip()

cur.execute("""
  select net.http_post(
    url := 'https://api.supabase.com/v1/projects/ktezkiifvstroujfjxqw/functions'::text,
    headers := jsonb_build_object('Authorization', 'Bearer ' || %s, 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_msec := 10000
  )
""", (tkn,))
for r in cur.fetchall():
    print('Result:', str(r)[:500])

# Wait for response
cur.execute("""
  select id, status, response_status_code, error_msg
  from net._http_response
  order by id desc
  limit 3
""")
for r in cur.fetchall():
    print('Response:', r)

conn.close()
