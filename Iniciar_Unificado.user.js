// ==UserScript==
// @name         Carregador Principal de Scripts (Iniciador Unificado V4.3)
// @namespace    http://tampermonkey.net/
// @version      4.3
// @description  Carrega automaticamente TODOS os scripts (Pausas, Cronômetros, Respostas e Protocolos)
// @author       (Adaptado por Parceiro de Programacao)
// @match        https://*.mypurecloud.*/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/scriptgenesys-code/Script-Completo/main/Iniciar_Unificado.user.js
// @updateURL    https://raw.githubusercontent.com/scriptgenesys-code/Script-Completo/main/Iniciar_Unificado.user.js
// ==/UserScript==

(function() {
    'use strict';
    console.log('[Bootloader V4.3 Unificado] Iniciador principal carregado.');

    // --- CORREÇÃO IMPORTANTE ---
    // Atualizado para o seu NOVO repositório: "scriptgenesys-code/Script-Completo"
    const basePath = 'https://cdn.jsdelivr.net/gh/scriptgenesys-code/Script-Completo@main/';

    // Lista CORRIGIDA com os 4 scripts que você quer carregar
    // (O nome "Pausas Automaticas (1).js" agora está correto)
    const scriptsToLoad = [
        'Cronometros.js',
        'Pausas Automaticas (1).js', // <--- CORRIGIDO (o seu ficheiro tem "(1)")
        'Respostas Rapidas.js',      // <--- Script 1 (v2.4.5)
        'Protocolos rapidos.js'      // <--- Script 2 (v1.5.15)
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
            console.log('[Bootloader V4.3] Log de acesso enviado.');
        }, 5000); 
    } catch (err) {
        console.log('[Bootloader V4.3] Falha ao registrar log:', err);
    }

    /* --- Carregador de Scripts --- */
    try {
        scriptsToLoad.forEach(scriptName => {
            var scriptElement = document.createElement('script');
            
            // IMPORTANTE: Adicionado 'encodeURIComponent' para garantir que nomes
            // com espaços ou (1) funcionem corretamente.
            scriptElement.src = basePath + encodeURIComponent(scriptName) + '?v=' + Date.now();
            
            document.body.appendChild(scriptElement);
            console.log(`[Bootloader V4.3] Carregando: ${scriptName}`);
        });
        
        console.log('[Bootloader V4.3] Todos os 4 scripts foram injetados.');
        
    } catch(e) {
        console.error('[Bootloader V4.3] Erro crítico ao carregar scripts:', e);
    }

})();
