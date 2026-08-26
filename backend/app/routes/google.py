import os
from datetime import datetime, timezone

# Allow OAuth over HTTP for local development
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config.firebase import db
from app.middleware.auth import get_current_user

router = APIRouter()

SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
]

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _get_flow(**kwargs) -> Flow:
    """Create a Google OAuth2 flow using env vars."""
    client_config = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI")],
        }
    }
    flow = Flow.from_client_config(client_config, scopes=SCOPES, **kwargs)
    flow.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    return flow


def _get_credentials(token_data: dict) -> Credentials:
    """Build Credentials object from stored token data."""
    return Credentials(
        token=token_data["access_token"],
        refresh_token=token_data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES,
    )


def _save_tokens(uid: str, creds: Credentials):
    """Save/update tokens in Firestore."""
    doc_ref = db.collection("users").document(uid).collection("integrations").document("google")
    data = {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_expiry": creds.expiry.isoformat() if creds.expiry else None,
        "connected": True,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    doc_ref.set(data, merge=True)


async def _get_valid_credentials(uid: str) -> Credentials:
    """Get valid (refreshed if needed) credentials for a user."""
    doc_ref = db.collection("users").document(uid).collection("integrations").document("google")
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=400, detail="Google not connected. Please connect first.")

    token_data = doc.to_dict()
    creds = _get_credentials(token_data)

    if creds.expired and creds.refresh_token:
        from google.auth.transport.requests import Request as GoogleRequest

        creds.refresh(GoogleRequest())
        _save_tokens(uid, creds)

    return creds


# ─────────────────────────── OAuth Flow ───────────────────────────


@router.get("/auth-url")
async def get_auth_url(user: dict = Depends(get_current_user)):
    """Return Google OAuth consent URL. Frontend opens this in a popup/redirect."""
    flow = _get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=user["uid"],
    )
    
    # Store PKCE verifier securely to survive the stateless callback
    if getattr(flow, 'code_verifier', None):
        db.collection("users").document(user["uid"]).collection("integrations").document("google_oauth_state").set({
            "code_verifier": flow.code_verifier,
            "created_at": datetime.now(timezone.utc)
        }, merge=True)
        
    return {"url": auth_url}


@router.get("/callback")
async def google_callback(request: Request):
    """Handle Google OAuth callback — exchange code for tokens and store them."""
    code = request.query_params.get("code")
    state = request.query_params.get("state")  # uid passed via state
    error = request.query_params.get("error")

    if error:
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?google=error&reason={error}")

    if not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?google=error&reason=missing_params")

    try:
        # Retrieve the PKCE code_verifier from the auth_url step
        state_doc_ref = db.collection("users").document(state).collection("integrations").document("google_oauth_state")
        state_doc = state_doc_ref.get()
        
        flow_kwargs = {}
        if state_doc.exists:
            verifier = state_doc.to_dict().get("code_verifier")
            if verifier:
                flow_kwargs["code_verifier"] = verifier
                flow_kwargs["autogenerate_code_verifier"] = False

        flow = _get_flow(**flow_kwargs)
        flow.fetch_token(code=code)
        
        # Cleanup state after use
        state_doc_ref.delete()
        
        creds = flow.credentials
        _save_tokens(state, creds)
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?google=success")
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?google=error&reason={str(e)}")


@router.get("/status")
async def get_status(user: dict = Depends(get_current_user)):
    """Check if user has connected their Google account."""
    doc = db.collection("users").document(user["uid"]).collection("integrations").document("google").get()
    if doc.exists and doc.to_dict().get("connected"):
        return {"connected": True}
    return {"connected": False}


@router.post("/disconnect")
async def disconnect(user: dict = Depends(get_current_user)):
    """Remove Google tokens for the user."""
    doc_ref = db.collection("users").document(user["uid"]).collection("integrations").document("google")
    doc_ref.delete()
    return {"success": True}


# ─────────────────────────── Calendar ───────────────────────────


@router.get("/calendar/events")
async def get_calendar_events(user: dict = Depends(get_current_user)):
    """List upcoming calendar events from ALL user's calendars (including holidays)."""
    creds = await _get_valid_credentials(user["uid"])
    service = build("calendar", "v3", credentials=creds)

    now = datetime.now(timezone.utc).isoformat()
    events = []

    try:
        # Get all calendars the user has selected
        calendar_list = service.calendarList().list().execute()
        seen_ids = set()
        
        for calendar in calendar_list.get("items", []):
            try:
                result = service.events().list(
                    calendarId=calendar["id"],
                    timeMin=now,
                    maxResults=20,
                    singleEvents=True,
                    orderBy="startTime",
                ).execute()

                for event in result.get("items", []):
                    event_id = event["id"]
                    # Prevent duplicates if multiple calendars track the same event
                    if event_id in seen_ids:
                        continue
                    seen_ids.add(event_id)
                    
                    start = event["start"].get("dateTime", event["start"].get("date"))
                    events.append({
                        "id": event_id,
                        "title": event.get("summary", "(No title)"),
                        "start": start,
                        "location": event.get("location"),
                        "link": event.get("htmlLink"),
                        "calendarName": calendar.get("summary", "Google Calendar")
                    })
            except Exception:
                # Some shared/holiday calendars might fail or have no permissions
                continue
                
    except Exception as e:
        print(f"Failed to fetch calendar lists: {e}")

    # Sort all combined events by start time and take top 50
    events.sort(key=lambda x: x["start"])
    events = events[:50]

    return {"events": events}


# ─────────────────────────── Gmail ───────────────────────────


@router.get("/gmail/messages")
async def get_gmail_messages(user: dict = Depends(get_current_user)):
    """List recent 10 email subjects."""
    creds = await _get_valid_credentials(user["uid"])
    service = build("gmail", "v1", credentials=creds)

    result = service.users().messages().list(userId="me", maxResults=10).execute()
    messages = []

    for msg_meta in result.get("messages", []):
        msg = service.users().messages().get(
            userId="me", id=msg_meta["id"], format="metadata",
            metadataHeaders=["Subject", "From", "Date"],
        ).execute()

        headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
        messages.append({
            "id": msg["id"],
            "subject": headers.get("Subject", "(No subject)"),
            "from": headers.get("From", ""),
            "date": headers.get("Date", ""),
            "snippet": msg.get("snippet", ""),
        })

    return {"messages": messages}


@router.get("/gmail/message/{message_id}")
async def get_gmail_message(message_id: str, user: dict = Depends(get_current_user)):
    """GET /api/google/gmail/message/:id — Fetch full email content."""
    import base64

    creds = await _get_valid_credentials(user["uid"])
    service = build("gmail", "v1", credentials=creds)

    msg = service.users().messages().get(
        userId="me", id=message_id, format="full",
    ).execute()

    headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}

    # Extract body — handle multipart and simple payloads
    body_text = ""
    payload = msg.get("payload", {})

    def decode_part(part: dict) -> str:
        """Recursively decode email parts to find text/plain or text/html."""
        mime = part.get("mimeType", "")
        data = part.get("body", {}).get("data", "")

        if data and mime in ("text/plain", "text/html"):
            decoded = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
            return decoded

        # Recurse into sub-parts
        for sub in part.get("parts", []):
            result = decode_part(sub)
            if result:
                return result
        return ""

    # Try to get text/plain first
    if payload.get("parts"):
        # Multipart — prefer text/plain
        for part in payload["parts"]:
            if part.get("mimeType") == "text/plain":
                data = part.get("body", {}).get("data", "")
                if data:
                    body_text = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
                    break
        # Fallback to recursive decode
        if not body_text:
            body_text = decode_part(payload)
    else:
        # Simple payload
        data = payload.get("body", {}).get("data", "")
        if data:
            body_text = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")

    # Fallback to snippet
    if not body_text:
        body_text = msg.get("snippet", "")

    return {
        "id": msg["id"],
        "subject": headers.get("Subject", "(No subject)"),
        "from": headers.get("From", ""),
        "to": headers.get("To", ""),
        "date": headers.get("Date", ""),
        "body": body_text,
        "snippet": msg.get("snippet", ""),
        "labelIds": msg.get("labelIds", []),
    }


# ─────────────────────────── Drive ───────────────────────────


@router.get("/drive/files")
async def get_drive_files(user: dict = Depends(get_current_user)):
    """List recent 10 Drive files."""
    creds = await _get_valid_credentials(user["uid"])
    service = build("drive", "v3", credentials=creds)

    try:
        result = service.files().list(
            pageSize=10,
            fields="files(id, name, mimeType, modifiedTime, webViewLink, iconLink)",
            orderBy="modifiedTime desc",
        ).execute()

        files = []
        for f in result.get("files", []):
            files.append({
                "id": f["id"],
                "name": f["name"],
                "mimeType": f.get("mimeType", ""),
                "modifiedTime": f.get("modifiedTime", ""),
                "link": f.get("webViewLink", ""),
                "icon": f.get("iconLink", ""),
            })

        return {"files": files}
    except Exception as e:
        from google.auth.exceptions import RefreshError
        if isinstance(e, RefreshError) or "invalid_scope" in str(e):
            # Tokens are invalid/scoped differently. Delete them to prompt reconnect.
            db.collection("users").document(user["uid"]).collection("integrations").document("google").delete()
            raise HTTPException(status_code=401, detail="Google scope changed. Please reconnect your account.")
        raise HTTPException(status_code=500, detail=f"Failed to fetch drive files: {str(e)}")


@router.get("/drive/file/{file_id}")
async def get_drive_file(file_id: str, user: dict = Depends(get_current_user)):
    """GET /api/google/drive/file/:id — Export full text of a Google Doc."""
    creds = await _get_valid_credentials(user["uid"])
    service = build("drive", "v3", credentials=creds)

    try:
        # Get metadata
        file_meta = service.files().get(fileId=file_id, fields="id, name, mimeType").execute()
        mime_type = file_meta.get("mimeType", "")

        # We can only export Google Docs easily as plain text
        if mime_type == "application/vnd.google-apps.document":
            content = service.files().export(fileId=file_id, mimeType="text/plain").execute()
            body_text = content.decode("utf-8", errors="replace")
        else:
            return {"error": f"Cannot extract text from file type: {mime_type}"}

        return {
            "id": file_meta["id"],
            "name": file_meta["name"],
            "content": body_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch drive file: {str(e)}")


class ExportNoteRequest(BaseModel):
    title: str
    content: str
    folderId: Optional[str] = None

class NoteItem(BaseModel):
    title: str
    content: str

class ExportGroupRequest(BaseModel):
    groupName: str
    notes: List[NoteItem]


@router.post("/drive/export-note")
async def export_note_to_drive(body: ExportNoteRequest, user: dict = Depends(get_current_user)):
    """POST /api/google/drive/export-note — Export a markdown note to Google Docs."""
    from googleapiclient.http import MediaIoBaseUpload
    import io

    creds = await _get_valid_credentials(user["uid"])
    service = build("drive", "v3", credentials=creds)

    try:
        file_metadata = {
            "name": body.title or "Untitled Note",
            "mimeType": "application/vnd.google-apps.document"
        }
        if body.folderId:
            file_metadata["parents"] = [body.folderId]
            
        media = MediaIoBaseUpload(
            io.BytesIO(body.content.encode("utf-8")), 
            mimetype="text/plain", 
            resumable=True
        )

        file = service.files().create(body=file_metadata, media_body=media, fields="id, webViewLink").execute()
        return {"id": file.get("id"), "link": file.get("webViewLink")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export note: {str(e)}")


@router.post("/drive/export-group")
async def export_group_to_drive(body: ExportGroupRequest, user: dict = Depends(get_current_user)):
    """POST /api/google/drive/export-group — Export multiple notes into a single Google Drive folder."""
    from googleapiclient.http import MediaIoBaseUpload
    import io

    creds = await _get_valid_credentials(user["uid"])
    service = build("drive", "v3", credentials=creds)

    try:
        # 1. Create Folder
        folder_metadata = {
            "name": f"Prodexa - {body.groupName or 'Ungrouped'}",
            "mimeType": "application/vnd.google-apps.folder"
        }
        folder = service.files().create(body=folder_metadata, fields="id, webViewLink").execute()
        folder_id = folder.get("id")

        created_files = []
        # 2. Upload Notes into Folder
        for note in body.notes:
            file_meta = {
                "name": note.title or "Untitled Note",
                "mimeType": "application/vnd.google-apps.document",
                "parents": [folder_id]
            }
            media = MediaIoBaseUpload(
                io.BytesIO(note.content.encode("utf-8")), 
                mimetype="text/plain", 
                resumable=True
            )
            doc = service.files().create(body=file_meta, media_body=media, fields="id").execute()
            created_files.append(doc.get("id"))

        return {
            "folderId": folder_id, 
            "folderLink": folder.get("webViewLink"),
            "filesExported": len(created_files)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export group: {str(e)}")
