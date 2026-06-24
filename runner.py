import schedule   # handles the "run every hour" logic
import time       # lets us pause and wait between checks
from etl import run_etl   # pulls in the ETL we already built

def job():
    print("\n⏰ Scheduler triggered a run...")
    run_etl()

# --- tell schedule what to do and when ---
schedule.every(1).hours.do(job)   # run job() every 1 hour

# run it once immediately so we don't wait an hour for first result
print("🚀 Scheduler started! Running now, then every hour.")
job()

# keep the script alive, checking every 60 seconds if it's time to run again
while True:
    schedule.run_pending()   # "is it time yet?" check
    time.sleep(60)           # wait 60 seconds, then check again