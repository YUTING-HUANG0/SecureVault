#這符合「程式安全」要求，避免將密鑰寫死。
import os
from dotenv import load_dotenv

# 載入 .env 檔案中的環境變數
load_dotenv()

class Config:
    # 這是 Flask 的加密金鑰，絕對不能外洩，從環境變數讀取
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-do-not-use-in-prod'
    
    # 資料庫連線設定 (使用 SQLite 作為本地測試)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///gacha.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False