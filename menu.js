// ==UserScript==
// @name         PureCloud - Menu Unificado (V8.3 - Overlay Safety)
// @namespace    http://tampermonkey.net/
// @version      8.3
// @description  Menu FAB com proteção absoluta contra bloqueio de tela.
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    if (window.self !== window.top) return;

    // --- CSS DE SEGURANÇA ---
    const css = `
        /* 1. Oculta botões originais para não poluir */
        #qr-trigger-button, #pr-trigger-button, #bau-trigger-button, 
        #gemini-float-btn, #monitor-trigger-btn, #central-trigger-btn, #car-float-btn {
            display: none !important; opacity: 0 !important; pointer-events: none !important;
        }

        /* 2. Container do Menu: TRANSPARENTE AO CLIQUE */
        #uni-menu-container { 
            position: fixed; z-index: 2147483640; 
            display: flex; flex-direction: column-reverse; align-items: center; gap: 12px; 
            width: 60px; height: auto; bottom: 20px; right: 20px;
            pointer-events: none !important; /* O SEGREDRO: Cliques atravessam a área vazia */
        }

        /* 3. Botões do Menu: REATIVAM O CLIQUE */
        .uni-fab-main, .uni-fab-btn { 
            pointer-events: auto !important; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); 
        }

        .uni-fab-main { 
            width: 60px; height: 60px; border-radius: 50%; 
            background: linear-gradient(135deg, #FF5F6D, #FFC371); 
            color: white; border: none; cursor: pointer; font-size: 28px; 
            display: flex; align-items: center; justify-content: center; 
            transition: transform 0.3s, background 0.3s; user-select: none;
        }
        .uni-fab-main:hover { transform: scale(1.05); }
        .uni-fab-main.active { transform: rotate(45deg); background: linear-gradient(135deg, #ff4b1f, #ff9068); }
        
        .uni-fab-actions { 
            display: flex; flex-direction: column-reverse; gap: 10px; margin-bottom: 5px; 
            opacity: 0; visibility: hidden; transform: translateY(20px) scale(0.8); 
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
            pointer-events: none !important; /* Garante que invisível não bloqueia */
        }
        
        #uni-menu-container.active .uni-fab-actions { 
            opacity: 1; visibility: visible; transform: translateY(0) scale(1); 
            pointer-events: auto !important; /* Ativa clique apenas quando visível */
        }
        
        .uni-fab-btn { 
            width: 45px; height: 45px; border-radius: 50%; border: none; color: white; cursor: pointer; 
            display: flex; align-items: center; justify-content: center; position: relative;
        }
        .uni-fab-btn:hover { transform: scale(1.15); z-index: 2; }
        
        /* Cores dos Botões */
        #uni-btn-id { background: linear-gradient(135deg, #667eea, #764ba2); }
        #uni-btn-bar { background: linear-gradient(135deg, #ff6b6b, #ee5253); }
        #uni-btn-pr { background: linear-gradient(135deg, #d4fc79, #96e6a1); color: #333; }
        #uni-btn-qr { background: linear-gradient(135deg, #00f260, #0575e6); }
        #uni-btn-ia { background: linear-gradient(135deg, #2563EB, #7C3AED); }
        #uni-btn-mon { background: linear-gradient(135deg, #F59E0B, #D97706); }
        #uni-btn-central { background: linear-gradient(135deg, #06B6D4, #3B82F6); }
        #uni-btn-copy { background: linear-gradient(135deg, #FF00CC, #333399); }
        #uni-btn-car { background: linear-gradient(135deg, #10b981, #059669); } 
        #uni-btn-game { background: linear-gradient(135deg, #f093fb, #f5576c); }

        .uni-fab-btn::after { 
            content: attr(data-label); position: absolute; right: 55px; 
            background: rgba(0,0,0,0.8); color: #fff; padding: 4px 8px; 
            border-radius: 4px; font-size: 11px; white-space: nowrap; 
            opacity: 0; visibility: hidden; transition: opacity 0.2s; pointer-events: none;
        }
        .uni-fab-btn:hover::after { opacity: 1; visibility: visible; }
        .uni-icon { width: 20px; height: 20px; fill: currentColor; }

        /* OVERLAY DO JOGO - PROTEÇÃO MÁXIMA */
        #game-overlay-backdrop {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 2147483648;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(5px);
            pointer-events: auto; /* Bloqueia o fundo apenas quando o jogo está aberto */
        }
        #game-overlay-container {
            width: 820px; height: 620px; background: #000;
            border: 2px solid #333; border-radius: 10px;
            box-shadow: 0 0 50px rgba(0,0,0,0.8); position: relative; overflow: hidden;
        }
        #game-overlay-close {
            position: absolute; top: -15px; right: -15px; width: 40px; height: 40px;
            background: #f44336; color: white; border: 2px solid #fff; border-radius: 50%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 20px; z-index: 10;
        }
        #game-iframe { width: 100%; height: 100%; border: none; }
    `;
    
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    // --- LIMPEZA DE LIXO E CONFLITOS ---
    if (document.getElementById('uni-menu-container')) document.getElementById('uni-menu-container').remove();
    
    // Remove qualquer overlay órfão que possa estar bloqueando a tela (Correção Crítica)
    const oldOverlays = document.querySelectorAll('#game-overlay-backdrop');
    oldOverlays.forEach(el => el.remove());

    const div = document.createElement('div'); div.id = 'uni-menu-container';
    div.innerHTML = `
        <div class="uni-fab-actions">
            <button class="uni-fab-btn" id="uni-btn-game" data-label="Relax Game"><span style="font-size:20px;">🎮</span></button>
            <button class="uni-fab-btn" id="uni-btn-ia" data-label="Assistente IA"><span style="font-size:20px;">🧑‍💻</span></button>
            <button class="uni-fab-btn" id="uni-btn-central" data-label="Central de Ajuda"><span style="font-size:22px;">💠</span></button>
            <button class="uni-fab-btn" id="uni-btn-mon" data-label="Monitor Filas"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></button>
            <button class="uni-fab-btn" id="uni-btn-copy" data-label="Copiar Chat"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg></button>
            <button class="uni-fab-btn" id="uni-btn-car" data-label="Automação (CAR)"><span style="font-size:18px;">⌨️</span></button>
            <button class="uni-fab-btn" id="uni-btn-id" data-label="Copiar ID"><span style="font-size:20px;font-weight:800;">🆔</span></button>
            <button class="uni-fab-btn" id="uni-btn-bar" data-label="Ferramentas (Bar)"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg></button>
            <button class="uni-fab-btn" id="uni-btn-pr" data-label="Protocolos"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg></button>
            <button class="uni-fab-btn" id="uni-btn-qr" data-label="Respostas"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6zm8 5H6v-2h8zm4-6H6V6h12z"/></svg></button>
        </div>
        <button class="uni-fab-main" id="uni-fab-trigger" title="Menu Genesys">
            <svg class="uni-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
    `;
    document.body.appendChild(div);

    const container = document.getElementById('uni-menu-container');
    const trigger = document.getElementById('uni-fab-trigger');
    let isDragging = false, startX, startY, initialLeft, initialTop;

    trigger.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        e.preventDefault(); isDragging = false; startX = e.clientX; startY = e.clientY;
        const rect = container.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
        document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        const dx = e.clientX - startX; const dy = e.clientY - startY;
        if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) { isDragging = true; container.style.transition = 'none'; }
        if (isDragging) {
            let newLeft = Math.max(0, Math.min(initialLeft + dx, window.innerWidth - container.offsetWidth));
            let newTop = Math.max(0, Math.min(initialTop + dy, window.innerHeight - container.offsetHeight));
            container.style.left = newLeft + 'px'; container.style.top = newTop + 'px';
            container.style.bottom = 'auto'; container.style.right = 'auto';
        }
    }

    function onMouseUp(e) {
        document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp);
        if (isDragging) {
            container.style.transition = 'all 0.3s';
            localStorage.setItem('uniMenuPos', JSON.stringify({ left: container.style.left, top: container.style.top }));
            setTimeout(() => { isDragging = false; }, 50);
        }
    }

    trigger.addEventListener('click', function(e) {
        if (isDragging) { e.stopImmediatePropagation(); e.preventDefault(); return; }
        container.classList.toggle('active'); trigger.classList.toggle('active');
    });

    try { const savedPos = localStorage.getItem('uniMenuPos'); if (savedPos) { const p = JSON.parse(savedPos); container.style.left = p.left; container.style.top = p.top; container.style.bottom = 'auto'; container.style.right = 'auto'; } } catch (e) {}

    // TRIGGERS
    function triggerModule(id) { const btn = document.getElementById(id); if (btn) btn.click(); else console.warn("Módulo não carregado: " + id); }

    document.getElementById('uni-btn-qr').onclick = () => triggerModule('qr-trigger-button');
    document.getElementById('uni-btn-pr').onclick = () => triggerModule('pr-trigger-button');
    document.getElementById('uni-btn-bar').onclick = () => triggerModule('bau-trigger-button');
    document.getElementById('uni-btn-ia').onclick = () => triggerModule('gemini-float-btn');
    document.getElementById('uni-btn-mon').onclick = () => triggerModule('monitor-trigger-btn');
    document.getElementById('uni-btn-central').onclick = () => triggerModule('central-trigger-btn');
    
    document.getElementById('uni-btn-car').onclick = () => { if (typeof window.toggleCAR === 'function') window.toggleCAR(); };
    document.getElementById('uni-btn-id').onclick = () => { if (typeof window.executarExtracaoDocumento === 'function') window.executarExtracaoDocumento(); };
    document.getElementById('uni-btn-copy').onclick = () => {
        if (typeof window.executarCopiaEspelho === 'function') {
            const btn = document.getElementById('uni-btn-copy'); btn.style.transform = 'scale(0.9)';
            setTimeout(()=>btn.style.transform = 'scale(1)', 150); window.executarCopiaEspelho();
        }
    };

    // --- GAME (Overlay) ---
    function openGameInWindow(url) {
        window.open(url, 'FinalizarClienteGame', 'width=820,height=620,scrollbars=no,resizable=no');
    }

    function openGameInOverlay(url) {
        // Limpa anteriores para evitar duplicação de fundo escuro
        const old = document.getElementById('game-overlay-backdrop');
        if (old) old.remove();

        const backdrop = document.createElement('div');
        backdrop.id = 'game-overlay-backdrop';
        backdrop.innerHTML = `
            <div id="game-overlay-container">
                <button id="game-overlay-close" title="Fechar Jogo">X</button>
                <iframe id="game-iframe" src="${url}"></iframe>
            </div>
        `;
        document.body.appendChild(backdrop);

        const container = backdrop.querySelector('#game-overlay-container');
        container.style.transform = "scale(0.8)"; container.style.opacity = "0"; container.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        setTimeout(() => { container.style.transform = "scale(1)"; container.style.opacity = "1"; }, 10);

        document.getElementById('game-overlay-close').onclick = () => {
            container.style.transform = "scale(0.8)"; container.style.opacity = "0";
            setTimeout(() => backdrop.remove(), 200);
        };
        setTimeout(() => { document.getElementById('game-iframe').focus(); }, 100);
    }

    document.getElementById('uni-btn-game').onclick = () => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            const gameUrl = chrome.runtime.getURL('game.html');
            chrome.storage.local.get(['MOD_GAME_MODE'], function(result) {
                const mode = result.MOD_GAME_MODE || 'window';
                if (mode === 'overlay') openGameInOverlay(gameUrl);
                else openGameInWindow(gameUrl);
            });
        } else {
            alert("Erro: Este módulo só funciona como extensão instalada.");
        }
    };

})();
