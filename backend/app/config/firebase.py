import os
import json
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from dotenv import load_dotenv

load_dotenv()

# Option 1: Load from JSON env var (Render / production)
_service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

if _service_account_json:
    _cert_data = json.loads(_service_account_json)
    cred = credentials.Certificate(_cert_data)
else:
    # Option 2: Load from file path (local development)
    _service_account_path = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        "../prodexa-b03-firebase-adminsdk-fbsvc-8d173cc4f8.json",
    )
    _backend_dir = Path(__file__).resolve().parent.parent.parent
    _resolved_path = (_backend_dir / _service_account_path).resolve()
    cred = credentials.Certificate(str(_resolved_path))

firebase_admin.initialize_app(cred)

db = firestore.client()
auth = firebase_auth
