import sqlite3   # built into Python, no install needed!

def create_database():
    # connect to the database file (creates it if it doesn't exist yet)
    conn = sqlite3.connect("air_quality.db")
    cursor = conn.cursor()  # cursor is like a pen that writes to the database

    # create the table where we'll store all our readings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS air_quality_readings (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,  -- auto numbering
            timestamp   TEXT NOT NULL,                      -- when was it recorded
            aqi         INTEGER,                            -- air quality index
            co          REAL,                               -- carbon monoxide
            no2         REAL,                               -- nitrogen dioxide
            o3          REAL,                               -- ozone
            pm2_5       REAL,                               -- fine particles
            pm10        REAL,                               -- coarse particles
            UNIQUE(timestamp)                               -- no duplicate entries
        )
    """)

    conn.commit()   # save the changes
    conn.close()    # close the connection
    print("Database ready!")

# run it
create_database()