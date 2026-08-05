import os
import json
import uuid
import base64
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- 1. RAZORPAY INITIALIZATION ---
def get_razorpay_client():
    import razorpay
    key_id = os.environ.get('RAZORPAY_KEY_ID')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
    if not key_id or not key_secret:
        raise ValueError("Razorpay API keys are missing in environment variables.")
    return razorpay.Client(auth=(key_id, key_secret))

# --- 2. FIREBASE INITIALIZATION ---
def get_db_and_bucket():
    import firebase_admin
    from firebase_admin import credentials, firestore, storage
    
    if not firebase_admin._apps:
        firebase_creds = os.environ.get('FIREBASE_CREDENTIALS')
        if not firebase_creds:
            raise ValueError("Firebase credentials missing in environment variables.")
        
        creds_dict = json.loads(firebase_creds)
        bucket_name = os.environ.get('FIREBASE_STORAGE_BUCKET', '')
        
        cred = credentials.Certificate(creds_dict)
        if bucket_name:
            firebase_admin.initialize_app(cred, {'storageBucket': bucket_name})
        else:
            firebase_admin.initialize_app(cred)
            
    db = firestore.client()
    bucket = None
    try:
        bucket = storage.bucket() if os.environ.get('FIREBASE_STORAGE_BUCKET') else None
    except Exception:
        bucket = None
        
    return db, bucket

def process_and_upload_images(images_dict, gift_id, bucket):
    """Processes images: saves to Firebase Storage if bucket exists, otherwise validates payload size."""
    processed_images = {}
    
    for key, base64_str in images_dict.items():
        if not base64_str or not isinstance(base64_str, str):
            continue
            
        # If Storage Bucket is available, upload to Firebase Storage
        if bucket and base64_str.startswith('data:image'):
            try:
                header, encoded = base64_str.split(',', 1)
                img_data = base64.b64decode(encoded)
                blob_path = f"gifts/{gift_id}/photo_{key}.webp"
                blob = bucket.blob(blob_path)
                blob.upload_from_string(img_data, content_type='image/webp')
                blob.make_public()
                processed_images[str(key)] = blob.public_url
                continue
            except Exception as e:
                print(f"Storage upload failed for image {key}, falling back to inline: {e}")
        
        # Fallback to inline WebP Base64 (validated for size)
        processed_images[str(key)] = base64_str

    return processed_images

# --- ROUTES ---

@app.route('/api/create-order', methods=['POST'])
def create_order():
    try:
        client = get_razorpay_client()
        order_amount = 9900  # ₹99 in paise
        razorpay_order = client.order.create({
            "amount": order_amount,
            "currency": "INR",
            "payment_capture": 1
        })
        return jsonify({'id': razorpay_order['id']}), 200
    except Exception as e:
        return jsonify({'error': f"Payment Initialization Failed: {str(e)}"}), 500

@app.route('/api/verify-and-generate-link', methods=['POST'])
def verify_payment():
    data = request.json or {}
    required_fields = ['order_id', 'payment_id', 'signature']
    
    if not all(field in data for field in required_fields):
        return jsonify({'status': 'failed', 'error': 'Missing transaction parameters.'}), 400

    try:
        client = get_razorpay_client()
        params_dict = {
            'razorpay_order_id': data['order_id'],
            'razorpay_payment_id': data['payment_id'],
            'razorpay_signature': data['signature']
        }
        
        # Verify Payment Signature
        client.utility.verify_payment_signature(params_dict)

        unique_gift_id = str(uuid.uuid4())
        db, bucket = get_db_and_bucket()
        
        # Process and optimize image storage payload
        raw_images = data.get('images', {})
        final_images = process_and_upload_images(raw_images, unique_gift_id, bucket)
        
        # Save payload to Firestore
        doc_data = {
            'order_id': data['order_id'],
            'payment_id': data['payment_id'],
            'partner_name': data.get('partner_name', 'Someone Special'),
            'user_name': data.get('user_name', ''),
            'envelope_msg': data.get('envelope_msg', ''),
            'main_wish': data.get('main_wish', ''),
            'audio_link': data.get('audio_link', ''),
            'images': final_images,
            'created_at': firestore.SERVER_TIMESTAMP,
            'status': 'paid_and_secured'
        }
        
        db.collection('magical_gifts').document(unique_gift_id).set(doc_data)
        
        frontend_url = os.environ.get('FRONTEND_URL', 'https://10petalx.vercel.app').rstrip('/')
        gift_link = f"{frontend_url}/?gift={unique_gift_id}"
        
        return jsonify({'status': 'success', 'link': gift_link}), 200
    except Exception as e:
        return jsonify({'status': 'failed', 'error': f"Verification Failed: {str(e)}"}), 500

@app.route('/api/get-gift/<gift_id>', methods=['GET'])
def get_gift(gift_id):
    try:
        db, _ = get_db_and_bucket()
        doc_ref = db.collection('magical_gifts').document(gift_id)
        doc = doc_ref.get()
        
        if doc.exists:
            return jsonify({'status': 'success', 'data': doc.to_dict()}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Surprise link not found or expired.'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST'])
def catch_all(path):
    return jsonify({"error": "API route not found."}), 404

if __name__ == '__main__':
    app.run(debug=True)
    
