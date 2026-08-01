import os
import json
import uuid
import razorpay
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify

app = Flask(__name__)

# ==========================================
# 1. RAZORPAY SETUP (Vercel ke Environment Variables se keys utha raha hai)
# ==========================================
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID') 
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# ==========================================
# 2. FIREBASE SECURE VAULT SETUP
# ==========================================
if not firebase_admin._apps:
    firebase_creds_json = os.environ.get('FIREBASE_CREDENTIALS')
    if firebase_creds_json:
        creds_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(creds_dict)
        firebase_admin.initialize_app(cred)

db = firestore.client() if firebase_admin._apps else None

# ==========================================
# ROUTE 1: CREATE ORDER (Payment shuru karne ke liye)
# ==========================================
@app.route('/api/create-order', methods=['POST'])
def create_order():
    try:
        order_amount = 9900 # ₹99 ka order (paise mein)
        razorpay_order = client.order.create({
            "amount": order_amount,
            "currency": "INR",
            "payment_capture": 1
        })
        return jsonify({'id': razorpay_order['id']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# ROUTE 2: VERIFY PAYMENT & GENERATE SECURE LINK
# ==========================================
@app.route('/api/verify-and-generate-link', methods=['POST'])
def verify_payment():
    data = request.json
    try:
        # 1. Payment ka signature verify karo
        params_dict = {
            'razorpay_order_id': data['order_id'],
            'razorpay_payment_id': data['payment_id'],
            'razorpay_signature': data['signature']
        }
        client.utility.verify_payment_signature(params_dict)
        
        # 2. Secure UUID generate karo (Jaise: 550e8400-e29b...)
        unique_gift_id = str(uuid.uuid4())
        partner_name = data.get('partner_name', 'Someone Special')
        
        # 3. Database (Firestore) mein is data ko hamesha ke liye lock kar do
        if db:
            db.collection('magical_gifts').document(unique_gift_id).set({
                'order_id': data['order_id'],
                'payment_id': data['payment_id'],
                'partner_name': partner_name,
                'status': 'paid_and_secured'
            })
        
        # 4. Final link banakar frontend par bhej do
        gift_link = f"https://10petalx.vercel.app/?gift={unique_gift_id}"
        
        return jsonify({'status': 'success', 'link': gift_link})
        
    except razorpay.errors.SignatureVerificationError:
        return jsonify({'status': 'failed', 'error': 'Fake payment detected!'}), 400
    except Exception as e:
        return jsonify({'status': 'failed', 'error': str(e)}), 500

# Vercel serverless function entry point
if __name__ == '__main__':
    app.run(debug=True)
    
