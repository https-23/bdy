import os
import json
import uuid
import razorpay
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify

app = Flask(__name__)

# ==========================================
# 1. RAZORPAY SETUP
# ==========================================
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID') 
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# ==========================================
# 2. FIREBASE SETUP (100% FREE TIER - NO STORAGE NEEDED)
# ==========================================
if not firebase_admin._apps:
    firebase_creds_json = os.environ.get('FIREBASE_CREDENTIALS')
    if firebase_creds_json:
        try:
            creds_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"Firebase Init Error: {str(e)}")

db = firestore.client() if firebase_admin._apps else None

# ==========================================
# ROUTE 1: CREATE ORDER
# ==========================================
@app.route('/api/create-order', methods=['POST'])
def create_order():
    try:
        order_amount = 9900 # ₹99
        razorpay_order = client.order.create({
            "amount": order_amount,
            "currency": "INR",
            "payment_capture": 1
        })
        return jsonify({'id': razorpay_order['id']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# ROUTE 2: VERIFY AND SAVE (DIRECT TO DB)
# ==========================================
@app.route('/api/verify-and-generate-link', methods=['POST'])
def verify_payment():
    data = request.json
    try:
        # 1. Verify Payment Signature
        params_dict = {
            'razorpay_order_id': data['order_id'],
            'razorpay_payment_id': data['payment_id'],
            'razorpay_signature': data['signature']
        }
        client.utility.verify_payment_signature(params_dict)
        
        # 2. Generate UUID
        unique_gift_id = str(uuid.uuid4())
        
        # 3. Save Master Record to Firestore (Images saved directly as text!)
        if db:
            db.collection('magical_gifts').document(unique_gift_id).set({
                'order_id': data['order_id'],
                'payment_id': data['payment_id'],
                'partner_name': data.get('partner_name', 'Someone Special'),
                'user_name': data.get('user_name', ''),
                'envelope_msg': data.get('envelope_msg', ''),
                'main_wish': data.get('main_wish', ''),
                'audio_link': data.get('audio_link', ''),
                'images': data.get('images', {}),  # Bypassing storage bucket
                'status': 'paid_and_secured'
            })
        
        # 4. Generate Dynamic Frontend Link
        frontend_url = os.environ.get('FRONTEND_URL', 'https://10petalx.vercel.app').rstrip('/')
        gift_link = f"{frontend_url}/?gift={unique_gift_id}"
        
        return jsonify({'status': 'success', 'link': gift_link})
        
    except razorpay.errors.SignatureVerificationError:
        return jsonify({'status': 'failed', 'error': 'Fake payment detected!'}), 400
    except Exception as e:
        return jsonify({'status': 'failed', 'error': str(e)}), 500

# ==========================================
# ROUTE 3: FETCH GIFT DATA
# ==========================================
@app.route('/api/get-gift/<gift_id>', methods=['GET'])
def get_gift(gift_id):
    try:
        if not db:
            return jsonify({'error': 'Database not initialized'}), 500
            
        doc_ref = db.collection('magical_gifts').document(gift_id)
        doc = doc_ref.get()
        
        if doc.exists:
            return jsonify({'status': 'success', 'data': doc.to_dict()}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Gift not found'}), 404
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
    
