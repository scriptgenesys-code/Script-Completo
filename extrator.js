// ==UserScript==
// @name         Extrator Rápido de CPF/CNPJ (V6.5 - Validador)
// @namespace    http://tampermonkey.net/
// @version      6.5
// @description  Copia CPFs/CNPJs válidos automaticamente, ignorando telefones.
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. VALIDADOR MATEMÁTICO DE CPF ---
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        
        let soma = 0, resto;
        
        // Valida 1º Dígito
        for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;
        
        // Valida 2º Dígito
        soma = 0;
        for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;
        
        return true;
    }

    // --- 2. SISTEMA DE PONTUAÇÃO E BUSCA ---
    function buscarMelhorDocumento() {
        // Coleta todo o texto visível da página
        const textoTotal = document.body.innerText + " ";
        
        // Regex poderosa: Captura CPF/CNPJ com ou sem pontuação
        // Ex: 12345678901, 123.456.789-01, 12.345.678/0001-90
        const regexDoc = /(?<!\d)(\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?!\d)|(?<!\d)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})(?!\d)/g;
        
        const encontrados = textoTotal.match(regexDoc);
        if (!encontrados) return null;

        let melhorCandidato = null;
        let maiorPontuacao = -1000; // Começa negativo para exigir mínimo de qualidade

        encontrados.forEach(rawDoc => {
            const docLimpo = rawDoc.replace(/\D/g, '');
            
            // FILTRO 1: Tamanho exato (CPF=11, CNPJ=14)
            if (docLimpo.length !== 11 && docLimpo.length !== 14) return;

            // FILTRO 2: Validação Matemática (Apenas para CPF por enquanto)
            if (docLimpo.length === 11 && !validarCPF(docLimpo)) return; 

            // FILTRO 3: Contexto (Pontuação)
            let pontos = 0;
            const index = textoTotal.indexOf(rawDoc);
            // Analisa os 40 caracteres antes e depois do número
            const contexto = textoTotal.substring(Math.max(0, index - 40), index + rawDoc.length + 40).toLowerCase();
            
            // Bônus para palavras-chave de documento
            if (contexto.includes('cpf') || contexto.includes('cnpj') || contexto.includes('doc')) pontos += 100;
            
            // Penalidade severa para palavras de telefone (evita copiar celulares)
            if (contexto.includes('telefone') || contexto.includes('celular') || contexto.includes('whatsapp') || contexto.includes('contato')) pontos -= 500;
            
            // Bônus se estiver formatado (ex: 123.456...) pois telefones raramente usam pontos assim
            if (rawDoc.includes('.') || rawDoc.includes('-')) pontos += 20;

            // O último da página ganha um pequeno bônus (geralmente é o mais recente no chat)
            pontos += 1;

            if (pontos > maiorPontuacao) {
                maiorPontuacao = pontos;
                melhorCandidato = docLimpo;
            }
        });

        // Só retorna se a pontuação for aceitável (evita falso positivo de telefone solto)
        if (melhorCandidato && maiorPontuacao > -100) {
            return melhorCandidato;
        }
        return null;
    }

    // --- 3. EXECUTAR AÇÃO ---
    window.executarExtracaoDocumento = function() {
        const documento = buscarMelhorDocumento();

        if (documento) {
            // Copia para a área de transferência
            navigator.clipboard.writeText(documento).then(() => {
                mostrarFeedback(`Copiado: ${documento}`, 'sucesso');
            }).catch(() => {
                // Fallback para GM_setClipboard se disponível
                if (typeof GM_setClipboard !== 'undefined') {
                    GM_setClipboard(documento);
                    mostrarFeedback(`Copiado (GM): ${documento}`, 'sucesso');
                } else {
                    mostrarFeedback("Erro ao acessar Clipboard.", 'erro');
                }
            });
        } else {
            mostrarFeedback("Nenhum CPF/CNPJ válido encontrado.", 'erro');
        }
    };

    // --- 4. FEEDBACK VISUAL ---
    function mostrarFeedback(texto, tipo) {
        const id = 'extrator-feedback-box';
        const old = document.getElementById(id);
        if (old) old.remove();

        const div = document.createElement('div');
        div.id = id;
        div.style.cssText = `
            position: fixed; bottom: 90px; right: 90px; z-index: 2147483647;
            padding: 12px 20px; border-radius: 8px; font-family: sans-serif; font-weight: bold;
            color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            background: ${tipo === 'sucesso' ? '#10b981' : '#ef4444'};
            animation: slideUp 0.3s ease-out;
        `;
        div.innerText = texto;
        document.body.appendChild(div);

        // Remove após 3 segundos
        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transition = 'opacity 0.5s';
            setTimeout(() => div.remove(), 500);
        }, 3000);
    }

    // Adiciona animação CSS
    const style = document.createElement('style');
    style.innerHTML = `@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
    document.head.appendChild(style);

    // --- 5. ATALHO (Alt + D) ---
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 'd') {
            e.preventDefault(); // Evita conflito com atalhos do navegador
            window.executarExtracaoDocumento();
        }
    });

    console.log("[Extrator V6.5] Carregado. Use Alt+D para extrair CPFs.");

})();
