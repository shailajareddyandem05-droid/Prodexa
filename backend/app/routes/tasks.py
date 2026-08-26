from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.config.firebase import db
from app.middleware.auth import get_current_user

router = APIRouter()


class TaskCreate(BaseModel):
    title: str
    due: Optional[str] = "No date"
    priority: Optional[str] = "medium"
    source: Optional[str] = "manual"
    parentId: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    due: Optional[str] = None
    priority: Optional[str] = None
    done: Optional[bool] = None
    source: Optional[str] = None
    parentId: Optional[str] = None


@router.get("/")
async def get_tasks(user: dict = Depends(get_current_user)):
    """GET /api/tasks — List all tasks."""
    tasks_ref = (
        db.collection("users")
        .document(user["uid"])
        .collection("tasks")
        .order_by("createdAt", direction="DESCENDING")
    )
    docs = tasks_ref.stream()
    tasks = [{"id": doc.id, **doc.to_dict()} for doc in docs]
    return {"tasks": tasks}


@router.post("/", status_code=201)
async def create_task(body: TaskCreate, user: dict = Depends(get_current_user)):
    """POST /api/tasks — Create a task."""
    now = datetime.now(timezone.utc).isoformat()
    task_data = {
        "title": body.title,
        "due": body.due,
        "priority": body.priority,
        "done": False,
        "source": body.source,
        "parentId": body.parentId,
        "createdAt": now,
        "updatedAt": now,
    }
    doc_ref = (
        db.collection("users")
        .document(user["uid"])
        .collection("tasks")
        .add(task_data)
    )
    # add() returns (timestamp, doc_ref)
    return {"id": doc_ref[1].id, **task_data}


@router.patch("/{task_id}")
async def update_task(task_id: str, body: TaskUpdate, user: dict = Depends(get_current_user)):
    """PATCH /api/tasks/:id — Update a task."""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updatedAt"] = datetime.now(timezone.utc).isoformat()

    db.collection("users").document(user["uid"]).collection("tasks").document(task_id).update(updates)
    return {"id": task_id, **updates}


@router.delete("/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(get_current_user)):
    """DELETE /api/tasks/:id — Delete a task."""
    db.collection("users").document(user["uid"]).collection("tasks").document(task_id).delete()
    return {"message": "Task deleted"}
