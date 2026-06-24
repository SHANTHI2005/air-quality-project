import requests          # talks to the internet
from datetime import datetime  # helps us convert the weird timestamp

# --- settings ---
API_KEY = "2af69c1b610dead1a7373bbc63dcca80"   # keep your real key here
LAT = 17.3850
LON = 78.4867

# --- fetch ---
url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={LAT}&lon={LON}&appid={API_KEY}"
response = requests.get(url)
data = response.json()

# --- dig into the blob and pull out what we care about ---
record = data["list"][0]   # the actual data is buried one level deep in a list

# pull out each value we want, one by one
aqi        = record["main"]["aqi"]
co         = record["components"]["co"]
no2        = record["components"]["no2"]
o3         = record["components"]["o3"]
pm2_5      = record["components"]["pm2_5"]
pm10       = record["components"]["pm10"]
timestamp  = datetime.fromtimestamp(record["dt"])  # convert weird number to real time

# --- print it nicely ---
print(f"Time:       {timestamp}")
print(f"AQI:        {aqi}  (1=Good, 5=Very Poor)")
print(f"CO:         {co}")
print(f"NO2:        {no2}")
print(f"O3:         {o3}")
print(f"PM2.5:      {pm2_5}")
print(f"PM10:       {pm10}")