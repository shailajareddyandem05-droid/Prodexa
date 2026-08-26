from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.config.firebase import db
from app.middleware.auth import get_current_user

router = APIRouter()


class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""
    group: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    group: Optional[str] = None


@router.get("/")
async def get_notes(user: dict = Depends(get_current_user)):
    """GET /api/notes — List all notes."""
    notes_ref = (
        db.collection("users")
        .document(user["uid"])
        .collection("notes")
        .order_by("createdAt", direction="DESCENDING")
    )
    docs = notes_ref.stream()
    notes = [{"id": doc.id, **doc.to_dict()} for doc in docs]
    return {"notes": notes}


@router.post("/", status_code=201)
async def create_note(body: NoteCreate, user: dict = Depends(get_current_user)):
    """POST /api/notes — Create a note."""
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%b %d")  # e.g. "Feb 19"
    note_data = {
        "title": body.title,
        "content": body.content,
        "group": body.group,
        "date": date_str,
        "createdAt": now.isoformat(),
        "updatedAt": now.isoformat(),
    }
    doc_ref = (
        db.collection("users")
        .document(user["uid"])
        .collection("notes")
        .add(note_data)
    )
    return {"id": doc_ref[1].id, **note_data}


@router.patch("/{note_id}")
async def update_note(note_id: str, body: NoteUpdate, user: dict = Depends(get_current_user)):
    """PATCH /api/notes/:id — Update a note."""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updatedAt"] = datetime.now(timezone.utc).isoformat()

    db.collection("users").document(user["uid"]).collection("notes").document(note_id).update(updates)
    return {"id": note_id, **updates}


@router.delete("/{note_id}")
async def delete_note(note_id: str, user: dict = Depends(get_current_user)):
    """DELETE /api/notes/:id — Delete a note."""
    db.collection("users").document(user["uid"]).collection("notes").document(note_id).delete()
    return {"message": "Note deleted"}
