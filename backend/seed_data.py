"""
Seeds the database with example theses from theses_seed.json
if the database is empty.
"""

import json
import logging
from datetime import datetime
from pathlib import Path

from .database import SessionLocal
from .models import (
    Thesis, SecondOrderEffect, Assumption, InvalidationCondition,
    ProxyIndicator, Catalyst, ActionableBet, BetScenario, ConvictionEntry,
)

logger = logging.getLogger(__name__)

SEED_FILE = Path(__file__).parent / "seed" / "theses_seed.json"


def _parse_dt(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return None


def seed_if_empty():
    db = SessionLocal()
    try:
        count = db.query(Thesis).count()
        if count > 0:
            logger.info(f"Database already has {count} theses — skipping seed.")
            return

        logger.info("Database empty — loading seed theses...")
        with open(SEED_FILE, "r") as f:
            seed_data = json.load(f)

        for item in seed_data:
            thesis = Thesis(
                name=item["name"],
                description=item.get("description"),
                sector=item.get("sector"),
                time_horizon=item.get("time_horizon"),
                confidence_level=item.get("confidence_level", 5),
                activation_date=_parse_dt(item.get("activation_date")),
                bear_case=item.get("bear_case"),
                status="active",
            )
            db.add(thesis)
            db.flush()

            for eff in item.get("second_order_effects", []):
                db.add(SecondOrderEffect(
                    thesis_id=thesis.id,
                    order_level=eff.get("order_level", 2),
                    description=eff["description"],
                    sort_order=eff.get("sort_order", 0),
                ))

            for ass in item.get("assumptions", []):
                db.add(Assumption(
                    thesis_id=thesis.id,
                    text=ass["text"],
                    evidence_rating=ass.get("evidence_rating", "mixed"),
                ))

            for inv in item.get("invalidation_conditions", []):
                db.add(InvalidationCondition(
                    thesis_id=thesis.id,
                    description=inv["description"],
                ))

            for pi in item.get("proxy_indicators", []):
                db.add(ProxyIndicator(
                    thesis_id=thesis.id,
                    ticker_or_series_id=pi["ticker_or_series_id"],
                    name=pi.get("name", pi["ticker_or_series_id"]),
                    source=pi.get("source", "yfinance"),
                    expected_direction=pi.get("expected_direction", "up"),
                ))

            for cat in item.get("catalysts", []):
                db.add(Catalyst(
                    thesis_id=thesis.id,
                    event_name=cat["event_name"],
                    event_date=_parse_dt(cat["event_date"]),
                    event_type=cat.get("event_type", "other"),
                    description=cat.get("description"),
                ))

            for bet_data in item.get("bets", []):
                scenarios = bet_data.pop("scenarios", [])
                bet = ActionableBet(
                    thesis_id=thesis.id,
                    name=bet_data["name"],
                    ticker=bet_data.get("ticker"),
                    entry_price=bet_data.get("entry_price"),
                    target_price=bet_data.get("target_price"),
                    stop_price=bet_data.get("stop_price"),
                    position_size_pct=bet_data.get("position_size_pct"),
                    status=bet_data.get("status", "watching"),
                    entry_date=_parse_dt(bet_data.get("entry_date")),
                    notes=bet_data.get("notes"),
                )
                db.add(bet)
                db.flush()
                for sc in scenarios:
                    db.add(BetScenario(
                        bet_id=bet.id,
                        scenario_type=sc["scenario_type"],
                        expected_return_pct=sc["expected_return_pct"],
                        probability=sc["probability"],
                        notes=sc.get("notes"),
                        target_price=sc.get("target_price"),
                    ))

            for entry in item.get("conviction_entries", []):
                db.add(ConvictionEntry(
                    thesis_id=thesis.id,
                    date=_parse_dt(entry["date"]),
                    conviction_score=entry["conviction_score"],
                    note=entry["note"],
                    tag=entry["tag"],
                ))

        db.commit()
        logger.info(f"Seeded {len(seed_data)} theses successfully.")

    except Exception as e:
        logger.error(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()
