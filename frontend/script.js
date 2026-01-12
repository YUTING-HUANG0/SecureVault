// ==============================
// 0. 核心變數 & 資料
// ==============================
const API_URL = "http://localhost:5000/api";

let diamonds = 0;
let isSecureMode = false;
let pityCount = 0; // 保底計數器
const PITY_LIMIT = 15; // 保底門檻 
let myInventory = []; // 初始為空，等後端資料
const localCardPool = [
    { rarity: 'N', name: "N 史萊姆", icon: "fa-ghost", color: "#888", chance: 40 },
    { rarity: 'N', name: "N 骷髏兵", icon: "fa-skull", color: "#888", chance: 40 },
    { rarity: 'N', name: "N 哥布林", icon: "fa-frog", color: "#888", chance: 40 },
    { rarity: 'R', name: "R 皇家衛兵", icon: "fa-shield-halved", color: "#3b82f6", chance: 30 },
    { rarity: 'R', name: "R 元素法師", icon: "fa-hat-wizard", color: "#3b82f6", chance: 30 },
    { rarity: 'SR', name: "SR 暗影刺客", icon: "fa-user-ninja", color: "#d946ef", chance: 25 },
    { rarity: 'SR', name: "SR 機械戰神", icon: "fa-robot", color: "#d946ef", chance: 25 },
    { rarity: 'SSR', name: "SSR 傳說巨龍", icon: "fa-dragon", color: "gold", chance: 15 },
    { rarity: 'SSR', name: "SSR 魔界君主", icon: "fa-crown", color: "gold", chance: 15 }
];
// ==============================
// 1. 初始化與事件監聽
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 同步開關狀態
    const mainToggle = document.getElementById('securityToggle');
    if(mainToggle) isSecureMode = mainToggle.checked;

    // 2. 檢查是否已登入
    updateAuthUI();

    // 3. 嘗試從後端獲取最新資料 (如果已登入)
    const token = localStorage.getItem("auth_token");
    if(token) {
        fetchProfile(); 
    }

    updateModeUI();
});

// ==============================
// 2. UI 狀態管理
// ==============================

function syncSecurityMode(checkbox) {
    const mainToggle = document.getElementById('securityToggle');
    const loginToggle = document.getElementById('login-security-toggle');

    if (checkbox === mainToggle && loginToggle) loginToggle.checked = checkbox.checked;
    if (checkbox === loginToggle && mainToggle) mainToggle.checked = checkbox.checked;

    isSecureMode = checkbox.checked;
    updateModeUI();

    if(isSecureMode) showToast("防禦模式啟動", "success");
    else showToast("駭客模式啟動", "error");
}

function updateModeUI() {
    if(isSecureMode) document.body.classList.add('secure-mode');
    else document.body.classList.remove('secure-mode');
}

// --- 顯示/隱藏 主畫面邏輯 ---
function updateAuthUI() {
    const token = localStorage.getItem("auth_token");
    const loginBtn = document.getElementById('btn-nav-login');
    const logoutBtn = document.getElementById('btn-nav-logout');

    const landingPage = document.getElementById('landing-page');
    const gameContent = document.getElementById('game-content');

    if (token) {
        // [已登入]
        if(loginBtn) loginBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'inline-block';

        if(landingPage) landingPage.style.display = 'none';
        if(gameContent) gameContent.style.display = 'block';
    } else {
        // [未登入]
        if(loginBtn) loginBtn.style.display = 'inline-block';
        if(logoutBtn) logoutBtn.style.display = 'none';

        if(landingPage) landingPage.style.display = 'block';
        if(gameContent) gameContent.style.display = 'none';
    }
}

// ==============================
// 3. 雙欄式登入系統 (串接 API)
// ==============================

// --- 視窗控制 ---
function openLoginModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
    resetAuthPanel();
}

function closeLoginModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

// --- 面板狀態控制 ---
function resetAuthPanel() {
    const otpPanel = document.getElementById('otp-panel');
    if(otpPanel) otpPanel.classList.remove('active');

    const otpInput = document.getElementById('otp-input');
    if(otpInput) {
        otpInput.disabled = true;
        otpInput.value = "";
    }

    const btnOtp = document.getElementById('btn-otp-verify');
    if(btnOtp) {
        btnOtp.disabled = true;
        btnOtp.style.background = "#333";
        btnOtp.style.color = "#666";
        btnOtp.style.cursor = "not-allowed";
    }
    const passInput = document.getElementById('login-pass');
    if(passInput) passInput.value = "";
}

function activateOTPPanel() {
    const otpPanel = document.getElementById('otp-panel');
    if(otpPanel) otpPanel.classList.add('active');

    const input = document.getElementById('otp-input');
    if(input) {
        input.disabled = false;
        input.value = "";
        input.focus(); 
    }

    const btnOtp = document.getElementById('btn-otp-verify');
    if(btnOtp) {
        btnOtp.disabled = false;
        btnOtp.style.background = "var(--primary)";
        btnOtp.style.color = "#000";
        btnOtp.style.cursor = "pointer";
    }
}

// --- 登入邏輯 (串接後端 /api/login) ---
async function handleLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    // A. 駭客模式 (前端模擬漏洞，不經過後端)
    if (!isSecureMode) {
        if ((user === "admin" && pass === "123456") || user.includes("' OR '1'='1")) {
            if(user.includes("' OR '1'='1")) showToast("🔓 SQL Injection 成功！", "success");
            else showToast("⚠️ 警告：2FA 未啟用 (HACK MODE)", "error");
            
            // 這裡還是用假 token，因為是駭客模式
            localStorage.setItem("auth_token", "hacked_token"); 
            setTimeout(() => {
                closeLoginModal();
                updateAuthUI();
                showToast("✅ 強制登入成功", "success");
            }, 800);
        } else {
            showToast("❌ 登入失敗", "error");
        }
        return;
    }

    // B. 防禦模式 (正式串接後端 API)
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: user, pass: pass })
        });
        
        const data = await response.json();

        if (data.success) {
            // 第一階段成功，暫存 Token (或是等 OTP 完再存)
            // 為了簡化流程，我們先把後端給的 token 存起來
            localStorage.setItem("temp_token", data.token); 

            showToast("🔒 第一階段驗證通過，請填寫 OTP", "info");
            activateOTPPanel(); 
        } else {
            showToast("🚫 " + data.message, "error");
        }
    } catch (error) {
        showToast("⚠️ 無法連接伺服器", "error");
        console.error(error);
    }
}

// --- OTP 驗證邏輯 ---
function verifyOTP() {
    const input = document.getElementById('otp-input');
    if (input.value === "123456") {
        // OTP 通過，將暫存 token 轉正
        const realToken = localStorage.getItem("temp_token");
        localStorage.setItem("auth_token", realToken);
        localStorage.removeItem("temp_token");

        loginSuccess();
    } else {
        input.style.borderColor = "#ff2a2a";
        showToast("🚫 驗證碼錯誤", "error");
        setTimeout(() => input.style.borderColor = "var(--primary)", 500);
    }
}

function loginSuccess() {
    closeLoginModal();
    updateAuthUI();
    fetchProfile(); // 登入成功後，立刻抓取資料
    showToast("✅ 登入成功，歡迎進入系統", "success");
}
function logout() {
    // 1. 清除 Token
    localStorage.removeItem("auth_token");
    localStorage.removeItem("temp_token");

    // 2.  重置前端暫存的數據
    diamonds = 0;           // 鑽石歸零
    myInventory = [];       // 背包清空
    updateDiamondDisplay(); // 讓介面上的數字馬上變回 0
    
    const grid = document.getElementById('inventory-grid');
    if(grid) grid.innerHTML = "";

    // 3. 更新介面狀態 (回到登入頁)
    updateAuthUI();
    showToast("已登出系統", "info");
}
// ==============================
// 4. 資料同步 (串接 /api/profile)
// ==============================
async function fetchProfile() {
    const token = localStorage.getItem("auth_token");
    if(!token) return;

    try {
        const res = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: { 'Authorization': token } // 👈 這裡用上了你說的 Header
        });
        const data = await res.json();
        
        if(data.success) {
            diamonds = data.diamonds;
            myInventory = data.inventory;
            
            updateDiamondDisplay();
            renderInventory();
        }
    } catch (err) {
        console.error("無法同步資料", err);
    }
}

function showPage(pageId) {
    const token = localStorage.getItem("auth_token");
    if (!token && (pageId === 'inventory' || pageId === 'store' || pageId === 'altar')) {
        showToast("🚫 存取被拒 (401)：請先登入", "error");
        openLoginModal();
        return;
    }
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    
    const navMap = { 'altar': 0, 'store': 1, 'inventory': 2 };
    const navBtns = document.querySelectorAll('.nav-btn');
    if(navBtns[navMap[pageId]]) {
        navBtns[navMap[pageId]].classList.add('active');
    }

    if(pageId === 'inventory') renderInventory();
}

// ==============================
// 5. 遊戲功能 (串接 /api/gacha)
// ==============================

async function performGacha() {
    const cost = 100;
    const btn = document.getElementById('btn-gacha');
    const box = document.getElementById('gacha-box');
    const status = document.getElementById('gacha-status');

    // UI 動畫
    btn.disabled = true;
    if (isSecureMode) {
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> 召喚陣啟動中...';
    } else {
        btn.innerText = "正在連接不安全節點...";
    }

    box.className = "gacha-card-placeholder summoning";
    box.innerHTML = '<div class="question-mark" style="font-size:5rem;">?</div>';
    status.innerText = "能量匯聚中...";
    status.style.color = "#fff";

    // ==========================================
    // 分流 1: 駭客模式 (前端模擬，不連後端)
    // ==========================================
    if (!isSecureMode) {
        setTimeout(() => {
            // 駭客模式直接扣前端變數 (不影響資料庫)
            diamonds -= cost; 
            updateDiamondDisplay();

            // 前端隨機邏輯
            const rand = Math.random() * 100;
            let selectedRarity = 'N';
            if (rand > 85) selectedRarity = 'SSR';
            else if (rand > 75) selectedRarity = 'SR';
            else if (rand > 70) selectedRarity = 'R';

            const pool = localCardPool.filter(c => c.rarity === selectedRarity);
            const template = pool[Math.floor(Math.random() * pool.length)];
            
            // 建立假卡片物件
            const card = { 
                id: Date.now(), // 用時間當假 ID
                name: template.name,
                rarity: template.rarity,
                icon: template.icon,
                color: template.color
            };

            myInventory.push(card);
            showGachaResult(card, btn, box, status);
            showToast("駭客模式：已繞過伺服器驗證 (本地計算)", "error");

        }, 1000);
        return; // 結束函式，不執行下面的 fetch
    }

    // ==========================================
    //  分流 2: 防禦模式 (正規連線後端 API)
    // ==========================================
    try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_URL}/gacha`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token 
            }
        });
        const data = await res.json();

        setTimeout(() => {
            box.classList.remove('summoning');
            
            if (data.success) {
                // 更新後端回傳的正確數據
                diamonds = data.diamonds;
                updateDiamondDisplay();
                
                const card = data.card;
                myInventory.push(card);
                showGachaResult(card, btn, box, status);
            } else {
                showToast("❌ " + data.message, "error");
                status.innerText = "召喚失敗";
                btn.disabled = false;
                btn.innerText = "單抽 (100 💎)";
            }
        }, 1500);

    } catch (err) {
        console.error(err);
        showToast(" 系統錯誤", "error");
        btn.disabled = false;
    }
}

// 抽取出來的共用顯示函式 (讓上面兩個分流都能用)
function showGachaResult(card, btn, box, status) {
    box.className = `gacha-card-placeholder ${card.rarity.toLowerCase()}`;
    if(card.rarity === 'SSR') box.classList.add('active-glow');
    box.classList.remove('summoning');

    box.innerHTML = `
        <div class="card-appear">
            <i class="fa-solid ${card.icon}" style="font-size: 6rem; color: ${card.color}; text-shadow: 0 0 20px ${card.color};"></i>
        </div>`;
    
    status.innerHTML = `<span style="color: ${card.color}; font-weight:900; font-size: 1.5rem;">${card.name}</span>`;
    
    btn.disabled = false;
    btn.innerText = "單抽 (100 💎)";
}

// ==============================
// 6. 儲值功能 (串接 /api/store)
// ==============================
async function performPurchase() {
    const input = document.getElementById('store-amount');
    const amount = parseInt(input.value);
    const btn = document.querySelector('#store .btn-mega');

    // UI 鎖定
    if (isSecureMode) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 交易處理中...';
    }

    try {
        // --- 呼叫後端 API ---
        const res = await fetch(`${API_URL}/store`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount })
        });
        const data = await res.json();

        setTimeout(() => {
            if (data.success) {
                diamonds = data.diamonds;
                updateDiamondDisplay();
                showToast(data.message, "success");
            } else {
                showToast("❌ 交易失敗", "error");
            }
            
            // 恢復 UI
            if (isSecureMode) {
                btn.disabled = false;
                btn.innerText = "確認支付 / 注入資金";
                btn.style.opacity = "1";
            }
        }, 1000);

    } catch (err) {
        console.error(err);
        showToast("⚠️ 連線失敗", "error");
    }
}

function quickPurchase(val) {
    document.getElementById('store-amount').value = val;
    performPurchase();
}

// ==============================
// 7. 其他輔助函式
// ==============================

function updateProfile() {
    const input = document.getElementById('signature-input').value;
    const display = document.getElementById('signature-display');

    if (isSecureMode) {
        display.innerText = input;
        showToast("資料已更新 (WAF 已過濾)", "success");
    } else {
        display.innerHTML = input;
        showToast("資料已更新 (Payload 已寫入)", "error");
    }
}

async function deleteCard() {
    const input = document.getElementById('delete-target-id');
    const id = parseInt(input.value);

    if (!id) {
        showToast("請輸入要刪除的卡片 ID", "error");
        return;
    }

    // 先找出這張卡片 (為了知道它的稀有度)
    const targetCard = myInventory.find(c => c.id === id);
    if (!targetCard) {
        showToast("找不到此 ID 的卡片", "error");
        return;
    }

    // ==========================================
    // 分流 1: 駭客模式 (無視規則，強制刪除)
    // ==========================================
    if (!isSecureMode) {
        // 駭客特權：就算你是 SSR，我照樣刪！
        const prevLen = myInventory.length;
        myInventory = myInventory.filter(c => c.id !== id);

        if(myInventory.length < prevLen) {
            renderInventory();
            // 根據稀有度顯示不同訊息
            if (targetCard.rarity === 'SSR') {
                showToast(`ROOT 權限：強制覆寫保護協定！SSR ${targetCard.name} 已刪除`, "success");
            } else {
                showToast(`卡片 ${targetCard.name} 已移除`, "info");
            }
        }
        return;
    }

    // ==========================================
    // 分流 2: 防禦模式 (受到後端規則限制)
    // ==========================================
    try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_URL}/delete`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token 
            },
            body: JSON.stringify({ id: id })
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message, "success");
            fetchProfile(); 
            input.value = ""; 
        } else {
            // 這裡會顯示後端傳回來的「系統警告：SSR 卡片受保護...」
            showToast("🚫 " + data.message, "error");
        }
    } catch (err) {
        console.error(err);
        showToast("連線失敗", "error");
    }
}
function updateDiamondDisplay() {
    const el = document.getElementById('diamond-display');
    if(el) el.innerText = diamonds;
}

let currentFilter = 'ALL';
function filterInventory(rarity) {
    currentFilter = rarity;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText === rarity || (rarity === 'R' && btn.innerText === 'R/N')) {
            btn.classList.add('active');
        }
    });
    renderInventory();
}

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    const filteredList = myInventory.filter(c => {
        if (currentFilter === 'ALL') return true;
        if (currentFilter === 'SSR') return c.rarity === 'SSR';
        if (currentFilter === 'SR') return c.rarity === 'SR';
        if (currentFilter === 'R') return c.rarity === 'R' || c.rarity === 'N';
        return true;
    });

    if (filteredList.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #555; padding: 2rem;">
            <i class="fa-regular fa-folder-open" style="font-size: 2rem; margin-bottom: 10px;"></i><br>沒有相關卡片
        </div>`;
        return;
    }

    filteredList.forEach(c => {
        const icon = c.icon || (c.rarity === 'SSR' ? 'fa-dragon' : 'fa-ghost');
        const color = c.color || (c.rarity === 'SSR' ? 'gold' : '#fff');
        const rarityClass = c.rarity ? c.rarity.toLowerCase() : 'n';

        const div = document.createElement('div');
        div.className = `card-item ${rarityClass}`;
        div.style.animation = "fadeIn 0.5s ease";
        div.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 10px;">
                <i class="fa-solid ${icon}" style="color: ${color}; text-shadow: 0 0 10px ${color};"></i>
            </div>
            <div style="font-weight:bold; color: ${color}">${c.name}</div>
            <div style="font-size: 0.8rem; color: #666; margin-top:5px;">ID: ${c.id}</div>
        `;
        grid.appendChild(div);
    });
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'fa-info-circle';
    if(type === 'error') icon = 'fa-skull';
    if(type === 'success') icon = 'fa-shield-halved';
    
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
});
// 一鍵清空鑽石功能
async function clearDiamonds() {
    // 1. 駭客模式：只改前端顯示 
    if (!isSecureMode) {
        diamonds = 0;
        updateDiamondDisplay();
        showToast(" 本地變數已清空 (資料庫未受影響)", "info");
        return;
    }

    // 2. 防禦模式：呼叫後端真的清空資料庫
    try {
        const res = await fetch(`${API_URL}/reset`, { method: 'POST' });
        const data = await res.json();
        
        if (data.success) {
            diamonds = data.diamonds;
            updateDiamondDisplay();
            showToast(data.message, "success");
        }
    } catch (err) {
        console.error(err);
        showToast(" 連線失敗", "error");
    }
}