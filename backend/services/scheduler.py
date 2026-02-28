"""
APScheduler background job runner.
Refreshes market data every 6 hours.
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler = None


def _refresh_job():
    try:
        from .market_data import refresh_all_indicators
        logger.info("Scheduler: refreshing market data...")
        refresh_all_indicators()
        logger.info("Scheduler: refresh complete.")
    except Exception as e:
        logger.error(f"Scheduler refresh error: {e}")


def start_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        return

    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(
        _refresh_job,
        trigger=IntervalTrigger(hours=6),
        id="market_refresh",
        name="Market Data Refresh",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("APScheduler started — market data will refresh every 6 hours.")


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
