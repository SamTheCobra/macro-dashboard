"""
News service.
- If NEWS_API_KEY is set: uses newsapi.org
- Otherwise: falls back to Google News RSS via feedparser
Provides simple keyword-based sentiment tagging.
"""

import logging
import os
from typing import List, Dict

import requests
import feedparser

logger = logging.getLogger(__name__)

POSITIVE_WORDS = {
    "surge", "rally", "rise", "gain", "beat", "exceed", "strong", "bull",
    "growth", "accelerate", "outperform", "breakout", "record", "recovery",
    "boom", "upgrade", "inflow", "optimism", "robust",
}
NEGATIVE_WORDS = {
    "fall", "drop", "crash", "decline", "miss", "weak", "bear", "collapse",
    "risk", "warning", "slowdown", "recession", "inflation", "crisis",
    "downgrade", "outflow", "concern", "volatility", "uncertainty",
}


def _sentiment(headline: str) -> str:
    lower = headline.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in lower)
    neg = sum(1 for w in NEGATIVE_WORDS if w in lower)
    if pos > neg:
        return "positive"
    if neg > pos:
        return "negative"
    return "neutral"


def fetch_newsapi(keywords: List[str], max_items: int = 10) -> List[Dict]:
    api_key = os.getenv("NEWS_API_KEY", "")
    if not api_key:
        return []
    query = " OR ".join(f'"{k}"' for k in keywords[:5])
    try:
        resp = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": query,
                "apiKey": api_key,
                "pageSize": max_items,
                "sortBy": "publishedAt",
                "language": "en",
            },
            timeout=10,
        )
        resp.raise_for_status()
        articles = resp.json().get("articles", [])
        return [
            {
                "title": a["title"],
                "url": a["url"],
                "published": a.get("publishedAt", ""),
                "source": a.get("source", {}).get("name", ""),
                "summary": (a.get("description") or "")[:300],
                "sentiment": _sentiment(a["title"]),
            }
            for a in articles
            if a.get("title")
        ]
    except Exception as e:
        logger.error(f"NewsAPI error: {e}")
        return []


def fetch_rss(keywords: List[str], max_items: int = 10) -> List[Dict]:
    query = "+".join(k.replace(" ", "+") for k in keywords[:3])
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    try:
        feed = feedparser.parse(url)
        results = []
        for entry in feed.entries[:max_items]:
            title = entry.get("title", "")
            results.append(
                {
                    "title": title,
                    "url": entry.get("link", ""),
                    "published": entry.get("published", ""),
                    "source": entry.get("source", {}).get("title", "Google News"),
                    "summary": entry.get("summary", "")[:300],
                    "sentiment": _sentiment(title),
                }
            )
        return results
    except Exception as e:
        logger.error(f"RSS fetch error: {e}")
        return []


def fetch_news_for_thesis(thesis_name: str, sector: str, max_items: int = 10) -> List[Dict]:
    """Return combined news from NewsAPI (if key set) or RSS fallback."""
    keywords = [thesis_name, sector]
    # Try NewsAPI first
    articles = fetch_newsapi(keywords, max_items)
    if articles:
        return articles
    # Fallback to RSS
    return fetch_rss(keywords, max_items)
