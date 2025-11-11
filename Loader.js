// Este é um SCRIPT SIMPLES (V4.5) - NÃO é um UserScript.
// Este ficheiro foi feito para ser carregado pelo seu FAVORITO (Bookmarklet).

(function() {
    'use strict';
    console.log('[Bookmarklet Loader V4.5] Carregador principal iniciado.');

    // --- ATENÇÃO ---
    // Este URL base APONTA para o seu "GitHub Pages" (veja o Passo 2).
    const basePath = 'https://scriptgenesys-code.github.io/Script-Completo/';

    // Lista dos 4 scripts que você quer carregar
    const scriptsToLoad = [
        'Cronometros.js',
        'Pausas Automaticas (1).js',
        'Respostas Rapidas.js',   
        'Protocolos rapidos.js'
    ];
    
    // URL DE LOG (Mantido)
    const LOG_URL = 'https://script.google.com/macros/s/AKfycbwIRwR7V6eo2BWFQqtVfnomi5zn-VCFe76ltXLN25eYcAqPn4nakZDxv1QdWPvOXz12vA/exec';

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
        
        console.log('[Bookmarklet Loader V4.5] Todos os 4 scripts foram injetados.');
        
    } catch(e) {
        console.error('[Bookmarklet Loader V4.5] Erro crítico ao carregar scripts:', e);
    }

})();
