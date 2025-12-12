const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ELEMENTOS DOM
const scoreEl = document.getElementById('scoreEl');
const levelEl = document.getElementById('levelEl');
const highScoreEl = document.getElementById('highScoreEl'); 
const financeBar = document.getElementById('finance-bar');
const xpBar = document.getElementById('xp-bar');
const ultBar = document.getElementById('ult-bar');
const comboEl = document.getElementById('comboEl'); 
const muteBtn = document.getElementById('muteBtn');
const mobileUltBtn = document.getElementById('mobileUltBtn');
const achievePopup = document.getElementById('achievePopup');
const achieveTitle = document.getElementById('achieveTitle');
const achieveDesc = document.getElementById('achieveDesc');

const startScreen = document.getElementById('startScreen');
const shopScreen = document.getElementById('shopScreen'); 
const skinScreen = document.getElementById('skinScreen'); 
const pauseScreen = document.getElementById('pauseScreen'); 
const rankingScreen = document.getElementById('rankingScreen'); 
const shopBalance = document.getElementById('shopBalance'); 
const skinWallet = document.getElementById('skinWallet'); 
const gameOverScreen = document.getElementById('gameOverScreen');
const winScreen = document.getElementById('winScreen');

const finalScoreEl = document.getElementById('finalScore');
const newRecordMsg = document.getElementById('newRecordMsg');
const winScoreEl = document.getElementById('winScore');
const goTitle = document.getElementById('goTitle');
const goReason = document.getElementById('goReason');
const bossHud = document.getElementById('boss-hud');
const bossHpBar = document.getElementById('boss-hp-bar');
const btnShield = document.getElementById('btnShield');

const playerNameInput = document.getElementById('playerNameInput');
const btnSaveRecord = document.getElementById('btnSaveRecord');
const rankingBody = document.getElementById('rankingBody');

// LISTENERS
document.getElementById('btnStartGame').onclick = startGame;
document.getElementById('btnOpenSkins').onclick = openSkins;
document.getElementById('btnShowRanking').onclick = openRanking; 
document.getElementById('btnBackMenu').onclick = backToMenu;
// Adicionado listener para o botão de voltar do ranking (se tiver ID diferente ou onclick direto no HTML, o JS abaixo resolve para ambos)
const btnBackRanking = document.querySelector('#rankingScreen button');
if(btnBackRanking) btnBackRanking.onclick = backToMenu;

document.getElementById('btnCloseShop').onclick = closeShop;
document.getElementById('btnResetGame').onclick = resetToMenu;
document.getElementById('btnResetWin').onclick = resetToMenu;
document.getElementById('muteBtn').onclick = toggleMute;
document.getElementById('mobileUltBtn').onclick = triggerUltimate;
document.getElementById('btnSaveRecord').onclick = saveRecord; 

document.getElementById('btnBuySpeed').onclick = () => buyUpgrade('speed');
document.getElementById('btnBuyCoffee').onclick = () => buyUpgrade('coffee');
document.getElementById('btnBuyHealth').onclick = () => buyUpgrade('health');
document.getElementById('btnShield').onclick = () => buyUpgrade('shield');
document.getElementById('btnBuyPower').onclick = () => buyUpgrade('power');


const MAX_LEVEL = 25;
const SALES_TO_LEVEL_UP = 10;
const GAME_OVER_LIMIT = -10.00;
const SAFE_LIMIT = 20.00;
const LEADERBOARD_KEY = 'finalizarCliente_Leaderboard_v1';

const BASE_VALUES = { SALE: 1.00, VIP_SALE: 5.00, WASTE: 0.50, MISS: 0.25, HIT: 1.50, BOSS_HIT: 3.00, COLLISION: 2.00, CHAOS_KILL: 3.00 };

const PALETTE = {
    skin: '#ffdbac', suit_green: '#2e7d32', suit_blue: '#1565c0', suit_red: '#c62828', suit_gold: '#f9a825',
    suit_pink: '#e91e63', shirt: '#ffffff', tie: '#d32f2f', shadow: 'rgba(0,0,0,0.4)',
    coffee_cup: '#fff', coffee_liquid: '#3e2723' 
};

const SKINS = [
    { id: 'default', name: 'Estagiário', color: '#1565c0', cost: 0 },
    { id: 'black', name: 'Gerente', color: '#212121', cost: 200 },
    { id: 'gold', name: 'O CEO', color: '#ffd700', cost: 1000 },
    { id: 'matrix', name: 'Hacker', color: '#00e676', cost: 800 },
    { id: 'white', name: 'Anjo', color: '#fff', cost: 1500 }
];

const ACHIEVEMENTS = [
    { id: 'rich100', name: 'Primeiro Salário', desc: 'Acumule R$ 100,00', unlocked: false, check: (s) => s >= 100 },
    { id: 'rich1000', name: 'Milionário', desc: 'Acumule R$ 1.000,00', unlocked: false, check: (s) => s >= 1000 },
    { id: 'lvl10', name: 'Sobrevivente', desc: 'Chegue ao Nível 10', unlocked: false, check: (s, l) => l >= 10 },
    { id: 'lvl25', name: 'Lenda Corporativa', desc: 'Chegue ao Nível 25', unlocked: false, check: (s, l) => l >= 25 }
];

let ownedSkins = ['default'];
let unlockedAchievements = [];
let currentSkin = SKINS[0];

const THEMES = [
    { wall: '#e3f2fd', floor: '#455a64', window: '#81d4fa', border: '#555', type: 'day' },
    { wall: '#fff3e0', floor: '#3e2723', window: '#ffcc80', border: '#e65100', type: 'sunset' },
    { wall: '#263238', floor: '#1a237e', window: '#0d47a1', border: '#303f9f', type: 'night' }
];

let score=0, highScore=0, level=1, salesCount=0;
let combo=0, ultCharge=0; 
let targets=[], projectiles=[], enemyProjectiles=[], particles=[], clouds=[];
let gameRunning=false, isBossActive=false, isPaused=false, isMuted=false;
let spawnTimer=0, frame=0;
let animationId = null;
let slowMotionTimer = 0;
let timeScale = 1.0; 

let playerSpeedMult = 1.0;
let coffeeDurationMult = 1.0;
let hasShield = false; 
let clickPower = 1; 

const player = { x: 400, y: 500, w: 40, h: 60, speed: 5, moveUp: false, moveDown: false, moveLeft: false, moveRight: false };
const boss = { x: 400, y: -150, tx: 400, ty: 100, width: 100, height: 120, hp: 100, maxHp: 100, speed: 3 };

// --- JOYSTICK MOBILE ---
let joystickActive = false;
let joystickOrigin = { x: 0, y: 0 };
const joystickEl = document.getElementById('joystick');
const stickEl = document.getElementById('stick');

joystickEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    const touch = e.touches[0];
    joystickOrigin = { x: touch.clientX, y: touch.clientY };
    stickEl.style.transition = '0s';
}, {passive: false});

joystickEl.addEventListener('touchmove', (e) => {
    if(!joystickActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    let dx = touch.clientX - joystickOrigin.x;
    let dy = touch.clientY - joystickOrigin.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = 35;
    if(dist > maxDist) { dx = (dx/dist) * maxDist; dy = (dy/dist) * maxDist; }
    stickEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    if(Math.abs(dx) > 10) { player.moveLeft = dx < 0; player.moveRight = dx > 0; } else { player.moveLeft = false; player.moveRight = false; }
    if(Math.abs(dy) > 10) { player.moveUp = dy < 0; player.moveDown = dy > 0; } else { player.moveUp = false; player.moveDown = false; }
}, {passive: false});

joystickEl.addEventListener('touchend', (e) => {
    joystickActive = false;
    stickEl.style.transition = '0.2s';
    stickEl.style.transform = `translate(-50%, -50%)`;
    player.moveUp=false; player.moveDown=false; player.moveLeft=false; player.moveRight=false;
});

const TYPES = {
    VENDA:     { color: PALETTE.suit_green, label: '💰', type: 'good', hp: 1, canShoot: true }, 
    CURIOSO:   { color: PALETTE.suit_blue, label: '🔫', type: 'bad', hp: 1, canShoot: true }, 
    PROCON:    { color: PALETTE.suit_red, label: '😡', type: 'killer', hp: 1, canShoot: true },
    VIP:       { color: PALETTE.suit_gold, label: '💎', type: 'vip', hp: 3, radiusMult: 1.3, canShoot: true },
    CAFE:      { color: '#fff', label: '☕', type: 'powerup', hp: 1, radiusMult: 0.8, canShoot: false },
    PUXA_SACO: { color: PALETTE.suit_pink, label: '🤯', type: 'chaos', hp: 2, radiusMult: 1.0, canShoot: true, speedMult: 1.5 }
};

function getPenalty(baseValue) { return baseValue * (1 + (level * 0.20)); }

function checkAchievements() {
    if(!unlockedAchievements) unlockedAchievements = [];
    ACHIEVEMENTS.forEach(ach => {
        if(!ach.unlocked && !unlockedAchievements.includes(ach.id) && ach.check(score, level)) {
            ach.unlocked = true;
            unlockedAchievements.push(ach.id);
            saveGameData();
            showAchievement(ach.name, ach.desc);
        }
    });
}

function showAchievement(title, desc) {
    achieveTitle.innerText = "🏆 " + title;
    achieveDesc.innerText = desc;
    achievePopup.style.top = "20px";
    playSound('coin');
    setTimeout(() => { achievePopup.style.top = "-100px"; }, 3000);
}

function updateCombo(success) {
    if (success) {
        combo++;
        comboEl.innerText = "x" + (combo >= 5 ? (combo >= 10 ? "3" : "2") : "1") + " COMBO " + combo;
        comboEl.style.opacity = combo > 1 ? 1 : 0;
        if(combo >= 10) { comboEl.style.color = "#ff5252"; comboEl.classList.add('combo-active'); }
        else if(combo >= 5) { comboEl.style.color = "#ffd700"; comboEl.classList.remove('combo-active'); }
        else { comboEl.style.color = "#fff"; comboEl.classList.remove('combo-active'); }
        ultCharge = Math.min(100, ultCharge + 2);
    } else {
        if (combo > 5) playSound('bad');
        combo = 0; comboEl.style.opacity = 0; comboEl.classList.remove('combo-active');
    }
    updateUI();
}
function getScoreMultiplier() { if (combo >= 10) return 3.0; if (combo >= 5) return 2.0; return 1.0; }

let audioCtx = null;
function initAudio() { if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} } if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }

function toggleMute() { isMuted = !isMuted; muteBtn.innerText = isMuted ? "🔇" : "🔊"; }

function playSound(type) {
    if (!audioCtx || isMuted) return;
    try {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        if (type === 'shoot') { osc.type = 'triangle'; osc.frequency.setValueAtTime(800, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(); osc.stop(now + 0.1); }
        else if (type === 'shield_break') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(50, now+0.3); gain.gain.linearRampToValueAtTime(0, now+0.3); osc.start(); osc.stop(now + 0.3); }
        else if (type === 'hit_vip') { osc.type = 'square'; osc.frequency.setValueAtTime(300, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(); osc.stop(now + 0.1); }
        else if (type === 'buy') { osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.2); gain.gain.linearRampToValueAtTime(0, now+0.2); osc.start(); osc.stop(now + 0.2); }
        else if (type === 'chaos_shoot') { osc.type = 'square'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(100, now+0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(); osc.stop(now + 0.1); }
        else if (type === 'coin') { osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(); osc.stop(now + 0.3); }
        else if (type === 'powerup') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(1200, now + 0.5); gain.gain.linearRampToValueAtTime(0, now+0.5); osc.start(); osc.stop(now + 0.5); }
        else if (type === 'bad') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(); osc.stop(now + 0.3); }
        else if (type === 'enemy_shoot') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(); osc.stop(now + 0.1); }
        else if (type === 'win') { osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); gain.gain.linearRampToValueAtTime(0, now+1); osc.start(); osc.stop(now + 1); }
        else if (type === 'ult') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.linearRampToValueAtTime(1000, now+0.5); gain.gain.linearRampToValueAtTime(0, now+0.5); osc.start(); osc.stop(now + 0.5); }
    } catch (e) { }
}

function initClouds() { clouds = []; for(let i=0; i<5; i++) clouds.push({ x: Math.random()*800, y: Math.random()*150, speed: 0.2 + Math.random()*0.5, size: 30 + Math.random()*20 }); }

function loadGameData() {
    try { 
        const savedScore = localStorage.getItem('finalizarClienteHighScore'); 
        highScore = savedScore ? parseFloat(savedScore) : 0; 
        const savedSkins = localStorage.getItem('finalizarClienteSkins');
        if (savedSkins) ownedSkins = JSON.parse(savedSkins);
        const savedAch = localStorage.getItem('finalizarClienteAch');
        if (savedAch) unlockedAchievements = JSON.parse(savedAch);
        const savedEquipped = localStorage.getItem('finalizarClienteEquipped');
        if (savedEquipped) {
            const skinObj = SKINS.find(s => s.id === savedEquipped);
            if (skinObj) currentSkin = skinObj;
        }
    } catch (e) { } 
    highScoreEl.innerText = highScore.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
}

function saveGameData() {
    try { 
        localStorage.setItem('finalizarClienteHighScore', highScore); 
        localStorage.setItem('finalizarClienteSkins', JSON.stringify(ownedSkins));
        localStorage.setItem('finalizarClienteEquipped', currentSkin.id);
        localStorage.setItem('finalizarClienteAch', JSON.stringify(unlockedAchievements));
    } catch (e) { } 
}

// --- FUNÇÕES DE RANKING ---
function saveRecord() {
    const name = playerNameInput.value.trim() || "Anônimo";
    if (!name) return;

    let leaderboard = [];
    try {
        leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    } catch(e) {}

    leaderboard.push({
        name: name.substring(0, 12),
        score: score,
        date: new Date().toLocaleDateString('pt-BR')
    });

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    
    btnSaveRecord.innerText = "SALVO!";
    btnSaveRecord.disabled = true;
    
    setTimeout(() => {
        openRanking(); 
        gameOverScreen.style.display = 'none';
    }, 1000);
}

function openRanking() {
    startScreen.style.display = 'none';
    rankingScreen.style.display = 'flex';
    
    let leaderboard = [];
    try { leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]"); } catch(e) {}

    rankingBody.innerHTML = "";
    
    if(leaderboard.length === 0) {
        rankingBody.innerHTML = "<tr><td colspan='3' style='text-align:center'>Nenhum recorde ainda. Seja o primeiro!</td></tr>";
    } else {
        leaderboard.forEach((entry, index) => {
            const tr = document.createElement('tr');
            const scoreFmt = parseFloat(entry.score).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            tr.innerHTML = `
                <td>${index + 1}º</td>
                <td>${entry.name}</td>
                <td>${scoreFmt}</td>
            `;
            rankingBody.appendChild(tr);
        });
    }
}

// --- FUNÇÃO CORRIGIDA PARA VOLTAR AO MENU ---
function backToMenu() { 
    skinScreen.style.display = 'none'; 
    rankingScreen.style.display = 'none'; // <--- Agora esconde o ranking também
    startScreen.style.display = 'flex'; 
}

function startGame() {
    initAudio(); 
    startScreen.style.display = 'none'; 
    gameOverScreen.style.display = 'none'; 
    winScreen.style.display = 'none'; 
    shopScreen.style.display = 'none'; 
    skinScreen.style.display = 'none';
    rankingScreen.style.display = 'none'; 

    score = 0; level = 1; salesCount = 0; combo = 0; ultCharge = 0; updateCombo(false);
    targets = []; projectiles = []; enemyProjectiles = []; particles = [];
    gameRunning = true; isPaused = false; isBossActive = false; bossHud.style.display = 'none';
    player.x = 400; player.y = 500;
    playerSpeedMult = 1.0; coffeeDurationMult = 1.0; hasShield = false; clickPower = 1;
    btnShield.classList.remove('purchased');
    slowMotionTimer = 0; timeScale = 1.0; document.body.classList.remove('slow-motion-effect');
    initClouds(); updateUI(); updateCombo(false);
    if (animationId) cancelAnimationFrame(animationId); loop();
}

function resetToMenu() {
    gameRunning = false; cancelAnimationFrame(animationId);
    gameOverScreen.style.display = 'none'; winScreen.style.display = 'none'; 
    shopScreen.style.display = 'none'; skinScreen.style.display = 'none';
    rankingScreen.style.display = 'none';
    startScreen.style.display = 'flex'; loadGameData();
}

function togglePause() {
    if(!gameRunning) return;
    isPaused = !isPaused;
    pauseScreen.style.display = isPaused ? 'flex' : 'none';
    if(!isPaused) loop();
}

function openSkins() { startScreen.style.display = 'none'; skinScreen.style.display = 'flex'; skinWallet.innerText = "Saldo (Recorde): " + highScore.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); renderSkinGrid(); }

function renderSkinGrid() {
    const list = document.getElementById('skinList'); list.innerHTML = '';
    SKINS.forEach(skin => {
        const item = document.createElement('div');
        item.className = 'skin-card ' + (currentSkin.id === skin.id ? 'selected' : '');
        const isOwned = ownedSkins.includes(skin.id);
        item.innerHTML = `<div class="skin-preview" style="background:${skin.color}"></div><div style="font-weight:bold; color:white">${skin.name}</div><div style="font-size:12px; color:${isOwned ? '#4caf50' : '#aaa'}">${isOwned ? 'Adquirido' : 'R$ ' + skin.cost}</div>`;
        item.onclick = () => selectSkin(skin); list.appendChild(item);
    });
}
function selectSkin(skin) {
    if (ownedSkins.includes(skin.id)) { currentSkin = skin; saveGameData(); renderSkinGrid(); }
    else if (highScore >= skin.cost) {
        if(confirm(`Comprar ${skin.name}?`)) { highScore -= skin.cost; ownedSkins.push(skin.id); currentSkin = skin; saveGameData(); renderSkinGrid(); skinWallet.innerText = "Saldo (Recorde): " + highScore.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); playSound('buy'); }
    } else { playSound('bad'); alert("Saldo insuficiente no Recorde!"); }
}

function openShop() { gameRunning = false; cancelAnimationFrame(animationId); bossHud.style.display = 'none'; updateUI(); shopBalance.innerText = "Saldo: " + scoreEl.innerText; shopScreen.style.display = 'flex'; }
function closeShop() { shopScreen.style.display = 'none'; gameRunning = true; loop(); }
function buyUpgrade(type) {
    let cost = 0; if (type === 'speed') cost = 50; if (type === 'coffee') cost = 75; if (type === 'health') cost = 40; if (type === 'shield') cost = 100; if (type === 'power') cost = 150;
    if (score >= cost) {
        if (type === 'shield' && hasShield) return;
        score -= cost; playSound('buy');
        if (type === 'speed') { playerSpeedMult += 0.1; showFloatingText(400, 300, "VELOCIDADE UP!", "#00e676"); }
        if (type === 'coffee') { coffeeDurationMult += 0.2; showFloatingText(400, 300, "CAFÉ DURADOURO!", "#8d6e63"); }
        if (type === 'health') { score += 20; updateUI(); showFloatingText(400, 300, "RECUPERADO!", "#ff5252"); }
        if (type === 'shield') { hasShield = true; btnShield.classList.add('purchased'); showFloatingText(400, 300, "ESCUDO ATIVO!", "#2196f3"); }
        if (type === 'power') { clickPower += 1; showFloatingText(400, 300, "CLIQUE PODEROSO!", "#ffd700"); }
        shopBalance.innerText = "Saldo: " + score.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); updateUI();
    } else { playSound('bad'); shopBalance.style.color = "red"; setTimeout(() => shopBalance.style.color = "#4caf50", 200); }
}

function triggerUltimate() {
    if(ultCharge >= 100) {
        ultCharge = 0; updateUI(); playSound('ult');
        document.body.classList.add('flash-white'); setTimeout(() => document.body.classList.remove('flash-white'), 500);
        targets.forEach(t => { spawnParticle(t.x, t.y, 'white'); if(t.type === 'good' || t.type === 'vip') score += 10; });
        targets = []; enemyProjectiles = []; showFloatingText(400, 300, "DEMISSÃO EM MASSA!", "white");
    }
}

function spawnPuxaSaco() {
        const margin = 60; const x = margin + Math.random() * (canvas.width - margin * 2);
        const y = canvas.height - 120 - Math.random() * 200;
        const speed = (1 + (level * 0.2)) * TYPES.PUXA_SACO.speedMult; 
        const angle = Math.random() * Math.PI * 2;
        targets.push({ x: x, y: y, z: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.5, ...TYPES.PUXA_SACO, life: 150, maxLife: 150, scale: 0, targetScale: 0.8 + (y/canvas.height)*0.4, animOffset: Math.random() * 100, width: 40, height: 80 });
    showFloatingText(x, y - 50, "PUXA SACO!", "#e91e63");
}

function spawnTarget() {
    if (isBossActive) return;
    const margin = 60; const x = margin + Math.random() * (canvas.width - margin * 2);
    const y = canvas.height - 120 - Math.random() * 200;
    const rand = Math.random();
    let type = TYPES.VENDA; 
    if (rand > 0.55 && rand < 0.70) type = TYPES.CURIOSO; 
    if (rand >= 0.70 && rand < 0.80) type = TYPES.PROCON;
    if (rand >= 0.80 && rand < 0.90) type = TYPES.VIP;
    if (rand >= 0.90 && rand < 0.96) type = TYPES.CAFE;
    if (rand >= 0.96) type = TYPES.PUXA_SACO;
    
    const speed = (1 + (level * 0.2)) * (type.speedMult || 1); 
    const angle = Math.random() * Math.PI * 2;
    targets.push({ x: x, y: y, z: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.5, ...type, life: 180 - (level * 5), maxLife: 180 - (level * 5), scale: 0, targetScale: 0.8 + (y/canvas.height)*0.4, animOffset: Math.random() * 100, width: 40 * (type.radiusMult || 1), height: 80 * (type.radiusMult || 1) });
}

function startBossFight() { isBossActive = true; targets = []; boss.y = -100; boss.x = 400; boss.tx = 400; boss.ty = 100; boss.hp = 20 * level; boss.maxHp = boss.hp; bossHud.style.display = 'block'; updateBossBar(); showFloatingText(400, 300, `CHEFE NÍVEL ${level}!`, "red", 40); }
function spawnParticle(x, y, color) { if (particles.length > 50) particles.shift(); particles.push({x, y, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, life: 20, color}); }
function spawnClickParticles(x, y, color) { for(let i=0; i<6; i++) particles.push({x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 15, color: color}); }
function shakeScreen() { document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); }

function update() {
    frame++;
    checkAchievements();
    clouds.forEach(c => { c.x += c.speed; if(c.x > canvas.width + 50) c.x = -50; });
    
    let currentSpeed = player.speed * playerSpeedMult;
    if (player.moveUp && player.y > 250) player.y -= currentSpeed;
    if (player.moveDown && player.y < canvas.height - 20) player.y += currentSpeed;
    if (player.moveLeft && player.x > 30) player.x -= currentSpeed;
    if (player.moveRight && player.x < canvas.width - 30) player.x += currentSpeed;

    if (slowMotionTimer > 0) { slowMotionTimer--; timeScale = 0.3; if (slowMotionTimer <= 0) { timeScale = 1.0; document.body.classList.remove('slow-motion-effect'); showFloatingText(player.x, player.y - 50, "FIM DO CAFÉ!", "#fff"); } } else { timeScale = 1.0; }

    targets.forEach(t => {
        if (t.canShoot && t.scale > 0.5) {
            let shootChance = 0.003 + (level * 0.001); 
            if (t.type === 'chaos') { shootChance = 0.02; if (Math.random() < shootChance * timeScale) { const ang = Math.random() * Math.PI * 2; enemyProjectiles.push({ x: t.x, y: t.y - 40, vx: Math.cos(ang)*7, vy: Math.sin(ang)*7 }); playSound('chaos_shoot'); } } else { if (Math.random() < shootChance * timeScale) { const ang = Math.atan2(player.y - t.y, player.x - t.x); enemyProjectiles.push({ x: t.x, y: t.y - 40, vx: Math.cos(ang)*4, vy: Math.sin(ang)*4 }); playSound('enemy_shoot'); } }
        }
    });

    let allHostileProjectiles = isBossActive ? projectiles : enemyProjectiles;

    if (isBossActive) {
        if (level === MAX_LEVEL && boss.hp < boss.maxHp * 0.2) {
            boss.tx = player.x; boss.ty = player.y;
            let kamikazeSpeed = 0.1; 
            boss.x += (Math.random() - 0.5) * 10; boss.y += (Math.random() - 0.5) * 10;
            boss.x += (boss.tx - boss.x) * kamikazeSpeed; boss.y += (boss.ty - boss.y) * kamikazeSpeed;
            if (Math.abs(boss.x - player.x) < 60 && Math.abs(boss.y - player.y) < 60) {
                for(let k=0; k<50; k++) spawnParticle(player.x, player.y, 'orange');
                gameOver("SACRIFÍCIO CORPORATIVO", "O CEO levou a empresa (e você) junto!"); return;
            }
        } else {
            if (Math.random() < 0.005 * timeScale) spawnPuxaSaco();
            if(Math.abs(boss.x - boss.tx) < 10 && Math.abs(boss.y - boss.ty) < 10) { boss.tx = 50 + Math.random() * (canvas.width - 100); boss.ty = 50 + Math.random() * (canvas.height - 250); }
            boss.x += (boss.tx - boss.x) * 0.02 * boss.speed * timeScale;
            boss.y += (boss.ty - boss.y) * 0.02 * boss.speed * timeScale;
            if (Math.random() < (0.05 + (level * 0.002)) * timeScale) { const ang = Math.atan2(player.y-boss.y, player.x-boss.x); projectiles.push({ x: boss.x, y: boss.y + 50, vx: Math.cos(ang)*6, vy: Math.sin(ang)*6, angle: ang }); playSound('enemy_shoot'); }
        }

        for (let i = targets.length - 1; i >= 0; i--) {
            let t = targets[i];
            if (t.scale < t.targetScale) t.scale += 0.05;
            t.x += t.vx * timeScale; t.y += t.vy * timeScale;
            if (t.x < 30 || t.x > canvas.width - 30) t.vx *= -1;
            if (t.y < 250 || t.y > canvas.height - 20) t.vy *= -1;
            if (Math.abs(t.x - player.x) < 30 && Math.abs(t.y - player.y) < 30) { applyDamage(getPenalty(BASE_VALUES.COLLISION), "COLISÃO!"); t.vx = (t.x - player.x) * 0.2; t.vy = (t.y - player.y) * 0.2; updateCombo(false); }
            t.life -= 1 * timeScale; if (t.life <= 0) targets.splice(i, 1);
        }
    } else {
        spawnTimer += 1 * timeScale; 
        if (spawnTimer >= Math.max(30, 60 - level*2)) { spawnTarget(); spawnTimer = 0; }
        for (let i = targets.length - 1; i >= 0; i--) {
            let t = targets[i];
            if (t.scale < t.targetScale) t.scale += 0.05;
            t.x += t.vx * timeScale; t.y += t.vy * timeScale; 
            if (t.x < 30 || t.x > canvas.width - 30) t.vx *= -1;
            if (t.y < 250 || t.y > canvas.height - 20) t.vy *= -1;
            if (Math.abs(t.x - player.x) < 30 && Math.abs(t.y - player.y) < 30) { if(t.type !== 'powerup') { applyDamage(getPenalty(BASE_VALUES.COLLISION), "COLISÃO!"); t.vx = (t.x - player.x) * 0.2; t.vy = (t.y - player.y) * 0.2; updateCombo(false); } }
            t.life -= 1 * timeScale; 
            if (t.life <= 0) {
                if (t.type === 'good' || t.type === 'vip') { score -= getPenalty(BASE_VALUES.LOST_SALE); showFloatingText(t.x, t.y, "PERDEU!", "orange"); updateCombo(false); }
                targets.splice(i, 1); updateUI();
            }
        }
    }

    for (let i = allHostileProjectiles.length - 1; i >= 0; i--) {
        let p = allHostileProjectiles[i]; p.x += p.vx * timeScale; p.y += p.vy * timeScale;
        if (Math.abs(p.x - player.x) < 20 && Math.abs(p.y - player.y) < 40) { 
            let dmg = isBossActive ? Math.max(5.00, score * 0.10) : getPenalty(BASE_VALUES.HIT);
            applyDamage(dmg, "ATINGIDO!"); allHostileProjectiles.splice(i, 1); 
        } 
        else if (p.y > canvas.height || p.y < 0 || p.x < 0 || p.x > canvas.width) { allHostileProjectiles.splice(i, 1); }
    }
    for(let i=particles.length-1; i>=0; i--) { let p = particles[i]; p.x += p.vx * timeScale; p.y += p.vy * timeScale; p.life--; if(p.life<=0) particles.splice(i,1); }
    if (score <= GAME_OVER_LIMIT) gameOver("FALÊNCIA", "Saldo Negativo!");
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoom();
    let renderList = [];
    if (isBossActive) renderList.push({type: 'boss', y: boss.y, obj: boss});
    renderList.push({type: 'player', y: player.y, obj: player});
    targets.forEach(t => renderList.push({type: 'target', y: t.y, obj: t}));
    renderList.sort((a, b) => a.y - b.y);
    renderList.forEach(item => {
        if (item.type === 'target') drawCharacter(item.obj);
        if (item.type === 'player') drawPlayer(item.obj);
        if (item.type === 'boss') drawBoss(item.obj);
    });
    
    projectiles.forEach(p => {
        ctx.save(); ctx.translate(p.x, p.y); if(p.angle) ctx.rotate(p.angle + frame*0.1);
        ctx.fillStyle = '#fff'; ctx.fillRect(-8, -10, 16, 20); 
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.moveTo(-5, 5); ctx.lineTo(3, 5); ctx.stroke();
        ctx.restore();
    });
    enemyProjectiles.forEach(p => { ctx.fillStyle = p.type==='chaos'?'#e91e63':'red'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill(); });
    particles.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life/20; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill(); });
    ctx.globalAlpha = 1;
}

function drawRoom() {
    let themeIndex;
    if (level <= 8) themeIndex = 0; else if (level <= 16) themeIndex = 1; else themeIndex = 2;
    const theme = THEMES[themeIndex] || THEMES[0]; 

    const grd = ctx.createLinearGradient(0, 0, 0, 300);
    grd.addColorStop(0, theme.wall); grd.addColorStop(1, "#fff");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, canvas.width, 300);
    
    ctx.fillStyle = theme.window; ctx.fillRect(100, 50, 600, 180);
    
    if(theme.type === 'night') {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        for(let i=0; i<20; i++) { ctx.beginPath(); ctx.arc(100 + (i*30 + frame)%600, 50 + Math.sin(i)*50, 1, 0, Math.PI*2); ctx.fill(); }
    } else {
        ctx.fillStyle = "rgba(255,255,255,0.6)"; 
        if(clouds && clouds.length) clouds.forEach(c => { ctx.beginPath(); ctx.arc(100+c.x, 50+c.y, c.size, 0, Math.PI*2); ctx.fill(); });
    }

    ctx.strokeStyle = theme.border; ctx.lineWidth = 8; ctx.strokeRect(100, 50, 600, 180);
    drawPlant(50, 260); drawPlant(750, 260);
    const floorGrd = ctx.createLinearGradient(0, 300, 0, 600);
    floorGrd.addColorStop(0, theme.floor); floorGrd.addColorStop(1, "#000");
    ctx.fillStyle = floorGrd; ctx.fillRect(0, 300, canvas.width, 300);
    ctx.fillStyle = "#222"; ctx.fillRect(0, 290, canvas.width, 10);
}

function drawPlant(x, y) { ctx.fillStyle = "#2e7d32"; ctx.beginPath(); ctx.ellipse(x, y, 20, 40, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#8d6e63"; ctx.fillRect(x-10, y+20, 20, 20); }

function drawCharacter(obj) {
    ctx.save(); ctx.translate(obj.x, obj.y); ctx.scale(obj.scale, obj.scale);
    ctx.fillStyle = PALETTE.shadow; ctx.beginPath(); ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI*2); ctx.fill();
    const walk = Math.sin((frame + obj.animOffset) * 0.2 * timeScale) * 0.5;
    const bob = Math.abs(Math.sin((frame + obj.animOffset) * 0.2 * timeScale)) * 3;
    ctx.translate(0, -bob);

    if(obj.type === 'powerup') {
            ctx.translate(0, -20); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -10, 15, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(15, -10, 8, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.ellipse(0, -10, 12, 5, 0, 0, Math.PI*2); ctx.fill();
    } else {
        ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
        ctx.save(); ctx.translate(-8, -20); ctx.rotate(walk); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 20); ctx.stroke(); 
        ctx.fillStyle='black'; ctx.beginPath(); ctx.ellipse(0, 20, 6, 3, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(8, -20); ctx.rotate(-walk); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 20); ctx.stroke(); 
        ctx.fillStyle='black'; ctx.beginPath(); ctx.ellipse(0, 20, 6, 3, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();

        ctx.fillStyle = obj.color; if(obj.hitFlash) ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.moveTo(-15, -60); ctx.lineTo(15, -60); ctx.lineTo(12, -20); ctx.lineTo(-12, -20); ctx.fill();
        
        ctx.strokeStyle = obj.type === 'vip' ? '#ffd700' : (obj.type==='chaos'?'#e91e63':'#000');
        ctx.save(); ctx.translate(-15, -55); ctx.rotate(-walk); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 20); ctx.stroke(); ctx.restore();
        
        ctx.save(); ctx.translate(15, -55); ctx.rotate(walk); 
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 20); ctx.stroke(); 
        if(obj.canShoot) {
                ctx.fillStyle = '#37474f'; ctx.translate(0, 20); ctx.fillRect(-2, -2, 6, 10); 
        }
        ctx.restore();

        if(obj.type !== 'bad' && obj.type !== 'chaos') {
            ctx.fillStyle = obj.type === 'vip' ? '#000' : '#fff'; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(-5, -50); ctx.lineTo(5, -50); ctx.fill();
            ctx.fillStyle = PALETTE.tie; ctx.fillRect(-2, -58, 4, 15);
        }
        
        ctx.fillStyle = PALETTE.skin; if(obj.hitFlash) ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(0, -70, 12, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = 'black'; ctx.strokeStyle = 'black'; ctx.lineWidth = 1.5;
        if (obj.type === 'good') { 
            ctx.beginPath(); ctx.arc(-4, -72, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(4, -72, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -68, 5, 0, Math.PI); ctx.stroke(); 
        } 
        else if (obj.type === 'bad') { 
            ctx.beginPath(); ctx.arc(-4, -72, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(4, -72, 1.5, 0, Math.PI*2); ctx.fill(); ctx.fillRect(-3, -68, 6, 1);
        } 
        else if (obj.type === 'killer') { 
            ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, -76); ctx.lineTo(-2, -73); ctx.stroke(); ctx.beginPath(); ctx.moveTo(7, -76); ctx.lineTo(2, -73); ctx.stroke();
            ctx.beginPath(); ctx.arc(-4, -71, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(4, -71, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -65, 4, Math.PI, 0); ctx.stroke(); 
        } 
        else if (obj.type === 'vip') { 
            ctx.fillStyle = 'black'; ctx.fillRect(-10, -75, 20, 6); ctx.fillRect(-3, -68, 6, 1);
        }
        else if (obj.type === 'chaos') { 
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(-4, -72, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(4, -72, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(-4, -72, 1, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(4, -72, 1, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -65, 3, 0, Math.PI*2); ctx.stroke(); 
        }
    }
    if (obj.hitFlash) obj.hitFlash--;
    if(obj.type !== 'powerup') {
        const hpPct = obj.life / obj.maxLife; ctx.fillStyle = 'black'; ctx.fillRect(-15, -95, 30, 4);
        ctx.fillStyle = hpPct < 0.3 ? 'red' : 'lime'; ctx.fillRect(-14, -94, 28 * hpPct, 2);
    }
    ctx.restore();
}

function drawPlayer(p) {
    ctx.save(); ctx.translate(p.x, p.y);
    if (hasShield) { ctx.strokeStyle = '#21cbf3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -50, 50, 0, Math.PI*2); ctx.stroke(); ctx.fillStyle = 'rgba(33, 203, 243, 0.2)'; ctx.fill(); }
    ctx.fillStyle = PALETTE.shadow; ctx.beginPath(); ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI*2); ctx.fill();
    
    let isMoving = p.moveUp || p.moveDown || p.moveLeft || p.moveRight;
    const walk = isMoving ? Math.sin(frame * 0.3) * 0.6 : 0;
    const bob = isMoving ? Math.abs(Math.sin(frame * 0.3)) * 3 : 0;
    ctx.translate(0, -bob);

    ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
    ctx.save(); ctx.translate(-8, -20); ctx.rotate(walk); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 20); ctx.stroke(); 
    ctx.fillStyle='#333'; ctx.beginPath(); ctx.ellipse(0, 20, 6, 3, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
    
    ctx.save(); ctx.translate(8, -20); ctx.rotate(-walk); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 20); ctx.stroke(); 
    ctx.fillStyle='#333'; ctx.beginPath(); ctx.ellipse(0, 20, 6, 3, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();

    ctx.fillStyle = currentSkin.color; ctx.fillRect(-16, -60, 32, 42); 
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(-6, -50); ctx.lineTo(6, -50); ctx.fill(); 
    ctx.fillStyle = currentSkin.color === '#212121' ? '#333' : '#d32f2f'; 
    ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(-3, -45); ctx.lineTo(0, -40); ctx.lineTo(3, -45); ctx.fill();
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(8, -45, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(8, -35, 2, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = currentSkin.color; 
    ctx.save(); ctx.translate(-16, -55); ctx.rotate(-walk); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 22); ctx.stroke(); 
    ctx.fillStyle = '#ffdbac'; ctx.beginPath(); ctx.arc(0, 24, 4, 0, Math.PI*2); ctx.fill(); ctx.restore(); 

    ctx.save(); ctx.translate(16, -55); ctx.rotate(walk); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 22); ctx.stroke(); 
    ctx.fillStyle = '#ffdbac'; ctx.beginPath(); ctx.arc(0, 24, 4, 0, Math.PI*2); ctx.fill(); 
    ctx.fillStyle = '#546e7a'; ctx.fillRect(-2, 20, 8, 12); ctx.fillStyle = '#cfd8dc'; ctx.fillRect(0, 20, 4, 12);
    ctx.restore();

    ctx.fillStyle = '#ffdbac'; ctx.beginPath(); ctx.arc(0, -70, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2c1b0e'; 
    ctx.beginPath(); ctx.moveTo(-15, -70); ctx.quadraticCurveTo(0, -95, 15, -75); ctx.lineTo(15, -68); ctx.quadraticCurveTo(0, -60, -15, -68); ctx.fill();

    ctx.fillStyle = 'black'; 
    ctx.beginPath(); ctx.arc(-5, -70, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -70, 2, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#00e676'; ctx.font = 'bold 12px Arial'; ctx.textAlign='center'; ctx.fillText("VOCÊ", 0, -95);
    ctx.restore();
}

function drawBoss(b) {
    ctx.save(); ctx.translate(b.x, b.y);
    if (level === MAX_LEVEL && boss.hp < boss.maxHp * 0.2) {
        ctx.fillStyle = '#ff0000'; ctx.translate((Math.random()-0.5)*5, (Math.random()-0.5)*5);
    } else {
        ctx.fillStyle = '#3e2723';
    }
    
    ctx.beginPath(); ctx.moveTo(-40, -100); ctx.lineTo(40, -100); ctx.lineTo(30, -10); ctx.lineTo(-30, -10); ctx.fill();
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth=8;
    ctx.beginPath(); ctx.moveTo(-40, -90); ctx.lineTo(-60, -50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, -90); ctx.lineTo(60, -50); ctx.stroke();
    ctx.fillStyle = PALETTE.skin; ctx.beginPath(); ctx.arc(0, -120, 30, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#9e9e9e'; ctx.beginPath(); ctx.arc(0, -125, 32, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(-10, -120, 8, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(10, -120, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(-10, -120, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(10, -120, 3, 0, Math.PI*2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'gold'; ctx.beginPath(); ctx.arc(10, -120, 9, 0, Math.PI*2); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = 'black'; ctx.beginPath(); ctx.moveTo(-20, -110); ctx.quadraticCurveTo(0, -100, 20, -110); ctx.stroke();
    ctx.fillStyle = 'black'; ctx.fillRect(-35, -160, 70, 40); ctx.fillRect(-50, -125, 100, 10);
    ctx.restore();
}

function loop() { 
    if (!gameRunning || isPaused) return; 
    try {
        update(); draw(); 
        animationId = requestAnimationFrame(loop); 
    } catch(e) {
        console.error(e);
        alert("Erro no jogo: " + e.message + ". Reiniciando...");
        resetToMenu();
    }
}

function applyDamage(amount, reason) {
    if (hasShield) { hasShield = false; btnShield.classList.remove('purchased'); playSound('shield_break'); showFloatingText(player.x, player.y - 60, "BLOQUEADO!", "#21cbf3"); return; }
    score -= amount; playSound('bad'); document.body.classList.add('damage-flash'); 
    shakeScreen(); 
    showFloatingText(player.x, player.y - 60, `-R$ ${amount.toFixed(2)}`, 'red'); setTimeout(() => document.body.classList.remove('damage-flash'), 100); updateUI(); updateCombo(false); 
}

function gameOver(title, reason) { 
    gameRunning = false; cancelAnimationFrame(animationId); goTitle.innerText = title; goReason.innerText = reason; finalScoreEl.innerText = scoreEl.innerText; 
    
    btnSaveRecord.innerText = "SALVAR"; 
    btnSaveRecord.disabled = false;
    playerNameInput.value = "";
    
    if (score > highScore) { 
        highScore = score; 
        saveGameData(); 
        newRecordMsg.style.display = 'block'; 
    } else {
        newRecordMsg.style.display = 'none';
    }
    
    gameOverScreen.style.display = 'flex'; 
}

function updateUI() { 
    if (isNaN(score)) { score = 0; }
    scoreEl.innerText = score.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
    scoreEl.style.color = score >= 0 ? '#4caf50' : '#f44336'; 
    levelEl.innerText = `${level}/${MAX_LEVEL}`; 
    
    let pct = ((score - GAME_OVER_LIMIT) / (SAFE_LIMIT - GAME_OVER_LIMIT)) * 100; 
    financeBar.style.width = Math.max(0, Math.min(100, pct)) + "%"; 
    financeBar.style.background = score < 0 ? '#d32f2f' : 'linear-gradient(90deg, #d32f2f, #fdd835, #4caf50)'; 
    
    let xpPct = (salesCount / SALES_TO_LEVEL_UP) * 100; 
    xpBar.style.width = xpPct + '%'; 

    ultBar.style.width = ultCharge + '%';
    mobileUltBtn.classList.toggle('disabled', ultCharge < 100);
}

function updateBossBar() { bossHpBar.style.width = (boss.hp / boss.maxHp * 100) + '%'; }
function showFloatingText(x, y, text, color) { const el = document.createElement('div'); el.className = 'float-text'; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.color = color; el.innerText = text; document.body.appendChild(el); setTimeout(() => el.remove(), 800); }
function checkLevelUp() { if (salesCount >= SALES_TO_LEVEL_UP) { level++; salesCount = 0; playSound('coin'); if (level > MAX_LEVEL) { gameWin(); return; } if (level % 5 === 0) startBossFight(); } }

window.addEventListener('keydown', e => {
    if(e.code === 'Space') { togglePause(); } 
    if(e.shiftKey) { triggerUltimate(); }
    if(e.key=='w'||e.key=='ArrowUp') player.moveUp=true; if(e.key=='s'||e.key=='ArrowDown') player.moveDown=true;
    if(e.key=='a'||e.key=='ArrowLeft') player.moveLeft=true; if(e.key=='d'||e.key=='ArrowRight') player.moveRight=true;
});
window.addEventListener('keyup', e => {
    if(e.key=='w'||e.key=='ArrowUp') player.moveUp=false; if(e.key=='s'||e.key=='ArrowDown') player.moveDown=false;
    if(e.key=='a'||e.key=='ArrowLeft') player.moveLeft=false; if(e.key=='d'||e.key=='ArrowRight') player.moveRight=false;
});

canvas.addEventListener('mousedown', e => {
    if (!gameRunning || isPaused) return; 
    const rect = canvas.getBoundingClientRect(); 
    const mouseX = e.clientX - rect.left; 
    const mouseY = e.clientY - rect.top;
    handleShot(mouseX, mouseY);
});

canvas.addEventListener('touchstart', e => {
    if(joystickActive) return;
    if (!gameRunning || isPaused) return; 
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    handleShot(mouseX, mouseY);
});

function handleShot(mouseX, mouseY) {
    initAudio(); playSound('shoot');
    spawnClickParticles(mouseX, mouseY, '#fff'); 
    let mult = getScoreMultiplier();

    if (isBossActive) {
        let bossHit = false;
        if(Math.abs(mouseX - boss.x) < 60 && mouseY > boss.y - 150 && mouseY < boss.y + 20) {
            boss.hp -= (5 * clickPower); 
            updateBossBar(); playSound('hit_vip'); spawnParticle(mouseX, mouseY, 'yellow');
            bossHit = true;
            if(boss.hp <= 0) { isBossActive=false; projectiles=[]; enemyProjectiles=[]; score+=50 * mult; showFloatingText(400, 300, "+R$ "+(50*mult).toFixed(2), "gold"); openShop(); }
        }
        if (!bossHit) {
            let hitTarget = false;
            for (let i = targets.length - 1; i >= 0; i--) {
                let t = targets[i];
                if (mouseX > t.x - 20 && mouseX < t.x + 20 && mouseY > t.y - 80 && mouseY < t.y) {
                    hitTarget = true;
                    t.hp -= clickPower; 
                    playSound('hit_vip'); spawnParticle(t.x, t.y-40, PALETTE.suit_pink);
                    if(t.hp<=0) {
                        let val = BASE_VALUES.CHAOS_KILL * mult;
                        score += val; showFloatingText(t.x, t.y-80, "+R$ "+val.toFixed(2), "#e91e63"); targets.splice(i, 1); updateCombo(true);
                    }
                    break;
                }
            }
            if (!hitTarget) { let penalty = getPenalty(BASE_VALUES.MISS); score -= penalty; showFloatingText(mouseX, mouseY, `-R$ ${penalty.toFixed(2)}`, 'red'); updateUI(); updateCombo(false); }
        }
    } else {
        let hit = false;
        const clickList = [...targets].sort((a,b) => b.y - a.y);
        for (let t of clickList) {
            if (mouseX > t.x - 20 && mouseX < t.x + 20 && mouseY > t.y - 80 && mouseY < t.y) {
                hit = true;
                if (t.type === 'chaos') { 
                    t.hp -= clickPower; playSound('hit_vip'); spawnParticle(t.x, t.y-40, PALETTE.suit_pink);
                    if(t.hp<=0) { let val = BASE_VALUES.CHAOS_KILL * mult; score += val; showFloatingText(t.x, t.y-80, "+R$ "+val.toFixed(2), "#e91e63"); targets = targets.filter(obj => obj !== t); updateCombo(true); }
                }
                else if (t.type === 'vip') {
                    t.hp -= clickPower; spawnParticle(t.x, t.y-40, 'gold'); playSound('hit_vip');
                    if(t.hp<=0) { let val = BASE_VALUES.VIP_SALE * mult; score += val; salesCount+=2; playSound('coin'); showFloatingText(t.x, t.y-80, "+R$ "+val.toFixed(2), "gold"); targets = targets.filter(obj => obj !== t); updateCombo(true); }
                } 
                else if (t.type === 'good') {
                    let val = BASE_VALUES.SALE * mult;
                    score += val; salesCount++; playSound('coin'); showFloatingText(t.x, t.y-80, "+R$ "+val.toFixed(2), "#4caf50"); targets = targets.filter(obj => obj !== t); updateCombo(true);
                } 
                else if (t.type === 'powerup') { 
                    playSound('powerup'); slowMotionTimer = 300 * coffeeDurationMult; 
                    showFloatingText(t.x, t.y-80, "CAFÉ SALVADOR!", "#fff"); document.body.classList.add('slow-motion-effect'); targets = targets.filter(obj => obj !== t);
                }
                else if (t.type === 'bad') {
                    let penalty = getPenalty(BASE_VALUES.WASTE); score -= penalty; playSound('bad'); showFloatingText(t.x, t.y-80, `-R$ ${penalty.toFixed(2)}`, "#29b6f6"); targets = targets.filter(obj => obj !== t); updateCombo(false);
                } 
                else if (t.type === 'killer') { gameOver("DEMITIDO!", "Cliente VIP insatisfeito."); return; }
                
                if (t.type !== 'powerup' && t.type !== 'chaos') checkLevelUp(); 
                break;
            }
        }
        if (!hit) { let penalty = getPenalty(BASE_VALUES.MISS); score -= penalty; playSound('bad'); showFloatingText(mouseX, mouseY, `-R$ ${penalty.toFixed(2)}`, 'red'); updateCombo(false); }
        updateUI();
    }
}

loadGameData();
updateUI();
