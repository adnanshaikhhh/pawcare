"""Look for JWT secret in current Supabase config."""
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

# Check all tables in auth schema
print('--- All auth.* tables ---')
cur.execute("select tablename from pg_tables where schemaname='auth' order by 1")
for r in cur.fetchall():
    print(f'  {r[0]}')

# Check the _internal table (GoTrue storage)
print('\n--- auth._internal ---')
try:
    cur.execute("select name, value from auth._internal")
    for r in cur.fetchall():
        val = str(r[1])[:120]
        print(f'  {r[0]} = {val}')
except Exception as e:
    print(f'  {e}')

# auth.sso_provider (might have keys)
print('\n--- auth schema columns ---')
cur.execute("""
  select table_name, column_name
  from information_schema.columns
  where table_schema = 'auth'
    and (column_name ilike '%secret%' or column_name ilike '%key%' or column_name ilike '%token%' or column_name ilike '%config%')
  order by table_name, column_name
""")
for r in cur.fetchall():
    print(f'  {r[0]}.{r[1]}')

# Maybe in the pg_settings under gotrue
print('\n--- relevant pg_settings ---')
cur.execute("select name, setting, short_desc from pg_settings where name ilike '%gotrue%' or name ilike '%jwt%' or name ilike '%supabase%' order by 1")
for r in cur.fetchall():
    val = str(r[1])[:80]
    print(f'  {r[0]} = {val}  ({r[2][:60]})')

# Check current_setting with a different name
print('\n--- current_setting tests ---')
for s in ['app.settings.jwt_secret', 'app.settings.supabase_url', 'app.jwt_secret', 'jwt.secret']:
    try:
        cur.execute(f"select current_setting('{s}', true)")
        v = cur.fetchone()[0]
        if v:
            print(f'  {s} = {v[:80]}')
        else:
            print(f'  {s} = (not set)')
    except Exception as e:
        print(f'  {s}: {str(e)[:60]}')

# The Supabase project info table
print('\n--- public.projects / project_info ---')
for t in ['projects', 'project_info', 'app_meta', 'site_url', 'jwt_signing_keys']:
    try:
        cur.execute(f"select to_regclass('public.{t}')")
        exists = cur.fetchone()[0]
        print(f'  public.{t}: {exists}')
    except Exception:
        pass

# Look at ALL functions in public schema
print('\n--- public schema functions ---')
cur.execute("""
  select p.proname, pg_get_function_arguments(p.oid)
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
  order by 1
""")
for r in cur.fetchall():
    print(f'  {r[0]}({r[1]})')

conn.close()
