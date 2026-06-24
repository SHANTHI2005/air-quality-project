# 🌫️ Air Quality Analytics Platform — Hyderabad

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.1-green?logo=springboot)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)
![Deployed](https://img.shields.io/badge/Deployed-Netlify-00C7B7?logo=netlify)
![License](https://img.shields.io/badge/License-MIT-yellow)

A full stack air quality monitoring platform that ingests live pollution data for Hyderabad, stores it in a database, serves it through a REST API, and displays it on an interactive dashboard with an AI-powered chat assistant.

🔗 **Live Demo**: [dynamic-biscotti-f53836.netlify.app](https://dynamic-biscotti-f53836.netlify.app)
📦 **GitHub**: [github.com/SHANTHI2005/air-quality-project](https://github.com/SHANTHI2005/air-quality-project)

---
## 🏗️ Architecture

```
OpenWeatherMap API
        ↓
  Python ETL Pipeline          ← extracts, transforms, loads every hour
        ↓
   SQLite Database              ← stores all readings with deduplication
        ↓
  Spring Boot REST API          ← serves data via 3 REST endpoints
        ↓
   React Frontend               ← displays live dashboard + AI chat
        ↓
     Netlify                    ← deployed and publicly accessible
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Data Ingestion | Python, `requests`, `schedule` |
| Database | SQLite, `sqlite3` |
| Backend API | Java, Spring Boot 3, Spring Data JPA |
| Frontend | React, Vite |
| AI Assistant | Claude API (Anthropic) |
| Deployment | Netlify |
| Version Control | Git, GitHub |

---

## 📁 Project Structure

```
air-quality-project/
│
├── fetch_data.py          # fetches raw data from OpenWeatherMap API
├── database.py            # creates SQLite database and table
├── etl.py                 # extract → transform → load pipeline
├── runner.py              # hourly scheduler
├── air_quality.db         # SQLite database file
│
├── api/                   # Spring Boot REST API
│   └── src/main/java/com/airquality/api/
│       ├── AirQualityReading.java      # entity (maps to DB table)
│       ├── AirQualityRepository.java   # database queries
│       ├── AirQualityController.java   # REST endpoints
│       └── ApiApplication.java         # entry point
│
└── frontend/              # React dashboard
    └── src/
        ├── App.jsx         # main dashboard component
        └── main.jsx        # entry point
```

---

## 🚀 Features

- ✅ **Live Data Ingestion** — pulls real air quality data from OpenWeatherMap every hour
- ✅ **ETL Pipeline** — structured Extract, Transform, Load with error handling
- ✅ **Deduplication** — UNIQUE constraint prevents duplicate database entries
- ✅ **REST API** — 3 endpoints serving JSON data
- ✅ **Interactive Dashboard** — AQI gauge, pollutant table, color-coded status
- ✅ **AI Chat Assistant** — ask questions about air quality in plain English
- ✅ **Cloud Deployed** — live public URL on Netlify

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/air-quality` | Get all readings |
| GET | `/api/air-quality/recent` | Get 10 most recent readings |
| GET | `/api/air-quality/{id}` | Get single reading by ID |

**Example Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2026-06-24 12:02:10",
    "aqi": 1,
    "co": 88.63,
    "no2": 2.52,
    "o3": 44.2,
    "pm2_5": 2.51,
    "pm10": 3.18
  }
]
```

---

## 🔢 AQI Scale

| AQI Value | Status | Meaning |
|-----------|--------|---------|
| 1 | 🟢 Good | Air quality is satisfactory |
| 2 | 🟡 Fair | Acceptable air quality |
| 3 | 🟠 Moderate | Sensitive groups affected |
| 4 | 🔴 Poor | Everyone may feel effects |
| 5 | 🟣 Very Poor | Health warnings for everyone |

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.10+
- Java 21
- Node.js 18+
- OpenWeatherMap API key (free at openweathermap.org)
- Anthropic API key (free at console.anthropic.com)

### 1. Clone the repo
```bash
git clone https://github.com/SHANTHI2005/air-quality-project.git
cd air-quality-project
```

### 2. Set up Python ETL
```bash
pip install requests schedule
```

Create a `.env` file or edit `etl.py` and add your OpenWeatherMap API key:
```
API_KEY=your_openweathermap_key_here
```

Run the ETL once to populate the database:
```bash
python etl.py
```

Start the hourly scheduler:
```bash
python runner.py
```

### 3. Start Spring Boot API
```bash
cd api
.\mvnw.cmd spring-boot:run     # Windows
./mvnw spring-boot:run          # Mac/Linux
```
API runs at: `http://localhost:8081`

### 4. Start React Frontend
```bash
cd frontend
```

Create a `.env` file:
```
VITE_ANTHROPIC_KEY=your_anthropic_key_here
```

```bash
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 🌍 Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Netlify | [Live Site](https://dynamic-biscotti-f53836.netlify.app) |
| Backend API | localhost:8081 | (deploy to Render for production) |

---

## 📊 Data Source

This project uses the **OpenWeatherMap Air Pollution API** (free tier).

Tracked pollutants:
- **AQI** — Air Quality Index (1-5 scale)
- **CO** — Carbon Monoxide (μg/m³)
- **NO2** — Nitrogen Dioxide (μg/m³)
- **O3** — Ozone (μg/m³)
- **PM2.5** — Fine particulate matter (μg/m³)
- **PM10** — Coarse particulate matter (μg/m³)

---

## 👩‍💻 Author

**Shanthi**
- GitHub: [@SHANTHI2005](https://github.com/SHANTHI2005)

---

## 📄 License

This project is licensed under the MIT License.
