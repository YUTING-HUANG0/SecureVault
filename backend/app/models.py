#入了 set_password 和 check_password 方法
# 這是評分表中「密碼 Hash」的實作基礎
from . import db, bcrypt
from flask_login import UserMixin
from datetime import datetime

# 1. 玩家資料表 (User)
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    # 這裡存的是 Hash 過的亂碼，不是明文密碼！
    password_hash = db.Column(db.String(128), nullable=False)
    nickname = db.Column(db.String(80))
    diamonds = db.Column(db.Integer, default=0)  # 攻擊目標：邏輯漏洞
    is_admin = db.Column(db.Boolean, default=False)
    
    cards = db.relationship('Card', backref='owner', lazy=True)

    # 設定密碼時自動加密
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    # 驗證密碼
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "nickname": self.nickname,
            "diamonds": self.diamonds,
            "is_admin": self.is_admin
        }

# 2. 卡片資料表 (Card)
class Card(db.Model):
    __tablename__ = 'cards'
    
    id = db.Column(db.Integer, primary_key=True)
    card_name = db.Column(db.String(100), nullable=False)
    rarity = db.Column(db.String(10), nullable=False) # N, R, SR, SSR
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "card_name": self.card_name,
            "rarity": self.rarity,
            "owner_id": self.owner_id
        }

# 3. 禮包碼資料表 (Coupon)
class Coupon(db.Model):
    __tablename__ = 'coupons'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.Integer, default=1000)
    is_used = db.Column(db.Boolean, default=False) # Race Condition 攻擊點

# --- 補上這段 User Loader --- 
from . import login_manager

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))