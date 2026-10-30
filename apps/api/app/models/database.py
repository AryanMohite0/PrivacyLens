import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

Base = declarative_base()

class Website(Base):
    __tablename__ = "websites"

    id = Column(String(64), primary_key=True)
    domain = Column(String(255), unique=True, index=True, nullable=False)
    root_domain = Column(String(255), index=True, nullable=False)
    first_scanned_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_scanned_at = Column(DateTime, default=datetime.datetime.utcnow)

    scans = relationship("Scan", back_populates="website", cascade="all, delete-orphan")

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(64), primary_key=True)
    website_id = Column(String(64), ForeignKey("websites.id"), nullable=False)
    url = Column(Text, nullable=False)
    overall_score = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    t_score = Column(Float, nullable=False)
    c_score = Column(Float, nullable=False)
    p_score = Column(Float, nullable=False)
    d_score = Column(Float, nullable=False)
    grade = Column(String(5), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    website = relationship("Website", back_populates="scans")
    events = relationship("NetworkEvent", back_populates="scan", cascade="all, delete-orphan")
    findings = relationship("RiskFinding", back_populates="scan", cascade="all, delete-orphan")

class NetworkEvent(Base):
    __tablename__ = "network_events"

    id = Column(String(64), primary_key=True)
    scan_id = Column(String(64), ForeignKey("scans.id"), nullable=False)
    destination = Column(Text, nullable=False)
    destination_domain = Column(String(255), index=True, nullable=False)
    resource_type = Column(String(64), nullable=False)
    is_third_party = Column(Boolean, default=True)
    tracker_match = Column(Boolean, default=False)
    tracker_category = Column(String(64), default="unknown")
    tracker_owner = Column(String(128), nullable=True)
    confidence = Column(Float, default=1.0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("Scan", back_populates="events")

class RiskFinding(Base):
    __tablename__ = "risk_findings"

    id = Column(String(64), primary_key=True)
    scan_id = Column(String(64), ForeignKey("scans.id"), nullable=False)
    category = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    observed_behavior = Column(Text, nullable=False)
    policy_claim = Column(Text, nullable=False)
    status = Column(String(32), nullable=False) # consistent, potentially_inconsistent, unverifiable
    severity = Column(String(32), nullable=False) # low, medium, high, critical
    evidence_references = Column(Text, nullable=False) # comma-separated or json string
    explanation = Column(Text, nullable=False)

    scan = relationship("Scan", back_populates="findings")

DATABASE_URL = "sqlite:///./privacylens.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
