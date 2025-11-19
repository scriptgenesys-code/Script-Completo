// ==UserScript==
// @name         Extrator Rápido de CPF/CNPJ (V5.0 - Integrado ao Menu)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Motor de busca de documentos (Modo Invisível para integração).
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_setClipboard
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURAÇÃO ---
    const ABRIR_SISTEMA_AUTO = false;
    const URL_SISTEMA = ""; 

    // --- FUNÇÃO 1: VARREDURA PROFUNDA ---
    function coletarTextoProfundo(node, listaTextos) {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
            const val = node.nodeValue.trim();
            if (val.length > 0) listaTextos.push(val);
        }
        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
            if (node.value) listaTextos.push(node.value);
        }
        if (node.shadowRoot) {
            coletarTextoProfundo(node.shadowRoot, listaTextos);
        }
        if (node.childNodes) {
            node.childNodes.forEach(child => coletarTextoProfundo(child, listaTextos));
        }
        if (node.tagName === 'IFRAME') {
            try {
                if (node.contentDocument && node.contentDocument.body) {
                    coletarTextoProfundo(node.contentDocument.body, listaTextos);
                }
            } catch(e) {}
        }
    }

    // --- FUNÇÃO 2: PROCESSAMENTO E CONTEXTO ---
    // Tornamos esta função global para o Menu Unificado chamar
    window.executarExtracaoDocumento = function() {
        
        // 1. Prioridade: Texto Selecionado
        const sel = window.getSelection().toString().trim();
        if (sel) {
            const docSel = sel.replace(/\D/g, '');
            if (docSel.length === 11 || docSel.length === 14) {
                acaoSucesso(docSel, "Seleção");
                return;
            }
        }

        // 2. Varredura Automática
        let blocosDeTexto = [];
        coletarTextoProfundo(document.body, blocosDeTexto);

        let candidatoMelhor = null;
        let candidatoSecundario = null;

        const regexEstrito = /(?<!\d)(\d{3}\.?\d{3}\.?\d{3}[-.]?\d{2})(?!\d)|(?<!\d)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}[-.]?\d{2})(?!\d)/;

        for (let i = 0; i < blocosDeTexto.length; i++) {
            let textoAtual = blocosDeTexto[i];
            const match = textoAtual.match(regexEstrito);
            
            if (match) {
                let docLimpo = match[0].replace(/\D/g, '');
                if (docLimpo.length !== 11 && docLimpo.length !== 14) continue;

                let contexto = "";
                if (i > 1) contexto += blocosDeTexto[i-2] + " ";
                if (i > 0) contexto += blocosDeTexto[i-1] + " ";
                contexto += textoAtual + " ";
                if (i < blocosDeTexto.length - 1) contexto += blocosDeTexto[i+1] + " ";

                if (/Documento|CPF|CNPJ|Doc:/i.test(contexto)) {
                    candidatoMelhor = docLimpo;
                    break; 
                }

                if (/Telefone|Celular|Zap|Whatsapp|Contato/i.test(contexto)) {
                    continue; 
                }
                
                // Preferência por números formatados se não achar contexto claro
                if (!candidatoSecundario || (match[0].includes('.') || match[0].includes('-'))) {
                    candidatoSecundario = docLimpo;
                }
            }
        }

        const documentoFinal = candidatoMelhor || candidatoSecundario;

        if (documentoFinal) {
            acaoSucesso(documentoFinal, "Auto");
        } else {
            mostrarNotificacao("Nenhum Documento encontrado.", "erro");
        }
    };

    // --- AÇÕES ---
    function acaoSucesso(doc, metodo) {
        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(doc);
        } else {
            navigator.clipboard.writeText(doc);
        }

        const msg = metodo === "Seleção" ? "Seleção Copiada!" : `Copiado: ${doc}`;
        mostrarNotificacao(msg, 'sucesso');

        if (ABRIR_SISTEMA_AUTO && URL_SISTEMA) {
            window.open(URL_SISTEMA + doc, '_blank');
        }
    }

    function mostrarNotificacao(msg, tipo) {
        // Remove anterior se existir
        const old = document.getElementById('doc-notif');
        if (old) old.remove();

        let box = document.createElement('div');
        box.id = 'doc-notif';
        box.innerText = msg;
        let cor = tipo === 'erro' ? '#e74c3c' : '#2ecc71';
        box.style.cssText = `
            position: fixed; bottom: 90px; right: 80px;
            padding: 10px 20px; background: ${cor};
            color: white; border-radius: 8px; z-index: 2147483648;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-family: sans-serif; font-weight: bold;
            animation: slideIn 0.3s; font-size: 14px; pointer-events: none;
        `;
        document.body.appendChild(box);
        
        const style = document.createElement('style');
        style.innerHTML = `@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
        document.head.appendChild(style);

        setTimeout(() => { box.remove(); }, 3000);
    }

    // Mantém atalho de teclado (Alt + D)
    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            window.executarExtracaoDocumento();
        }
    });

})();
