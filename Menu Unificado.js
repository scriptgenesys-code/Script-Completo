// ==UserScript==
// @name         PureCloud - Menu Unificado (Master Button)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Junta Respostas, Protocolos e BAR num único botão flutuante.
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. ESCONDER OS BOTÕES ORIGINAIS ---
    // Injetamos CSS para garantir que os botões originais nunca apareçam,
    // mas continuem a existir no DOM para podermos "clicar" neles via código.
    const hideOriginalsCSS = `
        #qr-trigger-button, 
        #pr-trigger-button, 
        #bau-trigger-button { 
            display: none !important; 
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    const styleTag = document.createElement('style');
    styleTag.textContent = hideOriginalsCSS;
    document.head.appendChild(styleTag);

    // --- 2. ESTILO DO NOVO MENU (FAB - Floating Action Button) ---
    const menuCSS = `
        .uni-fab-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 2147483647; /* Máximo Z-Index */
            display: flex;
            flex-direction: column-reverse;
            align-items: center;
            gap: 10px;
            font-family: 'Segoe UI', sans-serif;
        }

        /* Botão Principal (Mestre) */
        .uni-fab-main {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00BFFF, #007FFF); /* Azul Tecnológico */
            color: white;
            border: none;
            box-shadow: 0 4px 15px rgba(0, 191, 255, 0.4);
            cursor: pointer;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            user-select: none;
        }

        .uni-fab-main:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 191, 255, 0.6);
        }

        .uni-fab-main.active {
            transform: rotate(45deg);
            background: #ff5252; /* Vermelho ao abrir */
        }

        /* Botões Secundários (Filhos) */
        .uni-fab-actions {
            display: flex;
            flex-direction: column-reverse;
            gap: 12px;
            margin-bottom: 5px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px) scale(0.8);
            transition: all 0.3s ease;
        }

        .uni-fab-container:hover .uni-fab-actions,
        .uni-fab-container.active .uni-fab-actions {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }

        .uni-fab-btn {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            transition: all 0.2s;
            position: relative;
        }

        .uni-fab-btn:hover {
            transform: scale(1.1) translateX(-2px);
        }
        
        /* Tooltip (Etiqueta) ao lado do botão */
        .uni-fab-btn::after {
            content: attr(data-label);
            position: absolute;
            right: 60px;
            background: rgba(20, 20, 30, 0.9);
            color: #fff;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s;
            pointer-events: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .uni-fab-btn:hover::after {
            opacity: 1;
            visibility: visible;
        }

        /* Cores Específicas */
        #uni-btn-qr { background: linear-gradient(135deg, #00C9FF, #92FE9D); } /* Verde/Azul - Respostas */
        #uni-btn-pr { background: linear-gradient(135deg, #FDBB2D, #22C1C3); } /* Amarelo/Verde - Protocolos */
        #uni-btn-bar { background: linear-gradient(135deg, #f85032, #e73827); } /* Laranja/Vermelho - BAR */
        
        /* Ícones SVG simples */
        .uni-icon { width: 24px; height: 24px; fill: currentColor; }
    `;
    
    const menuStyle = document.createElement('style');
    menuStyle.textContent = menuCSS;
    document.head.appendChild(menuStyle);

    // --- 3. CRIAR O HTML DO MENU ---
    const container = document.createElement('div');
    container.className = 'uni-fab-container';
    container.id = 'uni-menu-container';

    // Ícones SVG
    const iconMenu = `<svg class="uni-icon" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`;
    const iconPlus = `<svg class="uni-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`; // Usado para girar
    const iconChat = `<svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
    const iconList = `<svg class="uni-icon" viewBox="0 0 24 24"><path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z"/></svg>`;
    const iconPC = `<svg class="uni-icon" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`;

    container.innerHTML = `
        <div class="uni-fab-actions">
            <button class="uni-fab-btn" id="uni-btn-bar" data-label="Baú (BAR)">${iconPC}</button>
            <button class="uni-fab-btn" id="uni-btn-pr" data-label="Protocolos">${iconList}</button>
            <button class="uni-fab-btn" id="uni-btn-qr" data-label="Respostas">${iconChat}</button>
        </div>
        <button class="uni-fab-main" id="uni-fab-trigger" title="Menu Ferramentas">
            ${iconPlus}
        </button>
    `;

    document.body.appendChild(container);

    // --- 4. LÓGICA DE FUNCIONAMENTO ---

    // Ação de abrir/fechar menu (clique no botão principal)
    const trigger = document.getElementById('uni-fab-trigger');
    const menuContainer = document.getElementById('uni-menu-container');

    trigger.addEventListener('click', () => {
        trigger.classList.toggle('active');
        menuContainer.classList.toggle('active');
    });

    // Função auxiliar para disparar o clique no botão original
    function triggerOriginalButton(originalId, name) {
        const originalBtn = document.getElementById(originalId);
        if (originalBtn) {
            console.log(`[Menu Unificado] Abrindo ${name}...`);
            originalBtn.click();
        } else {
            alert(`O script "${name}" ainda não carregou ou não foi encontrado.`);
        }
    }

    // Ligar os botões novos aos antigos
    document.getElementById('uni-btn-qr').onclick = () => triggerOriginalButton('qr-trigger-button', 'Respostas Rápidas');
    document.getElementById('uni-btn-pr').onclick = () => triggerOriginalButton('pr-trigger-button', 'Protocolos Rápidos');
    document.getElementById('uni-btn-bar').onclick = () => triggerOriginalButton('bau-trigger-button', 'Baú de Acesso (BAR)');

    // --- 5. TORNAR O MENU ARRASTÁVEL (DRAGGABLE) ---
    // Usa a mesma lógica dos seus outros scripts para manter consistência
    let isDragging = false;
    let dragStartX, dragStartY, initialLeft, initialTop;

    trigger.onmousedown = (e) => {
        if (e.button !== 0) return; // Apenas botão esquerdo
        isDragging = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        const rect = container.getBoundingClientRect();
        // Se não tiver left/top definido (estiver usando right/bottom), calcula
        initialLeft = rect.left;
        initialTop = rect.top;

        // Desativa transições durante o arrasto para ser suave
        container.style.transition = 'none';
        
        document.onmousemove = (me) => {
            const dX = me.clientX - dragStartX;
            const dY = me.clientY - dragStartY;

            if (Math.abs(dX) > 5 || Math.abs(dY) > 5) {
                isDragging = true; // Começou a arrastar
                
                // Remove right/bottom para usar left/top
                container.style.right = 'auto';
                container.style.bottom = 'auto';
                
                container.style.left = (initialLeft + dX) + 'px';
                container.style.top = (initialTop + dY) + 'px';
            }
        };

        document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
            container.style.transition = ''; // Retorna transições
            
            // Se foi um arrasto, impede o clique de abrir o menu imediatamente
            if (isDragging) {
                // Pequeno timeout para evitar que o evento 'click' dispare a abertura
                setTimeout(() => { isDragging = false; }, 100);
                // Garante que o botão não fique no estado "ativo" se só arrastou
                trigger.classList.remove('active');
                menuContainer.classList.remove('active');
            }
        };
    };

    // Impede que o clique de arrastar abra o menu
    trigger.addEventListener('click', (e) => {
        if (isDragging) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }, true);

})();
