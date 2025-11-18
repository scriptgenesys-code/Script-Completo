// Este é um SCRIPT SIMPLES (V4.5 CORRIGIDO) - NÃO é um UserScript.
// Este ficheiro foi feito para ser carregado pelo seu FAVORITO (Bookmarklet).

(function() {
    'use strict';
    console.log('[Bookmarklet Loader V4.5] Carregador principal iniciado.');

    // URL base do seu GitHub Pages
    const basePath = 'https://scriptgenesys-code.github.io/Script-Completo/';

    // Lista ATUALIZADA com os 5 scripts que você quer carregar
    const scriptsToLoad = [
        'Cronometros.js',
        'Pausas Automaticas (1).js',
        'Respostas Rapidas.js',   
        'Protocolos rapidos.js',
        'BAR.js'
    ];
    
    // --- CORREÇÃO (V4.5) ---
    // URL DE LOG ATUALIZADA para corresponder ao Cronometros.js
    const LOG_URL = 'https://script.google.com/macros/s/AKfycbyBkz1XED-bMLDrPX19VMPoHmMB2_WovBb-Pn2HN1MG0P3lQOl6MkVCkcI6_Yo6WiGsEg/exec';

    /* --- Log de Acesso (Mantido) --- */
    let userName = "Usuário Anônimo";
    try {
        setTimeout(function() {
            let userElement = document.querySelector('div.name span.entry-value');
            if (userElement) {
                userName = userElement.innerText;
            }
            
            fetch(LOG_URL, {
                method: 'POST',
                mode: 'no-cors', 
                body: JSON.stringify({
                    type: 'log',
                    user: userName,
                    page: window.location.href
                })
            });
            console.log('[Bookmarklet Loader V4.5] Log de acesso enviado.');
        }, 5000); 
    } catch (err) {
        console.log('[Bookmarklet Loader V4.5] Falha ao registrar log:', err);
    }

    /* --- Carregador de Scripts --- */
    try {
        scriptsToLoad.forEach(scriptName => {
            var scriptElement = document.createElement('script');
            scriptElement.src = basePath + encodeURIComponent(scriptName) + '?v=' + Date.now();
            document.body.appendChild(scriptElement);
            console.log(`[Bookmarklet Loader V4.5] Carregando: ${scriptName}`);
        });
        
        console.log('[Bookmarklet Loader V4.5] Todos os 5 scripts foram injetados.');
        
    } catch(e) {
        console.error('[Bookmarklet Loader V4.5] Erro crítico ao carregar scripts:', e);
    }

})();
