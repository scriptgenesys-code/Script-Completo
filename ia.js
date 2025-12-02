// ==UserScript==
// @name         PureCloud - Assistente IA (v22.0 - Secure Login)
// @description  Bloqueio de funções antes do login. Visual Premium v21.
// @author       Parceiro de Programacao
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. CONFIGURAÇÃO E STORAGE ---
    const APP_PREFIX = "IA_V22_SECURE_";
    
    const store = {
        get: (keys, cb) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(keys, cb);
            } else {
                let res = {};
                keys.forEach(k => {
                    const val = localStorage.getItem(APP_PREFIX + k);
                    if(val) { try { res[k] = JSON.parse(val); } catch(e) { res[k] = val; } }
                });
                cb(res);
            }
        },
        set: (obj, cb) => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set(obj, cb);
            } else {
                Object.keys(obj).forEach(k => localStorage.setItem(APP_PREFIX + k, JSON.stringify(obj[k])));
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

    store.get(['MOD_IA'], function(result) {
        if (result.MOD_IA === false) return; 
        initIA(); 
    });

    function initIA() {
        console.log("[IA] Assistente v22.0 Iniciado...");

        // --- VARIÁVEIS ---
        let currentModel = "gemini-1.5-flash"; 
        let userApiKey = '';
        let agentName = 'Atendente';
        let chatHistoryContext = []; 

        // --- 2. CSS (MANTIDO DO V21) ---
        const css = `
            #gemini-wrapper {
                --ia-bg: rgba(15, 23, 42, 0.98);
                --ia-card: #1e293b; --ia-border: #334155; 
                --ia-text: #f1f5f9; --ia-text-muted: #94a3b8;
                --ia-input: #0f172a; 
                --ia-primary: #3b82f6; --ia-primary-hover: #2563eb;
                --ia-danger: #ef4444; --ia-success: #10b981;
                --ia-shadow: 0 20px 50px rgba(0,0,0,0.6);
                --ia-radius: 12px;
                font-family: 'Segoe UI', Roboto, sans-serif;
                box-sizing: border-box; color-scheme: dark; font-size: 14px;
            }
            #gemini-wrapper.light-mode {
                --ia-bg: rgba(255, 255, 255, 0.98);
                --ia-card: #f8fafc; --ia-border: #e2e8f0; 
                --ia-text: #334155; --ia-text-muted: #64748b;
                --ia-input: #ffffff; 
                --ia-primary: #2563eb; --ia-primary-hover: #1d4ed8;
                --ia-shadow: 0 20px 50px rgba(0,0,0,0.15);
                color-scheme: light;
            }
            #gemini-wrapper * { box-sizing: border-box; transition: background-color 0.2s, color 0.2s; }

            /* Botão Flutuante */
            #gemini-float-btn {
                position: fixed; bottom: 85px; right: 25px; width: 56px; height: 56px; 
                background: linear-gradient(135deg, var(--ia-primary), var(--ia-primary-hover)); 
                color: white; border-radius: 50%; border: none; 
                box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4); 
                cursor: pointer; font-size: 24px; z-index: 999999;
                display: flex; align-items: center; justify-content: center;
                transition: transform 0.2s;
            }
            #gemini-float-btn:hover { transform: scale(1.1); }

            /* Modal */
            #gemini-modal {
                display: none; position: fixed; z-index: 999999;
                width: 400px; height: 650px; left: 50%; top: 50%; transform: translate(-50%, -50%);
                background-color: var(--ia-bg); color: var(--ia-text);
                border-radius: var(--ia-radius); border: 1px solid var(--ia-border);
                box-shadow: var(--ia-shadow); backdrop-filter: blur(12px);
                flex-direction: column; overflow: hidden;
            }

            /* Header */
            .gemini-header { 
                padding: 12px 16px; border-bottom: 1px solid var(--ia-border); 
                display: flex; justify-content: space-between; align-items: center; 
                cursor: move; user-select: none; background: rgba(0,0,0,0.15); 
            }
            .gemini-header h3 { margin: 0; font-size: 15px; font-weight: 600; display:flex; gap:8px; align-items:center;}
            
            .gh-actions { display: flex; gap: 4px; align-items: center; }
            .icon-btn { 
                background: transparent; border: none; cursor: pointer; font-size: 15px; 
                color: var(--ia-text-muted); padding: 6px; border-radius: 6px; 
                display: flex; align-items: center; justify-content: center;
                transition: all 0.2s;
            }
            .icon-btn:hover { color: var(--ia-text); background: rgba(255,255,255,0.1); }

            /* Abas */
            .nav-tabs { display: flex; border-bottom: 1px solid var(--ia-border); background: rgba(0,0,0,0.02); }
            .nav-tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--ia-text-muted); border-bottom: 2px solid transparent; }
            .nav-tab:hover { color: var(--ia-text); background: rgba(255,255,255,0.03); }
            .nav-tab.active { color: var(--ia-primary); border-bottom-color: var(--ia-primary); font-weight: 600; }

            /* Screens */
            .screen { padding: 20px; display: none; flex-direction: column; flex: 1; overflow-y: auto; }
            .screen.active { display: flex; }

            /* Inputs */
            .gemini-input { width: 100%; padding: 12px; margin-bottom: 12px; border-radius: 8px; border: 1px solid var(--ia-border); background: var(--ia-input); color: var(--ia-text); font-size: 13px; font-family: inherit; resize: none; }
            .gemini-input:focus { outline: none; border-color: var(--ia-primary); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
            .gemini-label { font-size: 11px; font-weight: 700; color: var(--ia-text-muted); margin-bottom: 6px; display: block; text-transform: uppercase; letter-spacing: 0.5px; }

            /* Buttons */
            .gemini-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: white; transition: filter 0.2s, transform 0.1s; }
            .gemini-btn:active { transform: scale(0.98); }
            .btn-primary { background: var(--ia-primary); }
            .btn-success { background: var(--ia-success); }
            .btn-danger { background: transparent; border: 1px solid var(--ia-danger); color: var(--ia-danger); }
            .btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
            .btn-outline { background: transparent; border: 1px solid var(--ia-border); color: var(--ia-text); }

            /* Result */
            #gemini-result { margin-top: 15px; padding: 15px; background: var(--ia-card); border: 1px solid var(--ia-border); border-left: 4px solid var(--ia-primary); border-radius: 8px; font-size: 13px; line-height: 1.6; display:none; white-space: pre-wrap; word-wrap: break-word; }
            #gemini-result strong { color: var(--ia-primary); font-weight: 700; }
            
            /* History */
            .history-item { background: var(--ia-card); border: 1px solid var(--ia-border); border-radius: 8px; padding: 12px; margin-bottom: 10px; }
            .history-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--ia-text-muted); margin-bottom: 6px; border-bottom: 1px dashed var(--ia-border); padding-bottom: 4px; }
            .history-preview { font-size: 12px; color: var(--ia-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px; }
            .h-actions { display: flex; gap: 5px; justify-content: flex-end; }
            .h-btn { padding: 4px 10px; font-size: 11px; border-radius: 4px; cursor: pointer; border: none; }
            
            /* Chat */
            .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.4; margin-bottom: 10px; }
            .chat-user { align-self: flex-end; background-color: var(--ia-primary); color: white; }
            .chat-ai { align-self: flex-start; background-color: var(--ia-card); border: 1px solid var(--ia-border); }
        `;
        
        const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

        // --- 3. HTML ---
        const widgetHTML = `
          <div id="gemini-wrapper">
            <button id="gemini-float-btn" title="Abrir Assistente">✨</button>
            <div id="gemini-modal">
              
              <div class="gemini-header" id="gemini-drag-handle">
                <h3>✨ Assistente IA <span style="font-size:10px; opacity:0.6; font-weight:400; margin-left:6px;">v22.0</span></h3>
                <div class="gh-actions">
                   <span id="logged-in-tools" style="display:none; gap:4px; align-items:center;">
                       <button id="btn-head-history" class="icon-btn" title="Histórico">🕒</button>
                       <button id="btn-head-config" class="icon-btn" title="Configurações">⚙️</button>
                       <div style="width:1px; height:16px; background:var(--ia-border); margin:0 4px;"></div>
                   </span>
                   
                   <button id="btn-theme" class="icon-btn" title="Mudar Tema">🌗</button>
                   <button id="btn-close" class="icon-btn" title="Fechar">✖</button>
                </div>
              </div>

              <div id="ia-nav-tabs" class="nav-tabs" style="display:none;">
                  <div class="nav-tab active" data-target="report">📝 Relatório</div>
                  <div class="nav-tab" data-target="chat">💬 Chat</div>
              </div>

              <div id="screen-login" class="screen active">
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:center;">
                    <div style="font-size: 42px; margin-bottom: 15px;">🔒</div>
                    <h4 style="margin: 0 0 5px 0;">Acesso Restrito</h4>
                    <p style="font-size:12px; color:var(--ia-text-muted); margin-bottom:20px;">Faça login para desbloquear o assistente.</p>
                    
                    <div style="text-align:left;">
                        <span class="gemini-label">Seu Nome:</span>
                        <input type="text" id="input-setup-name" class="gemini-input" placeholder="Ex: Josias">
                        <span class="gemini-label">Chave API:</span>
                        <input type="password" id="input-setup-key" class="gemini-input" placeholder="Cole a chave aqui...">
                    </div>

                    <button id="btn-login" class="gemini-btn btn-primary">Desbloquear e Entrar</button>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" style="margin-top:15px; font-size:11px; color:var(--ia-primary); text-decoration:none;">Obter chave gratuita</a>
                </div>
              </div>

              <div id="screen-report" class="screen">
                <span class="gemini-label">Texto do Protocolo / Conversa</span>
                <textarea id="input-report" class="gemini-input" style="min-height:100px;" placeholder="Cole o protocolo ou conversa aqui..." spellcheck="false"></textarea>
                
                <div style="display:flex; gap:8px;">
                    <button id="btn-gen-report" class="gemini-btn btn-primary">⚡ Gerar Relatório</button>
                    <button id="btn-clear-report" class="gemini-btn btn-outline" style="width:50px;" title="Limpar">🗑️</button>
                </div>

                <div id="gemini-result"></div>
                
                <div id="result-actions" style="display:none; margin-top:10px;">
                    <button id="btn-copy-result" class="gemini-btn btn-success">📋 Copiar Relatório</button>
                </div>
              </div>

              <div id="screen-history" class="screen">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                      <h4 style="margin:0;">Últimos Relatórios</h4>
                      <button id="btn-wipe-history" style="background:none; border:none; color:var(--ia-danger); font-size:11px; cursor:pointer;">Limpar Tudo</button>
                  </div>
                  <div id="history-list"></div>
                  <button id="btn-back-report-h" class="gemini-btn btn-outline" style="margin-top:auto;">Voltar</button>
              </div>

              <div id="screen-chat" class="screen">
                 <div id="chat-container" style="flex:1; overflow-y:auto; display:flex; flex-direction:column;">
                    <div class="chat-bubble chat-ai">Olá <b id="chat-user-name"></b>! Como posso ajudar hoje?</div>
                 </div>
                 <div style="display:flex; gap:8px; margin-top:10px; border-top:1px solid var(--ia-border); padding-top:10px;">
                    <input type="text" id="input-chat" class="gemini-input" style="margin:0; border-radius:20px;" placeholder="Escreva...">
                    <button id="btn-send-chat" class="gemini-btn btn-primary" style="width:40px; margin:0; border-radius:50%;">➤</button>
                 </div>
                 <button id="btn-clear-chat" style="background:none; border:none; color:var(--ia-text-muted); font-size:11px; cursor:pointer; align-self:flex-end; margin-top:5px;">Limpar Chat</button>
              </div>

              <div id="screen-config" class="screen">
                  <h4 style="margin-top:0;">Configurações</h4>
                  <span class="gemini-label">Nome:</span>
                  <input type="text" id="cfg-name" class="gemini-input">
                  <span class="gemini-label">API Key:</span>
                  <input type="password" id="cfg-key" class="gemini-input">
                  <button id="btn-save-cfg" class="gemini-btn btn-primary">Salvar Alterações</button>
                  
                  <div style="margin-top:auto; border-top:1px dashed var(--ia-border); padding-top:15px;">
                      <button id="btn-back-report-c" class="gemini-btn btn-outline" style="margin-bottom:10px;">Voltar</button>
                      <button id="btn-logout" class="gemini-btn btn-danger">Sair e Bloquear</button>
                  </div>
              </div>

            </div>
          </div>
        `;

        const container = document.createElement('div'); container.innerHTML = widgetHTML; document.body.appendChild(container);

        // --- 4. REFERÊNCIAS ---
        const getEl = (id) => document.getElementById(id);
        const modal = getEl('gemini-modal');
        const wrapper = getEl('gemini-wrapper');
        
        // --- 5. LÓGICA API ---
        async function findBestFreeModel(apiKey) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                const data = await response.json();
                if (data.models) {
                    const all = data.models.map(m => m.name.replace("models/", ""));
                    let best = all.find(m => m === "gemini-1.5-flash-8b");
                    if (!best) best = all.find(m => m === "gemini-1.5-flash");
                    if (!best) best = all.find(m => m.includes("flash"));
                    return best || "gemini-1.5-flash";
                }
            } catch (e) {} 
            return "gemini-1.5-flash";
        }

        async function generateText(prompt) {
             let model = currentModel;
             const url = (m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${userApiKey}`;
             const body = { contents: [{ parts: [{ text: prompt }] }] };

             try {
                let response = await fetch(url(model), {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
                });
                let data = await response.json();

                if (data.error) {
                    model = await findBestFreeModel(userApiKey);
                    response = await fetch(url(model), {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
                    });
                    data = await response.json();
                }

                if (data.error) throw new Error(data.error.message);
                return data.candidates[0].content.parts[0].text;

             } catch(e) { throw e; }
        }

        function formatMarkdown(text) {
            if(!text) return '';
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1); padding:2px; border-radius:3px;">$1</code>');
        }

        // --- CONTROLE DE ESTADO (LOGIN/LOGOUT) ---
        function loadState() {
            store.get(['geminiKey', 'agentName', 'IA_THEME'], (res) => {
                
                // TEMA
                if(res.IA_THEME === 'light') {
                    wrapper.classList.add('light-mode');
                    getEl('btn-theme').innerText = '☀️';
                }

                // VERIFICA SE ESTÁ LOGADO
                if (res.geminiKey) {
                    // LOGADO: Desbloqueia tudo
                    userApiKey = res.geminiKey;
                    agentName = res.agentName || "Atendente";
                    
                    // Preenche campos
                    getEl('cfg-key').value = userApiKey;
                    getEl('cfg-name').value = agentName;
                    getEl('input-setup-name').value = agentName;
                    getEl('chat-user-name').innerText = agentName;
                    
                    // Mostra UI Restrita
                    getEl('logged-in-tools').style.display = 'flex'; // Ícones Header
                    getEl('ia-nav-tabs').style.display = 'flex';     // Abas
                    
                    // Vai para relatório
                    switchScreen('report');
                } else {
                    // NÃO LOGADO: Bloqueia tudo
                    getEl('logged-in-tools').style.display = 'none'; // Esconde ícones
                    getEl('ia-nav-tabs').style.display = 'none';     // Esconde abas
                    
                    // Vai para login
                    switchScreen('login');
                }
            });
        }

        function switchScreen(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            
            getEl('screen-' + id).classList.add('active');
            
            // Ativa aba visualmente apenas se for Report ou Chat
            const tab = document.querySelector(`.nav-tab[data-target="${id}"]`);
            if(tab) tab.classList.add('active');

            if(id === 'history') renderHistory();
        }

        // --- HISTÓRICO ---
        function saveToHistory(text) {
            store.get(['geminiHistory'], (res) => {
                let hist = res.geminiHistory || [];
                hist.unshift({ id: Date.now(), date: new Date().toLocaleString(), text: text });
                if(hist.length > 20) hist = hist.slice(0, 20);
                store.set({geminiHistory: hist});
            });
        }

        function renderHistory() {
            const list = getEl('history-list');
            store.get(['geminiHistory'], (res) => {
                const hist = res.geminiHistory || [];
                list.innerHTML = hist.length ? '' : '<p style="text-align:center; color:var(--ia-text-muted); margin-top:20px;">Nenhum histórico.</p>';
                hist.forEach(item => {
                    const div = document.createElement('div'); div.className = 'history-item';
                    div.innerHTML = `
                        <div class="history-meta"><span>${item.date}</span></div>
                        <div class="history-preview">${item.text}</div>
                        <div class="h-actions">
                             <button class="h-btn btn-primary h-copy" data-text="${encodeURIComponent(item.text)}">Copiar</button>
                             <button class="h-btn btn-danger h-del" data-id="${item.id}">🗑️</button>
                        </div>
                    `;
                    list.appendChild(div);
                });
                list.querySelectorAll('.h-copy').forEach(b => b.onclick = (e) => {
                    navigator.clipboard.writeText(decodeURIComponent(e.target.dataset.text));
                    e.target.innerText = "OK!"; setTimeout(()=>e.target.innerText="Copiar", 1500);
                });
                list.querySelectorAll('.h-del').forEach(b => b.onclick = (e) => {
                    const id = parseInt(e.target.dataset.id);
                    store.get(['geminiHistory'], r => {
                        store.set({geminiHistory: (r.geminiHistory||[]).filter(i=>i.id!==id)}, renderHistory);
                    });
                });
            });
        }

        // --- EVENTOS ---
        
        // Header
        getEl('btn-head-history').onclick = () => switchScreen('history');
        getEl('btn-head-config').onclick = () => switchScreen('config');
        getEl('btn-theme').onclick = () => {
             wrapper.classList.toggle('light-mode');
             store.set({IA_THEME: wrapper.classList.contains('light-mode')?'light':'dark'});
             getEl('btn-theme').innerText = wrapper.classList.contains('light-mode')?'☀️':'🌗';
        };
        getEl('btn-close').onclick = () => modal.style.display = 'none';
        getEl('gemini-float-btn').onclick = () => { modal.style.display = modal.style.display==='flex'?'none':'flex'; loadState(); };

        // Abas
        document.querySelectorAll('.nav-tab').forEach(t => t.onclick = () => switchScreen(t.dataset.target));

        // Login / Logout / Config
        getEl('btn-login').onclick = () => {
            const k = getEl('input-setup-key').value.trim();
            const n = getEl('input-setup-name').value.trim();
            if(k.length < 10) return alert("Chave inválida.");
            store.set({geminiKey: k, agentName: n || "Atendente"}, loadState);
        };
        getEl('btn-logout').onclick = () => { if(confirm("Sair e Bloquear?")) store.remove(['geminiKey','agentName'], () => { userApiKey=''; loadState(); }); };
        getEl('btn-save-cfg').onclick = () => {
            store.set({geminiKey: getEl('cfg-key').value, agentName: getEl('cfg-name').value}, ()=>alert("Salvo!"));
        };
        getEl('btn-back-report-h').onclick = () => switchScreen('report');
        getEl('btn-back-report-c').onclick = () => switchScreen('report');

        // Relatório
        getEl('btn-gen-report').onclick = async () => {
            const txt = getEl('input-report').value.trim();
            if(!txt) return alert("Insira o texto.");
            
            const btn = getEl('btn-gen-report');
            const resDiv = getEl('gemini-result');
            const actions = getEl('result-actions');
            
            btn.innerHTML = "⏳ A gerar..."; btn.disabled = true;
            resDiv.style.display = 'none'; actions.style.display = 'none';

            const prompt = `
            Aja como o atendente ${agentName}.
            Gere um relatório técnico em PRIMEIRA PESSOA.
            REGRAS DE PRIVACIDADE:
            1. NÃO mencione horários exatos nem datas.
            2. Cite APENAS Nome e Telefone.
            3. Se houver CPF/Endereço, diga apenas "Realizei a confirmação de dados".
            4. Destaque em **NEGRITO**: Nome, Telefone e Protocolo.
            ESTRUTURA:
            1. Introdução: "Eu, ${agentName}, atendi [Nome]..."
            2. Relato do problema.
            3. Procedimentos feitos.
            4. Conclusão.
            Texto base:
            ${txt}`;

            try {
                const raw = await generateText(prompt);
                resDiv.innerHTML = formatMarkdown(raw);
                resDiv.style.display = 'block';
                actions.style.display = 'flex'; 
                actions.style.flexDirection = 'column';
                saveToHistory(raw); 
            } catch (e) {
                resDiv.innerText = "Erro: " + e.message;
                resDiv.style.display = 'block';
            } finally {
                btn.innerHTML = "⚡ Gerar Relatório"; btn.disabled = false;
            }
        };

        getEl('btn-copy-result').onclick = () => {
            navigator.clipboard.writeText(getEl('gemini-result').innerText);
            const b = getEl('btn-copy-result');
            b.innerText = "Copiado! ✅"; setTimeout(()=>b.innerText="📋 Copiar Relatório", 2000);
        };
        getEl('btn-clear-report').onclick = () => {
            getEl('input-report').value = '';
            getEl('gemini-result').innerHTML = '';
            getEl('gemini-result').style.display = 'none';
            getEl('result-actions').style.display = 'none';
        };
        getEl('btn-wipe-history').onclick = () => { if(confirm("Apagar tudo?")) store.set({geminiHistory:[]}, renderHistory); };

        // Chat
        const sendChat = async () => {
            const inp = getEl('input-chat');
            const txt = inp.value.trim();
            if(!txt) return;
            
            const c = getEl('chat-container');
            c.innerHTML += `<div class="chat-bubble chat-user">${formatMarkdown(txt)}</div>`;
            inp.value = ''; c.scrollTop = c.scrollHeight;

            const tempId = "tmp-" + Date.now();
            c.innerHTML += `<div id="${tempId}" class="chat-bubble chat-ai">...</div>`;
            c.scrollTop = c.scrollHeight;

            try {
                const context = chatHistoryContext.slice(-6).map(m => `user: ${m.user}\nmodel: ${m.ai}`).join("\n");
                const prompt = `Aja como assistente ${agentName}. Histórico:\n${context}\nUsuário: ${txt}`;
                const ans = await generateText(prompt);
                document.getElementById(tempId).innerHTML = formatMarkdown(ans);
                chatHistoryContext.push({ user: txt, ai: ans });
            } catch(e) { document.getElementById(tempId).innerText = "Erro."; }
        };
        getEl('btn-send-chat').onclick = sendChat;
        getEl('input-chat').onkeypress = (e) => { if(e.key==='Enter') sendChat(); };
        getEl('btn-clear-chat').onclick = () => { getEl('chat-container').innerHTML = ''; chatHistoryContext = []; };

        // Drag
        const handle = getEl('gemini-drag-handle');
        let isDrag=false, startX, startY;
        handle.onmousedown = (e) => { if(e.target.closest('button'))return; isDrag=true; startX=e.clientX; startY=e.clientY; modal.style.transform='none'; modal.style.left=modal.getBoundingClientRect().left+'px'; modal.style.top=modal.getBoundingClientRect().top+'px'; };
        document.onmousemove = (e) => { if(isDrag) { modal.style.left=(parseFloat(modal.style.left)+e.clientX-startX)+'px'; modal.style.top=(parseFloat(modal.style.top)+e.clientY-startY)+'px'; startX=e.clientX; startY=e.clientY; } };
        document.onmouseup = () => isDrag=false;

        loadState();
    }
})();
