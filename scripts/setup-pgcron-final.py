"""Set up pg_cron to call the Vercel cron endpoint every 15 minutes.
This bypasses Vercel Hobby's 1-cron-per-day limit by using Supabase's
pg_cron extension (which is more lenient and free)."""
import os, pg8000, ssl, sys

DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
DB_PORT = 5432
DB_USER = 'postgres.ktezkiifvstroujfjxqw'
DB_PASS = os.environ.get('SUPABASE_DB_PASSWORD', '3Adnan9029#')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print('Connecting to Supabase Postgres...')
try:
    conn = pg8000.connect(
        host=DB_HOST, port=DB_PORT, database='postgres',
        user=DB_USER, password=DB_PASS, ssl_context=ctx, timeout=15
    )
    conn.autocommit = True
    cur = conn.cursor()
    print('OK connected.\n')

    # 1. Ensure pg_cron and pg_net are installed
    print('--- Installing required extensions ---')
    for ext in ['pg_cron', 'pg_net']:
        try:
            cur.execute(f'create extension if not exists {ext}')
            cur.execute(f"select extname, extversion from pg_extension where extname = '{ext}'")
            r = cur.fetchone()
            print(f'  + {ext}: {r}')
        except Exception as e:
            print(f'  ! {ext}: {str(e)[:200]}')

    # 2. Remove any existing pawcare jobs
    print('\n--- Removing old jobs ---')
    try:
        cur.execute("select cron.unschedule(jobname) from cron.job where jobname like 'pawcare-%'")
        print('  cleaned')
    except Exception as e:
        print(f'  ! {str(e)[:100]}')

    # 3. Schedule the main job
    print('\n--- Scheduling pawcare-send-notifications (every 15 min) ---')
    # pg_cron needs the function name in single-quotes inside $$
    # The url has the cron secret as bearer token
    cron_sql = """
        select cron.schedule(
          'pawcare-send-notifications',
          '*/15 * * * *',
          $cmd$ select net.http_post(
               url:='https://pawcare-omega.vercel.app/api/cron/send-notifications',
               headers:='{"Authorization": "Bearer pawcare_cron_secret_2025", "Content-Type": "application/json"}'::jsonb,
               body:='{}'::jsonb,
               timeout_milliseconds:=10000
             ) $cmd$
        )
    """
    # pg_cron's $tag$ syntax: use $tag$ where tag can be anything
    cron_sql = cron_sql.replace('$cmd$', '$$')
    try:
        cur.execute(cron_sql)
        print('  + pawcare-send-notifications scheduled')
    except Exception as e:
        print(f'  ! {str(e)[:500]}')

    # 4. Verify
    print('\n--- Verifying jobs ---')
    try:
        cur.execute("select jobid, jobname, schedule, active from cron.job order by jobname")
        for r in cur.fetchall():
            print(f'  jobid={r[0]} jobname={r[1]} schedule="{r[2]}" active={r[3]}')
    except Exception as e:
        print(f'  ! {str(e)[:200]}')

    # 5. Try to trigger it now
    print('\n--- Manually invoking the cron once to test ---')
    try:
        cur.execute("select cron.run_job('pawcare-send-notifications')")
        print('  + Manual invocation requested')
    except Exception as e:
        print(f'  ! {str(e)[:200]}')

    conn.close()
    print('\nDONE. PawCare notifications will run every 15 minutes via pg_cron.')
    print('The pg_cron in the database calls the Vercel endpoint, which:')
    print('  1. Auto-creates due reminders (vaccines, deworming, heat, inventory, birthdays)')
    print('  2. Collects due reminders')
    print('  3. Sends push notifications via Expo Push API (free)')

except Exception as e:
    print(f'FAILED: {e}')
    sys.exit(1)
