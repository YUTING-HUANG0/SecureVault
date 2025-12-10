from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return "<h1>SecureVault System Online</h1><p>專案基礎建置成功！</p>"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
