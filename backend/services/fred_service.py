"""
FRED API service.
API key loaded from FRED_API_KEY env var.
Falls back gracefully when key is missing.
"""

import logging
import os
from typing import Dict

import requests

logger = logging.getLogger(__name__)

FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"

SERIES_LABELS = {
    "FEDFUNDS": "Fed Funds Rate",
    "CPIAUCSL": "CPI (YoY %)",
    "GS10": "10Y Treasury Yield",
    "GS2": "2Y Treasury Yield",
    "T10Y2Y": "10Y-2Y Spread",
    "BAMLH0A0HYM2": "HY Credit Spread (OAS)",
    "M2SL": "M2 Money Supply",
    "UNRATE": "Unemployment Rate",
    "GDP": "Real GDP",
    "DPCCRV1Q225SBEA": "PCE",
    "VIXCLS": "VIX (FRED)",
    "DGS30": "30Y Treasury Yield",
}


def fetch_fred_series(series_id: str, start: str = "2015-01-01") -> Dict[str, float]:
    """Return {date: value} from FRED. Returns {} if key missing or request fails."""
    api_key = os.getenv("FRED_API_KEY", "")
    if not api_key:
        logger.warning(f"FRED_API_KEY not set — skipping {series_id}")
        return {}

    try:
        resp = requests.get(
            FRED_BASE,
            params={
                "series_id": series_id,
                "api_key": api_key,
                "file_type": "json",
                "observation_start": start,
                "sort_order": "asc",
            },
            timeout=15,
        )
        resp.raise_for_status()
        observations = resp.json().get("observations", [])
        result = {}
        for obs in observations:
            if obs["value"] not in (".", ""):
                try:
                    result[obs["date"]] = float(obs["value"])
                except ValueError:
                    pass
        return result
    except Exception as e:
        logger.error(f"FRED fetch error [{series_id}]: {e}")
        return {}


def get_fred_label(series_id: str) -> str:
    return SERIES_LABELS.get(series_id, series_id)
