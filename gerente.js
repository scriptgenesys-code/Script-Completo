// ==UserScript==
// @name         Genesys - Gerente de Visibilidade (v2.2)
// @description  Controla quem aparece na tela com base nas configurações.
// ==/UserScript==

(function() {
    'use strict';

    console.log("[Gerente] Iniciando serviço de camuflagem...");

    // Mapeamento: Nome do Módulo -> IDs dos Elementos para ESCONDER
    const MAPA = {
        'MOD_CRONOMETROS': [
            '#purecloud-script-mini-dashboard', 
            '.injected-bubbles-container'
        ],
        'MOD_PAUSAS': [
            '#pausa-script-container'
        ],
        'MOD_PROTOCOLOS': [
            '#pr-trigger-button',       // Botão original
            '.pr-script-base-popup',    // Janela
            '#uni-btn-pr'               // Botão no Menu Unificado
        ],
        'MOD_RESPOSTAS': [
            '#qr-trigger-button',       // Botão original
            '.qr-script-quick-reply-popup', // Janela
            '#uni-btn-qr'               // Botão no Menu Unificado
        ],
        'MOD_BAR': [
            '#bau-trigger-button',      // Botão original
            '#bau-rede',                // Janela
            '#uni-btn-bar'              // Botão no Menu Unificado
        ],
        'MOD_IA': [
            '#gemini-float-btn',        // Botão original
            '#gemini-modal',            // Janela
            '#uni-btn-ia'               // Botão no Menu Unificado
        ],
        'MOD_ID': [
            '#uni-btn-id'               // Botão no Menu Unificado
        ],
        'MOD_MENU': [
            '#uni-menu-container'       // O Próprio Menu Unificado
        ]
    };

    function aplicarRegras() {
        // Verifica se é extensão ou ambiente de teste
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get(Object.keys(MAPA), function(config) {
            let css = "";

            // 1. REGRA GERAL: SE O MÓDULO ESTIVER DESLIGADO -> ESCONDE TUDO
            for (const [modulo, seletores] of Object.entries(MAPA)) {
                if (config[modulo] === false) {
                    seletores.forEach(seletor => {
                        css += `${seletor} { display: none !important; opacity: 0 !important; pointer-events: none !important; }\n`;
                    });
                }
            }

            // 2. REGRA ESPECIAL: SE O MENU ESTIVER DESLIGADO -> MOSTRA OS BOTÕES SOLTOS
            // Se o usuário desligou o Menu Unificado, temos de "ressuscitar" os botões originais
            // Mas APENAS se o módulo daquela ferramenta específica estiver LIGADO.
            if (config['MOD_MENU'] === false) {
                
                // Se IA está ligada, mostra o botão flutuante original da IA
                if (config['MOD_IA'] !== false) {
                    css += `#gemini-float-btn { display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; top: auto !important; bottom: 85px !important; right: 25px !important; width: 50px !important; height: 50px !important; }\n`;
                }
                
                // Se Protocolos está ligado...
                if (config['MOD_PROTOCOLOS'] !== false) {
                    css += `#pr-trigger-button { display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; top: auto !important; bottom: 30px !important; right: 25px !important; width: 50px !important; height: 50px !important; }\n`;
                }

                // Se Respostas está ligado...
                if (config['MOD_RESPOSTAS'] !== false) {
                    css += `#qr-trigger-button { display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; top: auto !important; bottom: 20px !important; right: 20px !important; width: 48px !important; height: 48px !important; }\n`;
                }

                // Se Baú está ligado...
                if (config['MOD_BAR'] !== false) {
                    css += `#bau-trigger-button { display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; top: auto !important; bottom: 20px !important; right: 80px !important; width: 48px !important; height: 48px !important; }\n`;
                }
            }

            // 3. INJETA O CSS NA PÁGINA
            let style = document.getElementById('estilo-gerente-visual');
            if (!style) {
                style = document.createElement('style');
                style.id = 'estilo-gerente-visual';
                document.head.appendChild(style);
            }
            // Só atualiza se houve mudança para poupar recursos
            if (style.textContent !== css) {
                style.textContent = css;
            }
        });
    }

    // Listeners para reagir instantaneamente
    chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local') aplicarRegras(); });
    
    // Watchdog: Garante que as regras se mantêm mesmo se o site mudar algo
    setInterval(aplicarRegras, 500); 
    
    // Executa ao iniciar
    aplicarRegras();

})();