import os
import json
import uuid
import base64
import sys
import datetime
import traceback
from unittest.mock import MagicMock
from flask import Flask, request, jsonify

app = Flask(__name__)

# --- 🚀 THE BULLETPROOF VERCEL RAZORPAY PATCH ---
if 'pkg_resources' not in sys.modules:
    mock_pkg_resources = MagicMock()
    class MockDist:
        version = "1.4.1"
    mock_pkg_resources.get_distribution.return_value = MockDist()
    class DistributionNotFound(Exception):
        pass
    mock_pkg_resources.DistributionNotFound = DistributionNotFound
    sys.modules['pkg_resources'] = mock_pkg_resources
# ---------------------------------------------

def get_razorpay_client():
    import razorpay
    key_id = os.environ.get('RAZORPAY_KEY_ID')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
    if not key_id or not key_secret:
        raise ValueError("Razorpay API keys are missing in Vercel Environment Variables.")
    return razorpay.Client(auth=(key_id, key_secret))

def get_db_and_bucket():
    import firebase_admin
    from firebase_admin import credentials, firestore, storage
    
    if not firebase_admin._apps:
        firebase_creds = os.environ.get('FIREBASE_CREDENTIALS')
        if not firebase_creds:
            raise ValueError("FIREBASE_CREDENTIALS missing in Vercel Environment Variables.")
        
        try:
            # Fix Vercel's JSON string escaping issues dynamically
            if firebase_creds.startswith("'") and firebase_creds.endswith("'"):
                firebase_creds = firebase_creds[1:-1]
            
            creds_dict = json.loads(firebase_creds, strict=False)
            
            # Heal the broken newline characters in the private key
            if 'private_key' in creds_dict:
                creds_dict['private_key'] = creds_dict['private_key'].replace('\\n', '\n')
                
        except Exception as e:
            raise ValueError(f"Failed to parse Firebase JSON. Ensure it is a valid JSON string: {str(e)}")
            
        bucket_name = os.environ.get('FIREBASE_STORAGE_BUCKET', '')
        cred = credentials.Certificate(creds_dict)
        
        if bucket_name:
            firebase_admin.initialize_app(cred, {'storageBucket': bucket_name})
        else:
            firebase_admin.initialize_app(cred)
            
    db = firestore.client()
    try:
        bucket = storage.bucket() if os.environ.get('FIREBASE_STORAGE_BUCKET') else None
    except Exception:
        bucket = None
        
    return db, bucket

def process_and_upload_images(images_dict, gift_id, bucket):
    processed_images = {}
    for key, base64_str in images_dict.items():
        if not base64_str or not isinstance(base64_str, str):
            continue
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
                print(f"Storage upload failed: {e}")
        processed_images[str(key)] = base64_str
    return processed_images

@app.route('/api/create-order', methods=['POST'])
def create_order():
    try:
        client = get_razorpay_client()
        razorpay_order = client.order.create({
            "amount": 9900,
            "currency": "INR",
            "payment_capture": 1
        })
        return jsonify({'id': razorpay_order['id']}), 200
    except Exception as e:
        return jsonify({'error': f"Payment Initialization Failed: {str(e)}"}), 500

@app.route('/api/verify-and-generate-link', methods=['POST'])
def verify_payment():
    data = request.json or {}
    try:
        # 1. Verify Payment Signature
        client = get_razorpay_client()
        client.utility.verify_payment_signature({
            'razorpay_order_id': data.get('order_id', ''),
            'razorpay_payment_id': data.get('payment_id', ''),
            'razorpay_signature': data.get('signature', '')
        })

        # 2. Connect to Database
        db, _ = get_db_and_bucket()
        
        # 3. Retrieve pre-generated ID and URLs from Phase 1
        unique_gift_id = data.get('gift_id')
        final_images = data.get('images', {})
        
        if not unique_gift_id:
            raise ValueError("Gift ID is missing from the payload.")
        
        # 4. Save to Firestore
        doc_data = {
            'order_id': data.get('order_id'),
            'payment_id': data.get('payment_id'),
            'partner_name': data.get('partner_name', 'Someone Special'),
            'user_name': data.get('user_name', ''),
            'envelope_msg': data.get('envelope_msg', ''),
            'main_wish': data.get('main_wish', ''),
            'audio_link': data.get('audio_link', ''),
            'scratch_msgs': data.get('scratch_msgs', {}),
            'images': final_images,
            'created_at': datetime.datetime.utcnow(),
            'status': 'paid_and_secured'
        }
        
        db.collection('magical_gifts').document(unique_gift_id).set(doc_data)
        
        frontend_url = os.environ.get('FRONTEND_URL', 'https://10petalx.vercel.app').rstrip('/')
        gift_link = f"{frontend_url}/?gift={unique_gift_id}"
        
        return jsonify({'status': 'success', 'link': gift_link}), 200
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print("CRITICAL BACKEND ERROR:")
        print(error_trace) 
        return jsonify({'status': 'failed', 'error': str(e), 'trace': error_trace}), 500
        
@app.route('/api/get-gift/<gift_id>', methods=['GET'])
def get_gift(gift_id):
    try:
        db, _ = get_db_and_bucket()
        doc_ref = db.collection('magical_gifts').document(gift_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            
            # 👇 FIX: Convert the Firestore datetime to a string so JSON doesn't crash!
            if 'created_at' in data:
                data['created_at'] = str(data['created_at'])
                
            return jsonify({'status': 'success', 'data': data}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Surprise link not found.'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST'])
def catch_all(path):
    return jsonify({"error": "API route not found."}), 404
@app.route('/api/config', methods=['GET'])
def get_config():
    # Only expose the safe KEY_ID. Never expose the KEY_SECRET!
    return jsonify({
        'razorpay_key_id': os.environ.get('RAZORPAY_KEY_ID', '')
    }), 200
    
if __name__ == '__main__':
    app.run(debug=True)
    
