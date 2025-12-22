#呼叫我們新的 create_app
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

# from flask import Flask, jsonify
# app = Flask(__name__)
# @app.route('/')
# def index():
#     return jsonify({"status": "success", "message": "SecureVault Backend is running!"})
# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, debug=True)
