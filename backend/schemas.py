from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────────────

class EvidenceRating(str, Enum):
    strong = "strong"
    mixed = "mixed"
    weak = "weak"


class BetStatus(str, Enum):
    watching = "watching"
    active = "active"
    closed = "closed"


class ScenarioType(str, Enum):
    bull = "bull"
    base = "base"
    bear = "bear"


class ConvictionTag(str, Enum):
    new_data = "new_data"
    catalyst = "catalyst"
    changed_mind = "changed_mind"
    reaffirmed = "reaffirmed"


class IndicatorSource(str, Enum):
    yfinance = "yfinance"
    fred = "fred"


class ExpectedDirection(str, Enum):
    up = "up"
    down = "down"
    neutral = "neutral"


class CatalystType(str, Enum):
    fed = "fed"
    election = "election"
    earnings = "earnings"
    regulatory = "regulatory"
    other = "other"


class ThesisStatus(str, Enum):
    active = "active"
    closed = "closed"


class TimingAccuracy(str, Enum):
    early = "early"
    on_time = "on_time"
    late = "late"
    n_a = "n_a"


class AttributionTag(str, Enum):
    right_thesis_wrong_instrument = "right_thesis_wrong_instrument"
    wrong_timing = "wrong_timing"
    wrong_thesis = "wrong_thesis"
    thesis_played_out = "thesis_played_out"


# ── Second Order Effects ──────────────────────────────────────────────────────

class SecondOrderEffectBase(BaseModel):
    order_level: int = Field(2, ge=2, le=3)
    description: str
    sort_order: int = 0


class SecondOrderEffectCreate(SecondOrderEffectBase):
    pass


class SecondOrderEffectResponse(SecondOrderEffectBase):
    id: int
    thesis_id: int

    class Config:
        from_attributes = True


# ── Assumptions ───────────────────────────────────────────────────────────────

class AssumptionBase(BaseModel):
    text: str
    evidence_rating: EvidenceRating = EvidenceRating.mixed


class AssumptionCreate(AssumptionBase):
    pass


class AssumptionUpdate(BaseModel):
    text: Optional[str] = None
    evidence_rating: Optional[EvidenceRating] = None


class AssumptionResponse(AssumptionBase):
    id: int
    thesis_id: int

    class Config:
        from_attributes = True


# ── Invalidation Conditions ───────────────────────────────────────────────────

class InvalidationConditionBase(BaseModel):
    description: str


class InvalidationConditionCreate(InvalidationConditionBase):
    pass


class InvalidationConditionUpdate(BaseModel):
    description: Optional[str] = None
    is_triggered: Optional[bool] = None
    triggered_note: Optional[str] = None


class InvalidationConditionResponse(InvalidationConditionBase):
    id: int
    thesis_id: int
    is_triggered: bool
    triggered_at: Optional[datetime]
    triggered_note: Optional[str]

    class Config:
        from_attributes = True


# ── Proxy Indicators ──────────────────────────────────────────────────────────

class ProxyIndicatorBase(BaseModel):
    ticker_or_series_id: str
    name: str
    source: IndicatorSource = IndicatorSource.yfinance
    expected_direction: ExpectedDirection = ExpectedDirection.up


class ProxyIndicatorCreate(ProxyIndicatorBase):
    pass


class ProxyIndicatorResponse(ProxyIndicatorBase):
    id: int
    thesis_id: int

    class Config:
        from_attributes = True


# ── Catalysts ─────────────────────────────────────────────────────────────────

class CatalystBase(BaseModel):
    event_name: str
    event_date: datetime
    event_type: CatalystType = CatalystType.other
    description: Optional[str] = None


class CatalystCreate(CatalystBase):
    pass


class CatalystUpdate(BaseModel):
    event_name: Optional[str] = None
    event_date: Optional[datetime] = None
    event_type: Optional[CatalystType] = None
    description: Optional[str] = None
    outcome: Optional[str] = None
    is_past: Optional[bool] = None


class CatalystResponse(CatalystBase):
    id: int
    thesis_id: int
    outcome: Optional[str]
    is_past: bool

    class Config:
        from_attributes = True


# ── Bet Scenarios ─────────────────────────────────────────────────────────────

class BetScenarioBase(BaseModel):
    scenario_type: ScenarioType
    expected_return_pct: float
    probability: float = Field(ge=0.0, le=1.0)
    notes: Optional[str] = None
    target_price: Optional[float] = None


class BetScenarioCreate(BetScenarioBase):
    pass


class BetScenarioResponse(BetScenarioBase):
    id: int
    bet_id: int

    class Config:
        from_attributes = True


# ── Actionable Bets ───────────────────────────────────────────────────────────

class ActionableBetBase(BaseModel):
    name: str
    ticker: Optional[str] = None
    entry_price: Optional[float] = None
    target_price: Optional[float] = None
    stop_price: Optional[float] = None
    position_size_pct: Optional[float] = None
    status: BetStatus = BetStatus.watching
    entry_date: Optional[datetime] = None
    notes: Optional[str] = None


class ActionableBetCreate(ActionableBetBase):
    scenarios: Optional[List[BetScenarioCreate]] = []


class ActionableBetUpdate(BaseModel):
    name: Optional[str] = None
    ticker: Optional[str] = None
    entry_price: Optional[float] = None
    current_price: Optional[float] = None
    target_price: Optional[float] = None
    stop_price: Optional[float] = None
    position_size_pct: Optional[float] = None
    status: Optional[BetStatus] = None
    entry_date: Optional[datetime] = None
    close_date: Optional[datetime] = None
    close_price: Optional[float] = None
    close_pnl_pct: Optional[float] = None
    attribution_tag: Optional[AttributionTag] = None
    notes: Optional[str] = None


class ActionableBetResponse(ActionableBetBase):
    id: int
    thesis_id: int
    current_price: Optional[float]
    close_date: Optional[datetime]
    close_price: Optional[float]
    close_pnl_pct: Optional[float]
    attribution_tag: Optional[str]
    created_at: datetime
    scenarios: List[BetScenarioResponse] = []

    class Config:
        from_attributes = True


# ── Conviction Journal ────────────────────────────────────────────────────────

class ConvictionEntryBase(BaseModel):
    date: datetime
    conviction_score: int = Field(ge=1, le=10)
    note: str
    tag: ConvictionTag


class ConvictionEntryCreate(ConvictionEntryBase):
    pass


class ConvictionEntryResponse(ConvictionEntryBase):
    id: int
    thesis_id: int

    class Config:
        from_attributes = True


# ── Retro Scorecard ───────────────────────────────────────────────────────────

class RetroScorecardBase(BaseModel):
    predicted_outcome: Optional[str] = None
    actual_outcome: Optional[str] = None
    timing_accuracy: Optional[TimingAccuracy] = None
    key_hits: Optional[str] = None
    key_misses: Optional[str] = None
    right_thesis_wrong_instrument: bool = False
    final_pnl_pct: Optional[float] = None
    overall_grade: Optional[str] = None


class RetroScorecardCreate(RetroScorecardBase):
    pass


class RetroScorecardResponse(RetroScorecardBase):
    id: int
    thesis_id: int
    closed_at: datetime

    class Config:
        from_attributes = True


# ── Thesis ────────────────────────────────────────────────────────────────────

class ThesisBase(BaseModel):
    name: str
    description: Optional[str] = None
    sector: Optional[str] = None
    time_horizon: Optional[str] = None
    confidence_level: int = Field(5, ge=1, le=10)
    activation_date: Optional[datetime] = None
    bear_case: Optional[str] = None
    status: ThesisStatus = ThesisStatus.active


class ThesisCreate(ThesisBase):
    second_order_effects: Optional[List[SecondOrderEffectCreate]] = []
    assumptions: Optional[List[AssumptionCreate]] = []
    invalidation_conditions: Optional[List[InvalidationConditionCreate]] = []
    proxy_indicators: Optional[List[ProxyIndicatorCreate]] = []
    catalysts: Optional[List[CatalystCreate]] = []


class ThesisUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[str] = None
    time_horizon: Optional[str] = None
    confidence_level: Optional[int] = Field(None, ge=1, le=10)
    activation_date: Optional[datetime] = None
    bear_case: Optional[str] = None
    status: Optional[ThesisStatus] = None


class ThesisSummary(BaseModel):
    id: int
    name: str
    sector: Optional[str]
    time_horizon: Optional[str]
    confidence_level: int
    activation_date: Optional[datetime]
    status: str
    health_score: float = 0.0
    active_bet_count: int
    latest_conviction: Optional[int]
    triggered_invalidations: int
    created_at: datetime

    class Config:
        from_attributes = True


class ThesisResponse(ThesisBase):
    id: int
    health_score: float = 0.0
    created_at: datetime
    updated_at: datetime
    second_order_effects: List[SecondOrderEffectResponse] = []
    assumptions: List[AssumptionResponse] = []
    invalidation_conditions: List[InvalidationConditionResponse] = []
    bets: List[ActionableBetResponse] = []
    conviction_entries: List[ConvictionEntryResponse] = []
    proxy_indicators: List[ProxyIndicatorResponse] = []
    catalysts: List[CatalystResponse] = []
    retro_scorecard: Optional[RetroScorecardResponse] = None

    class Config:
        from_attributes = True


# ── Close Thesis ──────────────────────────────────────────────────────────────

class CloseThesisRequest(BaseModel):
    retro: RetroScorecardCreate


# ── Portfolio ─────────────────────────────────────────────────────────────────

class PortfolioOverview(BaseModel):
    total_theses: int
    active_theses: int
    closed_theses: int
    total_active_bets: int
    total_watching_bets: int
    avg_health_score: float
    regime: Optional[str]
    regime_confidence: Optional[str]
