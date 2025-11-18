// ==UserScript==
// @name         Carregador Principal de Scripts (Iniciador Unificado V4.5)
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Carrega automaticamente TODOS os scripts (Pausas, Cronômetros, Respostas, Protocolos e BAR)
// @author       (Adaptado por Parceiro de Programacao)
// @match        https://*.mypurecloud.*/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/scriptgenesys-code/Script-Completo/main/Iniciar_Unificado.user.js
// @updateURL    https://raw.githubusercontent.com/scriptgenesys-code/Script-Completo/main/Iniciar_Unificado.user.js
// ==/UserScript==

(function() {
    'use strict';
    console.log('[Bootloader V4.5 Unificado] Iniciador principal carregado.');

    // --- Repositório ---
    const basePath = 'https://cdn.jsdelivr.net/gh/scriptgenesys-code/Script-Completo@main/';

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
            console.log('[Bootloader V4.5] Log de acesso enviado.');
        }, 5000); 
    } catch (err) {
        console.log('[Bootloader V4.5] Falha ao registrar log:', err);
    }

    /* --- Carregador de Scripts --- */
    try {
        scriptsToLoad.forEach(scriptName => {
            var scriptElement = document.createElement('script');
            scriptElement.src = basePath + encodeURIComponent(scriptName) + '?v=' + Date.now();
            document.body.appendChild(scriptElement);
            console.log(`[Bootloader V4.5] Carregando: ${scriptName}`);
        });
        
        console.log('[Bootloader V4.5] Todos os 5 scripts foram injetados.');
        
    } catch(e) {
        console.error('[Bootloader V4.5] Erro crítico ao carregar scripts:', e);
    }

})();
