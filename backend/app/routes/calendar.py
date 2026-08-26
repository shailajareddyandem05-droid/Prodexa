from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.config.firebase import db
from app.middleware.auth import get_current_user

router = APIRouter()


class EventCreate(BaseModel):
    title: str
    day: int
    month: Optional[int] = None
    year: Optional[int] = None
    type: Optional[str] = "task"


class EventUpdate(BaseModel):
    title: Optional[str] = None
    day: Optional[int] = None
    month: Optional[int] = None
    year: Optional[int] = None
    type: Optional[str] = None


@router.get("/")
async def get_events(user: dict = Depends(get_current_user)):
    """GET /api/calendar — List all calendar events."""
    events_ref = (
        db.collection("users")
        .document(user["uid"])
        .collection("calendar")
        .order_by("day", direction="ASCENDING")
    )
    docs = events_ref.stream()
    events = [{"id": doc.id, **doc.to_dict()} for doc in docs]
    return {"events": events}


@router.post("/", status_code=201)
async def create_event(body: EventCreate, user: dict = Depends(get_current_user)):
    """POST /api/calendar — Create a calendar event."""
    now = datetime.now(timezone.utc)
    event_data = {
        "title": body.title,
        "day": body.day,
        "month": body.month if body.month is not None else now.month - 1,  # JS months are 0-indexed
        "year": body.year if body.year is not None else now.year,
        "type": body.type,
        "createdAt": now.isoformat(),
    }
    doc_ref = (
        db.collection("users")
        .document(user["uid"])
        .collection("calendar")
        .add(event_data)
    )
    return {"id": doc_ref[1].id, **event_data}


@router.patch("/{event_id}")
async def update_event(event_id: str, body: EventUpdate, user: dict = Depends(get_current_user)):
    """PATCH /api/calendar/:id — Update a calendar event."""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    db.collection("users").document(user["uid"]).collection("calendar").document(event_id).update(updates)
    return {"id": event_id, **updates}


@router.delete("/{event_id}")
async def delete_event(event_id: str, user: dict = Depends(get_current_user)):
    """DELETE /api/calendar/:id — Delete a calendar event."""
    db.collection("users").document(user["uid"]).collection("calendar").document(event_id).delete()
    return {"message": "Event deleted"}
