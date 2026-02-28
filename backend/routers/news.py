from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Thesis
from ..services.news_service import fetch_news_for_thesis

router = APIRouter(prefix="/api/theses", tags=["news"])


@router.get("/{thesis_id}/news")
def get_thesis_news(thesis_id: int, max_items: int = 10, db: Session = Depends(get_db)):
    thesis = db.get(Thesis, thesis_id)
    if not thesis:
        raise HTTPException(404, "Thesis not found")

    articles = fetch_news_for_thesis(
        thesis_name=thesis.name,
        sector=thesis.sector or "",
        max_items=max_items,
    )
    return {"thesis_id": thesis_id, "articles": articles}
