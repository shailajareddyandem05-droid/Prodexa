from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.config.firebase import db

router = APIRouter()


class ContactCreate(BaseModel):
    name: str
    email: str
    subject: Optional[str] = "No subject"
    message: str


@router.post("/", status_code=201)
async def create_contact(body: ContactCreate):
    """POST /api/contact — Store contact form (public, no auth needed)."""
    contact_data = {
        "name": body.name,
        "email": body.email,
        "subject": body.subject,
        "message": body.message,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "read": False,
    }
    doc_ref = db.collection("contacts").add(contact_data)
    return {"id": doc_ref[1].id, "message": "Message sent successfully"}
