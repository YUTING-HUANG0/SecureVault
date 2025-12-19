# SecureVault - 安全手遊抽卡模擬器

## 專案概述
本專案為資安期末專題，模擬具有多重安全防護的 Gacha 系統。

## 技術棧
- **前端**: Vue.js 3
- **後端**: Python Flask
- **資料庫**: SQLite (SQLAlchemy ORM)
- **部署**: Docker Compose
- **資安分析**: GitHub Actions (CodeQL)

## 快速啟動
1. 確保已安裝 Docker。
2. 執行指令：`docker-compose up --build`
3. 前端網址：http://localhost:3000
4. 後端 API：http://localhost:5000

## 開發規範
- 請所有組員在 **develop** 分支進行開發。
- 嚴禁將敏感資訊 (API Keys, Token) 直接寫入代碼。
