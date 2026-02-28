#!/usr/bin/env python3
"""
Import theses from a JSON file into the macro-dashboard database.

Usage:
    python import_theses.py theses.json
    python import_theses.py theses.json --clear   # wipe existing theses first
"""

import json
import sys
import argparse
from datetime import datetime
from pathlib import Path

# Make sure backend imports resolve
sys.path.insert(0, str(Path(__file__).parent))

from backend.database import SessionLocal, engine, Base
from backend.models import (
    Thesis, SecondOrderEffect, Assumption, InvalidationCondition,
    ProxyIndicator, Catalyst, ActionableBet,
)

Base.metadata.create_all(bind=engine)

QUARTER_STARTS = {"Q1": "01-01", "Q2": "04-01", "Q3": "07-01", "Q4": "10-01"}


def parse_date(s: str | None) -> datetime | None:
    """Parse ISO dates and quarter strings like '2026-Q2'."""
    if not s:
        return None
    # Quarter format
    parts = s.split("-")
    if len(parts) == 2 and parts[1].startswith("Q"):
        month_day = QUARTER_STARTS.get(parts[1])
        if month_day:
            return datetime.fromisoformat(f"{parts[0]}-{month_day}")
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def map_source(indicator_type: str) -> str:
    return {"ticker": "yfinance", "fred": "fred"}.get(indicator_type, "manual")


def import_theses(path: str, clear: bool = False) -> None:
    with open(path) as f:
        data = json.load(f)

    # Support both {theses: [...]} wrapper and bare list
    theses_list = data.get("theses", data) if isinstance(data, dict) else data

    db = SessionLocal()
    try:
        if clear:
            deleted = db.query(Thesis).delete()
            db.commit()
            print(f"Cleared {deleted} existing thesis/theses.")

        imported = 0
        skipped = 0

        for item in theses_list:
            name = item["name"]

            # Skip duplicates by name
            if db.query(Thesis).filter(Thesis.name == name).first():
                print(f"  SKIP (already exists): {name}")
                skipped += 1
                continue

            # Build description: summary + thesis_statement
            desc_parts = []
            if item.get("summary"):
                desc_parts.append(item["summary"])
            if item.get("thesis_statement"):
                desc_parts.append(f"\n**Thesis:** {item['thesis_statement']}")
            if item.get("leading_indicators_to_monitor"):
                indicators = "\n".join(f"- {i}" for i in item["leading_indicators_to_monitor"])
                desc_parts.append(f"\n**Leading Indicators:**\n{indicators}")

            thesis = Thesis(
                name=name,
                description="\n\n".join(desc_parts) or None,
                sector=item.get("sector"),
                time_horizon=item.get("time_horizon"),
                confidence_level=item.get("confidence_level", 5),
                activation_date=parse_date(item.get("activation_date")),
                bear_case=item.get("competing_thesis") or item.get("bear_case"),
                status=item.get("status", "active"),
            )
            db.add(thesis)
            db.flush()

            # 2nd-order effects
            for i, text in enumerate(item.get("second_order_effects", [])):
                db.add(SecondOrderEffect(
                    thesis_id=thesis.id,
                    order_level=2,
                    description=text,
                    sort_order=i,
                ))

            # 3rd-order effects
            for i, text in enumerate(item.get("third_order_effects", [])):
                db.add(SecondOrderEffect(
                    thesis_id=thesis.id,
                    order_level=3,
                    description=text,
                    sort_order=i,
                ))

            # Assumptions
            for ass in item.get("assumptions", []):
                text = ass.get("assumption") or ass.get("text", "")
                notes = ass.get("notes")
                if notes:
                    text = f"{text} [{notes}]"
                db.add(Assumption(
                    thesis_id=thesis.id,
                    text=text,
                    evidence_rating=ass.get("evidence_rating", "mixed"),
                ))

            # Invalidation conditions
            for cond in item.get("invalidation_conditions", []):
                desc = cond if isinstance(cond, str) else cond.get("description", str(cond))
                db.add(InvalidationCondition(
                    thesis_id=thesis.id,
                    description=desc,
                ))

            # Proxy indicators
            for pi in item.get("proxy_indicators", []):
                indicator_type = pi.get("type", "ticker")
                source = map_source(indicator_type)
                # FRED indicators use series_id as the identifier
                ticker_or_id = pi.get("series_id") or pi.get("name", "")
                display_name = f"{pi.get('name', ticker_or_id)}: {pi.get('description', '')}"
                db.add(ProxyIndicator(
                    thesis_id=thesis.id,
                    ticker_or_series_id=ticker_or_id,
                    name=display_name[:255],
                    source=source,
                    expected_direction="up",
                ))

            # Catalysts
            for cat in item.get("catalyst_calendar", []):
                event_date = parse_date(cat.get("date"))
                if not event_date:
                    print(f"    WARNING: Could not parse date '{cat.get('date')}' for catalyst '{cat.get('event')}' — skipping")
                    continue
                impact = cat.get("impact", "other")
                event_type = impact if impact in ("accelerate", "mixed", "decelerate") else "other"
                notes = cat.get("notes", "")
                db.add(Catalyst(
                    thesis_id=thesis.id,
                    event_name=cat.get("event", ""),
                    event_date=event_date,
                    event_type=event_type,
                    description=notes or None,
                ))

            # Actionable bets
            for bet in item.get("actionable_bets", []):
                layer = bet.get("layer", "")
                notes = bet.get("notes", "") or ""
                if layer:
                    notes = f"[{layer}] {notes}".strip()
                db.add(ActionableBet(
                    thesis_id=thesis.id,
                    name=bet.get("name", ""),
                    ticker=bet.get("ticker"),
                    entry_price=bet.get("entry_price"),
                    target_price=bet.get("target_price"),
                    stop_price=bet.get("stop_price"),
                    position_size_pct=bet.get("position_size_pct"),
                    status=bet.get("status", "watching"),
                    notes=notes or None,
                ))

            print(f"  IMPORT: {name}")
            imported += 1

        db.commit()
        print(f"\nDone. Imported: {imported}, Skipped: {skipped}")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import theses from JSON")
    parser.add_argument("file", help="Path to theses JSON file")
    parser.add_argument("--clear", action="store_true", help="Delete all existing theses before importing")
    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"File not found: {args.file}")
        sys.exit(1)

    import_theses(args.file, clear=args.clear)
