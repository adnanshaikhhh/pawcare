import pg8000, ssl, os
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
conn = pg8000.connect(host='aws-1-ap-northeast-1.pooler.supabase.com', port=5432, database='postgres', user='postgres.ktezkiifvstroujfjxqw', password='3Adnan9029#', ssl_context=ctx, timeout=10)
cur = conn.cursor()
cur.execute("""select proname, pg_get_function_arguments(oid) from pg_proc where pronamespace = (select oid from pg_namespace where nspname = 'net') order by proname""")
for r in cur.fetchall():
    print(r)
