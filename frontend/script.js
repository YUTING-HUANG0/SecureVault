// ==============================
// 0. 核心變數 & 資料
// ==============================
let diamonds = 0;
let isSecureMode = false;
let pityCount = 0; // 保底計數器
const PITY_LIMIT = 20; // 保底門檻 
let myInventory = [
    { id: 101, name: "N 史萊姆", rarity: "N" },
    { id: 102, name: "N 哥布林", rarity: "N" }
];

// ==============================
// 1. 初始化與事件監聽
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 同步開關狀態
    const mainToggle = document.getElementById('securityToggle');
    if(mainToggle) isSecureMode = mainToggle.checked;

    // 2. 檢查是否已登入 (決定顯示 鎖定畫面 還是 遊戲內容)
    updateAuthUI();

    // 3. 初始化畫面與資料
    updateDiamondDisplay();
    renderInventory();
    updateModeUI();
});

// ==============================
// 2. UI 狀態管理
// ==============================

function syncSecurityMode(checkbox) {
    const mainToggle = document.getElementById('securityToggle');
    const loginToggle = document.getElementById('login-security-toggle');

    // 讓兩個開關狀態連動
    if (checkbox === mainToggle && loginToggle) loginToggle.checked = checkbox.checked;
    if (checkbox === loginToggle && mainToggle) mainToggle.checked = checkbox.checked;

    isSecureMode = checkbox.checked;
    updateModeUI();

    if(isSecureMode) showToast("防禦模式啟動", "success");
    else showToast(" 駭客模式啟動", "error");
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
// 3. 雙欄式登入系統 (Login + OTP)
// ==============================

// --- 視窗控制 ---
function openLoginModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
    // 每次打開都重置狀態：鎖定右邊，清空左邊
    resetAuthPanel();
}

function closeLoginModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

// --- 面板狀態控制 (雙欄邏輯) ---
function resetAuthPanel() {
    // 1. 鎖定右側面板
    const otpPanel = document.getElementById('otp-panel');
    if(otpPanel) otpPanel.classList.remove('active');

    // 2. 禁用 OTP 輸入和按鈕
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

    // 3. 清空左側密碼
    const passInput = document.getElementById('login-pass');
    if(passInput) passInput.value = "";
}

function activateOTPPanel() {
    // 1. 解鎖右側面板
    const otpPanel = document.getElementById('otp-panel');
    if(otpPanel) otpPanel.classList.add('active');

    // 2. 啟用輸入
    const input = document.getElementById('otp-input');
    if(input) {
        input.disabled = false;
        input.value = "";
        input.focus(); // 自動聚焦
    }

    // 3. 啟用按鈕
    const btnOtp = document.getElementById('btn-otp-verify');
    if(btnOtp) {
        btnOtp.disabled = false;
        btnOtp.style.background = "var(--primary)";
        btnOtp.style.color = "#000";
        btnOtp.style.cursor = "pointer";
    }
}
// --- 登入邏輯 (第一階段) ---
function handleLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    // A. 駭客模式 (漏洞版)
    if (!isSecureMode) {
        // 允許 SQL Injection
        if ((user === "admin" && pass === "123456") || user.includes("' OR '1'='1")) {
            if(user.includes("' OR '1'='1")) showToast("🔓 SQL Injection 成功！", "success");
            else showToast("⚠️ 警告：2FA 未啟用 (HACK MODE)", "error");
            
            setTimeout(loginSuccess, 800);
        } else {
            showToast("❌ 登入失敗", "error");
        }
        return;
    }

    // B. 防禦模式 (安全版)
    if (user === "admin" && pass === "123456") {
        showToast("🔒 第一階段驗證通過，請填寫右側驗證碼", "info");
        activateOTPPanel(); // <--- 關鍵：呼叫解鎖函式
    } else {
        showToast("🚫 帳號或密碼錯誤", "error");
    }
}
// --- OTP 驗證邏輯 (第二階段) ---
function verifyOTP() {
    const input = document.getElementById('otp-input');
    // 模擬驗證
    if (input.value === "123456") {
        loginSuccess();
    } else {
        input.style.borderColor = "#ff2a2a";
        showToast("🚫 驗證碼錯誤", "error");
        setTimeout(() => input.style.borderColor = "var(--primary)", 500);
    }
}

function loginSuccess() {
    localStorage.setItem("auth_token", "admin_token_secure");
    closeLoginModal();
    updateAuthUI();
    showToast("✅ 登入成功，歡迎進入系統", "success");
}

function logout() {
    localStorage.removeItem("auth_token");
    updateAuthUI();
    showToast("👋 已登出系統", "info");
}

// ==============================
// 4. 路由守衛
// ==============================
function showPage(pageId) {
    const token = localStorage.getItem("auth_token");
    // 如果沒登入，且試圖訪問功能頁
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
// 5. 遊戲功能 (保底機制版)
// ==============================
const cardPool = [
    { rarity: 'N', name: "N 史萊姆", icon: "fa-ghost", color: "#888", chance: 60 },
    { rarity: 'N', name: "N 骷髏兵", icon: "fa-skull", color: "#888", chance: 60 },
    { rarity: 'N', name: "N 哥布林", icon: "fa-frog", color: "#888", chance: 60 },
    { rarity: 'R', name: "R 皇家衛兵", icon: "fa-shield-halved", color: "#3b82f6", chance: 30 },
    { rarity: 'R', name: "R 元素法師", icon: "fa-hat-wizard", color: "#3b82f6", chance: 30 },
    { rarity: 'R', name: "R 狙擊手", icon: "fa-crosshairs", color: "#3b82f6", chance: 30 },
    { rarity: 'SR', name: "SR 暗影刺客", icon: "fa-user-ninja", color: "#d946ef", chance: 9 },
    { rarity: 'SR', name: "SR 機械戰神", icon: "fa-robot", color: "#d946ef", chance: 9 },
    { rarity: 'SSR', name: "SSR 傳說巨龍", icon: "fa-dragon", color: "gold", chance: 1 },
    { rarity: 'SSR', name: "SSR 魔界君主", icon: "fa-crown", color: "gold", chance: 1 }
];

function performGacha() {
    const cost = 100;
    const btn = document.getElementById('btn-gacha');
    const box = document.getElementById('gacha-box');
    const status = document.getElementById('gacha-status');

    if (diamonds < cost) {
        showToast("錯誤：鑽石不足 (請前往黑市儲值)", "error");
        return;
    }

    // 1. UI 鎖定
    if (isSecureMode) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> 召喚陣啟動中...';
    } else {
        btn.innerText = "正在連接不安全節點...";
    }

    // 2. 震動動畫
    box.className = "gacha-card-placeholder summoning";
    box.innerHTML = '<div class="question-mark" style="font-size:5rem;">?</div>';
    
    // 顯示保底預告
    const nextIsPity = pityCount >= PITY_LIMIT - 1;
    if(nextIsPity) {
        status.innerText = "✨ 保底觸發！能量極限匯聚！ ✨";
        status.style.color = "gold";
        box.style.boxShadow = "0 0 50px gold"; // 預告金光
    } else {
        status.innerText = `能量匯聚中... (保底進度: ${pityCount}/${PITY_LIMIT})`;
        status.style.color = "#fff";
    }

    // 3. 開獎延遲
    setTimeout(() => {
        diamonds -= cost;
        updateDiamondDisplay();
        box.classList.remove('summoning');
        box.style.boxShadow = ""; // 清除預告金光

        // --- 🔥 核心抽卡邏輯 (含保底) 🔥 ---
        let selectedRarity = 'N';
        let isPityTriggered = false;

        // 判斷是否觸發保底
        if (pityCount >= PITY_LIMIT - 1) {
            selectedRarity = 'SSR'; // 強制必中
            isPityTriggered = true;
        } else {
            // 正常機率運算
            const rand = Math.random() * 100;
            if (rand > 99) selectedRarity = 'SSR';
            else if (rand > 90) selectedRarity = 'SR';
            else if (rand > 60) selectedRarity = 'R';
            else selectedRarity = 'N';
        }

        // 更新保底計數器
        if (selectedRarity === 'SSR') {
            pityCount = 0; // 抽到 SSR 就重置
        } else {
            pityCount++;   // 沒抽到就 +1
        }

        // --- 取出卡片資料 ---
        const pool = cardPool.filter(c => c.rarity === selectedRarity);
        const template = pool[Math.floor(Math.random() * pool.length)];
        const newCard = { 
            id: Date.now(), 
            rarity: template.rarity, 
            name: template.name,
            icon: template.icon,
            color: template.color
        };
        myInventory.push(newCard);

        // --- 顯示結果 UI ---
        box.className = `gacha-card-placeholder ${template.rarity.toLowerCase()}`;
        if(template.rarity === 'SSR') box.classList.add('active-glow');

        box.innerHTML = `
            <div class="card-appear">
                <i class="fa-solid ${template.icon}" style="font-size: 6rem; color: ${template.color}; text-shadow: 0 0 20px ${template.color};"></i>
            </div>`;
        
        let statusHtml = `<span style="color: ${template.color}; font-weight:900; font-size: 1.5rem; text-shadow: 0 0 10px ${template.color};">
            ${template.rarity === 'SSR' ? 'LEGENDARY!' : template.name}
        </span>`;
        
        // 如果是保底觸發的，多顯示一行提示
        if (isPityTriggered) {
            statusHtml += `<div style="font-size: 0.8rem; color: gold; margin-top: 5px;">(保底機制觸發)</div>`;
        } else if (selectedRarity !== 'SSR') {
            statusHtml += `<div style="font-size: 0.9rem; color: #666; margin-top: 5px;">距離保底還剩 ${PITY_LIMIT - pityCount} 抽</div>`;
        }
        status.innerHTML = statusHtml;
        // 4. 解鎖按鈕
        if (isSecureMode) {
            btn.disabled = false;
            btn.innerText = "單抽 (100 💎)";
        } else {
            btn.innerText = "單抽 (100 💎)"; 
        }
    }, 1500);
}
function performPurchase() {
    const input = document.getElementById('store-amount');
    const amount = parseInt(input.value);
    const btn = document.querySelector('#store .btn-mega');

    if (isSecureMode && (amount <= 0 || isNaN(amount))) {
        showToast("🚫 防火牆攔截：無效金額", "error");
        return;
    }

    if (isSecureMode) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 交易處理中...';
        btn.style.opacity = "0.7";
    }
    setTimeout(() => {
        diamonds += amount;
        updateDiamondDisplay();
        
        if (!isSecureMode && amount < 0) {
            showToast(`⚠️ 漏洞觸發！\n退款 ${amount} 但餘額增加`, "error");
        } else {
            showToast(`💳 交易完成：入帳 ${amount} 鑽石`, "success");
        }

        if (isSecureMode) {
            btn.disabled = false;
            btn.innerText = "確認支付 / 注入資金";
            btn.style.opacity = "1";
        }
    }, 1500);
}
// 快速購買 (點擊卡片直接帶入金額並執行)
function quickPurchase(val) {
    document.getElementById('store-amount').value = val;
    performPurchase(); // 直接呼叫原本的購買函式
}
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
function deleteCard() {
    const id = parseInt(document.getElementById('delete-target-id').value);
    
    if (id === 999) {
        if(isSecureMode) {
            showToast("🚫 存取被拒 (403)", "error");
        } else {
            showToast("🔥 IDOR 攻擊成功！已刪除管理員卡片", "error");
        }
        return;
    }
    const prevLen = myInventory.length;
    myInventory = myInventory.filter(c => c.id !== id);
    
    if(myInventory.length < prevLen) {
        renderInventory();
        showToast(`卡片 ID:${id} 已銷毀`);
    } else {
        showToast("錯誤：找不到該卡片", "error");
    }
}
// ==============================
// 6. 輔助函式
// ==============================
function updateDiamondDisplay() {
    const el = document.getElementById('diamond-display');
    if(el) el.innerText = diamonds;
}

// 全域變數：目前選擇的篩選器
let currentFilter = 'ALL';

function filterInventory(rarity) {
    currentFilter = rarity;
    
    // UI：更新按鈕狀態
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText === rarity || (rarity === 'R' && btn.innerText === 'R/N')) {
            btn.classList.add('active');
        }
    });
    renderInventory();
}
// 修改版的渲染函式
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    // 1. 先篩選資料
    const filteredList = myInventory.filter(c => {
        if (currentFilter === 'ALL') return true;
        if (currentFilter === 'SSR') return c.rarity === 'SSR';
        if (currentFilter === 'SR') return c.rarity === 'SR';
        if (currentFilter === 'R') return c.rarity === 'R' || c.rarity === 'N';
        return true;
    });
    // 2. 如果沒資料顯示提示
    if (filteredList.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #555; padding: 2rem;">
            <i class="fa-regular fa-folder-open" style="font-size: 2rem; margin-bottom: 10px;"></i><br>沒有相關卡片
        </div>`;
        return;
    }
    // 3. 渲染卡片
    filteredList.forEach(c => {
        const icon = c.icon || (c.rarity === 'SSR' ? 'fa-dragon' : 'fa-ghost');
        const color = c.color || (c.rarity === 'SSR' ? 'gold' : '#fff');
        const rarityClass = c.rarity.toLowerCase();

        const div = document.createElement('div');
        div.className = `card-item ${rarityClass}`;
        // 加入一點進場動畫
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