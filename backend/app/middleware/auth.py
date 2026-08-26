from fastapi import Depends, HTTPException, Request


def get_current_user(request: Request) -> dict:
    """FastAPI dependency that extracts and verifies the Firebase ID token."""
    from app.config.firebase import auth  # lazy import to avoid circular issues

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")

    token = auth_header.split("Bearer ")[1]

    try:
        decoded = auth.verify_id_token(token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email"),
            "name": decoded.get("name"),
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
