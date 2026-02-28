"""
Thesis Health Score calculator.

Score (0–100) is composed of four components:
  1. Assumption evidence quality         — 25 pts
  2. Invalidation conditions not fired   — 30 pts
  3. Conviction log trajectory           — 15 pts
  4. Proxy indicators trending correctly — 30 pts
"""

import json
import logging
from typing import TYPE_CHECKING

from ..database import SessionLocal
from ..models import MarketDataCache

if TYPE_CHECKING:
    from ..models import Thesis

logger = logging.getLogger(__name__)

RATING_WEIGHT = {"strong": 1.0, "mixed": 0.5, "weak": 0.1}


def _assumption_score(thesis) -> float:
    """Max 25 pts."""
    if not thesis.assumptions:
        return 12.5  # neutral
    avg = sum(RATING_WEIGHT.get(a.evidence_rating, 0.5) for a in thesis.assumptions) / len(
        thesis.assumptions
    )
    return avg * 25


def _invalidation_score(thesis) -> float:
    """Max 30 pts."""
    conditions = thesis.invalidation_conditions
    if not conditions:
        return 30.0  # no conditions defined → full credit
    not_triggered = sum(1 for c in conditions if not c.is_triggered)
    return (not_triggered / len(conditions)) * 30


def _conviction_score(thesis) -> float:
    """Max 15 pts. Based on trajectory of last 5 conviction entries."""
    entries = sorted(thesis.conviction_entries, key=lambda x: x.date)
    if not entries:
        return 7.5  # neutral
    if len(entries) == 1:
        return (entries[0].conviction_score / 10) * 15

    recent = entries[-5:]
    first_conv = recent[0].conviction_score
    last_conv = recent[-1].conviction_score
    current_normalized = last_conv / 10
    trend = last_conv - first_conv

    if trend > 0:
        return 15.0
    elif trend == 0:
        return current_normalized * 12
    else:
        # Penalise declining conviction, but floor at current level
        return max(0, current_normalized * 15 + trend)


def _proxy_score(thesis) -> float:
    """Max 30 pts. Checks 30-day price trend vs expected direction."""
    indicators = thesis.proxy_indicators
    if not indicators:
        return 15.0  # neutral

    db = SessionLocal()
    try:
        correct = 0.0
        for ind in indicators:
            if ind.expected_direction == "neutral":
                correct += 1.0
                continue

            record = (
                db.query(MarketDataCache)
                .filter(
                    MarketDataCache.source == ind.source,
                    MarketDataCache.identifier == ind.ticker_or_series_id,
                )
                .first()
            )

            if not record or not record.data_json:
                correct += 0.5  # no data → neutral
                continue

            data = json.loads(record.data_json)
            if len(data) < 2:
                correct += 0.5
                continue

            sorted_keys = sorted(data.keys())
            # 30-day window
            if len(sorted_keys) >= 22:
                v_now = data[sorted_keys[-1]]
                v_old = data[sorted_keys[-22]]
            else:
                v_now = data[sorted_keys[-1]]
                v_old = data[sorted_keys[0]]

            trend_up = v_now > v_old

            if ind.expected_direction == "up" and trend_up:
                correct += 1.0
            elif ind.expected_direction == "down" and not trend_up:
                correct += 1.0
            else:
                correct += 0.0

        return (correct / len(indicators)) * 30

    except Exception as e:
        logger.error(f"proxy_score error: {e}")
        return 15.0
    finally:
        db.close()


def calculate_health_score(thesis) -> float:
    """Return composite health score 0–100."""
    try:
        s1 = _assumption_score(thesis)
        s2 = _invalidation_score(thesis)
        s3 = _conviction_score(thesis)
        s4 = _proxy_score(thesis)
        total = s1 + s2 + s3 + s4
        return round(min(100.0, max(0.0, total)), 1)
    except Exception as e:
        logger.error(f"health_score error for thesis {thesis.id}: {e}")
        return 50.0
