#這一段代碼將 Flask、Database、Bcrypt 全部綁定在一起。
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from config import Config

# 初始化套件
db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # 綁定套件
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    CORS(app) # 允許前端跨網域請求

    # 註冊路由 (Blueprint)
    from .routes import main_bp
    app.register_blueprint(main_bp)

    # 建立資料庫 (若不存在)
    with app.app_context():
        db.create_all()

    return app