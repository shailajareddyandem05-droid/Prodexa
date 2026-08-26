import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Import routes after load_dotenv() so env vars are available during module init
from app.routes import auth, tasks, notes, calendar, mood, dashboard, contact, ai, google, razorpay_api  # noqa: E402

app = FastAPI(title="Prodexa API", version="1.0.0")

# CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    frontend_url,
    "http://localhost:3000",
    "https://prodexa-b03.web.app",
    "https://prodexa-b03.firebaseapp.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


# Routers
app.include_router(auth.router, prefix="/api/auth")
app.include_router(tasks.router, prefix="/api/tasks")
app.include_router(notes.router, prefix="/api/notes")
app.include_router(calendar.router, prefix="/api/calendar")
app.include_router(mood.router, prefix="/api/mood")
app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(contact.router, prefix="/api/contact")
app.include_router(ai.router, prefix="/api/ai")
app.include_router(google.router, prefix="/api/google")
app.include_router(razorpay_api.router, prefix="/api/razorpay")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "5000"))
    print(f"🚀 Prodexa backend running on http://localhost:{port}")
    print(f"📡 API endpoints available at http://localhost:{port}/api")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
