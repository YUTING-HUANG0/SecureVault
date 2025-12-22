from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from . import db
from .models import User

# 建立一個 Blueprint (藍圖)，管理所有的 API 路徑
main_bp = Blueprint('main', __name__)

# --- 測試首頁 ---
@main_bp.route('/')
def index():
    return jsonify({
        "message": "SecureVault Gacha System Online",
        "status": "running"
    })

# --- 功能 1: 使用者註冊 (含密碼加密) ---
@main_bp.route('/register', methods=['POST'])
def register():
    # 1. 接收前端傳來的 JSON 資料
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    nickname = data.get('nickname', 'Player')

    # 2. 檢查必要欄位
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # 3. 檢查帳號是否重複 (SQLAlchemy 會自動防止 SQL Injection)
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    # 4. 建立新使用者
    new_user = User(username=username, nickname=nickname)
    
    # [資安重點] 這裡呼叫我們在 models.py 寫好的 set_password
    # 它會自動把密碼轉成亂碼 (Hash) 才存進去
    new_user.set_password(password)

    # 5. 存入資料庫
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully!"}), 201

# --- 功能 2: 使用者登入 ---
@main_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # 1. 找尋使用者
    user = User.query.filter_by(username=username).first()

    # 2. [資安重點] 驗證密碼 (檢查 Hash 是否匹配)
    if user and user.check_password(password):
        # 登入成功，記錄在 Session 中 (Flask-Login 功能)
        login_user(user)
        return jsonify({
            "message": "Login successful",
            "user": user.to_dict()
        }), 200
    
    return jsonify({"error": "Invalid username or password"}), 401

# --- 功能 3: 登出 ---
@main_bp.route('/logout', methods=['POST'])
@login_required # 只有登入的人才能登出
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200



import random
from .models import Card

# --- 輔助功能: 抽卡 (讓玩家有卡片可以賣) ---
@main_bp.route('/gacha', methods=['POST'])
@login_required
def gacha():
    # 簡單模擬：扣 100 鑽石，隨機抽一張卡
    if current_user.diamonds < 100:
        return jsonify({"error": "Not enough diamonds"}), 400
    
    current_user.diamonds -= 100
    
    # 隨機產生卡片
    rarity = random.choice(['N', 'R', 'SR', 'SSR'])
    new_card = Card(
        card_name=f"Monster-{random.randint(100, 999)}", 
        rarity=rarity, 
        owner_id=current_user.id
    )
    
    db.session.add(new_card)
    db.session.commit()
    
    return jsonify({
        "message": f"You got {rarity} card!", 
        "card": new_card.to_dict(),
        "diamonds_left": current_user.diamonds
    })

# ==========================================
# 🛡️ 安全設計 1: 邏輯漏洞防護 (負數充值)
# ==========================================
@main_bp.route('/recharge', methods=['POST'])
@login_required
def recharge():
    data = request.get_json()
    amount = data.get('amount', 0)

    # ❌ [漏洞版程式碼] (M4 攻擊演示時，把下面註解打開，把安全版註解掉)
    # 駭客傳送 amount: -10000，系統直接加總，導致鑽石不減反增(或邏輯崩壞)
    # current_user.diamonds += amount
    
    # ✅ [安全版程式碼] (M2 交作業重點)
    # 必須嚴格檢查數值是否為正整數
    if not isinstance(amount, int) or amount <= 0:
        return jsonify({"error": "Invalid amount! Must be positive."}), 400
        
    current_user.diamonds += amount
    db.session.commit()

    return jsonify({
        "message": f"Successfully recharged {amount} diamonds.",
        "current_diamonds": current_user.diamonds
    })

# ==========================================
# 🛡️ 安全設計 2: IDOR 越權防護 (偷賣別人的卡)
# ==========================================
@main_bp.route('/sell_card', methods=['POST'])
@login_required
def sell_card():
    data = request.get_json()
    card_id = data.get('card_id')

    # ❌ [漏洞版程式碼] (M4 攻擊演示用)
    # 只檢查卡片存在，沒檢查「主人是誰」，導致可以賣掉別人的卡
    # card = Card.query.get(card_id)
    # if not card: return jsonify({"error": "Card not found"}), 404
    
    # ✅ [安全版程式碼] (M2 交作業重點)
    # 查詢時加上 owner_id=current_user.id，確保只能操作自己的卡
    card = Card.query.filter_by(id=card_id, owner_id=current_user.id).first()
    
    if not card:
        return jsonify({"error": "Card not found or you do not own this card"}), 403

    # 賣掉卡片換 50 鑽石
    current_user.diamonds += 50
    db.session.delete(card)
    db.session.commit()

    return jsonify({"message": "Card sold successfully", "diamonds": current_user.diamonds})



from sqlalchemy import text # 用來演示 SQL Injection 的漏洞寫法
from .models import Coupon

# --- 輔助功能: 快速建立測試用禮包碼 ---
@main_bp.route('/setup_test_data', methods=['POST'])
def setup_test_data():
    # 如果資料庫沒有禮包碼，就建立一個 WELCOME2025
    if not Coupon.query.filter_by(code="WELCOME2025").first():
        coupon = Coupon(code="WELCOME2025", value=1000, is_used=False)
        db.session.add(coupon)
        db.session.commit()
        return jsonify({"message": "Coupon WELCOME2025 created!"})
    return jsonify({"message": "Coupon already exists."})

# ==========================================
# 🛡️ 安全設計 3: 並發漏洞防護 (Race Condition)
# ==========================================
@main_bp.route('/redeem', methods=['POST'])
@login_required
def redeem():
    data = request.get_json()
    code = data.get('code')
    
    # ❌ [漏洞版程式碼] (M4 攻擊演示用：先查詢，再更新，中間有時間差)
    # coupon = Coupon.query.filter_by(code=code).first()
    # if not coupon: return jsonify({"error": "Invalid code"}), 400
    # if coupon.is_used: return jsonify({"error": "Already used"}), 400
    # # --- 駭客就在這裡同時發送 100 個請求 ---
    # coupon.is_used = True
    # current_user.diamonds += coupon.value
    # db.session.commit()

    # ✅ [安全版程式碼] (M2 交作業重點：原子操作 Atomic Update)
    # 利用資料庫的 update 指令回傳「影響行數」，只有第一個搶到的請求會回傳 1
    rows_affected = Coupon.query.filter_by(code=code, is_used=False).update({"is_used": True})
    
    if rows_affected == 0:
        return jsonify({"error": "Coupon invalid or already used"}), 400

    # 搶到了鎖，才發錢
    coupon = Coupon.query.filter_by(code=code).first()
    current_user.diamonds += coupon.value
    db.session.commit()

    return jsonify({"message": f"Redeemed {coupon.value} diamonds!", "diamonds": current_user.diamonds})

# ==========================================
# 🛡️ 安全設計 4: SQL Injection 防護
# ==========================================
@main_bp.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # ❌ [漏洞版程式碼] (M4 攻擊演示用：直接字串串接)
    # sql = text(f"SELECT * FROM users WHERE username = '{username}' AND is_admin = 1")
    # result = db.session.execute(sql).fetchone()
    # if result: return jsonify({"message": "Admin Login Success (SQLi Vulnerable!)"})

    # ✅ [安全版程式碼] (M2 交作業重點：使用 ORM 參數化查詢)
    user = User.query.filter_by(username=username, is_admin=True).first()

    if user and user.check_password(password):
        login_user(user)
        return jsonify({"message": "Admin Login Success"})
    
    return jsonify({"error": "Invalid admin credentials"}), 401

# ==========================================
# 🛡️ 安全設計 5: 敏感資料隱碼 (Data Masking)
# ==========================================
@main_bp.route('/profile', methods=['GET'])
@login_required
def profile():
    # ❌ [漏洞版程式碼] (M4 攻擊演示用：不小心回傳了 password_hash)
    # return jsonify({
    #     "id": current_user.id,
    #     "username": current_user.username,
    #     "password_hash": current_user.password_hash, # 😱 絕對不行！
    #     "is_admin": current_user.is_admin,
    #     "diamonds": current_user.diamonds
    # })

    # ✅ [安全版程式碼] (M2 交作業重點：使用 DTO 過濾欄位)
    # 呼叫我們在 models.py 定義好的 to_dict()，只回傳安全資訊
    return jsonify(current_user.to_dict())