from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class Thesis(Base):
    __tablename__ = "theses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sector = Column(String(100))
    time_horizon = Column(String(100))
    confidence_level = Column(Integer, default=5)  # 1-10
    activation_date = Column(DateTime, default=datetime.utcnow)
    bear_case = Column(Text)
    status = Column(String(50), default="active")  # active / closed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    second_order_effects = relationship(
        "SecondOrderEffect", back_populates="thesis", cascade="all, delete-orphan"
    )
    assumptions = relationship(
        "Assumption", back_populates="thesis", cascade="all, delete-orphan"
    )
    invalidation_conditions = relationship(
        "InvalidationCondition", back_populates="thesis", cascade="all, delete-orphan"
    )
    bets = relationship(
        "ActionableBet", back_populates="thesis", cascade="all, delete-orphan"
    )
    conviction_entries = relationship(
        "ConvictionEntry",
        back_populates="thesis",
        cascade="all, delete-orphan",
        order_by="ConvictionEntry.date",
    )
    proxy_indicators = relationship(
        "ProxyIndicator", back_populates="thesis", cascade="all, delete-orphan"
    )
    catalysts = relationship(
        "Catalyst",
        back_populates="thesis",
        cascade="all, delete-orphan",
        order_by="Catalyst.event_date",
    )
    retro_scorecard = relationship(
        "RetroScorecard",
        back_populates="thesis",
        cascade="all, delete-orphan",
        uselist=False,
    )


class SecondOrderEffect(Base):
    __tablename__ = "second_order_effects"

    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id"), nullable=False)
    order_level = Column(Integer, default=2)  # 2 or 3
    description = Column(Text, nullable=False)
    sort_order = Column(Integer, default=0)

    thesis = relationship("Thesis", back_populates="second_order_effects")


class Assumption(Base):
    __tablename__ = "assumptions"

    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id"), nullable=False)
    text = Column(Text, nullable=False)
    evidence_rating = Column(String(20), default="mixed")  # strong / mixed / weak

    thesis = relationship("Thesis", back_populates="assumptions")


class InvalidationCondition(Base):
    __tablename__ = "invalidation_conditions"

    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id"), nullable=False)
    description = Column(Text, nullable=False)
    is_triggered = Column(Boolean, default=False)
    triggered_at = Column(DateTime, nullable=True)
    triggered_note = Column(Text, nullable=True)

    thesis = relationship("Thesis", back_populates="invalidation_conditions")


class ActionableBet(Base):
    __tablename__ = "actionable_bets"

    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id"), nullable=False)
    name = Column(String(255), nullable=False)
    ticker = Column(String(50))
    entry_price = Column(Float, nullable=True)
    current_price = Column(Float, nullable=True)
    target_price = Column(Float, nullable=True)
    stop_price = Column(Float, nullable=True)
    position_size_pct = Column(Float, nullable=True)
    status = Column(String(50), default="watching")  # watching / active / closed
    entry_date = Column(DateTime, nullable=True)
    close_date = Column(DateTime, nullable=True)
    close_price = Column(Float, nullable=True)
    close_pnl_pct = Column(Float, nullable=True)
    attribution_tag = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    thesis = relationship("Thesis", back_populates="bets")
    scenarios = relationship(
        "BetScenario", back_populates="bet", cascade="all, delete-orphan"
    )


class BetScenario(Base):
    __tablename__ = "bet_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    bet_id = Column(Integer, ForeignKey("actionable_bets.id"), nullable=False)
    scenario_type = Column(String(20), nullable=False)  # bull / base / bear
    expected_return_pct = Column(Float)
    probability = Column(Float)  # 0.0 - 1.0
    notes = Column(Text)
    target_price = Column(Float, nullable=True)

    bet = relationship("ActionableBet", back_populates="scenarios")


class ConvictionEntry(Base):
    __tablename__ = "conviction_entries"

    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    conviction_score = Column(Integer)  # 1-10
    note = Column(Text)
    tag = Column(String(50))  # new_data / catalyst / changed_mind / reaffirmed

    thesis = relationship("Thesis", back_populates="conviction_entries")


class ProxyIndicator(Base):
    __tablename__ = "proxy_indicators"

    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id"), nullable=False)
    ticker_or_series_id = Column(String(50), nullable=False)
    name = Column(String(255))
    source = Column(String(20), default="yfinance")  # yfinance / fred
    expected_direction = Column(String(20), default="up")  # up / down / neutral

    thesis = relationship("Thesis", back_populates="proxy_indicators")


class Catalyst(Base):
    __tablename__ = "catalysts"

    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id"), nullable=False)
    event_name = Column(String(255), nullable=False)
    event_date = Column(DateTime, nullable=False)
    event_type = Column(String(50))  # fed / election / earnings / regulatory / other
    description = Column(Text)
    outcome = Column(Text, nullable=True)
    is_past = Column(Boolean, default=False)

    thesis = relationship("Thesis", back_populates="catalysts")


class RetroScorecard(Base):
    __tablename__ = "retro_scorecards"

    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id"), nullable=False, unique=True)
    predicted_outcome = Column(Text)
    actual_outcome = Column(Text)
    timing_accuracy = Column(String(50))  # early / on_time / late / n_a
    key_hits = Column(Text)  # newline-separated
    key_misses = Column(Text)  # newline-separated
    right_thesis_wrong_instrument = Column(Boolean, default=False)
    final_pnl_pct = Column(Float, nullable=True)
    overall_grade = Column(String(5))  # A / B / C / D / F
    closed_at = Column(DateTime, default=datetime.utcnow)

    thesis = relationship("Thesis", back_populates="retro_scorecard")


class MarketDataCache(Base):
    __tablename__ = "market_data_cache"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(20))  # yfinance / fred
    identifier = Column(String(100))
    data_json = Column(Text)  # JSON {date: value}
    last_updated = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("source", "identifier", name="uq_source_id"),)


class RegimeConfig(Base):
    __tablename__ = "regime_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rules_json = Column(Text)  # JSON rules
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
