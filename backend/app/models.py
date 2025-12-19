from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False) # 儲存 Bcrypt 雜湊值
    gems = db.Column(db.Integer, default=1000)
    
    # 建立與背包的關聯
    inventory = db.relationship('Inventory', backref='owner', lazy=True)

    def set_password(self, password):
        """將明文密碼轉換為雜湊儲存 (M2 安全設計 1)"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """驗證雜湊密碼"""
        return check_password_hash(self.password_hash, password)

class Card(db.Model):
    __tablename__ = 'cards'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    rarity = db.Column(db.String(10), nullable=False) # N, R, SR, SSR

class Inventory(db.Model):
    __tablename__ = 'inventories'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=False)
    obtained_at = db.Column(db.DateTime, default=datetime.utcnow)

class Coupon(db.Model):
    """用於演示 Race Condition 的禮包碼系統 (M2 安全設計 3)"""
    __tablename__ = 'coupons'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    is_used = db.Column(db.Boolean, default=False)
