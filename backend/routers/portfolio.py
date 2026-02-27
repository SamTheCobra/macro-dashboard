import json
import logging
from typing import Dict, List, Optional

import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Thesis, ActionableBet, MarketDataCache
from backend.schemas import PortfolioOverview
from backend.services.health_score import calculate_health_score
from backend.services.regime_detection import detect_current_regime
from backend.services.market_data import fetch_price_history

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("/overview", response_model=PortfolioOverview)
def get_overview(db: Session = Depends(get_db)):
    all_theses = db.query(Thesis).all()
    active = [t for t in all_theses if t.status == "active"]
    closed = [t for t in all_theses if t.status == "closed"]

    active_bets = sum(
        1 for t in active for b in t.bets if b.status == "active"
    )
    watching_bets = sum(
        1 for t in active for b in t.bets if b.status == "watching"
    )

    health_scores = [calculate_health_score(t) for t in active] if active else [0.0]
    avg_health = round(sum(health_scores) / len(health_scores), 1) if health_scores else 0.0

    regime_data = detect_current_regime()

    return PortfolioOverview(
        total_theses=len(all_theses),
        active_theses=len(active),
        closed_theses=len(closed),
        total_active_bets=active_bets,
        total_watching_bets=watching_bets,
        avg_health_score=avg_health,
        regime=regime_data.get("regime"),
        regime_confidence=regime_data.get("confidence"),
    )


@router.get("/exposure")
def get_exposure(db: Session = Depends(get_db)):
    """Returns sector exposure and per-thesis active bet counts."""
    theses = db.query(Thesis).filter(Thesis.status == "active").all()
    sectors: Dict[str, float] = {}
    thesis_exposure = []

    for t in theses:
        active_bets = [b for b in t.bets if b.status == "active"]
        total_pct = sum(b.position_size_pct or 0 for b in active_bets)
        sector = t.sector or "Uncategorized"
        sectors[sector] = sectors.get(sector, 0) + total_pct
        thesis_exposure.append({
            "thesis_id": t.id,
            "thesis_name": t.name,
            "sector": sector,
            "total_position_pct": total_pct,
            "active_bet_count": len(active_bets),
            "health_score": calculate_health_score(t),
        })

    return {
        "by_sector": sectors,
        "by_thesis": sorted(thesis_exposure, key=lambda x: x["total_position_pct"], reverse=True),
    }


@router.get("/correlation")
def get_correlation(db: Session = Depends(get_db)):
    """
    Returns correlation matrix for active bet tickers.
    Flags pairs with |corr| > 0.7 as crowding risk.
    """
    active_bets = (
        db.query(ActionableBet)
        .filter(
            ActionableBet.status == "active",
            ActionableBet.ticker.isnot(None),
        )
        .all()
    )

    tickers = list({b.ticker for b in active_bets if b.ticker})
    if len(tickers) < 2:
        return {"tickers": tickers, "matrix": [], "crowding_warnings": []}

    # Fetch return series
    price_series = {}
    for ticker in tickers:
        data = fetch_price_history(ticker)
        if data:
            sorted_keys = sorted(data.keys())
            prices = [data[k] for k in sorted_keys]
            if len(prices) > 1:
                returns = [
                    (prices[i] - prices[i - 1]) / prices[i - 1]
                    for i in range(1, len(prices))
                ]
                price_series[ticker] = returns

    valid_tickers = [t for t in tickers if t in price_series]
    if len(valid_tickers) < 2:
        return {"tickers": valid_tickers, "matrix": [], "crowding_warnings": []}

    # Align lengths
    min_len = min(len(price_series[t]) for t in valid_tickers)
    matrix_data = np.array([price_series[t][-min_len:] for t in valid_tickers])

    try:
        corr = np.corrcoef(matrix_data)
    except Exception as e:
        logger.error(f"Correlation error: {e}")
        return {"tickers": valid_tickers, "matrix": [], "crowding_warnings": []}

    # Build crowding warnings
    crowding = []
    n = len(valid_tickers)
    for i in range(n):
        for j in range(i + 1, n):
            val = float(corr[i][j])
            if abs(val) > 0.7:
                crowding.append({
                    "ticker_a": valid_tickers[i],
                    "ticker_b": valid_tickers[j],
                    "correlation": round(val, 3),
                    "risk_level": "high" if abs(val) > 0.85 else "medium",
                })

    matrix_list = [[round(float(corr[i][j]), 3) for j in range(n)] for i in range(n)]

    return {
        "tickers": valid_tickers,
        "matrix": matrix_list,
        "crowding_warnings": sorted(crowding, key=lambda x: abs(x["correlation"]), reverse=True),
    }


@router.get("/all-bets")
def get_all_bets(db: Session = Depends(get_db)):
    """All active bets across theses with thesis context."""
    theses = db.query(Thesis).filter(Thesis.status == "active").all()
    results = []
    for t in theses:
        for b in t.bets:
            if b.status in ("active", "watching"):
                results.append({
                    "thesis_id": t.id,
                    "thesis_name": t.name,
                    "sector": t.sector,
                    "bet_id": b.id,
                    "bet_name": b.name,
                    "ticker": b.ticker,
                    "entry_price": b.entry_price,
                    "current_price": b.current_price,
                    "target_price": b.target_price,
                    "stop_price": b.stop_price,
                    "position_size_pct": b.position_size_pct,
                    "status": b.status,
                    "pnl_pct": (
                        round((b.current_price - b.entry_price) / b.entry_price * 100, 2)
                        if b.current_price and b.entry_price
                        else None
                    ),
                })
    return results
