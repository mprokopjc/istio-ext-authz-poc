# api-service.py
from flask import Flask, request, jsonify
import jwt

app = Flask(__name__)

SECRET_KEY = "some-secret-key"

@app.route('/api/protected', methods=['GET'])
def api():
    auth_header = request.headers.get('Authorization')
    if auth_header:
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            return jsonify({'message': f'Hello, {payload["user"]}!'})
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
    else:
        return jsonify({'message': 'Authorization header missing'}), 401

# represents legacy API not protected by Istio Ext Authorizer
@app.route('/api/legacy', methods=['GET'])
def api():
    # return 200 OK with Authorization header value
    return jsonify({'message': f'Authorization was {request.headers.get('Authorization')}'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)