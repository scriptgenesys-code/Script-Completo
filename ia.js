// ==UserScript==
// @name         PureCloud - Assistente IA (v8.3 - Humanizado)
// @description  Assistente com relatórios naturais e fluidos (sem tópicos robóticos).
// @author       Parceiro de Programacao
// ==/UserScript==

(function() {
    'use strict';

    // --- 🛡️ PORTEIRO DE MÓDULOS ---
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['MOD_IA'], function(result) {
            if (result.MOD_IA === false) {
                console.log("⛔ [Genesys Admin] Módulo IA DESATIVADO pelo usuário.");
                return; 
            }
            initIA(); 
        });
    } else {
        initIA();
    }

    function initIA() {
        console.log("[IA] Iniciando Assistente (v8.3)...");

        let currentModel = "gemini-1.5-flash"; 
        let userApiKey = '';
        let chatHistoryContext = []; 

        // --- 1. CSS (MANTIDO IGUAL) ---
        const css = `
            /* --- VARIÁVEIS DE TEMA --- */
            #gemini-wrapper {
                /* TEMA ESCURO (Padrão) */
                --ia-bg: #0f172a; --ia-card: #1e293b; --ia-header: #1e293b;
                --ia-border: #334155; --ia-text: #f8fafc; --ia-text-muted: #94a3b8;
                --ia-input-bg: #0f172a; --ia-primary: #3b82f6;
                --ia-primary-grad: linear-gradient(135deg, #3b82f6, #2563eb);
                --ia-shadow: 0 10px 30px rgba(0,0,0,0.5); --ia-btn-text: #ffffff;
                --ia-user-msg: #3b82f6; --ia-ai-msg: #334155;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                box-sizing: border-box; color-scheme: dark;
            }
            #gemini-wrapper.light-mode {
                --ia-bg: #ffffff; --ia-card: #f8fafc; --ia-header: #f1f5f9;
                --ia-border: #e2e8f0; --ia-text: #334155; --ia-text-muted: #64748b;
                --ia-input-bg: #ffffff; --ia-primary: #2563eb;
                --ia-primary-grad: linear-gradient(135deg, #3b82f6, #2563eb);
                --ia-shadow: 0 10px 30px rgba(0,0,0,0.15); --ia-btn-text: #ffffff;
                --ia-user-msg: #2563eb; --ia-ai-msg: #f1f5f9;
                color-scheme: light;
            }
            #gemini-wrapper * { box-sizing: border-box; }

            /* BOTÃO FLUTUANTE */
            #gemini-float-btn {
                position: fixed; bottom: 85px; right: 25px; width: 50px; height: 50px; 
                background: var(--ia-primary-grad); color: var(--ia-btn-text);
                border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); 
                box-shadow: 0 4px 15px rgba(0,0,0,0.3); cursor: pointer; font-size: 24px; z-index: 2147483646;
                transition: transform 0.2s, box-shadow 0.2s; display: flex; align-items: center; justify-content: center;
            }
            #gemini-float-btn:hover { transform: scale(1.1); box-shadow: 0 0 15px var(--ia-primary); }

            /* JANELA MODAL */
            #gemini-modal {
                display: none; position: fixed; z-index: 2147483647;
                width: 400px; height: 600px; left: 20%; top: 20%;
                background-color: var(--ia-bg); color: var(--ia-text);
                border-radius: 12px; box-shadow: var(--ia-shadow); border: 1px solid var(--ia-border);
                flex-direction: column; resize: both; overflow: hidden;
                transition: background-color 0.3s, color 0.3s;
            }

            /* CABEÇALHO */
            .gemini-header { 
                background-color: var(--ia-header); padding: 12px 15px; 
                display: flex; justify-content: space-between; align-items: center; 
                border-bottom: 1px solid var(--ia-border); cursor: move; user-select: none; flex-shrink: 0; 
            }
            .gemini-header h3 { margin: 0; font-size: 14px; font-weight: 700; color: var(--ia-text); display: flex; align-items: center; gap: 8px; }
            .header-actions { display: flex; gap: 10px; align-items: center; }
            .icon-btn { background: transparent; border: none; cursor: pointer; font-size: 16px; color: var(--ia-text-muted); padding: 4px; transition: color 0.2s, transform 0.2s; border-radius: 4px; }
            .icon-btn:hover { color: var(--ia-primary); background-color: rgba(128,128,128,0.1); }
            
            /* NAVEGAÇÃO DE ABAS */
            .nav-tabs { display: flex; border-bottom: 1px solid var(--ia-border); background: var(--ia-card); }
            .nav-tab { flex: 1; padding: 10px; text-align: center; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--ia-text-muted); border-bottom: 2px solid transparent; transition: all 0.2s; }
            .nav-tab:hover { background-color: rgba(255,255,255,0.05); color: var(--ia-text); }
            .nav-tab.active { color: var(--ia-primary); border-bottom-color: var(--ia-primary); background-color: rgba(59, 130, 246, 0.05); }

            /* CORPO */
            .screen { padding: 15px; display: none; flex-direction: column; flex: 1; overflow-y: auto; height: 100%; background-color: var(--ia-bg); }
            .screen.active { display: flex; }

            /* INPUTS */
            .gemini-input { 
                width: 100%; padding: 12px; margin-bottom: 12px; border-radius: 6px; 
                border: 1px solid var(--ia-border); background-color: var(--ia-input-bg); 
                color: var(--ia-text); font-size: 13px; font-family: inherit; resize: none;
                transition: border-color 0.2s;
            }
            .gemini-input:focus { outline: none; border-color: var(--ia-primary); box-shadow: 0 0 0 1px var(--ia-primary); }
            textarea.gemini-input { flex-shrink: 0; min-height: 120px; }

            /* BOTÕES */
            .gemini-btn { 
                width: 100%; padding: 10px; border: none; border-radius: 6px; font-weight: 600; 
                cursor: pointer; margin-top: 5px; display: flex; align-items: center; justify-content: center; 
                gap: 6px; font-size: 13px; flex-shrink: 0; transition: filter 0.2s;
            }
            .btn-primary { background: var(--ia-primary-grad); color: var(--ia-btn-text); box-shadow: 0 2px 5px rgba(0,0,0,0.2); } 
            .btn-primary:hover { filter: brightness(1.1); }
            .btn-success { background: linear-gradient(135deg, #10b981, #059669); color: white; margin-top: 10px; }
            .btn-logout { background: transparent; color: #ef4444; border: 1px solid var(--ia-border); font-size: 11px; width: auto; padding: 5px 10px; } 
            .btn-logout:hover { background-color: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
            
            /* RESULTADO RELATÓRIO */
            #gemini-result { 
                margin-top: 15px; padding: 12px; background-color: var(--ia-card); 
                border: 1px solid var(--ia-border); border-left: 3px solid var(--ia-primary); 
                border-radius: 6px; font-size: 13px; line-height: 1.5; color: var(--ia-text); 
                white-space: pre-wrap; display:none; 
            }

            /* CHAT RÁPIDO */
            #simple-chat-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-bottom: 10px; }
            .chat-bubble { max-width: 85%; padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.4; position: relative; word-wrap: break-word; }
            .chat-user { align-self: flex-end; background-color: var(--ia-user-msg); color: white; border-bottom-right-radius: 2px; }
            .chat-ai { align-self: flex-start; background-color: var(--ia-ai-msg); color: var(--ia-text); border: 1px solid var(--ia-border); border-bottom-left-radius: 2px; }
            
            .chat-input-area { display: flex; gap: 5px; margin-top: 10px; border-top: 1px solid var(--ia-border); padding-top: 10px; flex-shrink: 0; }
            #simple-input { flex: 1; padding: 10px; border-radius: 20px; border: 1px solid var(--ia-border); background: var(--ia-input-bg); color: var(--ia-text); outline: none; }
            #simple-input:focus { border-color: var(--ia-primary); }
            #btn-send-simple { width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--ia-primary); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: transform 0.1s; }
            #btn-send-simple:active { transform: scale(0.9); }

            /* RODAPÉ */
            .footer-row { display: flex; justify-content: flex-end; align-items: center; margin-top: auto; padding-top: 10px; border-top: 1px dashed var(--ia-border); }
            
            /* HISTÓRICO */
            .history-item { background-color: var(--ia-card); border: 1px solid var(--ia-border); border-radius: 6px; padding: 10px; margin-bottom: 8px; }
            .history-date { font-size: 10px; color: var(--ia-text-muted); font-weight: bold; margin-bottom: 4px; }
            .history-preview { font-size: 12px; color: var(--ia-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px; }
            .h-btn { padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; border: none; margin-left: 5px; }
            .h-btn-copy { background: rgba(59, 130, 246, 0.2); color: #3b82f6; } 
            .h-btn-del { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

            /* SCROLLBAR */
            #gemini-wrapper ::-webkit-scrollbar { width: 6px; }
            #gemini-wrapper ::-webkit-scrollbar-track { background: var(--ia-bg); }
            #gemini-wrapper ::-webkit-scrollbar-thumb { background: var(--ia-border); border-radius: 3px; }
            #gemini-wrapper ::-webkit-scrollbar-thumb:hover { background: var(--ia-text-muted); }
        `;
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        // --- 2. HTML (INTERFACE) ---
        const widgetHTML = `
          <div id="gemini-wrapper">
            <button id="gemini-float-btn" title="Abrir Assistente">🧑‍💻</button>
            <div id="gemini-modal">
              
              <div class="gemini-header" id="gemini-drag-handle">
                <h3>🧑‍💻 Assistente IA</h3>
                <div class="header-actions">
                   <button id="btn-history" class="icon-btn" title="Histórico">🕒</button>
                   <button id="btn-theme-toggle" class="icon-btn" title="Mudar Tema">🌗</button>
                   <button id="btn-close-modal" class="icon-btn" title="Fechar">✖</button>
                </div>
              </div>

              <div id="ia-nav-tabs" class="nav-tabs" style="display:none;">
                  <div class="nav-tab active" data-target="report">📝 Relatórios</div>
                  <div class="nav-tab" data-target="chat">💬 Chat Rápido</div>
              </div>

              <div id="screen-login" class="screen active">
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:center;">
                    <div style="font-size: 40px; margin-bottom: 10px;">🔑</div>
                    <h4 style="margin: 0 0 10px 0; color: var(--ia-text);">Autenticação</h4>
                    <p style="margin-bottom:15px; font-size:12px; color: var(--ia-text-muted);">Insira a chave API do Gemini.</p>
                    <input type="password" id="input-api-key" class="gemini-input" placeholder="Cole a chave API aqui...">
                    <button id="btn-save-key" class="gemini-btn btn-primary">Validar e Entrar</button>
                    <p style="margin-top:15px; font-size:11px;">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#3b82f6; text-decoration:none;">Obter chave gratuita Google</a>
                    </p>
                </div>
              </div>

              <div id="screen-report" class="screen">
                <textarea id="report-input" class="gemini-input" placeholder="Cole o protocolo ou conversa aqui para gerar o relatório..." spellcheck="false"></textarea>
                <button id="btn-summarize" class="gemini-btn btn-primary"><span>⚡</span> Gerar Relatório</button>
                <button id="btn-reset-report" class="gemini-btn" style="background:transparent; border:1px solid var(--ia-border); margin-top:5px;">🔄 Limpar</button>
                
                <div id="gemini-result"></div>
                <button id="btn-copy" class="gemini-btn btn-success" style="display:none;">📋 Copiar Resultado</button>
                
                <div class="footer-row">
                   <button id="btn-logout-1" class="gemini-btn btn-logout">Sair</button>
                </div>
              </div>

              <div id="screen-chat" class="screen">
                 <div id="simple-chat-container">
                    <div class="chat-bubble chat-ai">Olá! Sou o teu assistente rápido. Podes perguntar sobre procedimentos, ortografia ou dúvidas técnicas. Como ajudo?</div>
                 </div>
                 <div class="chat-input-area">
                    <input type="text" id="simple-input" placeholder="Escreva aqui..." autocomplete="off">
                    <button id="btn-send-simple">➤</button>
                 </div>
                 <div style="text-align:right; margin-top:5px;">
                     <button id="btn-clear-chat" style="background:none; border:none; color:var(--ia-text-muted); font-size:11px; cursor:pointer;">Limpar Chat</button>
                 </div>
              </div>

              <div id="screen-history" class="screen">
                 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--ia-border); padding-bottom:10px;">
                    <button id="btn-back-history" class="icon-btn" style="font-size:14px;">⬅ Voltar</button>
                    <button id="btn-clear-history" class="icon-btn" style="color:#ef4444; font-size:14px;">Limpar Tudo</button>
                 </div>
                 <div id="history-list"></div>
              </div>

            </div>
          </div>
        `;

        const container = document.createElement('div');
        container.innerHTML = widgetHTML;
        document.body.appendChild(container);

        // --- 3. REFERÊNCIAS DOM ---
        const wrapper = document.getElementById('gemini-wrapper');
        const floatBtn = document.getElementById('gemini-float-btn');
        const modal = document.getElementById('gemini-modal');
        const dragHandle = document.getElementById('gemini-drag-handle');
        const closeBtn = document.getElementById('btn-close-modal');
        const themeBtn = document.getElementById('btn-theme-toggle');
        const historyBtn = document.getElementById('btn-history');
        const navTabs = document.getElementById('ia-nav-tabs');
        
        const screenLogin = document.getElementById('screen-login');
        const screenReport = document.getElementById('screen-report');
        const screenChat = document.getElementById('screen-chat');
        const screenHistory = document.getElementById('screen-history');

        const inputApiKey = document.getElementById('input-api-key');
        const btnSaveKey = document.getElementById('btn-save-key');

        const reportInput = document.getElementById('report-input');
        const btnSummarize = document.getElementById('btn-summarize');
        const btnResetReport = document.getElementById('btn-reset-report');
        const resultDiv = document.getElementById('gemini-result');
        const btnCopy = document.getElementById('btn-copy');
        const btnLogout1 = document.getElementById('btn-logout-1');

        const simpleChatContainer = document.getElementById('simple-chat-container');
        const simpleInput = document.getElementById('simple-input');
        const btnSendSimple = document.getElementById('btn-send-simple');
        const btnClearChat = document.getElementById('btn-clear-chat');

        const btnBackHistory = document.getElementById('btn-back-history');
        const btnClearHistory = document.getElementById('btn-clear-history');
        const historyList = document.getElementById('history-list');

        // --- 4. LÓGICA E FUNÇÕES ---

        function centerModal() { 
            const left = (window.innerWidth - 400) / 2; const top = (window.innerHeight - 600) / 2;
            modal.style.left = `${left}px`; modal.style.top = `${top}px`;
        }

        let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
        dragHandle.addEventListener('mousedown', (e) => { if(e.target.closest('button'))return; isDragging = true; const rect = modal.getBoundingClientRect(); dragOffsetX = e.clientX - rect.left; dragOffsetY = e.clientY - rect.top; document.body.style.userSelect = 'none'; });
        document.addEventListener('mousemove', (e) => { if (!isDragging) return; let newLeft = e.clientX - dragOffsetX; let newTop = e.clientY - dragOffsetY; if (newTop < 0) newTop = 0; modal.style.left = `${newLeft}px`; modal.style.top = `${newTop}px`; });
        document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; document.body.style.userSelect = ''; } });

        function toggleTheme() {
            wrapper.classList.toggle('light-mode');
            const isLight = wrapper.classList.contains('light-mode');
            chrome.storage.local.set({ 'IA_LIGHT_MODE': isLight });
            themeBtn.innerText = isLight ? '☀️' : '🌗';
        }

        function loadSettings() {
            chrome.storage.local.get(['geminiKey', 'IA_LIGHT_MODE'], function(result) {
                if (result.geminiKey) { 
                    userApiKey = result.geminiKey; 
                    showScreen('report'); 
                    navTabs.style.display = 'flex'; 
                } else { 
                    showScreen('login'); 
                    navTabs.style.display = 'none';
                }
                if (result.IA_LIGHT_MODE) { wrapper.classList.add('light-mode'); themeBtn.innerText = '☀️'; } else { wrapper.classList.remove('light-mode'); themeBtn.innerText = '🌗'; }
            });
        }

        function showScreen(name) {
            [screenLogin, screenReport, screenChat, screenHistory].forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

            if (name === 'login') {
                screenLogin.classList.add('active');
                navTabs.style.display = 'none';
            } else if (name === 'history') {
                screenHistory.classList.add('active');
                renderHistory();
            } else {
                navTabs.style.display = 'flex';
                if (name === 'report') {
                    screenReport.classList.add('active');
                    document.querySelector('[data-target="report"]').classList.add('active');
                } else if (name === 'chat') {
                    screenChat.classList.add('active');
                    document.querySelector('[data-target="chat"]').classList.add('active');
                    setTimeout(() => simpleInput.focus(), 100);
                }
            }
        }

        function saveToHistory(summaryText) {
            chrome.storage.local.get(['geminiHistory'], function(result) {
                let history = result.geminiHistory || [];
                history.unshift({ id: Date.now(), date: new Date().toLocaleString('pt-BR'), text: summaryText });
                if (history.length > 50) history = history.slice(0, 50);
                chrome.storage.local.set({ geminiHistory: history });
            });
        }
        
        function renderHistory() {
             chrome.storage.local.get(['geminiHistory'], function(result) {
                const history = result.geminiHistory || [];
                historyList.innerHTML = history.length === 0 ? '<p style="text-align:center;color:#94a3b8;margin-top:20px;">Vazio.</p>' : '';
                history.forEach(item => {
                    const div = document.createElement('div'); div.className = 'history-item';
                    div.innerHTML = `<div class="history-date">📅 ${item.date}</div><div class="history-preview">${item.text}</div><div class="history-item-actions" style="text-align:right;"><button class="h-btn h-btn-copy" data-text="${encodeURIComponent(item.text)}">Copiar</button><button class="h-btn h-btn-del" data-id="${item.id}">🗑️</button></div>`;
                    historyList.appendChild(div);
                });
                document.querySelectorAll('.h-btn-copy').forEach(btn => btn.onclick = (e) => { navigator.clipboard.writeText(decodeURIComponent(e.target.getAttribute('data-text'))); const prevText = e.target.innerText; e.target.innerText = "OK!"; setTimeout(()=>e.target.innerText=prevText,1500); });
                document.querySelectorAll('.h-btn-del').forEach(btn => btn.onclick = (e) => { const id = parseInt(e.target.getAttribute('data-id')); chrome.storage.local.get(['geminiHistory'], r => { chrome.storage.local.set({ geminiHistory: (r.geminiHistory || []).filter(i => i.id !== id) }, renderHistory); }); });
            });
        }

        // --- MODELO SEGURO ---
        async function findBestFreeModel(apiKey) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                const data = await response.json();
                if (data.models) {
                    const all = data.models.map(m => m.name.replace("models/", ""));
                    let best = all.find(m => m === "gemini-1.5-flash-8b");
                    if (!best) best = all.find(m => m === "gemini-1.5-flash");
                    if (!best) best = all.find(m => m.includes("flash") && !m.includes("exp") && !m.includes("experimental"));
                    return best || "gemini-1.5-flash";
                }
            } catch (e) {} 
            return "gemini-1.5-flash";
        }

        // --- EVENTOS ---
        document.querySelectorAll('.nav-tab').forEach(tab => { tab.addEventListener('click', () => showScreen(tab.dataset.target)); });
        btnSendSimple.onclick = sendSimpleMessage;
        simpleInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendSimpleMessage(); });
        btnClearChat.onclick = () => { simpleChatContainer.innerHTML = '<div class="chat-bubble chat-ai">Chat limpo. Como posso ajudar?</div>'; chatHistoryContext = []; };
        floatBtn.onclick = () => { if (modal.style.display === 'none' || !modal.style.display) { modal.style.display = 'flex'; centerModal(); loadSettings(); } else { modal.style.display = 'none'; } };
        closeBtn.onclick = () => modal.style.display = 'none';
        themeBtn.onclick = toggleTheme;
        historyBtn.onclick = () => showScreen('history');
        btnBackHistory.onclick = () => showScreen('report');
        btnResetReport.onclick = () => { reportInput.value = ''; resultDiv.innerText = ''; resultDiv.style.display = 'none'; btnCopy.style.display = 'none'; reportInput.focus(); };
        btnSaveKey.onclick = () => { const k = inputApiKey.value.trim(); if (k.length < 10) return alert("Chave inválida."); chrome.storage.local.set({ geminiKey: k }, () => { userApiKey = k; showScreen('report'); }); };
        btnLogout1.onclick = () => { if(confirm("Sair?")) chrome.storage.local.remove(['geminiKey'], () => { userApiKey = ''; showScreen('login'); }); };
        btnCopy.onclick = () => { navigator.clipboard.writeText(resultDiv.innerText); btnCopy.innerText = "Copiado! ✅"; setTimeout(() => btnCopy.innerText = "📋 Copiar Resultado", 2000); };
        document.getElementById('btn-clear-history').onclick = () => { if(confirm("Apagar tudo?")) chrome.storage.local.set({ geminiHistory: [] }, renderHistory); };

        // --- CHAT RÁPIDO ---
        async function sendSimpleMessage() {
            const text = simpleInput.value.trim(); if (!text) return;
            addChatBubble(text, 'user'); simpleInput.value = '';
            const loadingId = addChatBubble("Digitando...", 'ai', true);
            const context = chatHistoryContext.slice(-6).map(m => `user: ${m.user}\nmodel: ${m.ai}`).join("\n");
            
            const prompt = `Aja como um assistente de suporte técnico útil e direto. Responda de forma concisa.\nHistórico:\n${context}\n\nUsuário: ${text}\nAssistente:`;

            try {
                let model = currentModel;
                let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                let data = await response.json();

                if (data.error) {
                    model = await findBestFreeModel(userApiKey);
                    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                    });
                    data = await response.json();
                }

                const loadEl = document.getElementById(loadingId); if(loadEl) loadEl.remove();
                if (data.error) { addChatBubble("Erro: " + data.error.message, 'ai'); } 
                else {
                    const reply = data.candidates[0].content.parts[0].text;
                    addChatBubble(reply, 'ai');
                    chatHistoryContext.push({ user: text, ai: reply });
                }
            } catch (e) {
                const loadEl = document.getElementById(loadingId); if(loadEl) loadEl.remove();
                addChatBubble("Erro de conexão.", 'ai');
            }
        }

        function addChatBubble(text, type, isTemp = false) {
            const div = document.createElement('div'); div.className = `chat-bubble chat-${type}`; div.innerText = text;
            if (isTemp) div.id = "temp-loading-" + Date.now();
            simpleChatContainer.appendChild(div); simpleChatContainer.scrollTop = simpleChatContainer.scrollHeight;
            return div.id;
        }

        // --- RELATÓRIO HUMANIZADO (PROMPT CORRIGIDO) ---
        btnSummarize.onclick = async () => {
            const text = reportInput.value.trim(); if (!text) return alert('Cola o protocolo primeiro!');
            btnSummarize.innerHTML = "<span>⏳</span> A gerar..."; btnSummarize.disabled = true; resultDiv.style.display = 'none';
            
            const prompt = `
            Aja como o atendente de suporte técnico Josias.
            Escreva um relatório técnico em PRIMEIRA PESSOA, em texto corrido (narrativo).
            NÃO USE tópicos numerados ou listas como "1. Cabeçalho". Use parágrafos.
            
            ESTRUTURA NARRATIVA:
            1º Parágrafo: "Eu, Josias [Sobrenome], prestei assistência a [Nome Cliente] (titular), contato [Tel]. O atendimento foi sobre [Motivo]."
            2º Parágrafo: Descreva o relato do cliente com as palavras dele (ex: "Ele relatou lentidão... ameaçou cancelar...").
            3º Parágrafo: Descreva o que foi feito. "O Bot tentou X. Eu realizei Y e Z."
            4º Parágrafo: Conclusão. Se funcionou ou se o cliente disse que voltou a falhar logo em seguida (recorrência imediata). Se agendou visita, coloque o endereço no final.

            Conversa: ${text}`;

            try {
                let model = currentModel;
                let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                let data = await response.json();

                if (data.error) {
                    model = await findBestFreeModel(userApiKey);
                    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                    });
                    data = await response.json();
                }

                if (data.error) throw new Error(data.error.message);
                const summary = data.candidates[0].content.parts[0].text;
                resultDiv.innerText = summary; resultDiv.style.display = 'block'; btnCopy.style.display = 'flex'; 
                saveToHistory(summary); resultDiv.scrollIntoView({ behavior: "smooth" });
            } catch (error) { alert('Erro: ' + error.message); }
            finally { btnSummarize.innerHTML = "<span>⚡</span> Gerar Relatório"; btnSummarize.disabled = false; }
        };
    }
})();