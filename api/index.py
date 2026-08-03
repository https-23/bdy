import os
import json
import uuid
import base64
import razorpay
import firebase_admin
from firebase_admin import credentials, firestore, storage
from flask import Flask, request, jsonify

app = Flask(__name__)

# ==========================================
# 1. RAZORPAY SETUP
# ==========================================
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID') 
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# ==========================================
# 2. FIREBASE SECURE VAULT & STORAGE SETUP
# ==========================================
if not firebase_admin._apps:
    firebase_creds_json = os.environ.get('FIREBASE_CREDENTIALS')
    if firebase_creds_json:
        creds_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(creds_dict)
        # Required for image uploads. E.g., 'my-project-id.appspot.com'
        firebase_admin.initialize_app(cred, {
            'storageBucket': os.environ.get('FIREBASE_STORAGE_BUCKET') 
        })

db = firestore.client() if firebase_admin._apps else None
bucket = storage.bucket() if firebase_admin._apps else None

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
# ROUTE 2: ATOMIC VERIFY, UPLOAD & GENERATE
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
        
        # 3. Decode Base64 and Upload to Firebase Storage
        uploaded_image_urls = {}
        if bucket:
            images_b64 = data.get('images', {})
            for index, b64_str in images_b64.items():
                if b64_str: # If user uploaded an image for this slot
                    try:
                        # Split standard dataURI: 'data:image/webp;base64,...'
                        header, encoded = b64_str.split(",", 1)
                        file_data = base64.b64decode(encoded)
                        
                        file_path = f"gifts/{unique_gift_id}/photo_{index}.webp"
                        blob = bucket.blob(file_path)
                        blob.upload_from_string(file_data, content_type='image/webp')
                        blob.make_public() # Ensure bucket permissions allow public read
                        
                        uploaded_image_urls[index] = blob.public_url
                    except Exception as img_err:
                        print(f"Failed to process image {index}: {str(img_err)}")

        # 4. Save Master Record to Firestore
        if db:
            db.collection('magical_gifts').document(unique_gift_id).set({
                'order_id': data['order_id'],
                'payment_id': data['payment_id'],
                'partner_name': data.get('partner_name', 'Someone Special'),
                'user_name': data.get('user_name', ''),
                'envelope_msg': data.get('envelope_msg', ''),
                'main_wish': data.get('main_wish', ''),
                'audio_link': data.get('audio_link', ''),
                'images': uploaded_image_urls,
                'status': 'paid_and_secured'
            })
        
        # 5. Generate Dynamic Frontend Link
        frontend_url = os.environ.get('FRONTEND_URL', 'https://10petalx.vercel.app').rstrip('/')
        gift_link = f"{frontend_url}/?gift={unique_gift_id}"
        
        return jsonify({'status': 'success', 'link': gift_link})
        
    except razorpay.errors.SignatureVerificationError:
        return jsonify({'status': 'failed', 'error': 'Fake payment detected!'}), 400
    except Exception as e:
        return jsonify({'status': 'failed', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
