// ==UserScript==
// @name         Extrator Rápido de CPF/CNPJ (V3.2 - Draggable)
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Botão móvel que memoriza a posição + Busca inteligente de documentos.
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

    // --- CRIAÇÃO DO BOTÃO ---
    const btnId = 'btn-extrator-doc-v32';
    if (document.getElementById(btnId)) return;

    const btn = document.createElement('button');
    btn.id = btnId;
    btn.innerHTML = '🆔';
    btn.title = 'Copiar Documento (Alt + D) - Arraste para mover';
    
    // Estilo Base
    btn.style.cssText = `
        position: fixed; width: 50px; height: 50px;
        background: linear-gradient(135deg, #667eea, #764ba2); color: #fff;
        border: 2px solid #fff; border-radius: 50%; font-size: 24px;
        cursor: grab; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        z-index: 999999; transition: transform 0.2s, background 0.3s;
        display: flex; justify-content: center; align-items: center; user-select: none;
    `;

    // --- LÓGICA DE POSIÇÃO (MEMÓRIA) ---
    const savedPos = localStorage.getItem('extrator_doc_pos');
    if (savedPos) {
        const pos = JSON.parse(savedPos);
        btn.style.top = pos.top;
        btn.style.left = pos.left;
    } else {
        // Posição padrão inicial (se nunca foi movido)
        btn.style.bottom = '100px';
        btn.style.right = '20px';
    }

    btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    document.body.appendChild(btn);

    // --- LÓGICA DE ARRASTAR (DRAG AND DROP) ---
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    btn.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Apenas botão esquerdo
        isDragging = false;
        
        // Prepara para arrastar
        btn.style.cursor = 'grabbing';
        btn.style.transition = 'none'; // Remove animação para arrasto suave

        const rect = btn.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = rect.left;
        initialTop = rect.top;

        const onMouseMove = (eMove) => {
            const dx = eMove.clientX - startX;
            const dy = eMove.clientY - startY;

            // Só considera "arrasto" se mover mais de 5 pixels (evita tremores no clique)
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDragging = true;
                // Remove alinhamentos fixos para usar top/left absolutos
                btn.style.bottom = 'auto';
                btn.style.right = 'auto';
                btn.style.top = `${initialTop + dy}px`;
                btn.style.left = `${initialLeft + dx}px`;
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            btn.style.cursor = 'grab';
            btn.style.transition = 'transform 0.2s, background 0.3s'; // Devolve animação

            if (isDragging) {
                // Salva a nova posição
                localStorage.setItem('extrator_doc_pos', JSON.stringify({
                    top: btn.style.top,
                    left: btn.style.left
                }));
                
                // Impede o clique imediato logo após arrastar
                setTimeout(() => { isDragging = false; }, 50);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // --- FUNÇÃO 1: COLETAR TEXTO ---
    function obterTodasAsLinhas() {
        let linhasTotais = [];
        linhasTotais = linhasTotais.concat(document.body.innerText.split('\n'));
        document.querySelectorAll('input, textarea').forEach(inp => { 
            if(inp.value) linhasTotais.push(inp.value); 
        });
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

    // --- FUNÇÃO 2: PROCESSAMENTO ---
    function extrairDocumento() {
        if (isDragging) return; // Se estiver arrastando, não executa!

        const linhas = obterTodasAsLinhas();
        let candidatoMelhor = null;
        let candidatoSecundario = null;

        const regexEstrito = /(?<!\d)(\d{3}\.?\d{3}\.?\d{3}-?\d{2})(?!\d)|(?<!\d)(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})(?!\d)/;

        for (let i = 0; i < linhas.length; i++) {
            let linhaAtual = linhas[i].trim();
            if (!linhaAtual) continue;

            const match = linhaAtual.match(regexEstrito);
            
            if (match) {
                let docLimpo = match[0].replace(/\D/g, '');
                if (docLimpo.length !== 11 && docLimpo.length !== 14) continue;

                let linhaAnterior = (i > 0) ? linhas[i-1] : "";
                let linhaSeguinte = (i < linhas.length - 1) ? linhas[i+1] : "";
                let contextoCompleto = linhaAnterior + " " + linhaAtual + " " + linhaSeguinte;

                if (/Documento|CPF|CNPJ|Doc:/i.test(contextoCompleto)) {
                    candidatoMelhor = docLimpo;
                    break; 
                }
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

    // O evento agora é controlado para não disparar ao arrastar
    btn.onclick = extrairDocumento; 

    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            extrairDocumento();
        }
    });

})();
