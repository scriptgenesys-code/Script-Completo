// Este é um SCRIPT SIMPLES (V4.6 MODIFICADO) - NÃO é um UserScript.
// Este ficheiro foi feito para ser carregado pelo seu FAVORITO (Bookmarklet).

(function() {
    'use strict';
    console.log('[Bookmarklet Loader V4.6] Carregador principal iniciado.');

    // URL base do seu GitHub Pages (Mantido)
    const basePath = 'https://scriptgenesys-code.github.io/Script-Completo/';

    // Lista ATUALIZADA com os 7 scripts (Incluindo o novo Extrator)
    const scriptsToLoad = [
        'Cronometros.js',
        'Pausas Automaticas (1).js',
        'Respostas Rapidas.js',   
        'Protocolos rapidos.js',
        'BAR.js',
        'Menu Unificado.js',       // O seu menu flutuante
        'Extrator_Documentos.js'   // <-- NOVO: Extrator de CPF/CNPJ
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
            console.log('[Bookmarklet Loader V4.6] Log de acesso enviado.');
        }, 5000); 
    } catch (err) {
        console.log('[Bookmarklet Loader V4.6] Falha ao registrar log:', err);
    }

    /* --- Carregador de Scripts --- */
    try {
        scriptsToLoad.forEach(scriptName => {
            var scriptElement = document.createElement('script');
            // encodeURIComponent garante que nomes com espaços carreguem corretamente
            scriptElement.src = basePath + encodeURIComponent(scriptName) + '?v=' + Date.now();
            document.body.appendChild(scriptElement);
            console.log(`[Bookmarklet Loader V4.6] Carregando: ${scriptName}`);
        });
        
        console.log('[Bookmarklet Loader V4.6] Todos os scripts foram injetados.');
        
    } catch(e) {
        console.error('[Bookmarklet Loader V4.6] Erro crítico ao carregar scripts:', e);
    }

})();
