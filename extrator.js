// ==UserScript==
// @name         Extrator Pro de CPF/CNPJ (V7.4 - Atalho F2)
// @namespace    http://tampermonkey.net/
// @version      7.4
// @description  Varre Iframes e painéis para copiar CPFs/CNPJs pressionando F2.
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. FUNÇÕES AUXILIARES (DEEP SCAN) ---
    function coletarTextoTotal() {
        let texto = document.body.innerText + " ";
        const iframes = document.getElementsByTagName('iframe');
        
        for (let i = 0; i < iframes.length; i++) {
            try {
                let docInterno = iframes[i].contentDocument || iframes[i].contentWindow.document;
                if (docInterno) {
                    texto += " " + docInterno.body.innerText + " ";
                }
            } catch (e) {
                // Ignora iframes bloqueados
            }
        }
        return texto;
    }

    // --- 2. VALIDADORES MATEMÁTICOS ---
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        
        let soma = 0, resto;
        for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;
        
        soma = 0;
        for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;
        
        return true;
    }

    function validarCNPJ(cnpj) {
        cnpj = cnpj.replace(/[^\d]+/g, '');
        if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(0)) return false;

        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(1)) return false;

        return true;
    }

    // --- 3. SISTEMA DE BUSCA INTELIGENTE ---
    function buscarMelhorDocumento() {
        const textoTotal = coletarTextoTotal(); 
        const regexDoc = /(?<!\d)(\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?!\d)|(?<!\d)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})(?!\d)/g;
        
        const encontrados = textoTotal.match(regexDoc);
        if (!encontrados) return null;

        let melhorCandidato = null;
        let maiorPontuacao = -1000;

        encontrados.forEach(rawDoc => {
            const docLimpo = rawDoc.replace(/\D/g, '');
            let ehValido = false;

            if (docLimpo.length === 11 && validarCPF(docLimpo)) ehValido = true;
            if (docLimpo.length === 14 && validarCNPJ(docLimpo)) ehValido = true;

            if (!ehValido) return;

            let pontos = 0;
            const index = textoTotal.indexOf(rawDoc);
            const contexto = textoTotal.substring(Math.max(0, index - 60), index + rawDoc.length + 60).toLowerCase();
            
            if (contexto.includes('cpf') || contexto.includes('cnpj') || contexto.includes('documento')) pontos += 200;
            if (contexto.includes('cliente') || contexto.includes('titular')) pontos += 50;
            if (rawDoc.includes('.') || rawDoc.includes('-')) pontos += 50;

            if (contexto.includes('tel') || contexto.includes('cel') || contexto.includes('zap') || contexto.includes('contato')) pontos -= 1000;
            
            if (contexto.includes('documento:')) pontos += 500;

            pontos += 5;

            if (pontos > maiorPontuacao) {
                maiorPontuacao = pontos;
                melhorCandidato = docLimpo;
            }
        });

        if (melhorCandidato && maiorPontuacao > -500) {
            return melhorCandidato;
        }
        return null;
    }

    // --- 4. EXECUTAR E VISUALIZAR ---
    window.executarExtracaoDocumento = function() {
        const documento = buscarMelhorDocumento();

        if (documento) {
            const feedbackText = documento.length === 11 ? `CPF: ${documento}` : `CNPJ: ${documento}`;
            
            navigator.clipboard.writeText(documento).then(() => {
                mostrarFeedback(`Copiado! ${feedbackText}`, 'sucesso');
            }).catch(() => {
                if (typeof GM_setClipboard !== 'undefined') {
                    GM_setClipboard(documento);
                    mostrarFeedback(`Copiado (GM)! ${feedbackText}`, 'sucesso');
                } else {
                    mostrarFeedback("Erro de Clipboard.", 'erro');
                }
            });
        } else {
            mostrarFeedback("Nenhum CPF/CNPJ válido encontrado.", 'erro');
        }
    };

    function mostrarFeedback(texto, tipo) {
        const id = 'extrator-feedback-box';
        const old = document.getElementById(id);
        if (old) old.remove();

        const div = document.createElement('div');
        div.id = id;
        div.style.cssText = `
            position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%); z-index: 999999;
            padding: 12px 24px; border-radius: 50px; font-family: 'Segoe UI', sans-serif; font-size: 14px; font-weight: 600;
            color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            background: ${tipo === 'sucesso' ? '#2ecc71' : '#e74c3c'};
            display: flex; align-items: center; gap: 10px;
            animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        div.innerHTML = `<span>${tipo === 'sucesso' ? '✔' : '✖'}</span> <span>${texto}</span>`;
        document.body.appendChild(div);

        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => div.remove(), 500);
        }, 3000);
    }

    const style = document.createElement('style');
    style.innerHTML = `@keyframes popIn { from { transform: translateX(-50%) scale(0.8); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }`;
    document.head.appendChild(style);

    // --- 5. NOVO ATALHO (Apenas F2) ---
    document.addEventListener('keydown', (e) => {
        // Verifica se a tecla é APENAS o F2
        if (e.key === 'F2') {
            e.preventDefault(); // Impede o comportamento padrão do navegador
            e.stopPropagation();
            window.executarExtracaoDocumento();
        }
    });

    console.log("[Extrator V7.4] Deep Scan Ativado. Pressione F2 para copiar.");

})();
