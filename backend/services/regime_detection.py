"""
Macro Regime Detection.

Uses a rule-based engine over FRED + yfinance data to classify the current
macro environment into one of: risk_on, risk_off, stagflation, reflation,
tightening, easing.

Rules are evaluated in priority order; first match wins.
"""

import logging
from typing import Dict, Optional, Tuple

from backend.services.market_data import get_latest_value, get_30d_return

logger = logging.getLogger(__name__)

REGIME_LABELS = {
    "risk_on": "Risk-On",
    "risk_off": "Risk-Off",
    "stagflation": "Stagflation",
    "reflation": "Reflation",
    "tightening": "Tightening",
    "easing": "Easing",
    "neutral": "Neutral",
}

REGIME_COLORS = {
    "risk_on": "#22c55e",
    "risk_off": "#ef4444",
    "stagflation": "#f59e0b",
    "reflation": "#f97316",
    "tightening": "#8b5cf6",
    "easing": "#06b6d4",
    "neutral": "#6b7280",
}


def _safe(val: Optional[float], default: float = 0.0) -> float:
    return val if val is not None else default


def detect_current_regime() -> Dict:
    """
    Returns:
        {
            "regime": str,
            "label": str,
            "color": str,
            "confidence": str,          # high / medium / low
            "indicators": {key: value},
            "description": str,
        }
    """
    indicators = _collect_indicators()

    regime, confidence, description = _apply_rules(indicators)

    return {
        "regime": regime,
        "label": REGIME_LABELS.get(regime, regime),
        "color": REGIME_COLORS.get(regime, "#6b7280"),
        "confidence": confidence,
        "description": description,
        "indicators": indicators,
    }


def _collect_indicators() -> Dict:
    fed_rate = get_latest_value("fred", "FEDFUNDS")
    cpi = get_latest_value("fred", "CPIAUCSL")
    ten_year = get_latest_value("fred", "GS10")
    two_year = get_latest_value("fred", "GS2")
    spread_10_2 = get_latest_value("fred", "T10Y2Y")
    hy_spread = get_latest_value("fred", "BAMLH0A0HYM2")
    unemployment = get_latest_value("fred", "UNRATE")
    m2 = get_latest_value("fred", "M2SL")

    spy_30d = get_30d_return("yfinance", "SPY")
    vix = get_latest_value("yfinance", "^VIX")
    tlt_30d = get_30d_return("yfinance", "TLT")
    hyg_30d = get_30d_return("yfinance", "HYG")
    gld_30d = get_30d_return("yfinance", "GLD")

    fed_30d = get_30d_return("fred", "FEDFUNDS")
    cpi_trend = get_30d_return("fred", "CPIAUCSL")

    return {
        "fed_rate": fed_rate,
        "cpi": cpi,
        "ten_year": ten_year,
        "two_year": two_year,
        "spread_10_2": spread_10_2,
        "hy_spread": hy_spread,
        "unemployment": unemployment,
        "m2": m2,
        "spy_30d": spy_30d,
        "vix": vix,
        "tlt_30d": tlt_30d,
        "hyg_30d": hyg_30d,
        "gld_30d": gld_30d,
        "fed_30d": fed_30d,
        "cpi_trend": cpi_trend,
    }


def _apply_rules(ind: Dict) -> Tuple[str, str, str]:
    fed_rate = _safe(ind["fed_rate"])
    cpi = _safe(ind["cpi"])
    vix = _safe(ind["vix"], 20)
    spy_30d = _safe(ind["spy_30d"])
    hy_spread = _safe(ind["hy_spread"], 4.0)
    fed_30d = _safe(ind["fed_30d"])
    cpi_trend = _safe(ind["cpi_trend"])
    hyg_30d = _safe(ind["hyg_30d"])

    # Priority 1: Stagflation
    # High CPI + weak equities + rising unemployment
    if cpi > 5.0 and spy_30d < -3.0:
        return (
            "stagflation",
            "medium",
            f"CPI at {cpi:.1f}% with equity weakness — stagflation signals present.",
        )

    # Priority 2: Tightening
    # Fed actively hiking or real rates rising sharply
    if fed_30d > 0.05 or (fed_rate > 4.0 and spy_30d < 0 and hy_spread > 5.0):
        return (
            "tightening",
            "high" if fed_30d > 0.1 else "medium",
            f"Fed Funds at {fed_rate:.2f}% with policy tightening underway.",
        )

    # Priority 3: Easing
    # Fed cutting or recently cut
    if fed_30d < -0.05 or (fed_rate < 2.0 and spy_30d > 2.0):
        return (
            "easing",
            "high" if fed_30d < -0.1 else "medium",
            f"Monetary easing in progress — Fed Funds at {fed_rate:.2f}%.",
        )

    # Priority 4: Risk-Off
    # High VIX, equity weakness, credit spreads widening
    if vix > 25 and spy_30d < -5.0:
        return (
            "risk_off",
            "high",
            f"Risk-off: VIX at {vix:.0f}, equities down {spy_30d:.1f}% over 30d.",
        )
    if hy_spread > 6.0 and hyg_30d < -2.0:
        return (
            "risk_off",
            "medium",
            f"Credit stress: HY spread at {hy_spread:.1f}%, HYG down {hyg_30d:.1f}%.",
        )

    # Priority 5: Reflation
    # Rising CPI from a low base + positive equity returns
    if cpi_trend > 0.5 and spy_30d > 3.0 and cpi < 5.0:
        return (
            "reflation",
            "medium",
            f"Reflation: rising prices ({cpi:.1f}% CPI) + equity strength.",
        )

    # Priority 6: Risk-On
    # Low VIX, equities up, credit tight
    if vix < 18 and spy_30d > 3.0 and hy_spread < 4.0:
        return (
            "risk_on",
            "high",
            f"Risk-on: VIX {vix:.0f}, SPY +{spy_30d:.1f}%, HY spreads benign.",
        )
    if spy_30d > 2.0 and vix < 22:
        return (
            "risk_on",
            "medium",
            f"Mild risk-on: equities up {spy_30d:.1f}% over 30d.",
        )

    return (
        "neutral",
        "low",
        "Mixed signals — no dominant macro regime detected.",
    )


def regime_thesis_compat(regime: str, thesis_sector: str) -> str:
    """Return 'favored', 'challenged', or 'neutral' for a thesis given current regime."""
    sector = (thesis_sector or "").lower()

    favored_map = {
        "risk_on": ["technology", "growth", "equities", "emerging markets", "crypto"],
        "risk_off": ["bonds", "gold", "commodities", "defensive", "healthcare", "utilities"],
        "stagflation": ["commodities", "energy", "gold", "hard assets", "real assets"],
        "reflation": ["commodities", "energy", "financials", "value", "real assets"],
        "tightening": ["financials", "banks", "fixed income", "short duration"],
        "easing": ["growth", "technology", "real estate", "bonds", "emerging markets"],
    }
    challenged_map = {
        "risk_on": ["bonds", "gold", "defensive"],
        "risk_off": ["technology", "growth", "emerging markets", "crypto"],
        "stagflation": ["bonds", "growth", "technology"],
        "reflation": ["bonds", "growth", "technology"],
        "tightening": ["growth", "technology", "real estate", "long duration"],
        "easing": ["financials", "banks", "short duration"],
    }

    for keyword in favored_map.get(regime, []):
        if keyword in sector:
            return "favored"
    for keyword in challenged_map.get(regime, []):
        if keyword in sector:
            return "challenged"
    return "neutral"
