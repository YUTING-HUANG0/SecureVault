from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, User, Card, Inventory, Coupon
import random

app = Flask(__name__)

# --- 設定資料庫 (使用本地 SQLite) ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gacha.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 1. 啟用 CORS
CORS(app) 

# 初始化資料庫
db.init_app(app)

# --- 資料庫初始化與播種 (Seeding) ---
def init_db():
    with app.app_context():
        db.create_all() # 根據 models.py 建立表格
        
        # 1. 檢查是否需要建立卡池
        if Card.query.count() == 0:
            print("初始化卡池資料...")
            cards_data = [
                {"name": "N 史萊姆", "rarity": "N"},
                {"name": "N 骷髏兵", "rarity": "N"},
                {"name": "R 皇家衛兵", "rarity": "R"},
                {"name": "R 元素法師", "rarity": "R"},
                {"name": "SR 暗影刺客", "rarity": "SR"},
                {"name": "SR 機械戰神", "rarity": "SR"},
                {"name": "SSR 傳說巨龍", "rarity": "SSR"},
                {"name": "SSR 魔界君主", "rarity": "SSR"},
            ]
            for c in cards_data:
                db.session.add(Card(name=c['name'], rarity=c['rarity']))
            db.session.commit()

        # 2. 檢查是否需要建立管理員
        if not User.query.filter_by(username='admin').first():
            print("建立預設管理員 (admin)...")
            admin = User(username='admin', gems=100) # 預設 100 鑽
            admin.set_password('123456') # 會自動 hash
            db.session.add(admin)
            db.session.commit()

# --- API 路由實作 ---

@app.route('/')
def index():
    return jsonify({"status": "success", "message": "Gacha Hell Backend is Online!"})

# 1. 登入 API
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('user')
    password = data.get('pass')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        return jsonify({
            "success": True,
            "token": str(user.id), 
            "message": "登入成功"
        })
    else:
        return jsonify({"success": False, "message": "帳號或密碼錯誤"}), 401

# 2. 取得個人資料
@app.route('/api/profile', methods=['GET'])
def get_profile():
    token = request.headers.get('Authorization')
    
    if not token or not token.isdigit():
        return jsonify({"success": False, "message": "無效的 Token，請重新登入"}), 401
    
    user = User.query.get(int(token))
    if not user:
        return jsonify({"success": False, "message": "無效的用戶"}), 401

    inventory_list = []
    for item in user.inventory:
        # 防呆：避免背包裡有 ID 但卡池已經被刪掉的情況
        card = Card.query.get(item.card_id)
        if card:
            inventory_list.append({
                "id": item.id,
                "name": card.name,
                "rarity": card.rarity,
                "color": "gold" if card.rarity == 'SSR' else ("#d946ef" if card.rarity == 'SR' else ("#3b82f6" if card.rarity == 'R' else "#888")),
                "icon": "fa-dragon" if card.rarity == 'SSR' else "fa-ghost"
            })

    return jsonify({
        "success": True,
        "diamonds": user.gems,
        "inventory": inventory_list
    })

# 3. 抽卡 API (含安全防崩潰機制)
@app.route('/api/gacha', methods=['POST'])
def gacha():
    token = request.headers.get('Authorization')

    if not token or not token.isdigit():
        return jsonify({"success": False, "message": "請先登入"}), 401

    user = User.query.get(int(token))
    if not user:
        return jsonify({"success": False, "message": "用戶不存在"}), 401
    
    cost = 100
    if user.gems < cost:
        return jsonify({"success": False, "message": "鑽石不足"}), 400

    # --- 🔥 安全版抽卡邏輯 🔥 ---
    rand = random.randint(1, 100)
    if rand > 15: target_rarity = 'SSR'
    elif rand > 25: target_rarity = 'SR'
    elif rand > 30: target_rarity = 'R'
    else: target_rarity = 'N'

    # 從資料庫撈卡片
    pool = Card.query.filter_by(rarity=target_rarity).all()
    
    #  關鍵修復：如果該稀有度沒卡片，就改抽 N 卡 (避免崩潰)
    if not pool:
        print(f"警告：找不到 {target_rarity} 的卡片，降級為 N 卡")
        pool = Card.query.filter_by(rarity='N').all()
    
    #  二度防護：如果連 N 卡都沒有 (資料庫全空)，回傳錯誤
    if not pool:
        return jsonify({"success": False, "message": "系統錯誤：卡池是空的！請聯繫管理員"}), 500

    won_card = random.choice(pool)
    
    # 扣款
    user.gems -= cost

    # 存入背包
    new_item = Inventory(user_id=user.id, card_id=won_card.id)
    db.session.add(new_item)
    db.session.commit()

    card_data = {
        "name": won_card.name,
        "rarity": won_card.rarity,
        "color": "gold" if won_card.rarity == 'SSR' else ("#d946ef" if won_card.rarity == 'SR' else ("#3b82f6" if won_card.rarity == 'R' else "#888")),
        "icon": "fa-dragon" if won_card.rarity == 'SSR' else "fa-ghost"
    }

    return jsonify({
        "success": True,
        "diamonds": user.gems,
        "card": card_data,
        "message": f"獲得 {won_card.name}"
    })

# 4. 儲值 API
@app.route('/api/store', methods=['POST'])
def store():
    data = request.json
    amount = int(data.get('amount', 0))
    user = User.query.filter_by(username='admin').first()
    
    user.gems += amount
    db.session.commit()

    return jsonify({
        "success": True,
        "diamonds": user.gems,
        "message": f"交易成功，目前餘額: {user.gems}"
    })
# 新增：清空鑽石 API
@app.route('/api/reset', methods=['POST'])
def reset_gems():
    # 直接把 admin 的鑽石歸零
    user = User.query.filter_by(username='admin').first()
    user.gems = 0
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "diamonds": user.gems, 
        "message": " 鑽石已全數銷毀！"
    })
   # 修改 /api/delete 接口
@app.route('/api/delete', methods=['POST'])
def delete_card():
    token = request.headers.get('Authorization')
    if not token or not token.isdigit():
        return jsonify({"success": False, "message": "請先登入"}), 401

    user = User.query.get(int(token))
    if not user:
        return jsonify({"success": False, "message": "用戶不存在"}), 401

    data = request.json
    target_id = data.get('id')
    item = Inventory.query.get(target_id)

    if not item:
        return jsonify({"success": False, "message": "找不到該卡片"}), 404

    if item.user_id != user.id:
        return jsonify({"success": False, "message": "權限不足"}), 403
    card_info = Card.query.get(item.card_id)
    if card_info.rarity == 'SSR':
        # 如果是 SSR，回傳 403 禁止刪除
        return jsonify({
            "success": False, 
            "message": " 系統警告：SSR 卡片受「防誤刪協定」保護，無法執行刪除！"
        }), 403
    db.session.delete(item)
    db.session.commit()

    return jsonify({"success": True, "message": f"卡片 (ID: {target_id}) 已銷毀"})
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 