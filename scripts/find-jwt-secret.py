"""Search for JWT secret, anon key, service_role key in Supabase internal tables."""
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
cur = conn.cursor()

# Look for tables that might hold keys/secrets
print('--- Looking for key/secret/jwt/token tables ---')
cur.execute("""
  select schemaname, tablename
  from pg_tables
  where schemaname in ('auth', 'storage', 'vault', 'public', 'realtime')
    and (tablename ilike '%key%' or tablename ilike '%secret%' or tablename ilike '%token%' or tablename ilike '%jwt%' or tablename ilike '%config%' or tablename ilike '%setting%')
  order by 1, 2
""")
for s, t in cur.fetchall():
    print(f'  {s}.{t}')

# Try the auth.config table (GoTrue stores JWT secret here)
print('\n--- auth.config (JWT secret lives here) ---')
try:
    cur.execute("select * from auth.config")
    cols = [d[0] for d in cur.description]
    print('columns:', cols)
    for row in cur.fetchall():
        for c, v in zip(cols, row):
            if v is not None:
                print(f'  {c} = {str(v)[:100]}')
except Exception as e:
    print(f'auth.config: {e}')

# Try the vault (which the user explicitly enabled in migration 005)
print('\n--- vault.secrets ---')
try:
    cur.execute("select id, name, description, length(secret) as secret_len from vault.secrets limit 10")
    for r in cur.fetchall():
        print(f'  {r}')
except Exception as e:
    print(f'vault.secrets: {e}')

# Maybe the anon/service keys are in pgsodium key table
print('\n--- pgsodium.key ---')
try:
    cur.execute("select id, name, length(key) as klen from pgsodium.key limit 5")
    for r in cur.fetchall():
        print(f'  {r}')
except Exception as e:
    print(f'pgsodium.key: {e}')

# Or maybe in a custom config table
print('\n--- All non-default tables with key/config in name ---')
cur.execute("""
  select schemaname, tablename
  from pg_tables
  where tablename ilike '%jwt%' or tablename ilike '%anon%' or tablename ilike '%service%'
  order by 1, 2
""")
for s, t in cur.fetchall():
    print(f'  {s}.{t}')

# Check gotrue settings (in env / config files on disk)
# Try to look at the current GoTrue config
print('\n--- Try the auth schema functions ---')
cur.execute("select proname, pronargs from pg_proc where pronamespace = (select oid from pg_namespace where nspname='auth') limit 20")
for r in cur.fetchall():
    print(f'  auth.{r[0]}({r[1]} args)')

conn.close()
