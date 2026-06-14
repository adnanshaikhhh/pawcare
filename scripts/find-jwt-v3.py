"""Look more broadly for JWT secret in pg_dist_authkey, supabase_internal schemas."""
import pg8000
import ssl
import os
import json

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

# All schemas
cur.execute("select nspname from pg_namespace where nspname not like 'pg_%' and nspname != 'information_schema' order by 1")
schemas = [r[0] for r in cur.fetchall()]
print('All schemas:', schemas)

# Look for tables that might have keys
print('\n--- All tables in non-public schemas ---')
cur.execute("""
  select schemaname, tablename from pg_tables
  where schemaname in ('storage','auth','vault','realtime','supabase_admin','graphql','graphql_public')
  order by 1, 2
""")
for s, t in cur.fetchall():
    print(f'  {s}.{t}')

# Look in vault.secrets
print('\n--- vault.secrets columns ---')
cur.execute("""
  select column_name, data_type from information_schema.columns
  where table_schema = 'vault' and table_name = 'secrets'
  order by ordinal_position
""")
for c in cur.fetchall():
    print(f'  {c[0]} : {c[1]}')

# Sample vault.secrets (some Supabase plans seed with the JWT secret)
print('\n--- vault.secrets contents ---')
try:
    cur.execute("select id, name, description, length(secret), created_at from vault.secrets")
    for r in cur.fetchall():
        print(f'  {r}')
except Exception as e:
    print(f'  {str(e)[:200]}')

# Try the supabase vault._secret_access (or similar) that has the JWT
print('\n--- All vault objects ---')
cur.execute("""
  select n.nspname, c.relname, c.relkind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'vault'
  order by 1, 2
""")
for r in cur.fetchall():
    print(f'  {r[0]}.{r[1]} (kind={r[2]})')

conn.close()
