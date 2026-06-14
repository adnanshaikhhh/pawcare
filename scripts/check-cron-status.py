import os, pg8000, ssl, json

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

conn = pg8000.connect(host=DB_HOST, port=DB_PORT, database='postgres', user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=10)
conn.autocommit = True
cur = conn.cursor()

print('--- cron.job_run_details ---')
try:
    cur.execute("select jobid, runid, status, start_time, end_time, return_message from cron.job_run_details order by start_time desc limit 5")
    for r in cur.fetchall():
        print(f'  jobid={r[0]} runid={r[1]} status={r[2]} start={r[3]} end={r[4]} return={r[5]}')
except Exception as e:
    print('  err:', e)

print('\n--- net._http_response ---')
cur.execute("select id, status_code, error_msg, left(body::text, 200) from net._http_response order by id desc limit 5")
for r in cur.fetchall():
    print(f'  id={r[0]} status={r[1]} err={r[2]} body={r[3]}')

conn.close()
