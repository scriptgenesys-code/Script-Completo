// ==UserScript==
// @name         PureCloud - Menu Unificado (V4.3 - Correção Fantasma)
// @namespace    http://tampermonkey.net/
// @version      4.3
// @description  Menu FAB com ocultação forçada de botões fantasmas.
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 1. CSS
    const css = `
        /* Ocultação com especificidade máxima para evitar conflitos */
        #qr-trigger-button, #pr-trigger-button, #bau-trigger-button, [id^="btn-extrator"] { 
            display: none !important; 
            visibility: hidden !important; 
            opacity: 0 !important; 
            pointer-events: none !important; 
            position: fixed !important;
            z-index: -9999 !important;
            top: -1000px !important;
        }

        .uni-fab-container {
            position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
            display: flex; flex-direction: column-reverse; align-items: center; gap: 15px;
        }
        .uni-fab-main {
            width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #FF5F6D, #FFC371);
            color: white; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; font-size: 28px;
            display: flex; align-items: center; justify-content: center; transition: transform 0.3s, background 0.3s;
        }
        .uni-fab-main:hover { transform: scale(1.1); }
        .uni-fab-main.active { transform: rotate(45deg); background: linear-gradient(135deg, #ff4b1f, #ff9068); }
        
        .uni-fab-actions {
            display: flex; flex-direction: column-reverse; gap: 12px; margin-bottom: 5px; opacity: 0;
            visibility: hidden; transform: translateY(20px) scale(0.8); transition: all 0.3s; pointer-events: none;
        }
        .uni-fab-container.active .uni-fab-actions { opacity: 1; visibility: visible; transform: translateY(0) scale(1); pointer-events: auto; }

        .uni-fab-btn {
            width: 50px; height: 50px; border-radius: 50%; border: none; color: white; cursor: pointer;
            display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: transform 0.2s; position: relative;
        }
        .uni-fab-btn:hover { transform: scale(1.15); z-index: 2; }
        
        #uni-btn-id  { background: linear-gradient(135deg, #667eea, #764ba2); }
        #uni-btn-bar { background: linear-gradient(135deg, #ff6b6b, #ee5253); }
        #uni-btn-pr  { background: linear-gradient(135deg, #d4fc79, #96e6a1); color: #333; }
        #uni-btn-qr  { background: linear-gradient(135deg, #00f260, #0575e6); }
        
        .uni-fab-btn::after {
            content: attr(data-label); position: absolute; right: 65px; background: rgba(0,0,0,0.8); color: #fff;
            padding: 5px 10px; border-radius: 6px; font-size: 12px; white-space: nowrap; opacity: 0; visibility: hidden;
            transition: opacity 0.2s; pointer-events: none;
        }
        .uni-fab-btn:hover::after { opacity: 1; visibility: visible; }
        .uni-icon { width: 24px; height: 24px; fill: currentColor; }
    `;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

    // 2. HTML
    const div = document.createElement('div'); div.className = 'uni-fab-container'; div.id = 'uni-menu-container';
    div.innerHTML = `
        <div class="uni-fab-actions">
            <button class="uni-fab-btn" id="uni-btn-id" data-label="Copiar ID (Doc)"><span style="font-size:22px;font-weight:800;">🆔</span></button>
            <button class="uni-fab-btn" id="uni-btn-bar" data-label="Baú (BAR)"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg></button>
            <button class="uni-fab-btn" id="uni-btn-pr" data-label="Protocolos"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg></button>
            <button class="uni-fab-btn" id="uni-btn-qr" data-label="Respostas"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6zm8 5H6v-2h8zm4-6H6V6h12z"/></svg></button>
        </div>
        <button class="uni-fab-main" id="uni-fab-trigger"><svg class="uni-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>
    `;
    document.body.appendChild(div);

    // 3. LÓGICA
    const trigger = document.getElementById('uni-fab-trigger');
    const container = document.getElementById('uni-menu-container');
    
    function toggle() { trigger.classList.toggle('active'); container.classList.toggle('active'); }
    trigger.onclick = toggle;

    function clickFallback(id) { const b = document.getElementById(id); if(b) b.click(); else alert("Ferramenta não carregada."); }

    // --- AÇÕES INTEGRADAS ---
    document.getElementById('uni-btn-qr').onclick = () => clickFallback('qr-trigger-button'); 
    
    // Protocolos
    document.getElementById('uni-btn-pr').onclick = () => {
        if(typeof window.toggleProtocolos === 'function') window.toggleProtocolos();
        else clickFallback('pr-trigger-button');
    };

    // BAR
    document.getElementById('uni-btn-bar').onclick = () => {
        if(typeof window.toggleBau === 'function') window.toggleBau();
        else clickFallback('bau-trigger-button');
    };

    // ID
    document.getElementById('uni-btn-id').onclick = () => {
        if(typeof window.executarExtracaoDocumento === 'function') window.executarExtracaoDocumento();
        else alert("Script Extrator não carregado.");
    };

    // 4. DRAGGABLE
    let isDrag = false, sX, sY, iL, iT;
    trigger.onmousedown = e => {
        if(e.button!==0) return; isDrag = false; sX=e.clientX; sY=e.clientY;
        const r=container.getBoundingClientRect(); iL=r.left; iT=r.top;
        container.style.transition='none';
        
        const move = ev => {
            const dx=ev.clientX-sX, dy=ev.clientY-sY;
            if(Math.abs(dx)>5||Math.abs(dy)>5) { isDrag=true; trigger.onclick=null; 
                container.style.left=(iL+dx)+'px'; container.style.top=(iT+dy)+'px';
                container.style.bottom='auto'; container.style.right='auto';
            }
        };
        const up = () => {
            document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up);
            container.style.transition='';
            if(isDrag) {
                localStorage.setItem('uniMenuPos', JSON.stringify({left:container.style.left, top:container.style.top}));
                setTimeout(()=> { trigger.onclick=toggle; isDrag=false; }, 100);
            }
        };
        document.addEventListener('mousemove',move); document.addEventListener('mouseup',up);
    };

    // 5. RESTORE
    const saved = localStorage.getItem('uniMenuPos');
    if(saved) { const p=JSON.parse(saved); container.style.left=p.left; container.style.top=p.top; container.style.bottom='auto'; container.style.right='auto'; }

    // 6. CLEANER (AGRESSIVO V4.3)
    // Esta função força os estilos diretamente no elemento, vencendo qualquer CSS externo
    setInterval(() => {
        const ghosts = document.querySelectorAll('#qr-trigger-button, #pr-trigger-button, #bau-trigger-button, [id^="btn-extrator"]');
        ghosts.forEach(el => {
            // Aplica o estilo inline com !important para garantir a ocultação
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            // Move para fora da tela por precaução
            el.style.setProperty('position', 'fixed', 'important');
            el.style.setProperty('top', '-9999px', 'important');
        });
    }, 500); // Executa a cada 0.5s para garantir que novos botões sejam capturados rápido

})();
