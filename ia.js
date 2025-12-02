// ==UserScript==
// @name         PureCloud - Assistente IA (v16.0 - Ultimate)
// @description  Visual moderno, formatação rica e lógica robusta de API.
// @author       Parceiro de Programacao
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. CONFIGURAÇÃO E STORAGE (Robusto) ---
    const APP_PREFIX = "IA_ULTIMATE_";
    
    const store = {
        get: (keys, cb) => {
            // Tenta usar storage de extensão, senão usa localStorage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(keys, cb);
            } else {
                let res = {};
                keys.forEach(k => {
                    const val = localStorage.getItem(APP_PREFIX + k);
                    if(val) {
                        try { res[k] = JSON.parse(val); } 
                        catch(e) { res[k] = val; } // fallback se não for JSON
                    }
                });
                cb(res);
            }
        },
        set: (obj, cb) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set(obj, cb);
            } else {
                Object.keys(obj).forEach(k => {
                    localStorage.setItem(APP_PREFIX + k, JSON.stringify(obj[k]));
                });
                if(cb) cb();
            }
        },
        remove: (keys, cb) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.remove(keys, cb);
            } else {
                keys.forEach(k => localStorage.removeItem(APP_PREFIX + k));
                if(cb) cb();
            }
        }
    };

    // Verifica se foi desativado globalmente
    store.get(['MOD_IA'], function(result) {
        if (result.MOD_IA === false) {
            console.log("⛔ [IA] Módulo desativado.");
            return; 
        }
        initIA(); 
    });

    function initIA() {
        console.log("[IA] Assistente Ultimate Iniciado...");

        // Variáveis de Estado
        let currentModel = "gemini-1.5-flash"; 
        let userApiKey = '';
        let agentName = 'Atendente';
        let chatContext = []; 

        // --- 2. CSS (DESIGN SYSTEM MELHORADO) ---
        const css = `
            #gemini-wrapper {
                /* Cores e Variáveis - Modo Escuro (Default) */
                --ia-bg: rgba(15, 23, 42, 0.95); /* Translúcido */
                --ia-card: #1e293b; 
                --ia-border: #334155; 
                --ia-text: #f1f5f9; 
                --ia-text-muted: #94a3b8;
                --ia-input: #0f172a; 
                --ia-primary: #3b82f6;
                --ia-primary-hover: #2563eb;
                --ia-shadow: 0 20px 50px rgba(0,0,0,0.5);
                --ia-radius: 12px;
                
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                box-sizing: border-box; color-scheme: dark; font-size: 14px;
            }
            
            #gemini-wrapper.light-mode {
                --ia-bg: rgba(255, 255, 255, 0.95);
                --ia-card: #f8fafc; 
                --ia-border: #e2e8f0; 
                --ia-text: #334155; 
                --ia-text-muted: #64748b;
                --ia-input: #ffffff; 
                --ia-primary: #2563eb;
                --ia-primary-hover: #1d4ed8;
                --ia-shadow: 0 20px 50px rgba(0,0,0,0.15);
                color-scheme: light;
            }

            #gemini-wrapper * { box-sizing: border-box; transition: background-color 0.2s, color 0.2s; }

            /* Botão Flutuante */
            #gemini-float-btn {
                position: fixed; bottom: 85px; right: 25px; 
                width: 56px; height: 56px; 
                background: linear-gradient(135deg, var(--ia-primary), var(--ia-primary-hover)); 
                color: white; border-radius: 50%; border: none; 
                box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4); 
                cursor: pointer; font-size: 26px; z-index: 999999;
                display: flex; align-items: center; justify-content: center;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            #gemini-float-btn:hover { transform: scale(1.1) rotate(10deg); box-shadow: 0 0 20px var(--ia-primary); }

            /* Janela Principal */
            #gemini-modal {
                display: none; position: fixed; z-index: 999999;
                width: 400px; height: 650px; left: 50%; top: 50%; transform: translate(-50%, -50%);
                background-color: var(--ia-bg); color: var(--ia-text);
                border-radius: var(--ia-radius); 
                border: 1px solid var(--ia-border);
                box-shadow: var(--ia-shadow);
                backdrop-filter: blur(10px); /* Efeito de vidro */
                flex-direction: column; overflow: hidden;
            }

            /* Cabeçalho */
            .gemini-header { 
                padding: 15px; border-bottom: 1px solid var(--ia-border); 
                display: flex; justify-content: space-between; align-items: center; 
                cursor: move; user-select: none; background: rgba(0,0,0,0.1);
            }
            .gemini-header h3 { margin: 0; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
            .gh-actions { display: flex; gap: 8px; }
            .icon-btn { background: transparent; border: none; cursor: pointer; font-size: 16px; color: var(--ia-text-muted); padding: 4px; border-radius: 4px; transition: all 0.2s; }
            .icon-btn:hover { color: var(--ia-text); background: rgba(255,255,255,0.1); }

            /* Navegação */
            .nav-tabs { display: flex; border-bottom: 1px solid var(--ia-border); background: rgba(0,0,0,0.05); }
            .nav-tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--ia-text-muted); border-bottom: 2px solid transparent; }
            .nav-tab:hover { color: var(--ia-text); background: rgba(255,255,255,0.03); }
            .nav-tab.active { color: var(--ia-primary); border-bottom-color: var(--ia-primary); }

            /* Telas */
            .screen { padding: 20px; display: none; flex-direction: column; flex: 1; overflow-y: auto; }
            .screen.active { display: flex; }

            /* Inputs e Botões */
            .gemini-input { 
                width: 100%; padding: 12px; margin-bottom: 12px; border-radius: 8px; 
                border: 1px solid var(--ia-border); background: var(--ia-input); 
                color: var(--ia-text); font-size: 13px; font-family: inherit; resize: none;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .gemini-input:focus { outline: none; border-color: var(--ia-primary); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
            
            .gemini-label { font-size: 11px; font-weight: 700; color: var(--ia-text-muted); margin-bottom: 6px; display: block; text-transform: uppercase; letter-spacing: 0.5px; }

            .gemini-btn { 
                width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 600; 
                cursor: pointer; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;
                font-size: 13px; color: white; transition: filter 0.2s, transform 0.1s;
            }
            .gemini-btn:active { transform: scale(0.98); }
            .btn-primary { background: var(--ia-primary); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .btn-primary:hover { filter: brightness(1.1); }
            .btn-outline { background: transparent; border: 1px solid var(--ia-border); color: var(--ia-text); }
            .btn-outline:hover { border-color: var(--ia-text-muted); }
            .btn-danger { background: transparent; border: 1px solid #ef4444; color: #ef4444; width: auto; font-size: 11px; padding: 6px 12px; }
            .btn-danger:hover { background: rgba(239, 68, 68, 0.1); }

            /* Área de Resultado com Markdown */
            #gemini-result { 
                margin-top: 15px; padding: 15px; background: var(--ia-card); 
                border: 1px solid var(--ia-border); border-left: 4px solid var(--ia-primary); 
                border-radius: 8px; font-size: 13px; line-height: 1.6; color: var(--ia-text); 
                display:none; word-wrap: break-word; white-space: pre-wrap;
            }
            #gemini-result strong, .chat-bubble strong { color: var(--ia-primary); font-weight: 700; }
            #gemini-result em { font-style: italic; opacity: 0.9; }

            /* Chat Rápido */
            #chat-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 10px; }
            .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.4; position: relative; word-wrap: break-word; }
            .chat-user { align-self: flex-end; background-color: var(--ia-primary); color: white; border-bottom-right-radius: 2px; }
            .chat-ai { align-self: flex-start; background-color: var(--ia-card); color: var(--ia-text); border: 1px solid var(--ia-border); border-bottom-left-radius: 2px; }
            
            .chat-input-box { display: flex; gap: 8px; margin-top: 10px; border-top: 1px solid var(--ia-border); padding-top: 15px; }
            #input-chat { border-radius: 20px; margin: 0; }
            #btn-send-chat { width: 42px; height: 42px; border-radius: 50%; padding: 0; margin: 0; flex-shrink: 0; }
        `;
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        // --- 3. HTML (ESTRUTURA) ---
        const widgetHTML = `
          <div id="gemini-wrapper">
            <button id="gemini-float-btn" title="Abrir Assistente">✨</button>
            <div id="gemini-modal">
              
              <div class="gemini-header" id="gemini-drag-handle">
                <h3>🤖 Assistente <span style="font-size:10px; opacity:0.6; font-weight:400; margin-left:5px;">v16.0</span></h3>
                <div class="gh-actions">
                   <button id="btn-theme" class="icon-btn" title="Tema">🌗</button>
                   <button id="btn-close" class="icon-btn" title="Fechar">✖</button>
                </div>
              </div>

              <div id="ia-nav-tabs" class="nav-tabs" style="display:none;">
                  <div class="nav-tab active" data-target="report">📝 Relatórios</div>
                  <div class="nav-tab" data-target="chat">💬 Chat</div>
                  <div class="nav-tab" data-target="config">⚙️ Config</div>
              </div>

              <div id="screen-login" class="screen active">
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:center;">
                    <div style="font-size: 42px; margin-bottom: 15px;">👋</div>
                    <h4 style="margin: 0 0 5px 0; font-size:18px; color: var(--ia-text);">Bem-vindo</h4>
                    <p style="margin-bottom:25px; font-size:12px; color: var(--ia-text-muted);">Configure o seu assistente pessoal.</p>
                    
                    <div style="text-align:left;">
                        <span class="gemini-label">Seu Nome (Para Assinatura):</span>
                        <input type="text" id="input-setup-name" class="gemini-input" placeholder="Ex: Josias Silva">
                        
                        <span class="gemini-label">Chave API (Gemini):</span>
                        <input type="password" id="input-setup-key" class="gemini-input" placeholder="Cole a chave API aqui...">
                    </div>

                    <button id="btn-login" class="gemini-btn btn-primary">Salvar e Entrar</button>
                    <p style="margin-top:20px; font-size:11px;">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--ia-primary); text-decoration:none;">🔑 Obter chave gratuita</a>
                    </p>
                </div>
              </div>

              <div id="screen-report" class="screen">
                <span class="gemini-label">Texto do Protocolo / Conversa</span>
                <textarea id="input-report" class="gemini-input" style="min-height:120px;" placeholder="Cole aqui o texto..." spellcheck="false"></textarea>
                
                <div style="display:flex; gap:8px;">
                    <button id="btn-gen-report" class="gemini-btn btn-primary">⚡ Gerar Relatório</button>
                    <button id="btn-clear-report" class="gemini-btn btn-outline" style="width:50px;" title="Limpar">🗑️</button>
                </div>

                <div id="gemini-result"></div>
                <button id="btn-copy-result" class="gemini-btn btn-primary" style="display:none; background:#10b981; margin-top:10px;">📋 Copiar Resultado</button>
              </div>

              <div id="screen-chat" class="screen">
                 <div id="chat-container">
                    <div class="chat-bubble chat-ai">Olá <b id="chat-user-name"></b>! Sou o teu assistente. Podes pedir correções, dicas técnicas ou modelos de e-mail.</div>
                 </div>
                 <div class="chat-input-box">
                    <input type="text" id="input-chat" class="gemini-input" placeholder="Escreva aqui..." autocomplete="off">
                    <button id="btn-send-chat" class="gemini-btn btn-primary">➤</button>
                 </div>
                 <div style="text-align:right;">
                     <button id="btn-clear-chat" style="background:none; border:none; color:var(--ia-text-muted); font-size:11px; cursor:pointer;">Limpar Chat</button>
                 </div>
              </div>

              <div id="screen-config" class="screen">
                  <h4 style="margin-top:0;">Minhas Configurações</h4>
                  
                  <span class="gemini-label">Nome do Atendente:</span>
                  <input type="text" id="cfg-name" class="gemini-input">
                  
                  <span class="gemini-label">Chave API:</span>
                  <input type="password" id="cfg-key" class="gemini-input">
                  
                  <button id="btn-save-cfg" class="gemini-btn btn-primary">Atualizar Dados</button>
                  
                  <div style="margin-top:auto; border-top:1px dashed var(--ia-border); padding-top:15px;">
                     <button id="btn-logout" class="gemini-btn btn-danger">Sair e Remover Chave</button>
                  </div>
              </div>

            </div>
          </div>
        `;

        const container = document.createElement('div');
        container.innerHTML = widgetHTML;
        document.body.appendChild(container);

        // --- 4. REFERÊNCIAS DOM ---
        const getEl = (id) => document.getElementById(id);
        const wrapper = getEl('gemini-wrapper');
        const modal = getEl('gemini-modal');
        
        // --- 5. FUNÇÕES AUXILIARES ---
        
        // Parse Markdown Simples (Negrito e Itálico)
        function formatMarkdown(text) {
            if(!text) return '';
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrito
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Itálico
                .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:3px; font-family:monospace;">$1</code>'); // Code inline
        }

        // --- 6. LÓGICA DE API (Robustez do v8.3) ---
        async function callGemini(promptText) {
            let model = currentModel;
            const getUrl = (m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${userApiKey}`;
            const body = { contents: [{ parts: [{ text: promptText }] }] };
            const headers = { 'Content-Type': 'application/json' };

            try {
                // Tentativa 1: Modelo Padrão
                let response = await fetch(getUrl(model), { method: 'POST', headers, body: JSON.stringify(body) });
                let data = await response.json();

                // Tentativa 2: Fallback (Se der erro, procura outro gratuito)
                if (data.error) {
                    console.warn("[IA] Erro API, trocando modelo...");
                    model = await findBestFreeModel(userApiKey);
                    response = await fetch(getUrl(model), { method: 'POST', headers, body: JSON.stringify(body) });
                    data = await response.json();
                }

                if (data.error) throw new Error(data.error.message);
                return data.candidates[0].content.parts[0].text;
            } catch (e) {
                throw e;
            }
        }

        async function findBestFreeModel(apiKey) {
            try {
                const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                const d = await r.json();
                if (d.models) {
                    const all = d.models.map(m => m.name.replace("models/", ""));
                    // Prioridade: Flash 8b (mais rápido) -> Flash (padrão)
                    let best = all.find(m => m.includes("flash-8b")) || all.find(m => m === "gemini-1.5-flash") || all.find(m => m.includes("flash"));
                    return best || "gemini-1.5-flash";
                }
            } catch (e) { return "gemini-1.5-flash"; }
        }

        // --- 7. FLUXO DE NAVEGAÇÃO ---
        function loadState() {
            store.get(['geminiKey', 'agentName', 'IA_THEME'], (res) => {
                if (res.geminiKey) {
                    userApiKey = res.geminiKey;
                    agentName = res.agentName || "Atendente";
                    
                    // Atualiza UI com dados salvos
                    getEl('cfg-key').value = userApiKey;
                    getEl('cfg-name').value = agentName;
                    getEl('chat-user-name').innerText = agentName;
                    
                    switchScreen('report');
                    getEl('ia-nav-tabs').style.display = 'flex';
                } else {
                    switchScreen('login');
                    getEl('ia-nav-tabs').style.display = 'none';
                }

                if(res.IA_THEME === 'light') {
                    wrapper.classList.add('light-mode');
                    getEl('btn-theme').innerText = '☀️';
                }
            });
        }

        function switchScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            
            getEl('screen-' + id).classList.add('active');
            const tab = document.querySelector(`.nav-tab[data-target="${id}"]`);
            if(tab) tab.classList.add('active');
        }

        // --- 8. EVENT LISTENERS ---

        // Login
        getEl('btn-login').onclick = () => {
            const k = getEl('input-setup-key').value.trim();
            const n = getEl('input-setup-name').value.trim() || "Atendente";
            if(k.length < 10) return alert("Chave API parece inválida (muito curta).");
            store.set({geminiKey: k, agentName: n}, loadState);
        };

        // Config Salvar/Logout
        getEl('btn-save-cfg').onclick = () => {
            const k = getEl('cfg-key').value.trim();
            const n = getEl('cfg-name').value.trim();
            store.set({geminiKey: k, agentName: n}, () => { alert("Configurações atualizadas!"); loadState(); });
        };
        getEl('btn-logout').onclick = () => {
            if(confirm("Tem certeza que deseja apagar sua chave deste dispositivo?")) {
                store.remove(['geminiKey', 'agentName'], () => location.reload());
            }
        };

        // Gerar Relatório
        getEl('btn-gen-report').onclick = async () => {
            const txt = getEl('input-report').value.trim();
            if(!txt) return alert("Por favor, cole o texto do protocolo.");

            const btn = getEl('btn-gen-report');
            const resDiv = getEl('gemini-result');
            const cpyBtn = getEl('btn-copy-result');

            btn.disabled = true; btn.innerHTML = "⏳ A gerar...";
            resDiv.style.display = 'none'; cpyBtn.style.display = 'none';

            // Prompt Otimizado
            const prompt = `
            Você é ${agentName}, um especialista de suporte técnico.
            Escreva um relatório técnico em PRIMEIRA PESSOA (${agentName}) sobre o atendimento abaixo.
            
            DIRETRIZES:
            1. Seja profissional, direto e use linguagem culta.
            2. Use NEGRITO (**texto**) para destacar: Números de Protocolo, Datas, Telefones e Nomes de Clientes.
            3. Estrutura:
               - Introdução ("Eu, ${agentName}, atendi...")
               - Relato do Cliente
               - Procedimentos Realizados
               - Conclusão

            Texto para análise:
            ${txt}`;

            try {
                const raw = await callGemini(prompt);
                resDiv.innerHTML = formatMarkdown(raw); // Aplica formatação visual
                resDiv.style.display = 'block';
                cpyBtn.style.display = 'block';
            } catch (err) {
                resDiv.innerText = "Erro: " + err.message;
                resDiv.style.display = 'block';
            } finally {
                btn.disabled = false; btn.innerHTML = "⚡ Gerar Relatório";
            }
        };

        // Copiar e Limpar Relatório
        getEl('btn-copy-result').onclick = () => {
            navigator.clipboard.writeText(getEl('gemini-result').innerText);
            const b = getEl('btn-copy-result');
            b.innerText = "Copiado! ✅"; setTimeout(()=> b.innerText = "📋 Copiar Resultado", 2000);
        };
        getEl('btn-clear-report').onclick = () => {
            getEl('input-report').value = '';
            getEl('gemini-result').style.display = 'none';
            getEl('btn-copy-result').style.display = 'none';
        };

        // Chat
        const sendChatMsg = async () => {
            const inp = getEl('input-chat');
            const txt = inp.value.trim();
            if(!txt) return;

            // Add User Msg
            addBubble(txt, 'user');
            inp.value = '';

            // Add Loading
            const loadId = addBubble("...", 'ai', true);
            
            // Build Context
            const ctxStr = chatContext.slice(-4).map(m => `User: ${m.u}\nAI: ${m.a}`).join('\n');
            const prompt = `Seu nome é ${agentName}. Responda de forma útil e breve.\nContexto:\n${ctxStr}\n\nUsuário: ${txt}`;

            try {
                const ans = await callGemini(prompt);
                document.getElementById(loadId).remove();
                addBubble(ans, 'ai');
                chatContext.push({u: txt, a: ans});
            } catch(e) {
                document.getElementById(loadId).innerText = "Erro de conexão.";
            }
        };
        
        function addBubble(text, type, isTemp) {
            const d = document.createElement('div');
            d.className = `chat-bubble chat-${type}`;
            if(isTemp) { d.id = "temp-" + Date.now(); d.innerText = text; }
            else d.innerHTML = formatMarkdown(text);
            
            const c = getEl('chat-container');
            c.appendChild(d);
            c.scrollTop = c.scrollHeight;
            return d.id;
        }

        getEl('btn-send-chat').onclick = sendChatMsg;
        getEl('input-chat').onkeypress = (e) => { if(e.key === 'Enter') sendChatMsg(); };
        getEl('btn-clear-chat').onclick = () => {
            getEl('chat-container').innerHTML = `<div class="chat-bubble chat-ai">Chat limpo. Olá, sou ${agentName}.</div>`;
            chatContext = [];
        };

        // UI Geral
        document.querySelectorAll('.nav-tab').forEach(t => t.onclick = () => switchScreen(t.dataset.target));
        
        getEl('gemini-float-btn').onclick = () => {
            if(modal.style.display === 'none' || !modal.style.display) {
                modal.style.display = 'flex';
                loadState();
            } else modal.style.display = 'none';
        };
        getEl('btn-close').onclick = () => modal.style.display = 'none';
        
        getEl('btn-theme').onclick = () => {
            wrapper.classList.toggle('light-mode');
            const isLight = wrapper.classList.contains('light-mode');
            store.set({IA_THEME: isLight ? 'light' : 'dark'});
            getEl('btn-theme').innerText = isLight ? '☀️' : '🌗';
        };

        // Draggable Logic
        const handle = getEl('gemini-drag-handle');
        let isDrag = false, startX, startY, initX, initY;
        
        handle.onmousedown = (e) => {
            if(e.target.closest('button')) return;
            isDrag = true;
            startX = e.clientX; startY = e.clientY;
            const rect = modal.getBoundingClientRect();
            // Remove transform centering logic to allow absolute movement
            modal.style.transform = 'none';
            modal.style.left = rect.left + 'px';
            modal.style.top = rect.top + 'px';
            document.body.style.userSelect = 'none';
        };
        document.addEventListener('mousemove', (e) => {
            if(!isDrag) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            modal.style.left = (parseFloat(modal.style.left) + dx) + 'px';
            modal.style.top = (parseFloat(modal.style.top) + dy) + 'px';
            startX = e.clientX; startY = e.clientY;
        });
        document.addEventListener('mouseup', () => { isDrag = false; document.body.style.userSelect = ''; });

        loadState();
    }
})();
