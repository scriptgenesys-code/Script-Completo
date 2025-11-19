// ==UserScript==
// @name         PureCloud - Menu Unificado (V4.1 - Visual Refinado)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Menu FAB vertical moderno (Estilo Print) com animações suaves.
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. CSS (VISUAL DO PRINT) ---
    const css = `
        /* Esconder originais */
        #qr-trigger-button, #pr-trigger-button, #bau-trigger-button, #btn-extrator-doc-v31, #btn-extrator-doc-v41, #btn-extrator-doc-v5 { 
            display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; 
        }

        /* Container Principal */
        .uni-fab-container {
            position: fixed;
            bottom: 20px; right: 20px; /* Posição inicial */
            z-index: 2147483647;
            display: flex;
            flex-direction: column-reverse; /* Cresce para cima */
            align-items: center;
            gap: 15px; /* Espaço entre os botões */
        }

        /* Botão Mestre (O "+") */
        .uni-fab-main {
            width: 60px; height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FF5F6D, #FFC371); /* Laranja/Vermelho Suave */
            color: white; border: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer; font-size: 28px;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s;
            user-select: none;
        }
        
        .uni-fab-main:hover { transform: scale(1.1); }

        /* Estado Ativo (Vira "X" vermelho) */
        .uni-fab-main.active {
            transform: rotate(45deg);
            background: linear-gradient(135deg, #ff4b1f, #ff9068); /* Vermelho mais forte */
            box-shadow: 0 4px 20px rgba(255, 75, 31, 0.4);
        }

        /* Lista de Botões Filhos */
        .uni-fab-actions {
            display: flex;
            flex-direction: column-reverse;
            gap: 12px;
            margin-bottom: 5px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px) scale(0.8);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: none;
        }

        /* Mostrar botões quando ativo */
        .uni-fab-container.active .uni-fab-actions {
            opacity: 1; visibility: visible;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        /* Estilo dos Botões Menores */
        .uni-fab-btn {
            width: 50px; height: 50px;
            border-radius: 50%; border: none; color: white;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: transform 0.2s;
            position: relative;
        }
        .uni-fab-btn:hover { transform: scale(1.15); z-index: 2; }

        /* CORES ESPECÍFICAS (Baseado no Print) */
        #uni-btn-id  { background: linear-gradient(135deg, #667eea, #764ba2); } /* Roxo (ID) */
        #uni-btn-bar { background: linear-gradient(135deg, #ff6b6b, #ee5253); } /* Vermelho (PC) */
        #uni-btn-pr  { background: linear-gradient(135deg, #d4fc79, #96e6a1); color: #333; } /* Verde Limão (Lista) */
        #uni-btn-qr  { background: linear-gradient(135deg, #00f260, #0575e6); } /* Verde/Azul (Chat) */

        /* Ícones */
        .uni-icon { width: 24px; height: 24px; fill: currentColor; }
        .uni-icon-id { font-weight: 800; font-size: 22px; }
        
        /* Tooltip (Ao passar o mouse) */
        .uni-fab-btn::after {
            content: attr(data-label);
            position: absolute; right: 65px;
            background: rgba(0, 0, 0, 0.8); color: #fff;
            padding: 5px 10px; border-radius: 6px;
            font-size: 12px; font-weight: 600; white-space: nowrap;
            opacity: 0; visibility: hidden;
            transition: opacity 0.2s; pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .uni-fab-btn:hover::after { opacity: 1; visibility: visible; }
    `;
    
    const styleTag = document.createElement('style');
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    // --- 2. HTML (ESTRUTURA) ---
    const container = document.createElement('div');
    container.className = 'uni-fab-container';
    container.id = 'uni-menu-container';

    // Ícones SVG Limpos
    const iconPlus = `<svg class="uni-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
    const iconChat = `<svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6zm8 5H6v-2h8zm4-6H6V6h12z"/></svg>`;
    const iconList = `<svg class="uni-icon" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`;
    const iconPC = `<svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`;

    container.innerHTML = `
        <div class="uni-fab-actions">
            <button class="uni-fab-btn" id="uni-btn-id" data-label="Copiar ID (Doc)">
                <span class="uni-icon-id">🆔</span>
            </button>
            <button class="uni-fab-btn" id="uni-btn-bar" data-label="Baú (BAR)">${iconPC}</button>
            <button class="uni-fab-btn" id="uni-btn-pr" data-label="Protocolos">${iconList}</button>
            <button class="uni-fab-btn" id="uni-btn-qr" data-label="Respostas">${iconChat}</button>
        </div>
        <button class="uni-fab-main" id="uni-fab-trigger" title="Menu Ferramentas">${iconPlus}</button>
    `;
    document.body.appendChild(container);

    // --- 3. LÓGICA DE AÇÃO ---
    const trigger = document.getElementById('uni-fab-trigger');
    const menuContainer = document.getElementById('uni-menu-container');

    function toggleMenu() {
        trigger.classList.toggle('active');
        menuContainer.classList.toggle('active');
    }

    function clickOriginal(id) {
        const btn = document.getElementById(id);
        if(btn) btn.click();
    }

    trigger.onclick = toggleMenu;
    
    document.getElementById('uni-btn-qr').onclick = () => clickOriginal('qr-trigger-button');
    document.getElementById('uni-btn-pr').onclick = () => clickOriginal('pr-trigger-button');
    
    // BAR (Usa função global ou clique)
    document.getElementById('uni-btn-bar').onclick = () => {
        if (typeof window.toggleBau === 'function') window.toggleBau();
        else clickOriginal('bau-trigger-button');
    };

    // ID (Chama a função global do Extrator)
    document.getElementById('uni-btn-id').onclick = () => {
        if (typeof window.executarExtracaoDocumento === 'function') {
            window.executarExtracaoDocumento();
        } else {
            alert("Script de Extração não carregado.");
        }
    };

    // --- 4. ARRASTAR (DRAGGABLE) ---
    let isDragging = false, startX, startY, initLeft, initTop;

    trigger.onmousedown = (e) => {
        if(e.button !== 0) return;
        isDragging = false;
        startX = e.clientX; startY = e.clientY;
        const r = container.getBoundingClientRect();
        initLeft = r.left; initTop = r.top;
        container.style.transition = 'none'; trigger.style.transition = 'none';

        function onMove(me) {
            const dx = me.clientX - startX; const dy = me.clientY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDragging = true;
                trigger.onclick = null; 
                container.style.right = 'auto'; container.style.bottom = 'auto';
                container.style.left = (initLeft + dx) + 'px'; container.style.top = (initTop + dy) + 'px';
            }
        }

        function onUp() {
            document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
            container.style.transition = ''; trigger.style.transition = '';
            if (isDragging) {
                localStorage.setItem('uniMenuPos', JSON.stringify({left: container.style.left, top: container.style.top}));
                setTimeout(() => { trigger.onclick = toggleMenu; isDragging = false; }, 100);
            }
        }
        document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    };

    // --- 5. RESTAURAR POSIÇÃO ---
    const saved = localStorage.getItem('uniMenuPos');
    if(saved) {
        const p = JSON.parse(saved);
        container.style.left = p.left; container.style.top = p.top;
        container.style.bottom = 'auto'; container.style.right = 'auto';
    } else {
        container.style.bottom = '20px'; container.style.right = '20px';
    }

    // --- 6. EXTERMINADOR DE FANTASMAS ---
    setInterval(() => {
        ['qr-trigger-button', 'pr-trigger-button', 'bau-trigger-button', 'btn-extrator-doc-v31', 'btn-extrator-doc-v41', 'btn-extrator-doc-v5'].forEach(id => {
            const el = document.getElementById(id);
            if(el && el.style.display !== 'none') {
                el.style.display = 'none'; el.style.visibility = 'hidden'; el.style.pointerEvents = 'none';
            }
        });
    }, 1000);

})();
