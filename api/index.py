from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import razorpay
import os

app = FastAPI()

# Razorpay Setup (Keys hum Vercel settings me daalenge)
def get_rzp_client():
    return razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID"), os.environ.get("RAZORPAY_KEY_SECRET")))

@app.post("/api/create-order")
async def create_order():
    try:
        client = get_rzp_client()
        # ₹99 ka order (9900 paise)
        order = client.order.create({"amount": 9900, "currency": "INR", "receipt": "magic_gift_1"})
        return JSONResponse(order)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/verify-and-generate-link")
async def verify_payment(request: Request):
    data = await request.json()
    client = get_rzp_client()
    try:
        # Payment Verify Karna
        client.utility.verify_payment_signature({
            'razorpay_order_id': data['order_id'],
            'razorpay_payment_id': data['payment_id'],
            'razorpay_signature': data['signature']
        })
        
        # Link generate karna
        partner = data.get('partner_name', 'magic').replace(" ", "").lower()
        unique_url = f"https://10petalx.vercel.app/?id={partner}"
        
        return JSONResponse({"status": "success", "link": unique_url})
    except Exception as e:
        return JSONResponse({"status": "failed", "error": "Verification failed"})

