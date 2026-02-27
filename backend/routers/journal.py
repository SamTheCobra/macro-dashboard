from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import ConvictionEntry, Thesis
from backend.schemas import ConvictionEntryCreate, ConvictionEntryResponse

router = APIRouter(prefix="/api/theses", tags=["journal"])


@router.get("/{thesis_id}/journal", response_model=List[ConvictionEntryResponse])
def list_entries(thesis_id: int, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    return sorted(thesis.conviction_entries, key=lambda e: e.date)


@router.post("/{thesis_id}/journal", response_model=ConvictionEntryResponse, status_code=201)
def add_entry(thesis_id: int, payload: ConvictionEntryCreate, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")
    entry = ConvictionEntry(thesis_id=thesis_id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{thesis_id}/journal/{entry_id}", status_code=204)
def delete_entry(thesis_id: int, entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(ConvictionEntry, entry_id)
    if not entry or entry.thesis_id != thesis_id:
        raise HTTPException(404, "Journal entry not found")
    db.delete(entry)
    db.commit()
