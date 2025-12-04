// ==UserScript==
// @name         PureCloud - Menu Unificado (V6.1 - Com Espelho)
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Menu FAB que controla todas as ferramentas da Suite.
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const css = `
        /* Esconde os botões originais */
        #qr-trigger-button, #pr-trigger-button, #bau-trigger-button, 
        #gemini-float-btn, #monitor-trigger-btn, #central-trigger-btn {
            display: none !important; opacity: 0 !important; pointer-events: none !important;
        }

        #uni-menu-container { 
            position: fixed; z-index: 2147483647; display: flex; 
            flex-direction: column-reverse; align-items: center; gap: 12px; 
            width: 60px; height: auto; bottom: 20px; right: 20px;
        }

        .uni-fab-main { 
            width: 60px; height: 60px; border-radius: 50%; 
            background: linear-gradient(135deg, #FF5F6D, #FFC371); 
            color: white; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.3); 
            cursor: pointer; font-size: 28px; display: flex; align-items: center; justify-content: center; 
            transition: transform 0.3s, background 0.3s; user-select: none; pointer-events: auto;
        }
        .uni-fab-main:hover { transform: scale(1.05); }
        .uni-fab-main.active { transform: rotate(45deg); background: linear-gradient(135deg, #ff4b1f, #ff9068); }
        
        .uni-fab-actions { 
            display: flex; flex-direction: column-reverse; gap: 10px; margin-bottom: 5px; 
            opacity: 0; visibility: hidden; transform: translateY(20px) scale(0.8); 
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none; 
        }
        
        #uni-menu-container.active .uni-fab-actions { 
            opacity: 1; visibility: visible; transform: translateY(0) scale(1); pointer-events: auto; 
        }
        
        .uni-fab-btn { 
            width: 45px; height: 45px; border-radius: 50%; border: none; color: white; cursor: pointer; 
            display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
            transition: transform 0.2s; position: relative;
        }
        .uni-fab-btn:hover { transform: scale(1.15); z-index: 2; }
        
        /* Cores Específicas */
        #uni-btn-id  { background: linear-gradient(135deg, #667eea, #764ba2); }
        #uni-btn-bar { background: linear-gradient(135deg, #ff6b6b, #ee5253); }
        #uni-btn-pr  { background: linear-gradient(135deg, #d4fc79, #96e6a1); color: #333; }
        #uni-btn-qr  { background: linear-gradient(135deg, #00f260, #0575e6); }
        #uni-btn-ia  { background: linear-gradient(135deg, #2563EB, #7C3AED); }
        #uni-btn-mon { background: linear-gradient(135deg, #F59E0B, #D97706); }
        #uni-btn-central { background: linear-gradient(135deg, #06B6D4, #3B82F6); }
        #uni-btn-copy { background: linear-gradient(135deg, #FF00CC, #333399); } /* NOVO: Rosa Choque/Roxo */

        .uni-fab-btn::after { 
            content: attr(data-label); position: absolute; right: 55px; background: rgba(0,0,0,0.8); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; white-space: nowrap; opacity: 0; visibility: hidden; transition: opacity 0.2s; pointer-events: none;
        }
        .uni-fab-btn:hover::after { opacity: 1; visibility: visible; }
        
        .uni-icon { width: 20px; height: 20px; fill: currentColor; }
    `;
    
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    if (document.getElementById('uni-menu-container')) document.getElementById('uni-menu-container').remove();

    const div = document.createElement('div'); div.id = 'uni-menu-container';
    div.innerHTML = `
        <div class="uni-fab-actions">
            <button class="uni-fab-btn" id="uni-btn-ia" data-label="Assistente IA"><span style="font-size:20px;">🧑‍💻</span></button>
            <button class="uni-fab-btn" id="uni-btn-central" data-label="Central de Ajuda"><span style="font-size:22px;">💠</span></button>
            <button class="uni-fab-btn" id="uni-btn-mon" data-label="Monitor Filas"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></button>
            
            <button class="uni-fab-btn" id="uni-btn-copy" data-label="Copiar Chat"><svg class="uni-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg></button>
            
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
    
    document.getElementById('uni-btn-id').onclick = () => {
        if (typeof window.executarExtracaoDocumento === 'function') window.executarExtracaoDocumento();
        else alert("Módulo Extrator não está pronto.");
    };

    // --- NOVO GATILHO DE CÓPIA ---
    document.getElementById('uni-btn-copy').onclick = () => {
        if (typeof window.executarCopiaEspelho === 'function') {
            const btn = document.getElementById('uni-btn-copy');
            // Animação de clique
            btn.style.transform = 'scale(0.9)';
            setTimeout(()=>btn.style.transform = 'scale(1)', 150);
            window.executarCopiaEspelho();
        } else {
            alert("Módulo de Cópia Espelho não está carregado.");
        }
    };

})();
