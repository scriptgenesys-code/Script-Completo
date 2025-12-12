// ==UserScript==
// @name         Genesys - Gerente de Visibilidade (v2.5 - Game Added)
// @description  Controla quem aparece na tela com base nas configurações.
// ==/UserScript==

(function() {
    'use strict';

    console.log("[Gerente] Iniciando serviço de camuflagem...");

    // Mapeamento: Nome do Módulo -> IDs dos Elementos para ESCONDER
    const MAPA = {
        'MOD_CRONOMETROS': [ '#purecloud-script-mini-dashboard', '.injected-bubbles-container' ],
        'MOD_PAUSAS': [ '#pausa-script-container' ],
        'MOD_PROTOCOLOS': [ '#pr-trigger-button', '.pr-script-base-popup', '#uni-btn-pr' ],
        'MOD_RESPOSTAS': [ '#qr-trigger-button', '.qr-script-quick-reply-popup', '#uni-btn-qr' ],
        'MOD_BAR': [ '#bau-trigger-button', '#bau-rede', '#uni-btn-bar' ],
        'MOD_IA': [ '#gemini-float-btn', '#gemini-modal', '#uni-btn-ia' ],
        'MOD_CAR': [ '#car-panel', '#uni-btn-car' ],
        'MOD_ID': [ '#uni-btn-id' ],
        'MOD_MENU': [ '#uni-menu-container' ],
        'MOD_GAME': [ '#uni-btn-game' ] 
    };

    function aplicarRegras() {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

        chrome.storage.local.get(Object.keys(MAPA), function(config) {
            let css = "";

            for (const [modulo, seletores] of Object.entries(MAPA)) {
                if (config[modulo] === false) {
                    seletores.forEach(seletor => {
                        css += `${seletor} { display: none !important; opacity: 0 !important; pointer-events: none !important; }\n`;
                    });
                }
            }

            if (config['MOD_MENU'] === false) {
                // Se o menu estiver desligado, restauramos os botões flutuantes originais se os módulos estiverem ligados
                if (config['MOD_IA'] !== false) css += `#gemini-float-btn { display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; top: auto !important; bottom: 85px !important; right: 25px !important; width: 50px !important; height: 50px !important; }\n`;
                if (config['MOD_PROTOCOLOS'] !== false) css += `#pr-trigger-button { display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; top: auto !important; bottom: 30px !important; right: 25px !important; width: 50px !important; height: 50px !important; }\n`;
                if (config['MOD_RESPOSTAS'] !== false) css += `#qr-trigger-button { display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; top: auto !important; bottom: 20px !important; right: 20px !important; width: 48px !important; height: 48px !important; }\n`;
                if (config['MOD_BAR'] !== false) css += `#bau-trigger-button { display: flex !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; top: auto !important; bottom: 20px !important; right: 80px !important; width: 48px !important; height: 48px !important; }\n`;
            }

            let style = document.getElementById('estilo-gerente-visual');
            if (!style) {
                style = document.createElement('style');
                style.id = 'estilo-gerente-visual';
                document.head.appendChild(style);
            }
            if (style.textContent !== css) {
                style.textContent = css;
            }
        });
    }

    chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local') aplicarRegras(); });
    setInterval(aplicarRegras, 500); 
    aplicarRegras();

})();
