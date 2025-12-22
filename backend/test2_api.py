import requests
import threading
import time

BASE_URL = "http://localhost:5000"
SESSION = requests.Session()

def setup():
    print("--- 0. 初始化環境 ---")
    # 1. 登入
    login_payload = {"username": "test_player_1", "password": "my_secret_password"}
    resp = SESSION.post(f"{BASE_URL}/login", json=login_payload)
    if resp.status_code != 200:
        # 若無帳號則註冊
        SESSION.post(f"{BASE_URL}/register", json={"username": "test_player_1", "password": "my_secret_password"})
        SESSION.post(f"{BASE_URL}/login", json=login_payload)
    
    # 2. 建立禮包碼
    SESSION.post(f"{BASE_URL}/setup_test_data")
    print("環境準備完成。\n")

def test_sqli():
    print("--- 測試 4: SQL Injection 防護 ---")
    # 攻擊 Payload: 嘗試用 ' OR '1'='1 繞過驗證
    payload = {"username": "admin' OR '1'='1", "password": "anything"}
    response = requests.post(f"{BASE_URL}/admin/login", json=payload)
    
    print(f"攻擊 Payload: {payload['username']}")
    print(f"結果狀態: {response.status_code}")
    if response.status_code == 401:
        print("✅ 防禦成功！SQL Injection 無效。")
    else:
        print("❌ 防禦失敗！駭客登入了。")
    print("\n")

def test_data_masking():
    print("--- 測試 5: 資料隱碼 (Data Masking) ---")
    response = SESSION.get(f"{BASE_URL}/profile")
    data = response.json()
    
    print(f"回傳資料: {data}")
    if "password_hash" not in data:
        print("✅ 防禦成功！未發現敏感欄位 (password_hash)。")
    else:
        print("❌ 防禦失敗！密碼 Hash 外洩了。")
    print("\n")

def redeem_attack(results):
    """ 多執行緒攻擊用的函式 """
    try:
        resp = SESSION.post(f"{BASE_URL}/redeem", json={"code": "WELCOME2025"})
        results.append(resp.status_code)
    except:
        pass

def test_race_condition():
    print("--- 測試 3: 並發漏洞 (Race Condition) ---")
    print("正在同時發送 10 個兌換請求...")
    
    threads = []
    results = []
    
    # 啟動 10 個執行緒同時搶禮包
    for _ in range(10):
        t = threading.Thread(target=redeem_attack, args=(results,))
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
        
    # 統計結果
    success_count = results.count(200)
    fail_count = results.count(400)
    
    print(f"總請求數: 10, 成功兌換次數: {success_count}, 失敗次數: {fail_count}")
    
    if success_count == 1:
        print("✅ 防禦成功！禮包碼只被領取了一次。")
    else:
        print(f"❌ 防禦失敗！禮包碼被重複領取了 {success_count} 次。")

if __name__ == "__main__":
    setup()
    test_sqli()
    test_data_masking()
    test_race_condition()