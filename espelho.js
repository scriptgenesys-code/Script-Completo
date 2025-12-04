// ==UserScript==
// @name         PureCloud - Copiar Chat Espelho (Módulo Extensão)
// @description  Copia o chat EXATAMENTE como na tela (Shadow DOM deep scan).
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        IFRAME_SELECTOR: 'iframe[src*="messaging-gadget.html"]'
    };

    // --- 1. LÓGICA DE BUSCA (Shadow DOM) ---
    function encontrarUltimoChat() {
        let todosIframes = [];

        // Função recursiva para mergulhar em Shadow Roots
        const buscaRecursiva = (no) => {
            const iframesAqui = no.querySelectorAll(CONFIG.IFRAME_SELECTOR);
            iframesAqui.forEach(iframe => todosIframes.push(iframe));

            const elementos = no.querySelectorAll('*');
            for (let i = 0; i < elementos.length; i++) {
                if (elementos[i].shadowRoot) {
                    buscaRecursiva(elementos[i].shadowRoot);
                }
            }
        };

        buscaRecursiva(document.body);

        if (todosIframes.length > 0) {
            // Pega o último iframe (geralmente o chat mais recente)
            const alvo = todosIframes[todosIframes.length - 1];
            try {
                if (alvo.contentDocument && alvo.contentDocument.body) {
                    return alvo.contentDocument.body.innerText;
                }
            } catch (e) { console.warn("[Espelho] Erro de segurança no Iframe (Cross-Origin)."); }
        }
        return null;
    }

    // --- 2. CÓPIA FIEL (SEM FILTROS) ---
    function formatarEspelho(texto) {
        if (!texto) return "";
        // Remove excesso de quebras de linha (3 ou mais vira 2)
        return texto.replace(/\n\s*\n\s*\n/g, '\n\n');
    }

    // --- 3. FUNÇÃO GLOBAL (Para ser chamada pelo Menu.js) ---
    window.executarCopiaEspelho = async function() {
        const textoOriginal = encontrarUltimoChat();

        if (textoOriginal && textoOriginal.length > 20) {
            const textoFinal = formatarEspelho(textoOriginal);
            
            try {
                await navigator.clipboard.writeText(textoFinal);
                // Notificação visual simples usando a UI existente da extensão (se houver)
                if (typeof UI !== 'undefined' && UI.createNotification) {
                    UI.createNotification("Chat copiado com sucesso! (Modo Espelho)", "success");
                } else {
                    console.log("Chat copiado!"); // Fallback
                }
                return true;
            } catch (err) {
                console.error("Erro ao copiar:", err);
                if (typeof UI !== 'undefined') UI.createNotification("Erro ao acessar Clipboard.", "error");
                return false;
            }
        } else {
            if (typeof UI !== 'undefined') {
                UI.createNotification("Não foi possível ler o chat. Clique na conversa primeiro.", "warn");
            } else {
                alert("Não foi possível ler o chat.\nClique na conversa para garantir que está ativa.");
            }
            return false;
        }
    };

    // --- 4. ATALHO DE TECLADO (Ctrl + Shift + C) ---
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
            e.preventDefault();
            e.stopPropagation();
            window.executarCopiaEspelho();
        }
    });

    console.log("[Módulo Espelho] Carregado. Use Ctrl+Shift+C ou o Menu.");

})();
