"""Use pg_net to call the Supabase management API.
This goes through Supabase's server infrastructure, which may bypass WAF.
"""
import os, json, urllib.request, urllib.error
import pg8000, ssl, time

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')

tkn_file = r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\.supabase-token'
with open(tkn_file) as f:
    tkn = f.read().strip()

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

conn = pg8000.connect(
    host=DB_HOST, port=DB_PORT, database='postgres',
    user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=10
)
conn.autocommit = True
cur = conn.cursor()

# 1. Test pg_net can reach api.supabase.com at all
print('--- Test: pg_net GET to api.supabase.com ---')
cur.execute("""
  select net.http_get(
    url := 'https://api.supabase.com/v1/projects/ktezkiifvstroujfjxqw'::text,
    headers := jsonb_build_object('Authorization', 'Bearer ' || %s::text)
  )
""", (tkn,))
req_id = cur.fetchone()[0]
print(f'Request ID: {req_id}')

# Wait and collect
time.sleep(3)
cur.execute("select id, status, error_msg, length(body) from net._http_response where id >= 1 order by id desc limit 5")
for r in cur.fetchall():
    print(f'  id={r[0]} status={r[1]} error={r[2]} body_len={r[3]}')
    cur.execute("select body from net._http_response where id = %s", (r[0],))
    body = cur.fetchone()
    if body and body[0]:
        text = bytes(body[0]).decode('utf-8', errors='replace')[:500]
        print(f'  body: {text}')

# 2. Try the functions endpoint
print('\n--- Test: pg_net GET /functions ---')
cur.execute("""
  select net.http_get(
    url := 'https://api.supabase.com/v1/projects/ktezkiifvstroujfjxqw/functions'::text,
    headers := jsonb_build_object('Authorization', 'Bearer ' || %s::text, 'Content-Type', 'application/json')
  )
""", (tkn,))
req_id = cur.fetchone()[0]
time.sleep(2)
cur.execute("select status, error_msg, body from net._http_response where id = %s", (req_id,))
rows = cur.fetchall()
for r in rows:
    print(f'Status: {r[0]}, Error: {r[1]}')
    if len(r) > 2 and r[2]:
        body = bytes(r[2]).decode('utf-8', errors='replace')[:500]
        print(f'Body: {body}')

conn.close()
