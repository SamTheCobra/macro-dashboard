import logging
import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db
from backend.routers import theses, bets, journal, market_data, regime, news, portfolio
from backend.services.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Macro Investment Dashboard",
    description="Local financial dashboard for tracking macro investment theses.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(theses.router)
app.include_router(bets.router)
app.include_router(journal.router)
app.include_router(market_data.router)
app.include_router(regime.router)
app.include_router(news.router)
app.include_router(portfolio.router)


@app.on_event("startup")
async def startup():
    logger.info("Initializing database...")
    init_db()

    logger.info("Loading seed data if needed...")
    from backend.seed_data import seed_if_empty
    seed_if_empty()

    logger.info("Starting background scheduler...")
    start_scheduler()

    logger.info("Macro Dashboard backend ready.")


@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
