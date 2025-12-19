from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    gems = db.Column(db.Integer, default=1000)      # 鑽石餘額
    balance = db.Column(db.Integer, default=5000)   # 充值帳戶餘額 (用於邏輯漏洞演示)
    is_admin = db.Column(db.Boolean, default=False) # 權限管理 (用於 IDOR 演示)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    rarity = db.Column(db.String(10), nullable=False) # N, R, SR, SSR

class Inventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    obtained_at = db.Column(db.DateTime, default=datetime.utcnow)

class CouponUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    code = db.Column(db.String(20), nullable=False) # 用於 Race Condition 演示
    __table_args__ = (db.UniqueConstraint('user_id', 'code', name='_user_coupon_uc'),)
