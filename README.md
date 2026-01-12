# SecureVault - Gacha Hell 抽卡安全模擬器

## 專案概述
本專案模擬一個具有多重資安防護的「無良手遊」抽卡網站。核心目的是演示常見的 Web 漏洞（SQLi, IDOR, Race Condition）及其對應的後端與前端安全防護實作。

## 團隊分工 (五人戰鬥編組)
- **M1 (架構組長)**: 負責 Docker 基建、CI/CD 流程、Git 分支管理。
- **M2 (後端工程)**: 實作 5 個後端安全設計 (Bcrypt, SQLAlchemy)。
- **M3 (前端工程)**: 實作 3 個前端安全設計 (XSS 防禦, Route Guard)。
- **M4 (資安測試)**: 負責漏洞攻擊演示錄影與日誌稽核。
- **M5 (文檔後製)**: 撰寫專案報告、README 與影片剪輯。

## 快速啟動 
**A.(Docker 部署)**
1. 確保已安裝 Docker 與 Docker Compose。
2. 執行：`docker-compose up --build`。
3. 前端首頁：`http://localhost:3000`。
4. 後端 API：`http://localhost:5000`。

**B. 本地開發啟動**
1. 進入後端目錄:`cd backend`。
2. 安裝必要套件:`pip install flask-cors`。
3. 啟動後端連線:`python run.py`。
## 資安防禦亮點
- **CI/CD**: 集成 GitHub Actions (CodeQL) 進行自動化原始碼掃描。
- **後端**: 實作密碼雜湊、參數化查詢、並發控制。
- **前端**: 防止 DOM-based XSS 與路由非法存取。
