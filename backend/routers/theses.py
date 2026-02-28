from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Thesis, SecondOrderEffect, Assumption, InvalidationCondition,
    ProxyIndicator, Catalyst, RetroScorecard
)
from ..schemas import (
    ThesisCreate, ThesisUpdate, ThesisResponse, ThesisSummary,
    CloseThesisRequest,
    SecondOrderEffectCreate, SecondOrderEffectResponse,
    AssumptionCreate, AssumptionUpdate, AssumptionResponse,
    InvalidationConditionCreate, InvalidationConditionUpdate, InvalidationConditionResponse,
    ProxyIndicatorCreate, ProxyIndicatorResponse,
    CatalystCreate, CatalystUpdate, CatalystResponse,
)
from ..services.health_score import calculate_health_score

router = APIRouter(prefix="/api/theses", tags=["theses"])


def _build_summary(thesis: Thesis) -> ThesisSummary:
    health = calculate_health_score(thesis)
    active_bets = sum(1 for b in thesis.bets if b.status == "active")
    triggered = sum(1 for c in thesis.invalidation_conditions if c.is_triggered)
    latest_conv = None
    if thesis.conviction_entries:
        latest_conv = sorted(thesis.conviction_entries, key=lambda x: x.date)[-1].conviction_score
    return ThesisSummary(
        id=thesis.id,
        name=thesis.name,
        sector=thesis.sector,
        time_horizon=thesis.time_horizon,
        confidence_level=thesis.confidence_level,
        activation_date=thesis.activation_date,
        status=thesis.status,
        health_score=health,
        active_bet_count=active_bets,
        latest_conviction=latest_conv,
        triggered_invalidations=triggered,
        created_at=thesis.created_at,
    )


def _build_response(thesis: Thesis) -> ThesisResponse:
    health = calculate_health_score(thesis)
    data = ThesisResponse.model_validate(thesis)
    data.health_score = health
    return data


# ── List & Create ─────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ThesisSummary])
def list_theses(status: str = None, db: Session = Depends(get_db)):
    q = db.query(Thesis)
    if status:
        q = q.filter(Thesis.status == status)
    theses = q.order_by(Thesis.created_at.desc()).all()
    summaries = [_build_summary(t) for t in theses]
    summaries.sort(key=lambda s: s.health_score, reverse=True)
    return summaries


@router.post("/", response_model=ThesisResponse, status_code=201)
def create_thesis(payload: ThesisCreate, db: Session = Depends(get_db)):
    thesis = Thesis(
        name=payload.name,
        description=payload.description,
        sector=payload.sector,
        time_horizon=payload.time_horizon,
        confidence_level=payload.confidence_level,
        activation_date=payload.activation_date or datetime.utcnow(),
        bear_case=payload.bear_case,
        status=payload.status,
    )
    db.add(thesis)
    db.flush()

    for eff in payload.second_order_effects or []:
        db.add(SecondOrderEffect(thesis_id=thesis.id, **eff.model_dump()))
    for ass in payload.assumptions or []:
        db.add(Assumption(thesis_id=thesis.id, **ass.model_dump()))
    for inv in payload.invalidation_conditions or []:
        db.add(InvalidationCondition(thesis_id=thesis.id, **inv.model_dump()))
    for pi in payload.proxy_indicators or []:
        db.add(ProxyIndicator(thesis_id=thesis.id, **pi.model_dump()))
    for cat in payload.catalysts or []:
        db.add(Catalyst(thesis_id=thesis.id, **cat.model_dump()))

    db.commit()
    db.refresh(thesis)
    return _build_response(thesis)


# ── Read / Update / Delete ────────────────────────────────────────────────────

@router.get("/{thesis_id}", response_model=ThesisResponse)
def get_thesis(thesis_id: int, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    return _build_response(thesis)


@router.put("/{thesis_id}", response_model=ThesisResponse)
def update_thesis(thesis_id: int, payload: ThesisUpdate, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(thesis, field, val)
    thesis.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(thesis)
    return _build_response(thesis)


@router.delete("/{thesis_id}", status_code=204)
def delete_thesis(thesis_id: int, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    db.delete(thesis)
    db.commit()


# ── Close Thesis ──────────────────────────────────────────────────────────────

@router.post("/{thesis_id}/close", response_model=ThesisResponse)
def close_thesis(thesis_id: int, payload: CloseThesisRequest, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    thesis.status = "closed"
    thesis.updated_at = datetime.utcnow()

    existing = db.query(RetroScorecard).filter(RetroScorecard.thesis_id == thesis_id).first()
    if existing:
        for field, val in payload.retro.model_dump(exclude_none=True).items():
            setattr(existing, field, val)
        existing.closed_at = datetime.utcnow()
    else:
        scorecard = RetroScorecard(thesis_id=thesis_id, **payload.retro.model_dump())
        db.add(scorecard)

    db.commit()
    db.refresh(thesis)
    return _build_response(thesis)


# ── Second Order Effects ──────────────────────────────────────────────────────

@router.get("/{thesis_id}/effects", response_model=List[SecondOrderEffectResponse])
def list_effects(thesis_id: int, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    return thesis.second_order_effects


@router.post("/{thesis_id}/effects", response_model=SecondOrderEffectResponse, status_code=201)
def add_effect(thesis_id: int, payload: SecondOrderEffectCreate, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    eff = SecondOrderEffect(thesis_id=thesis_id, **payload.model_dump())
    db.add(eff)
    db.commit()
    db.refresh(eff)
    return eff


@router.delete("/effects/{effect_id}", status_code=204)
def delete_effect(effect_id: int, db: Session = Depends(get_db)):
    eff = db.get(SecondOrderEffect, effect_id)
    if not eff:
        raise HTTPException(404, "Effect not found")
    db.delete(eff)
    db.commit()


# ── Assumptions ───────────────────────────────────────────────────────────────

@router.post("/{thesis_id}/assumptions", response_model=AssumptionResponse, status_code=201)
def add_assumption(thesis_id: int, payload: AssumptionCreate, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    a = Assumption(thesis_id=thesis_id, **payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.put("/assumptions/{assumption_id}", response_model=AssumptionResponse)
def update_assumption(assumption_id: int, payload: AssumptionUpdate, db: Session = Depends(get_db)):
    a = db.get(Assumption, assumption_id)
    if not a:
        raise HTTPException(404, "Assumption not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(a, field, val)
    db.commit()
    db.refresh(a)
    return a


@router.delete("/assumptions/{assumption_id}", status_code=204)
def delete_assumption(assumption_id: int, db: Session = Depends(get_db)):
    a = db.get(Assumption, assumption_id)
    if not a:
        raise HTTPException(404, "Assumption not found")
    db.delete(a)
    db.commit()


# ── Invalidation Conditions ───────────────────────────────────────────────────

@router.post("/{thesis_id}/invalidations", response_model=InvalidationConditionResponse, status_code=201)
def add_invalidation(thesis_id: int, payload: InvalidationConditionCreate, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    inv = InvalidationCondition(thesis_id=thesis_id, **payload.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.put("/invalidations/{inv_id}", response_model=InvalidationConditionResponse)
def update_invalidation(inv_id: int, payload: InvalidationConditionUpdate, db: Session = Depends(get_db)):
    inv = db.get(InvalidationCondition, inv_id)
    if not inv:
        raise HTTPException(404, "Invalidation condition not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(inv, field, val)
    if payload.is_triggered and not inv.triggered_at:
        inv.triggered_at = datetime.utcnow()
    db.commit()
    db.refresh(inv)
    return inv


@router.delete("/invalidations/{inv_id}", status_code=204)
def delete_invalidation(inv_id: int, db: Session = Depends(get_db)):
    inv = db.get(InvalidationCondition, inv_id)
    if not inv:
        raise HTTPException(404, "Invalidation condition not found")
    db.delete(inv)
    db.commit()


# ── Proxy Indicators ──────────────────────────────────────────────────────────

@router.post("/{thesis_id}/indicators", response_model=ProxyIndicatorResponse, status_code=201)
def add_indicator(thesis_id: int, payload: ProxyIndicatorCreate, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    pi = ProxyIndicator(thesis_id=thesis_id, **payload.model_dump())
    db.add(pi)
    db.commit()
    db.refresh(pi)
    return pi


@router.delete("/indicators/{ind_id}", status_code=204)
def delete_indicator(ind_id: int, db: Session = Depends(get_db)):
    pi = db.get(ProxyIndicator, ind_id)
    if not pi:
        raise HTTPException(404, "Indicator not found")
    db.delete(pi)
    db.commit()


# ── Catalysts ─────────────────────────────────────────────────────────────────

@router.post("/{thesis_id}/catalysts", response_model=CatalystResponse, status_code=201)
def add_catalyst(thesis_id: int, payload: CatalystCreate, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    cat = Catalyst(thesis_id=thesis_id, **payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/catalysts/{cat_id}", response_model=CatalystResponse)
def update_catalyst(cat_id: int, payload: CatalystUpdate, db: Session = Depends(get_db)):
    cat = db.get(Catalyst, cat_id)
    if not cat:
        raise HTTPException(404, "Catalyst not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(cat, field, val)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/catalysts/{cat_id}", status_code=204)
def delete_catalyst(cat_id: int, db: Session = Depends(get_db)):
    cat = db.get(Catalyst, cat_id)
    if not cat:
        raise HTTPException(404, "Catalyst not found")
    db.delete(cat)
    db.commit()
