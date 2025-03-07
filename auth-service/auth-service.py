from flask import Flask, request, jsonify
import jwt
import datetime

app = Flask(__name__)

SECRET_KEY = "some-secret-key"

@app.route('/authorize/api', methods=['GET'])
def authorize():
    print("Received GET /authrize request!")
    # Simple authentication logic (replace with your actual logic)
    if 'Authorization' in request.headers and request.headers['Authorization'] == 'Bearer valid-token':
        # Generate JWT
        payload = {
            'user': 'test-user',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        print("Replying 200 with JWT!")
        return jsonify({}), 200, {
            'Authorization': f'Bearer {token}'
        }
    else:
        print("Replying 401 due to invalid token in Authorizatio header!")
        return jsonify({'message': 'Unauthorized'}), 401

if __name__ == '__main__':
    print("Starting auth-service!")
    app.run(host='0.0.0.0', port=5002)