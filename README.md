# Macro Investment Dashboard

A local full-stack financial dashboard for tracking macro investment theses with real-time market data, conviction logging, regime detection, and portfolio analytics.

**Tech stack:** Python + FastAPI + SQLite (backend) · React + Tailwind + Plotly.js + React Flow (frontend)

---

## Quick Start

```bash
# 1. Clone / copy the project
cd macro-dashboard

# 2. Add your API keys
cp .env.example .env
# Edit .env — add FRED_API_KEY (required for macro indicators)

# 3. Start everything
chmod +x run.sh
./run.sh
# OR
make start
```

Open **http://localhost:5173** — the dashboard loads with 3 seed theses immediately.

---

## Setup Steps

### Prerequisites
- Python 3.10+
- Node.js 18+

### First-time install (without starting)
```bash
make install
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `FRED_API_KEY` | Yes (for macro data) | Free at [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) |
| `NEWS_API_KEY` | Optional | Free at [newsapi.org](https://newsapi.org/register) — falls back to Google News RSS |
| `DATABASE_URL` | No | Defaults to `sqlite:///./macro_dashboard.db` |

### Getting a FRED API Key (free, 30 seconds)
1. Go to https://fred.stlouisfed.org/docs/api/api_key.html
2. Click "Request API Key"
3. Fill in a basic application description
4. Copy the key into `.env` as `FRED_API_KEY=your_key`

---

## How to Add a Thesis

### Via the UI
1. Click **New Thesis** in the sidebar
2. Fill in: name, description, sector, time horizon, confidence level
3. Add 2nd/3rd order effects, assumptions, invalidation conditions, proxy indicators
4. Hit **Create Thesis**
5. From the thesis detail page, add bets and log conviction entries

### Via the seed file
Edit `backend/seed/theses_seed.json` and follow the existing structure. Delete the database to reload:
```bash
make reset && make start
```

---

## How to Configure Regime Detection

Regime detection lives in `backend/services/regime_detection.py`.

The `_apply_rules()` function applies priority-ordered rules over these indicators:

| Indicator | Source | FRED series |
|---|---|---|
| Fed Funds Rate | FRED | `FEDFUNDS` |
| CPI | FRED | `CPIAUCSL` |
| 10Y Treasury Yield | FRED | `GS10` |
| 2Y Treasury Yield | FRED | `GS2` |
| 10Y-2Y Spread | FRED | `T10Y2Y` |
| HY Credit Spread | FRED | `BAMLH0A0HYM2` |
| SPY 30-day return | yfinance | `SPY` |
| VIX | yfinance | `^VIX` |

**Regime types:** `risk_on` · `risk_off` · `stagflation` · `reflation` · `tightening` · `easing` · `neutral`

To adjust thresholds, edit the `_apply_rules()` function. Each rule returns a `(regime, confidence, description)` tuple. Rules are evaluated in priority order — first match wins.

Example: to change the stagflation CPI threshold from 5% to 4%:
```python
# In _apply_rules():
if cpi > 4.0 and spy_30d < -3.0:   # was 5.0
    return ("stagflation", ...)
```

---

## Market Data

### yfinance
Fetches historical OHLCV data from Yahoo Finance. No API key needed. Data is cached in SQLite for 6 hours.

```
Supported: stocks, ETFs, commodities, currencies, indices
Format: TICKER (e.g. SPY, GLD, ^VIX, EURUSD=X)
```

### FRED
Fetches economic time series from the St. Louis Fed. Requires `FRED_API_KEY`.

```
Common series IDs:
  FEDFUNDS   — Fed Funds Rate
  CPIAUCSL   — CPI (All Urban Consumers)
  GS10       — 10-Year Treasury Yield
  GS2        — 2-Year Treasury Yield
  T10Y2Y     — 10Y minus 2Y spread
  M2SL       — M2 Money Supply
  UNRATE     — Unemployment Rate
  BAMLH0A0HYM2 — ICE BofA High Yield OAS
```

### Refreshing data
- **Automatic:** every 6 hours via APScheduler
- **Manual (UI):** click "Refresh Data" in the sidebar
- **Manual (API):** `POST http://localhost:8000/api/market-data/refresh`
- **Force refresh:** `GET http://localhost:8000/api/market-data/price/SPY?force=true`

---

## Database

SQLite database at `backend/macro_dashboard.db`. To reset and reseed:
```bash
make reset
```

### Schema overview
| Table | Purpose |
|---|---|
| `theses` | Core thesis records |
| `second_order_effects` | 2nd/3rd order effect descriptions |
| `assumptions` | Key assumptions with evidence ratings |
| `invalidation_conditions` | Kill-switch signals with trigger tracking |
| `proxy_indicators` | Tickers/series mapped to each thesis |
| `actionable_bets` | Position tracker with P&L |
| `bet_scenarios` | Bull/base/bear scenario models |
| `conviction_entries` | Timestamped conviction journal |
| `catalysts` | Event calendar per thesis |
| `retro_scorecards` | Closed thesis retrospective data |
| `market_data_cache` | Cached price/FRED time series |

---

## Project Structure

```
macro-dashboard/
├── run.sh              # Single startup script
├── Makefile            # make start / install / reset / clean
├── .env.example        # Copy to .env and add keys
├── backend/
│   ├── main.py         # FastAPI app, startup, CORS
│   ├── models.py       # SQLAlchemy ORM models
│   ├── schemas.py      # Pydantic request/response schemas
│   ├── database.py     # Engine, session, init_db
│   ├── seed_data.py    # Seed loader
│   ├── routers/        # API route handlers
│   ├── services/       # Business logic (data, regime, health score)
│   └── seed/
│       └── theses_seed.json
└── frontend/
    ├── src/
    │   ├── pages/      # Dashboard, ThesisDetail, Portfolio, Retrospective
    │   ├── components/ # Reusable UI components
    │   └── utils/      # API client, formatters
    └── ...config files
```

---

## API Reference

Interactive docs at **http://localhost:8000/docs** (Swagger UI) when the backend is running.

Key endpoints:
```
GET  /api/theses/               — List all theses with health scores
POST /api/theses/               — Create thesis
GET  /api/theses/{id}           — Full thesis detail
PUT  /api/theses/{id}           — Update thesis
POST /api/theses/{id}/close     — Close with retrospective
GET  /api/regime/current        — Current macro regime
GET  /api/regime/all-compat     — Regime compatibility for all theses
GET  /api/portfolio/overview    — Portfolio-level stats
GET  /api/portfolio/correlation — Correlation matrix for active bets
GET  /api/market-data/price/{ticker}  — Price history
GET  /api/market-data/fred/{series}   — FRED series data
POST /api/market-data/refresh   — Trigger background refresh
```

---

## Tips

- **Health Score** is auto-calculated: assumptions (25%) + no invalidations triggered (30%) + conviction trend (15%) + proxy indicators aligned (30%)
- **Conviction log** is the most powerful feature — log regularly with dated notes to build a trading journal
- **Position Sizing Calculator** (on the Bets tab) uses risk-per-trade logic: `shares = (portfolio × risk%) / (entry - stop)`
- **Correlation Matrix** only shows tickers with enough price history. Add positions as "active" bets to see them
- Charts show data from 2015 to present with a yellow dashed line at your thesis activation date

---

## Troubleshooting

**FRED data not loading:**
→ Check `FRED_API_KEY` in `.env`. Get a free key at fred.stlouisfed.org

**yfinance errors:**
→ Usually a network issue or invalid ticker. Check `http://localhost:8000/api/market-data/price/SPY` to test.

**Port already in use:**
```bash
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill
```

**Reset to factory state:**
```bash
make reset
```
