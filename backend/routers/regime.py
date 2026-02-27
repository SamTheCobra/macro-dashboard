from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.regime_detection import detect_current_regime, regime_thesis_compat
from backend.models import Thesis

router = APIRouter(prefix="/api/regime", tags=["regime"])


@router.get("/current")
def get_current_regime():
    """Returns current macro regime with indicators snapshot."""
    return detect_current_regime()


@router.get("/compat/{thesis_id}")
def get_thesis_compat(thesis_id: int, db: Session = Depends(get_db)):
    """Returns regime compatibility for a specific thesis."""
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        from fastapi import HTTPException
        raise HTTPException(404, "Thesis not found")
    regime_data = detect_current_regime()
    compat = regime_thesis_compat(regime_data["regime"], thesis.sector or "")
    return {
        "thesis_id": thesis_id,
        "regime": regime_data["regime"],
        "compatibility": compat,
    }


@router.get("/all-compat")
def get_all_compat(db: Session = Depends(get_db)):
    """Returns regime compatibility for every active thesis."""
    regime_data = detect_current_regime()
    theses = db.query(Thesis).filter(Thesis.status == "active").all()
    result = []
    for t in theses:
        compat = regime_thesis_compat(regime_data["regime"], t.sector or "")
        result.append({
            "thesis_id": t.id,
            "thesis_name": t.name,
            "sector": t.sector,
            "compatibility": compat,
        })
    return {
        "regime": regime_data,
        "theses": result,
    }
