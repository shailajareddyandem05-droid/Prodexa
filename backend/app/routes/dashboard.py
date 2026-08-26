from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.config.firebase import db
from app.middleware.auth import get_current_user

router = APIRouter()


class RoutineToggle(BaseModel):
    done: bool


@router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    """GET /api/dashboard/stats — Aggregated dashboard stats."""
    uid = user["uid"]

    # Get tasks
    tasks_snap = db.collection("users").document(uid).collection("tasks").stream()
    tasks = [doc.to_dict() for doc in tasks_snap]
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.get("done"))
    pending_tasks = total_tasks - completed_tasks
    percentage = round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0

    # Get today's mood
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    mood_doc = db.collection("users").document(uid).collection("moods").document(today).get()
    mood_data = mood_doc.to_dict() if mood_doc.exists else None

    return {
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "pending": pending_tasks,
            "percentage": percentage,
        },
        "mails": {"today": 0, "thisWeek": 0, "tasksFromMails": 0},
        "mood": mood_data,
    }


@router.get("/routine")
async def get_routine(user: dict = Depends(get_current_user)):
    """GET /api/dashboard/routine — Get daily routine."""
    uid = user["uid"]
    routine_ref = db.collection("users").document(uid).collection("routine")
    docs = list(routine_ref.order_by("time", direction="ASCENDING").stream())

    if not docs:
        return {"routine": []}

    routine = [{"id": doc.id, **doc.to_dict()} for doc in docs]
    return {"routine": routine}


@router.patch("/routine/{item_id}")
async def toggle_routine(item_id: str, body: RoutineToggle, user: dict = Depends(get_current_user)):
    """PATCH /api/dashboard/routine/:id — Toggle routine item."""
    db.collection("users").document(user["uid"]).collection("routine").document(item_id).update(
        {"done": body.done}
    )
    return {"id": item_id, "done": body.done}


@router.get("/week-progress")
async def get_week_progress(user: dict = Depends(get_current_user)):
    """GET /api/dashboard/week-progress — Last 7 days productivity data."""
    uid = user["uid"]
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    today = datetime.now(timezone.utc)
    week_data = []

    # Fetch tasks to count completions per day
    tasks_snap = db.collection("users").document(uid).collection("tasks").stream()
    tasks = [doc.to_dict() for doc in tasks_snap]

    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        date_str = d.strftime("%Y-%m-%d")
        # Monday=0 in Python, map to our day_names list
        day_name = day_names[d.weekday()]

        mood_doc = db.collection("users").document(uid).collection("moods").document(date_str).get()
        stress = mood_doc.to_dict().get("stress", 30) if mood_doc.exists else 30
        
        # Count tasks done on this exact date string
        tasks_done = sum(1 for t in tasks if t.get("done") and str(t.get("updatedAt", "")).startswith(date_str))

        # Focus hours tracked (placeholder 0 until actual focus sessions are synced)
        focus_hours = 0

        week_data.append({"day": day_name, "tasks": tasks_done, "stress": stress, "focus": focus_hours})

    return {"weekData": week_data}
