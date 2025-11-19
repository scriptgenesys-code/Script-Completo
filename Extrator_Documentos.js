// ==UserScript==
// @name         Extrator Rápido de CPF/CNPJ (V6.0 - Injeção Dupla)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Lê documentos em todos os iframes e contextos.
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
    const URL_SISTEMA = ""; // Ex: "https://crm.brisanet.com.br/busca/"

    // --- FUNÇÃO 1: MOTOR DE BUSCA (Roda em qualquer contexto) ---
    function buscarDocumentoNoContexto(contextoDocument) {
        // 1. Prioridade: Texto Selecionado pelo usuário
        const sel = contextoDocument.getSelection().toString().trim();
        if (sel) {
            const docSel = sel.replace(/\D/g, '');
            if (docSel.length === 11 || docSel.length === 14) {
                return { doc: docSel, metodo: "Seleção Manual" };
            }
        }

        // 2. Coleta todo o texto visível (Corpo + Inputs)
        let textoTotal = contextoDocument.body.innerText + " ";
        contextoDocument.querySelectorAll('input, textarea').forEach(el => {
            if (el.value) textoTotal += el.value + " ";
        });

        // 3. Regex Inteligente (CPF 11 ou CNPJ 14)
        // Aceita: 12345678901, 123.456.789-01, 12.345.678/0001-90
        const regexDoc = /(?<!\d)(\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?!\d)|(?<!\d)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})(?!\d)/g;
        
        const encontrados = textoTotal.match(regexDoc);
        if (!encontrados) return null;

        let melhorCandidato = null;
        let maiorPontuacao = -1;

        // 4. Análise de Contexto (Pontuação)
        encontrados.forEach(rawDoc => {
            const docLimpo = rawDoc.replace(/\D/g, '');
            if (docLimpo.length !== 11 && docLimpo.length !== 14) return;

            // Pontuação base
            let pontos = 0;

            // Pega os 50 caracteres antes do número para ver o contexto
            const index = textoTotal.indexOf(rawDoc);
            const contextoAnterior = textoTotal.substring(Math.max(0, index - 50), index).toLowerCase();
            
            // Aumenta pontos se tiver palavras-chave perto
            if (contextoAnterior.includes('cpf') || contextoAnterior.includes('cnpj') || contextoAnterior.includes('doc')) {
                pontos += 100;
            }
            
            // Penaliza se parecer telefone
            if (contextoAnterior.includes('tel') || contextoAnterior.includes('cel') || contextoAnterior.includes('zap')) {
                pontos -= 500;
            }

            // Prefere números formatados (com pontos) pois raramente são telefones
            if (rawDoc.includes('.') || rawDoc.includes('-')) {
                pontos += 20;
            }

            // O último da página (mais recente no chat) ganha um bônus pequeno
            pontos += 1;

            if (pontos > maiorPontuacao) {
                maiorPontuacao = pontos;
                melhorCandidato = docLimpo;
            }
        });

        if (melhorCandidato && maiorPontuacao > -100) {
            return { doc: melhorCandidato, metodo: "Automático" };
        }
        return null;
    }

    // --- FUNÇÃO 2: ORQUESTRADOR (Varre janela principal e iframes) ---
    window.executarExtracaoDocumento = function() {
        let resultado = buscarDocumentoNoContexto(document);

        // Se não achou na página principal, procura nos iframes (scripts laterais)
        if (!resultado) {
            const iframes = document.querySelectorAll('iframe');
            for (let iframe of iframes) {
                try {
                    if (iframe.contentDocument) {
                        const resIframe = buscarDocumentoNoContexto(iframe.contentDocument);
                        if (resIframe) {
                            resultado = resIframe;
                            break; // Achou, para de procurar
                        }
                    }
                } catch (e) {
                    // Bloqueio de segurança do navegador em iframes de outros domínios (normal)
                }
            }
        }

        if (resultado) {
            acaoSucesso(resultado.doc, resultado.metodo);
        } else {
            mostrarNotificacao("Nenhum CPF/CNPJ encontrado na tela.", "erro");
        }
    };

    // --- FUNÇÕES AUXILIARES ---
    function acaoSucesso(doc, metodo) {
        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(doc);
        } else {
            navigator.clipboard.writeText(doc);
        }

        const msg = metodo === "Seleção Manual" ? "Seleção Copiada!" : `Copiado: ${doc}`;
        mostrarNotificacao(msg, 'sucesso');

        if (ABRIR_SISTEMA_AUTO && URL_SISTEMA) {
            window.open(URL_SISTEMA + doc, '_blank');
        }
    }

    function mostrarNotificacao(msg, tipo) {
        const old = document.getElementById('doc-notif');
        if (old) old.remove();

        let box = document.createElement('div');
        box.id = 'doc-notif';
        box.innerText = msg;
        let cor = tipo === 'erro' ? '#ff4d4d' : '#2ecc71'; // Vermelho ou Verde
        box.style.cssText = `
            position: fixed; bottom: 90px; right: 90px;
            padding: 12px 24px; background: ${cor};
            color: white; border-radius: 50px; z-index: 2147483648;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-family: 'Segoe UI', sans-serif; font-weight: bold;
            font-size: 16px; pointer-events: none; text-align: center;
            animation: slideUpFade 0.3s ease-out;
        `;
        document.body.appendChild(box);
        
        // Injeta animação se não existir
        if (!document.getElementById('doc-anim-style')) {
            const style = document.createElement('style');
            style.id = 'doc-anim-style';
            style.innerHTML = `@keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
            document.head.appendChild(style);
        }

        setTimeout(() => { 
            box.style.opacity = '0';
            box.style.transition = 'opacity 0.5s';
            setTimeout(() => box.remove(), 500);
        }, 2500);
    }

    // Atalho de Teclado (Alt + D)
    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            window.executarExtracaoDocumento();
        }
    });

    // Log para confirmar carregamento
    console.log("[Extrator V6.0] Carregado e pronto (Modo Global).");

})();
