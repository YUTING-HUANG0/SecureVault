import requests

BASE_URL = "http://localhost:5000"
SESSION = requests.Session() # 使用 Session 來保持登入狀態

def step1_login():
    print("--- 1. 登入 (獲取 Session) ---")
    url = f"{BASE_URL}/login"
    # 使用之前註冊好的帳號 (如果被清空了，請先執行註冊)
    payload = {"username": "test_player_1", "password": "my_secret_password"}
    
    response = SESSION.post(url, json=payload)
    print(f"狀態: {response.status_code}, 回應: {response.json()}")
    if response.status_code != 200:
        # 如果登入失敗，嘗試註冊
        print("登入失敗，嘗試註冊...")
        SESSION.post(f"{BASE_URL}/register", json={"username": "test_player_1", "password": "my_secret_password", "nickname": "Hero"})
        response = SESSION.post(url, json=payload)

def step2_test_logic_flaw():
    print("\n--- 2. 測試邏輯漏洞 (嘗試負數充值) ---")
    url = f"{BASE_URL}/recharge"
    
    # 攻擊：嘗試充值 -10000 鑽石
    payload = {"amount": -10000}
    response = SESSION.post(url, json=payload)
    
    print(f"攻擊 payload: {payload}")
    print(f"狀態: {response.status_code}")
    print(f"回應: {response.json()}")
    
    if response.status_code == 400:
        print("✅ 防禦成功！系統拒絕了負數充值。")
    else:
        print("❌ 防禦失敗！駭客成功修改了數值。")

def step3_test_idor():
    print("\n--- 3. 測試 IDOR (嘗試賣掉不存在或別人的卡) ---")
    # 先隨便猜一個卡片 ID (例如 9999)
    target_card_id = 9999
    url = f"{BASE_URL}/sell_card"
    
    payload = {"card_id": target_card_id}
    response = SESSION.post(url, json=payload)
    
    print(f"攻擊目標卡片 ID: {target_card_id}")
    print(f"狀態: {response.status_code}")
    print(f"回應: {response.json()}")
    
    if response.status_code == 403:
        print("✅ 防禦成功！系統拒絕存取非使用者的卡片。")
    else:
        print("❌ 防禦失敗！")

def step4_normal_recharge():
    print("\n--- 4. 正常功能測試 (充值 1000) ---")
    SESSION.post(f"{BASE_URL}/recharge", json={"amount": 1000})
    print("充值完成。")

if __name__ == "__main__":
    try:
        step1_login()
        step2_test_logic_flaw()
        step3_test_idor()
        step4_normal_recharge()
    except Exception as e:
        print(f"發生錯誤: {e}")