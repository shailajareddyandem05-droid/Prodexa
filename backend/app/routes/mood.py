from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config.firebase import db
from app.middleware.auth import get_current_user

router = APIRouter()


class MoodCreate(BaseModel):
    mood: str
    stress: int


@router.post("/", status_code=201)
async def log_mood(body: MoodCreate, user: dict = Depends(get_current_user)):
    """POST /api/mood — Log mood + stress for today."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    mood_data = {
        "mood": body.mood,
        "stress": body.stress,
        "date": today,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    # Use date as document ID so only one entry per day
    db.collection("users").document(user["uid"]).collection("moods").document(today).set(mood_data)
    return mood_data


@router.get("/")
async def get_mood(user: dict = Depends(get_current_user)):
    """GET /api/mood — Get today's mood."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    doc = db.collection("users").document(user["uid"]).collection("moods").document(today).get()

    if not doc.exists:
        return {"mood": None}

    return doc.to_dict()
