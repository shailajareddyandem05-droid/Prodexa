import os
import traceback
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
import razorpay

from app.config.firebase import db
from app.middleware.auth import get_current_user

router = APIRouter()

# Lazy-initialized Razorpay Client
_client = None

def _get_client():
    """Lazily initialize the Razorpay client so env vars are read at request time."""
    global _client
    if _client is None:
        key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
        print(f"[RAZORPAY] Initializing client — key_id present: {bool(key_id)}, key_secret present: {bool(key_secret)}")
        if key_id and key_secret:
            try:
                _client = razorpay.Client(auth=(key_id, key_secret))
                print("[RAZORPAY] Client initialized successfully")
            except Exception as e:
                print(f"[RAZORPAY] Failed to initialize client: {e}")
                traceback.print_exc()
        else:
            print("[RAZORPAY] WARNING: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET env vars")
    return _client

class CreateOrderRequest(BaseModel):
    amount: int  # Amount is in currency subunits (paise for INR)
    currency: str = "INR"
    receipt: str = "receipt"

@router.post("/create-order")
async def create_order(req: CreateOrderRequest, user: dict = Depends(get_current_user)):
    client = _get_client()
    print(f"[RAZORPAY] create-order called — user={user.get('uid')}, amount={req.amount}, currency={req.currency}")

    if not client:
        raise HTTPException(
            status_code=500,
            detail="Razorpay keys not configured on server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables."
        )

    # Razorpay requires amount >= 100 paise (₹1)
    if req.amount < 100:
        raise HTTPException(
            status_code=400,
            detail=f"Amount must be at least 100 paise (₹1). Received: {req.amount}"
        )

    try:
        data = {
            "amount": req.amount,
            "currency": req.currency,
            "receipt": f"{user['uid']}_focus_{req.receipt}"[:40],
            "notes": {
                "userId": user["uid"]
            }
        }
        print(f"[RAZORPAY] Creating order with data: {data}")
        payment = client.order.create(data=data)
        print(f"[RAZORPAY] Order created successfully: id={payment['id']}")
        return {"order_id": payment["id"], "amount": payment["amount"], "currency": payment["currency"]}
    except razorpay.errors.BadRequestError as e:
        print(f"[RAZORPAY] BadRequestError: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Razorpay rejected the request: {e}")
    except Exception as e:
        print(f"[RAZORPAY] Unexpected error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Payment gateway error: {str(e)}")

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/verify-payment")
async def verify_payment(req: VerifyPaymentRequest, user: dict = Depends(get_current_user)):
    client = _get_client()
    if not client:
        raise HTTPException(status_code=500, detail="Razorpay keys not configured on server")
        
    try:
        params_dict = {
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        }
        
        # This will throw a SignatureVerificationError if signature is invalid
        client.utility.verify_payment_signature(params_dict)
        
        # Payment is valid, log it in Firestore
        doc_ref = db.collection("users").document(user["uid"]).collection("focus_penalties").document(req.razorpay_payment_id)
        doc_ref.set({
            "order_id": req.razorpay_order_id,
            "payment_id": req.razorpay_payment_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "paid"
        })
        return {"success": True, "message": "Payment verified securely"}
    except razorpay.errors.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
