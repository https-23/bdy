import os
import json
import uuid
import sys
import datetime
import traceback
import logging 
import requests # 🚀 ADDED: Required for making secure calls to ImgBB
from unittest.mock import MagicMock
from flask import Flask, request, jsonify

app = Flask(__name__)

# ⚡ CONFIGURE STRUCTURED LOGGING
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

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

# ⚡ SERVERLESS GLOBAL CACHING
cached_razorpay = None
cached_db = None

def get_razorpay_client():
    global cached_razorpay
    if cached_razorpay:
        return cached_razorpay
        
    import razorpay
    key_id = os.environ.get('RAZORPAY_KEY_ID')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
    if not key_id or not key_secret:
        raise ValueError("Razorpay API keys are missing in Vercel Environment Variables.")
        
    cached_razorpay = razorpay.Client(auth=(key_id, key_secret))
    return cached_razorpay

def get_db():
    global cached_db
    if cached_db:
        return cached_db
        
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    if not firebase_admin._apps:
        firebase_creds = os.environ.get('FIREBASE_CREDENTIALS')
        if not firebase_creds:
            raise ValueError("FIREBASE_CREDENTIALS missing in Vercel Environment Variables.")
        
        try:
            if firebase_creds.startswith("'") and firebase_creds.endswith("'"):
                firebase_creds = firebase_creds[1:-1]
            
            creds_dict = json.loads(firebase_creds, strict=False)
            
            if 'private_key' in creds_dict:
                creds_dict['private_key'] = creds_dict['private_key'].replace('\\n', '\n')
                
        except Exception as e:
            raise ValueError(f"Failed to parse Firebase JSON. Ensure it is a valid JSON string: {str(e)}")
            
        cred = credentials.Certificate(creds_dict)
        firebase_admin.initialize_app(cred)
            
    cached_db = firestore.client()
    return cached_db

# 🛡️ FIRESTORE SCHEMA VALIDATION (Updated for direct Base64 storage)
def validate_gift_payload(data):
    if len(str(data.get('partner_name', ''))) > 50:
        raise ValueError("Partner name exceeds 50 characters.")
    if len(str(data.get('user_name', ''))) > 50:
        raise ValueError("Your name exceeds 50 characters.")
    if len(str(data.get('envelope_msg', ''))) > 150:
        raise ValueError("Envelope message exceeds 150 characters.")
    if len(str(data.get('main_wish', ''))) > 2500:
        raise ValueError("Main wish exceeds the maximum allowed length.")
    if len(str(data.get('audio_link', ''))) > 500:
        raise ValueError("Audio link is too long.")
    
    scratch_msgs = data.get('scratch_msgs', {})
    if not isinstance(scratch_msgs, dict):
        raise ValueError("Invalid scratch messages format.")
    if len(scratch_msgs) > 4:
        raise ValueError("Maximum 4 scratch messages allowed.")
        
    images = data.get('images', {})
    if not isinstance(images, dict) or len(images) > 4:
        raise ValueError("Invalid image payload. Maximum 4 images allowed.")
        
    for key, img_url in images.items():
        if img_url and len(str(img_url)) > 2000: 
            raise ValueError(f"Image link rejected. Payload size limit exceeded.")
            
    return True

# 🚀 CORE API ROUTES
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'environment': 'vercel-serverless'
    }), 200

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify({
        'razorpay_key_id': os.environ.get('RAZORPAY_KEY_ID', '')
    }), 200

# 🚀 NEW ENDPOINT: SECURE IMAGE UPLOAD PROXY
@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    try:
        data = request.json
        base64_image = data.get('image')
        
        if not base64_image:
            return jsonify({'error': 'No image provided'}), 400
            
        imgbb_key = os.environ.get('IMGBB_API_KEY')
        if not imgbb_key:
            return jsonify({'error': 'Server configuration error'}), 500
            
        # Send to ImgBB securely from the backend (10s timeout prevents hanging)
        response = requests.post(
            "https://api.imgbb.com/1/upload",
            data={
                "key": imgbb_key,
                "image": base64_image
            },
            timeout=10 
        )
        
        result = response.json()
        
        if result.get('success'):
            return jsonify({'success': True, 'url': result['data']['url']}), 200
        else:
            if response.status_code == 429:
                return jsonify({'error': 'Servers are busy with too much magic! Please try again in 60 seconds.'}), 429
            return jsonify({'error': 'Cloud storage rejected the image.', 'details': result}), 400
            
    except Exception as e:
        logger.error(f"Image Upload Error: {str(e)}")
        return jsonify({'error': 'Failed to connect to image server.'}), 500

@app.route('/api/create-order', methods=['POST'])
def create_order():
    try:
        data = request.json or {}
        validate_gift_payload(data)
        
        client = get_razorpay_client()
        razorpay_order = client.order.create({
            "amount": 2900, # 🚀 CHANGED: Now set to ₹29
            "currency": "INR",
            "payment_capture": 1
        })
        
        order_id = razorpay_order['id']
        gift_id = str(uuid.uuid4())
        
        db = get_db()
        doc_data = {
            'order_id': order_id,
            'partner_name': data.get('partner_name', 'Someone Special'),
            'user_name': data.get('user_name', ''),
            'envelope_msg': data.get('envelope_msg', ''),
            'main_wish': data.get('main_wish', ''),
            'audio_link': data.get('audio_link', ''),
            'scratch_msgs': data.get('scratch_msgs', {}),
            'images': data.get('images', {}),
            'created_at': datetime.datetime.utcnow(),
            'status': 'payment_pending' 
        }
        db.collection('magical_gifts').document(gift_id).set(doc_data)

        return jsonify({'id': order_id, 'gift_id': gift_id}), 200
        
    except ValueError as ve:
        logger.error(f"Validation Error: {str(ve)}")
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        logger.error(f"Order Creation Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-and-generate-link', methods=['POST'])
def verify_payment():
    data = request.json or {}
    try:
        client = get_razorpay_client()
        client.utility.verify_payment_signature({
            'razorpay_order_id': data.get('order_id', ''),
            'razorpay_payment_id': data.get('payment_id', ''),
            'razorpay_signature': data.get('signature', '')
        })

        unique_gift_id = data.get('gift_id')
        
        if not unique_gift_id:
            raise ValueError("Gift ID is missing from the payload.")
            
        validate_gift_payload(data)
        
        db = get_db()
        db.collection('magical_gifts').document(unique_gift_id).update({
            'payment_id': data.get('payment_id'),
            'status': 'paid_and_secured'
        })
        
        frontend_url = os.environ.get('FRONTEND_URL', 'https://10petalx.vercel.app').rstrip('/')
        gift_link = f"{frontend_url}/?gift={unique_gift_id}"
        
        return jsonify({'status': 'success', 'link': gift_link}), 200
        
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Payment Verification Failed: {str(e)}")
        logger.error(f"Traceback: {error_trace}") 
        return jsonify({'status': 'failed', 'error': str(e), 'trace': error_trace}), 500

@app.route('/api/webhook/razorpay', methods=['POST'])
def razorpay_webhook():
    webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET')
    webhook_signature = request.headers.get('X-Razorpay-Signature')
    
    try:
        client = get_razorpay_client()
        client.utility.verify_webhook_signature(
            request.get_data(as_text=True), 
            webhook_signature, 
            webhook_secret
        )
        
        payload = request.json
        if payload['event'] == 'order.paid':
            order_id = payload['payload']['order']['entity']['id']
            payment_id = payload['payload']['payment']['entity']['id']
            
            db = get_db()
            docs = db.collection('magical_gifts').where('order_id', '==', order_id).limit(1).stream()
            
            for doc in docs:
                logger.info(f"Webhook received! Order {order_id} has been paid successfully.")
                doc.reference.update({
                    'status': 'paid_and_secured',
                    'payment_id': payment_id
                })
                
        return jsonify({'status': 'ok'}), 200
        
    except Exception as e:
        logger.error(f"Webhook Integrity Error: {str(e)}")
        return jsonify({'error': 'Invalid Signature or Server Error'}), 400

@app.route('/api/get-gift/<gift_id>', methods=['GET'])
def get_gift(gift_id):
    try:
        db = get_db()
        doc_ref = db.collection('magical_gifts').document(gift_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            if 'created_at' in data:
                data['created_at'] = str(data['created_at'])
            return jsonify({'status': 'success', 'data': data}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Surprise link not found.'}), 404
    except Exception as e:
        logger.error(f"Error fetching gift: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST'])
def catch_all(path):
    return jsonify({"error": "API route not found."}), 404

if __name__ == '__main__':
    app.run(debug=True)
