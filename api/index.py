import os
import json
import uuid
from flask import Flask, request, jsonify

app = Flask(__name__)

# 1. LAZY LOAD RAZORPAY
def get_razorpay_client():
    import razorpay
    key_id = os.environ.get('RAZORPAY_KEY_ID')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
    if not key_id or not key_secret:
        raise ValueError("Razorpay API keys are missing in Vercel.")
    return razorpay.Client(auth=(key_id, key_secret))

# 2. LAZY LOAD FIREBASE
def get_db():
    import firebase_admin
    from firebase_admin import credentials, firestore
    if not firebase_admin._apps:
        firebase_creds = os.environ.get('FIREBASE_CREDENTIALS')
        if not firebase_creds:
            raise ValueError("Firebase credentials missing in Vercel.")
        creds_dict = json.loads(firebase_creds)
        cred = credentials.Certificate(creds_dict)
        firebase_admin.initialize_app(cred)
    return firestore.client()

# ==========================================
# ROUTE 1: CREATE ORDER
# ==========================================
@app.route('/api/create-order', methods=['POST'])
def create_order():
    try:
        client = get_razorpay_client()
        order_amount = 9900 # ₹99
        razorpay_order = client.order.create({
            "amount": order_amount,
            "currency": "INR",
            "payment_capture": 1
        })
        return jsonify({'id': razorpay_order['id']})
    except Exception as e:
        return jsonify({'error': f"Payment Init Error: {str(e)}"}), 500

# ==========================================
# ROUTE 2: VERIFY AND SAVE
# ==========================================
@app.route('/api/verify-and-generate-link', methods=['POST'])
def verify_payment():
    data = request.json
    try:
        client = get_razorpay_client()
        params_dict = {
            'razorpay_order_id': data['order_id'],
            'razorpay_payment_id': data['payment_id'],
            'razorpay_signature': data['signature']
        }
        client.utility.verify_payment_signature(params_dict)

        unique_gift_id = str(uuid.uuid4())
        db = get_db()
        
        db.collection('magical_gifts').document(unique_gift_id).set({
            'order_id': data['order_id'],
            'payment_id': data['payment_id'],
            'partner_name': data.get('partner_name', 'Someone Special'),
            'user_name': data.get('user_name', ''),
            'envelope_msg': data.get('envelope_msg', ''),
            'main_wish': data.get('main_wish', ''),
            'audio_link': data.get('audio_link', ''),
            'images': data.get('images', {}),
            'status': 'paid_and_secured'
        })
        
        frontend_url = os.environ.get('FRONTEND_URL', 'https://10petalx.vercel.app').rstrip('/')
        gift_link = f"{frontend_url}/?gift={unique_gift_id}"
        return jsonify({'status': 'success', 'link': gift_link})
    except Exception as e:
        return jsonify({'status': 'failed', 'error': f"Verification Error: {str(e)}"}), 500

# ==========================================
# ROUTE 3: FETCH GIFT DATA
# ==========================================
@app.route('/api/get-gift/<gift_id>', methods=['GET'])
def get_gift(gift_id):
    try:
        db = get_db()
        doc_ref = db.collection('magical_gifts').document(gift_id)
        doc = doc_ref.get()
        if doc.exists:
            return jsonify({'status': 'success', 'data': doc.to_dict()}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Gift not found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Safety net for 404 routing errors
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST'])
def catch_all(path):
    return jsonify({"error": "Route not found."}), 404

if __name__ == '__main__':
    app.run(debug=True)
