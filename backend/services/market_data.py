"""
Market data service: fetches price history from yfinance and FRED,
caches results in SQLite to avoid rate-limit hammering.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

import yfinance as yf

from backend.database import SessionLocal
from backend.models import MarketDataCache
from backend.services.fred_service import fetch_fred_series

logger = logging.getLogger(__name__)

CACHE_TTL_HOURS = 6
START_DATE = "2015-01-01"


def _get_cache(source: str, identifier: str) -> Optional[Dict]:
    db = SessionLocal()
    try:
        record = (
            db.query(MarketDataCache)
            .filter(
                MarketDataCache.source == source,
                MarketDataCache.identifier == identifier,
            )
            .first()
        )
        if record and record.last_updated:
            age = datetime.utcnow() - record.last_updated
            if age < timedelta(hours=CACHE_TTL_HOURS):
                return json.loads(record.data_json)
        return None
    finally:
        db.close()


def _set_cache(source: str, identifier: str, data: Dict) -> None:
    db = SessionLocal()
    try:
        record = (
            db.query(MarketDataCache)
            .filter(
                MarketDataCache.source == source,
                MarketDataCache.identifier == identifier,
            )
            .first()
        )
        if record:
            record.data_json = json.dumps(data)
            record.last_updated = datetime.utcnow()
        else:
            record = MarketDataCache(
                source=source,
                identifier=identifier,
                data_json=json.dumps(data),
                last_updated=datetime.utcnow(),
            )
            db.add(record)
        db.commit()
    except Exception as e:
        logger.error(f"Cache write error [{source}/{identifier}]: {e}")
        db.rollback()
    finally:
        db.close()


def fetch_price_history(ticker: str, force_refresh: bool = False) -> Dict[str, float]:
    """Return {date_str: close_price} for a yfinance ticker."""
    if not force_refresh:
        cached = _get_cache("yfinance", ticker)
        if cached:
            return cached

    try:
        data = yf.download(ticker, start=START_DATE, progress=False, auto_adjust=True)
        if data.empty:
            logger.warning(f"No yfinance data for {ticker}")
            return {}

        closes = data["Close"].dropna()
        # Handle MultiIndex columns from yfinance >= 0.2.38
        if hasattr(closes, "columns"):
            closes = closes.iloc[:, 0]

        result = {str(d.date()): round(float(v), 4) for d, v in closes.items()}
        _set_cache("yfinance", ticker, result)
        return result
    except Exception as e:
        logger.error(f"yfinance fetch error [{ticker}]: {e}")
        cached = _get_cache("yfinance", ticker) or {}
        return cached


def fetch_fred_history(series_id: str, force_refresh: bool = False) -> Dict[str, float]:
    """Return {date_str: value} for a FRED series."""
    if not force_refresh:
        cached = _get_cache("fred", series_id)
        if cached:
            return cached

    result = fetch_fred_series(series_id, start=START_DATE)
    if result:
        _set_cache("fred", series_id, result)
    return result


def get_latest_value(source: str, identifier: str) -> Optional[float]:
    """Return the most recent data point from cache."""
    data = (
        fetch_price_history(identifier)
        if source == "yfinance"
        else fetch_fred_history(identifier)
    )
    if not data:
        return None
    latest_key = max(data.keys())
    return data[latest_key]


def get_30d_return(source: str, identifier: str) -> Optional[float]:
    """Return the 30-day percentage change."""
    data = (
        fetch_price_history(identifier)
        if source == "yfinance"
        else fetch_fred_history(identifier)
    )
    if len(data) < 2:
        return None

    sorted_keys = sorted(data.keys())
    cutoff = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    recent = [k for k in sorted_keys if k >= cutoff]
    older = [k for k in sorted_keys if k < cutoff]

    if not recent or not older:
        return None

    v_now = data[recent[-1]]
    v_old = data[older[-1]]
    if v_old == 0:
        return None
    return round((v_now - v_old) / abs(v_old) * 100, 2)


def refresh_all_indicators() -> None:
    """Triggered by scheduler or manual refresh endpoint."""
    db = SessionLocal()
    try:
        from backend.models import ProxyIndicator
        indicators = db.query(ProxyIndicator).all()
        seen = set()
        for ind in indicators:
            key = (ind.source, ind.ticker_or_series_id)
            if key in seen:
                continue
            seen.add(key)
            logger.info(f"Refreshing {ind.source}/{ind.ticker_or_series_id}")
            if ind.source == "yfinance":
                fetch_price_history(ind.ticker_or_series_id, force_refresh=True)
            else:
                fetch_fred_history(ind.ticker_or_series_id, force_refresh=True)

        # Always refresh regime indicators
        regime_tickers = ["SPY", "^VIX", "TLT", "HYG", "GLD", "UUP"]
        fred_series = ["FEDFUNDS", "CPIAUCSL", "GS10", "GS2",
                       "BAMLH0A0HYM2", "M2SL", "UNRATE", "T10Y2Y"]
        for t in regime_tickers:
            fetch_price_history(t, force_refresh=True)
        for s in fred_series:
            fetch_fred_history(s, force_refresh=True)

        # Refresh current prices for active bets
        from backend.models import ActionableBet
        bets = db.query(ActionableBet).filter(
            ActionableBet.status == "active",
            ActionableBet.ticker.isnot(None),
        ).all()
        for bet in bets:
            price = get_latest_value("yfinance", bet.ticker)
            if price is not None:
                bet.current_price = price
        db.commit()
    except Exception as e:
        logger.error(f"refresh_all_indicators error: {e}")
        db.rollback()
    finally:
        db.close()
