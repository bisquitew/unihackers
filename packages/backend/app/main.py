import json
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Timișoara City Hub API",
    description="Backend API for UNIHACK 2026 Timișoara City Hub (Netrom Glue, Auth0, Living Labs, Parkie)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load fallback mock data from packages/shared/mockData.json
MOCK_FILE = Path(__file__).resolve().parent.parent.parent / "shared" / "mockData.json"

def load_mock_data():
    if MOCK_FILE.exists():
        with open(MOCK_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "issues": [],
        "smells": [],
        "outages": [],
        "transit_detours": [],
        "events": [],
        "living_labs_feedback": [],
        "parking_lots": []
    }

DB_DATA = load_mock_data()

# Schemas
class FeedbackPayload(BaseModel):
    screen: str
    rating: int
    comment: Optional[str] = None

class IssueCreatePayload(BaseModel):
    title: str
    description: str
    category: str
    priority: str = "medium"
    latitude: float
    longitude: float
    address: Optional[str] = None
    image_url: Optional[str] = None

class SmellCreatePayload(BaseModel):
    odour_type: str
    intensity: int
    offensiveness: int
    latitude: float
    longitude: float
    neighbourhood: Optional[str] = None

@app.get("/")
def root():
    return {
        "project": "Timișoara City Hub",
        "status": "online",
        "hackathon": "UNIHACK 2026",
        "team": "UniHackers",
        "docs": "/docs"
    }

# 8.1 ReparaTM - Civic Issues
@app.get("/api/issues")
def get_issues():
    return DB_DATA.get("issues", [])

@app.post("/api/issues", status_code=status.HTTP_201_CREATED)
def create_issue(issue: IssueCreatePayload):
    new_issue = issue.model_dump()
    new_issue["id"] = f"iss-{len(DB_DATA.get('issues', [])) + 1:03d}"
    new_issue["status"] = "reported"
    new_issue["upvotes"] = 1
    new_issue["created_at"] = "2026-11-13T15:00:00Z"
    new_issue["reporter_id"] = "usr-citizen"
    DB_DATA.setdefault("issues", []).append(new_issue)
    return new_issue

# 8.2 MiroaseTM - Smell Map
@app.get("/api/smells")
def get_smells():
    return DB_DATA.get("smells", [])

@app.post("/api/smells", status_code=status.HTTP_201_CREATED)
def create_smell_report(smell: SmellCreatePayload):
    new_smell = smell.model_dump()
    new_smell["id"] = f"sml-{len(DB_DATA.get('smells', [])) + 1:03d}"
    new_smell["reported_at"] = "2026-11-13T15:00:00Z"
    DB_DATA.setdefault("smells", []).append(new_smell)
    return new_smell

# 8.3 Utility Outages (Colterm / Aquatim)
@app.get("/api/outages")
def get_outages():
    return DB_DATA.get("outages", [])

# 8.4 Transit Detours (Line 5, Lines 1/2, 5C)
@app.get("/api/transit/detours")
def get_transit_detours():
    return DB_DATA.get("transit_detours", [])

# 8.7 Micro-events
@app.get("/api/events")
def get_events():
    return DB_DATA.get("events", [])

# 8.13 Living Labs - Vest Ventures User Feedback
@app.get("/api/living-labs/feedback")
def get_living_labs_feedback():
    return DB_DATA.get("living_labs_feedback", [])

@app.post("/api/living-labs/feedback", status_code=status.HTTP_201_CREATED)
def submit_feedback(payload: FeedbackPayload):
    item = payload.model_dump()
    item["id"] = f"fb-{len(DB_DATA.get('living_labs_feedback', [])) + 1:03d}"
    item["created_at"] = "2026-11-13T15:00:00Z"
    DB_DATA.setdefault("living_labs_feedback", []).append(item)
    return item

# 3.2 Parkie Parking Lots
@app.get("/api/lots")
def get_parking_lots():
    return DB_DATA.get("parking_lots", [])
