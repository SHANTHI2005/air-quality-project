import requests
import sqlite3
from datetime import datetime

# --- settings ---
API_KEY = "2af69c1b610dead1a7373bbc63dcca80"   # paste your real key
LAT = 17.3850
LON = 78.4867

def extract():
    # go fetch data from the internet
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={LAT}&lon={LON}&appid={API_KEY}"
    response = requests.get(url)
    data = response.json()
    print("✓ Extracted data from API")
    return data

def transform(data):
    # dig out just the values we care about
    record = data["list"][0]
    clean = {
        "timestamp": datetime.fromtimestamp(record["dt"]).strftime("%Y-%m-%d %H:%M:%S"),
        "aqi":   record["main"]["aqi"],
        "co":    record["components"]["co"],
        "no2":   record["components"]["no2"],
        "o3":    record["components"]["o3"],
        "pm2_5": record["components"]["pm2_5"],
        "pm10":  record["components"]["pm10"],
    }
    print(f"✓ Transformed - AQI: {clean['aqi']}, PM2.5: {clean['pm2_5']}")
    return clean

def load(clean):
    # save the clean data into the database
    conn = sqlite3.connect("air_quality.db")
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO air_quality_readings 
            (timestamp, aqi, co, no2, o3, pm2_5, pm10)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            clean["timestamp"],
            clean["aqi"],
            clean["co"],
            clean["no2"],
            clean["o3"],
            clean["pm2_5"],
            clean["pm10"],
        ))
        conn.commit()
        print("✓ Saved to database!")

    except sqlite3.IntegrityError:
        # this fires if we already saved this exact timestamp before
        print("⚠ Already saved this reading, skipping duplicate.")

    finally:
        conn.close()  # always close the connection

def run_etl():
    print("--- Starting ETL ---")
    data  = extract()
    clean = transform(data)
    load(clean)
    print("--- ETL Complete ---")

# run it
run_etl()