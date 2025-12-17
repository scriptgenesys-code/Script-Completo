// ==UserScript==
// @name         PureCloud - Central de Conhecimento (Módulo Extensão)
// @description  Base completa de conhecimento integrada ao Menu Unificado.
// ==/UserScript==

(function() {
    'use strict';

    // ... (SEUS DADOS 'BRISA_DB' E OS TEMPLATES 'TPL' FICAM AQUI) ...
    // ... (Vou omitir os dados para economizar espaço, mas MANTENHA-OS) ...
    const TPL = {
        sistema: (t, s, c, l) => `<div class="wiki-content system-theme"><div class="wiki-header"><h3 style="color:#8be9fd;">🖥️ ${t}</h3><p class="wiki-subtitle">${s}</p></div><div class="wiki-body">${c}</div>${l&&l!=='#'?`<div class="wiki-footer"><a href="${l}" target="_blank" class="btn-acesso">Acessar Agora ↗</a></div>`:''}</div>`,
        produto: (t, s, c) => `<div class="wiki-content product-theme"><div class="wiki-header"><h3 style="color:#f1fa8c;">📦 ${t}</h3><p class="wiki-subtitle">${s}</p></div><div class="wiki-body">${c}</div></div>`,
        tecnico: (t, r, c, l) => `<div class="wiki-content tech-theme"><div class="wiki-header"><h3 style="color:#ff79c6;">🛠️ ${t}</h3></div><div class="wiki-summary"><strong>RESUMO:</strong> ${r}</div><div class="wiki-body">${c}</div>${l?`<div class="wiki-footer"><a href="${l}" target="_blank" class="btn-acesso">Abrir Documento/Link ↗</a></div>`:''}</div>`
    };
    
    // ... (MANTENHA A VARIÁVEL BRISA_DB AQUI) ...
    // Se precisar, copie do arquivo anterior. A lógica corrigida começa abaixo:

    const ICONS = {
        CLOSE: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        LINK_EXT: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
        MAIN_ICON: `💠`
    };

    function createDashboard() {
        if (document.getElementById('central-dashboard')) return;
        const oldOverlay = document.querySelector('.central-modal-overlay');
        if(oldOverlay) oldOverlay.remove();

        const dashboard = document.createElement('div');
        dashboard.id = 'central-dashboard';
        dashboard.innerHTML = `
            <div class="central-sidebar"><div class="central-logo"><span>${ICONS.MAIN_ICON}</span> Central</div><ul class="central-menu"></ul><div class="central-version">v34.2</div></div>
            <div class="central-main"><div class="central-topbar"><h3 id="section-title">Início</h3><input type="text" id="central-search" placeholder="Pesquisar..."><button id="btn-close-dashboard">${ICONS.CLOSE}</button></div><div class="central-grid" id="central-content"></div></div>
        `;
        document.body.appendChild(dashboard);

        // ... (Lógica de renderização do menu e conteúdo - MANTENHA A SUA) ...
        // ... (Vou colocar apenas a lógica de fechar e overlay corrigida) ...
        
        dashboard.querySelector('#btn-close-dashboard').onclick = () => dashboard.remove();
        makeDraggable(dashboard, dashboard.querySelector('.central-logo'));
        
        // Simulação do render inicial (Se tiver BRISA_DB disponível, descomente)
        if(typeof BRISA_DB !== 'undefined') {
             // ... Render logic ...
        }
    }

    function openModal(item) {
        const oldOverlay = document.querySelector('.central-modal-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'central-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'central-modal';
        
        let btnLink = '';
        if (item.url && item.url !== "#") {
             btnLink = `<a href="${item.url}" target="_blank" class="btn-modal-action">Acessar Link Externo ${ICONS.LINK_EXT}</a>`;
        }

        modal.innerHTML = `
            <div class="modal-header"><div class="modal-title"><span>${item.icon}</span> ${item.label}</div><button class="btn-close-modal">${ICONS.CLOSE}</button></div>
            <div class="modal-content">${item.details || "<p>Sem detalhes.</p>"}</div>
            <div class="modal-footer">${btnLink}</div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const close = () => { 
            overlay.style.opacity = '0'; 
            overlay.style.pointerEvents = 'none'; // Desbloqueia a tela imediatamente
            setTimeout(() => overlay.remove(), 200); 
        };
        
        modal.querySelector('.btn-close-modal').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
        
        requestAnimationFrame(() => { overlay.style.opacity = '1'; modal.style.transform = 'translate(-50%, -50%) scale(1)'; });
    }

    function makeDraggable(el, handle) {
        let isDrag = false, startX, startY, initL, initT;
        handle.onmousedown = e => { isDrag = true; startX = e.clientX; startY = e.clientY; initL = el.offsetLeft; initT = el.offsetTop; };
        document.onmousemove = e => { if (isDrag) { el.style.left = (initL + e.clientX - startX) + 'px'; el.style.top = (initT + e.clientY - startY) + 'px'; }};
        document.onmouseup = () => isDrag = false;
    }

    function injectCss() {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            /* ... (Seu CSS original) ... */
            .central-modal-overlay { 
                position: fixed; inset: 0; background: rgba(0,0,0,0.85); 
                backdrop-filter: blur(5px); z-index: 100001; 
                display: flex; justify-content: center; align-items: center; 
                opacity: 0; transition: opacity 0.2s; 
                pointer-events: auto; /* Bloqueia fundo SÓ quando ativo */
            }
        `;
        document.head.appendChild(style);
    }
    
    // Trigger Global
    const createTriggerButton = () => {
        let btn = document.getElementById('central-trigger-btn');
        if (btn) return;
        btn = document.createElement('button');
        btn.id = 'central-trigger-btn';
        btn.style.display = 'none'; 
        document.body.appendChild(btn);
        btn.onclick = createDashboard;
    };
    createTriggerButton();
})();
