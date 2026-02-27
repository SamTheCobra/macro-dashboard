from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from backend.services.market_data import (
    fetch_price_history,
    fetch_fred_history,
    refresh_all_indicators,
    get_latest_value,
    get_30d_return,
)

router = APIRouter(prefix="/api/market-data", tags=["market-data"])


class RefreshResponse(BaseModel):
    status: str
    message: str


@router.get("/price/{ticker}")
def get_price_history(ticker: str, force: bool = False) -> Dict[str, float]:
    data = fetch_price_history(ticker.upper(), force_refresh=force)
    if not data:
        raise HTTPException(404, f"No data available for ticker: {ticker}")
    return data


@router.get("/fred/{series_id}")
def get_fred_history(series_id: str, force: bool = False) -> Dict[str, float]:
    data = fetch_fred_history(series_id.upper(), force_refresh=force)
    if not data:
        raise HTTPException(404, f"No FRED data for series: {series_id}. Check FRED_API_KEY.")
    return data


@router.get("/latest")
def get_latest(source: str, identifier: str) -> Dict:
    value = get_latest_value(source, identifier)
    change_30d = get_30d_return(source, identifier)
    return {
        "source": source,
        "identifier": identifier,
        "latest_value": value,
        "change_30d_pct": change_30d,
    }


@router.post("/refresh")
def trigger_refresh(background_tasks: BackgroundTasks) -> RefreshResponse:
    background_tasks.add_task(refresh_all_indicators)
    return RefreshResponse(
        status="accepted",
        message="Market data refresh triggered in background.",
    )
