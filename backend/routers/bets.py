from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import ActionableBet, BetScenario, Thesis
from backend.schemas import (
    ActionableBetCreate, ActionableBetUpdate, ActionableBetResponse,
    BetScenarioCreate, BetScenarioResponse,
)

router = APIRouter(prefix="/api", tags=["bets"])


@router.get("/theses/{thesis_id}/bets", response_model=List[ActionableBetResponse])
def list_bets(thesis_id: int, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    return thesis.bets


@router.post("/theses/{thesis_id}/bets", response_model=ActionableBetResponse, status_code=201)
def create_bet(thesis_id: int, payload: ActionableBetCreate, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")

    scenarios_data = payload.scenarios or []
    bet_data = payload.model_dump(exclude={"scenarios"})
    bet = ActionableBet(thesis_id=thesis_id, **bet_data)
    db.add(bet)
    db.flush()

    for sc in scenarios_data:
        db.add(BetScenario(bet_id=bet.id, **sc.model_dump()))

    db.commit()
    db.refresh(bet)
    return bet


@router.get("/bets/{bet_id}", response_model=ActionableBetResponse)
def get_bet(bet_id: int, db: Session = Depends(get_db)):
    bet = db.get(ActionableBet, bet_id)
    if not bet:
        raise HTTPException(404, "Bet not found")
    return bet


@router.put("/bets/{bet_id}", response_model=ActionableBetResponse)
def update_bet(bet_id: int, payload: ActionableBetUpdate, db: Session = Depends(get_db)):
    bet = db.get(ActionableBet, bet_id)
    if not bet:
        raise HTTPException(404, "Bet not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(bet, field, val)
    db.commit()
    db.refresh(bet)
    return bet


@router.delete("/bets/{bet_id}", status_code=204)
def delete_bet(bet_id: int, db: Session = Depends(get_db)):
    bet = db.get(ActionableBet, bet_id)
    if not bet:
        raise HTTPException(404, "Bet not found")
    db.delete(bet)
    db.commit()


# ── Scenarios ─────────────────────────────────────────────────────────────────

@router.post("/bets/{bet_id}/scenarios", response_model=BetScenarioResponse, status_code=201)
def add_scenario(bet_id: int, payload: BetScenarioCreate, db: Session = Depends(get_db)):
    bet = db.get(ActionableBet, bet_id)
    if not bet:
        raise HTTPException(404, "Bet not found")
    sc = BetScenario(bet_id=bet_id, **payload.model_dump())
    db.add(sc)
    db.commit()
    db.refresh(sc)
    return sc


@router.delete("/scenarios/{sc_id}", status_code=204)
def delete_scenario(sc_id: int, db: Session = Depends(get_db)):
    sc = db.get(BetScenario, sc_id)
    if not sc:
        raise HTTPException(404, "Scenario not found")
    db.delete(sc)
    db.commit()
