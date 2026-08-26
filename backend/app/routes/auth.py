from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from app.config.firebase import db
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/verify")
async def verify_token(user: dict = Depends(get_current_user)) -> dict[str, Any]:
    """Verify Firebase token & upsert user in Firestore."""
    uid: str = user["uid"]
    email: str = user.get("email") or ""
    name: str = user.get("name") or ""

    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    now: str = datetime.now(timezone.utc).isoformat()

    if not user_doc.exists:
        user_ref.set({
            "uid": uid,
            "email": email,
            "displayName": name,
            "createdAt": now,
            "updatedAt": now,
        })
    else:
        user_ref.update({
            "email": email,
            "displayName": name,
            "updatedAt": now,
        })

    user_data: Optional[dict[str, Any]] = user_ref.get().to_dict()
    if not user_data:
        raise HTTPException(status_code=500, detail="Failed to read user data")

    return {"user": user_data}
