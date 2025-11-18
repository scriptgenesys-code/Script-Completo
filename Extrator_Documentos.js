// ==UserScript==
// @name         Extrator Rápido de CPF/CNPJ (V3.1 - Visão Periférica)
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Olha a linha atual e a ANTERIOR para garantir o contexto do documento.
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
    // Exemplo: const URL_SISTEMA = "https://seu-sistema.com/busca/"; 
    const URL_SISTEMA = "";

    // --- BOTÃO ---
    const btnId = 'btn-extrator-doc-v31';
    if (document.getElementById(btnId)) return;

    const btn = document.createElement('button');
    btn.id = btnId;
    btn.innerHTML = '🆔';
    btn.title = 'Copiar Documento (Alt + D)';
    // Estilo ajustado para não colidir com o Menu Unificado (Fica um pouco acima)
    btn.style.cssText = `
        position: fixed; bottom: 100px; right: 20px; width: 50px; height: 50px;
        background: linear-gradient(135deg, #667eea, #764ba2); color: #fff;
        border: 2px solid #fff; border-radius: 50%; font-size: 24px;
        cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        z-index: 999999; transition: transform 0.2s;
        display: flex; justify-content: center; align-items: center;
    `;
    btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    document.body.appendChild(btn);

    // --- FUNÇÃO 1: COLETAR TEXTO ---
    function obterTodasAsLinhas() {
        let linhasTotais = [];
        // Corpo
        linhasTotais = linhasTotais.concat(document.body.innerText.split('\n'));
        // Inputs
        document.querySelectorAll('input, textarea').forEach(inp => { 
            if(inp.value) linhasTotais.push(inp.value); 
        });
        // Iframes
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                if (iframe.contentDocument && iframe.contentDocument.body) {
                    linhasTotais = linhasTotais.concat(iframe.contentDocument.body.innerText.split('\n'));
                    iframe.contentDocument.querySelectorAll('input').forEach(i => {
                         if(i.value) linhasTotais.push(i.value); 
                    });
                }
            } catch (e) {}
        });
        return linhasTotais;
    }

    // --- FUNÇÃO 2: PROCESSAMENTO (COM VISÃO PERIFÉRICA) ---
    function extrairDocumento() {
        const linhas = obterTodasAsLinhas();
        let candidatoMelhor = null;
        let candidatoSecundario = null;

        // Regex para números exatos (11 ou 14 dígitos)
        const regexEstrito = /(?<!\d)(\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?!\d)|(?<!\d)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})(?!\d)/;

        for (let i = 0; i < linhas.length; i++) {
            let linhaAtual = linhas[i].trim();
            if (!linhaAtual) continue;

            const match = linhaAtual.match(regexEstrito);
            
            if (match) {
                let docLimpo = match[0].replace(/\D/g, '');
                if (docLimpo.length !== 11 && docLimpo.length !== 14) continue;

                // --- CRIAÇÃO DO CONTEXTO ---
                let linhaAnterior = (i > 0) ? linhas[i-1] : "";
                let linhaSeguinte = (i < linhas.length - 1) ? linhas[i+1] : "";
                
                let contextoCompleto = linhaAnterior + " " + linhaAtual + " " + linhaSeguinte;

                // REGRA 1: CONTEXTO POSITIVO
                if (/Documento|CPF|CNPJ|Doc:/i.test(contextoCompleto)) {
                    candidatoMelhor = docLimpo;
                    break; 
                }

                // REGRA 2: FILTRO NEGATIVO (Evita telefones na mesma linha)
                if (/Telefone|Celular|Whatsapp|Contato/i.test(linhaAtual)) {
                    continue; 
                }
                
                if (!candidatoSecundario) {
                    candidatoSecundario = docLimpo;
                }
            }
        }

        const documentoFinal = candidatoMelhor || candidatoSecundario;

        if (documentoFinal) {
            acaoSucesso(documentoFinal);
        } else {
            mostrarNotificacao("Nenhum Documento encontrado.", "erro");
            animarErro();
        }
    }

    // --- AÇÕES ---
    function acaoSucesso(doc) {
        copiarParaClipboard(doc);
        btn.innerHTML = '✅';
        btn.style.background = '#4caf50';
        mostrarNotificacao(`Copiado: ${doc}`, 'sucesso');

        if (ABRIR_SISTEMA_AUTO && URL_SISTEMA) {
            window.open(URL_SISTEMA + doc, '_blank');
        }

        setTimeout(() => {
            btn.innerHTML = '🆔';
            btn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }, 2000);
    }

    function copiarParaClipboard(texto) {
        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(texto);
        } else {
            navigator.clipboard.writeText(texto);
        }
    }

    function animarErro() {
        btn.style.animation = "shake 0.5s";
        setTimeout(() => btn.style.animation = "", 500);
    }

    function mostrarNotificacao(msg, tipo) {
        let box = document.createElement('div');
        box.innerText = msg;
        let cor = tipo === 'erro' ? '#e74c3c' : '#2ecc71';
        box.style.cssText = `
            position: fixed; bottom: 160px; right: 20px;
            padding: 12px 20px; background: ${cor};
            color: white; border-radius: 8px; z-index: 1000000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-family: sans-serif; font-weight: bold;
            animation: slideIn 0.3s; font-size: 14px;
        `;
        document.body.appendChild(box);
        setTimeout(() => { box.remove(); }, 3000);
    }

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    btn.onclick = extrairDocumento;
    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            extrairDocumento();
        }
    });

})();
