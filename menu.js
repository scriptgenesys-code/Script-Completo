// ==UserScript==
// @name         PureCloud - Menu Unificado (V5.3 - Safe Position)
// @description  Menu FAB com proteção de posição e arrasto.
// ==/UserScript==

(function() {
    'use strict';

    // 1. HTML (ESTRUTURA DO MENU)
    const div = document.createElement('div'); 
    div.className = 'uni-fab-container'; 
    div.id = 'uni-menu-container';
    
    // Estilos inline de emergência para garantir que aparece no lugar certo
    div.style.cssText = "position: fixed; bottom: 30px; right: 30px; z-index: 2147483646; display: flex; flex-direction: column-reverse; align-items: center; gap: 15px;";

    div.innerHTML = `
        <div class="uni-fab-actions">
            <button class="uni-fab-btn" id="uni-btn-ia" data-label="Assistente IA"><span style="font-size:22px;">🧑‍💻</span></button>
            <button class="uni-fab-btn" id="uni-btn-id" data-label="Copiar ID (Doc)"><span style="font-size:22px;font-weight:800;">🆔</span></button>
            <button class="uni-fab-btn" id="uni-btn-bar" data-label="Baú (BAR)"><svg class="uni-icon" viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg></button>
            <button class="uni-fab-btn" id="uni-btn-pr" data-label="Protocolos"><svg class="uni-icon" viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg></button>
            <button class="uni-fab-btn" id="uni-btn-qr" data-label="Respostas"><svg class="uni-icon" viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6zm8 5H6v-2h8zm4-6H6V6h12z"/></svg></button>
        </div>
        <button class="uni-fab-main" id="uni-fab-trigger"><svg class="uni-icon" viewBox="0 0 24 24" style="width:24px;height:24px;fill:white;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>
    `;
    document.body.appendChild(div);

    // 2. LÓGICA E COMPORTAMENTO
    const trigger = document.getElementById('uni-fab-trigger');
    const container = document.getElementById('uni-menu-container');
    
    function toggle() { 
        trigger.classList.toggle('active'); 
        container.classList.toggle('active'); 
    }
    trigger.onclick = toggle;

    // Fallback de clique (Função para clicar nos botões escondidos)
    function clickFallback(id) { 
        const b = document.getElementById(id); 
        if(b) b.click(); 
        else alert("Ferramenta não carregada (verifique se o módulo está ativo)."); 
    }

    document.getElementById('uni-btn-qr').onclick = () => clickFallback('qr-trigger-button'); 
    document.getElementById('uni-btn-pr').onclick = () => clickFallback('pr-trigger-button');
    document.getElementById('uni-btn-bar').onclick = () => clickFallback('bau-trigger-button');
    document.getElementById('uni-btn-ia').onclick = () => clickFallback('gemini-float-btn');
    document.getElementById('uni-btn-id').onclick = () => { 
        if(typeof window.executarExtracaoDocumento === 'function') window.executarExtracaoDocumento();
        else alert("Script Extrator não carregado.");
    };

    // 3. DRAG (ARRASTAR)
    let isDrag = false, sX, sY, iL, iT;
    
    trigger.onmousedown = e => {
        if(e.button!==0) return;
        isDrag = false; sX = e.clientX; sY = e.clientY;
        const r = container.getBoundingClientRect(); 
        iL = r.left; iT = r.top;
        container.style.transition = 'none';
        
        const move = ev => { 
            if(Math.abs(ev.clientX - sX) > 5 || Math.abs(ev.clientY - sY) > 5) { 
                isDrag = true; trigger.onclick = null;
                container.style.left = (iL + ev.clientX - sX) + 'px'; 
                container.style.top = (iT + ev.clientY - sY) + 'px'; 
                container.style.bottom = 'auto'; container.style.right = 'auto'; 
            } 
        };
        
        const up = () => { 
            document.removeEventListener('mousemove', move); 
            document.removeEventListener('mouseup', up); 
            container.style.transition = '';
            
            if(isDrag) { 
                localStorage.setItem('uniMenuPos', JSON.stringify({ left: container.style.left, top: container.style.top })); 
                setTimeout(() => { trigger.onclick = toggle; isDrag = false; }, 100); 
            } 
        };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    };

    // 4. RESTAURAR POSIÇÃO (COM PROTEÇÃO)
    const saved = localStorage.getItem('uniMenuPos');
    if(saved) { 
        try {
            const p = JSON.parse(saved);
            const top = parseInt(p.top);
            const left = parseInt(p.left);
            const h = window.innerHeight;
            const w = window.innerWidth;

            // Verifica se a posição salva está DENTRO da tela visível
            if (top > 0 && left > 0 && top < (h - 50) && left < (w - 50)) {
                container.style.left = p.left; 
                container.style.top = p.top; 
                container.style.bottom = 'auto'; 
                container.style.right = 'auto'; 
            } else {
                // Se estiver fora, apaga a memória e usa o padrão (reset)
                console.warn("[Menu] Posição inválida detetada. Resetando para o canto.");
                localStorage.removeItem('uniMenuPos');
            }
        } catch(e) {
            localStorage.removeItem('uniMenuPos');
        }
    }

})();
