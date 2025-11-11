// ==UserScript==
// @name         Carregador Principal de Scripts (Iniciador Unificado V4)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Carrega automaticamente TODOS os scripts (Pausas, Cronômetros, Respostas e Protocolos)
// @author       Seu Nome (Adaptado por Parceiro de Programacao)
// @match        https://*.mypurecloud.*/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/kingoffjoss/Meus-Scripts/main/Iniciar_Unificado.user.js
// @updateURL    https://raw.githubusercontent.com/kingoffjoss/Meus-Scripts/main/Iniciar_Unificado.user.js
// ==/UserScript==

(function() {
    'use strict';
    console.log('[Bootloader V4 Unificado] Iniciador principal carregado.');

    // URL base do seu repositório (usando jsDelivr para mais velocidade)
    const basePath = 'https://cdn.jsdelivr.net/gh/kingoffjoss/Meus-Scripts@main/';

    // Lista de TODOS os scripts que este ficheiro deve carregar
    const scriptsToLoad = [
        'Cronometros.js',
        'Pausas Automaticas.js',
        'Respostas Rapidas.js',   // <--- ADICIONADO
        'Protocolos rapidos.js' // <--- MANTIDO
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
            console.log('[Bootloader V4] Log de acesso enviado.');
        }, 5000); 
    } catch (err) {
        console.log('[Bootloader V4] Falha ao registrar log:', err);
    }

    /* --- Carregador de Scripts --- */
    try {
        scriptsToLoad.forEach(scriptName => {
            var scriptElement = document.createElement('script');
            // O ?v=Date.now() evita problemas de cache
            scriptElement.src = basePath + scriptName + '?v=' + Date.now();
            document.body.appendChild(scriptElement);
            console.log(`[Bootloader V4] Carregando: ${scriptName}`);
        });
        
        console.log('[Bootloader V4] Todos os scripts foram injetados.');
        
    } catch(e) {
        console.error('[Bootloader V4] Erro crítico ao carregar scripts:', e);
    }

})();
