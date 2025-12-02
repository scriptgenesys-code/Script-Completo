// ==UserScript==
// @name         PureCloud - Assistente IA (v15.8 - Universal Standalone)
// @description  Funciona independentemente (Console, Favorito ou Extensão).
// @author       Parceiro de Programacao
// ==/UserScript==

(function() {
    'use strict';

    console.log("[IA] Inicializando V15.8 (Modo Universal)...");

    // --- 1. SISTEMA DE ARMAZENAMENTO SIMPLIFICADO ---
    // Prioriza o localStorage (Navegador) que funciona sempre.
    const DB = {
        save: (key, value) => {
            localStorage.setItem(key, value);
            // Tenta sincronizar com a extensão se possível, mas sem depender disso
            try { if(window.chrome && chrome.storage) chrome.storage.local.set({[key]: value}); } catch(e){}
        },
        get: (key) => {
            return localStorage.getItem(key);
        },
        remove: (key) => {
            localStorage.removeItem(key);
            try { if(window.chrome && chrome.storage) chrome.storage.local.remove([key]); } catch(e){}
        }
    };

    // --- 2. INICIALIZAÇÃO ---
    function initIA() {
        // Evita criar duplicado se já estiver na tela
        if (document.getElementById('gemini-wrapper')) return;

        // Tenta recuperar a chave
        let userApiKey = DB.get('geminiKey') || '';
        let chatHistory = [];

        // ESTILOS CSS
        const css = `
            #gemini-wrapper { font-family: 'Segoe UI', sans-serif; color-scheme: dark; box-sizing: border-box; }
            #gemini-float-btn { position: fixed; bottom: 85px; right: 25px; width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 50%; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.3); cursor: pointer; font-size: 24px; z-index: 2147483647; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
            #gemini-float-btn:hover { transform: scale(1.1); }
            #gemini-modal { display: none; position: fixed; z-index: 2147483647; width: 400px; height: 600px; top: 20%; left: 20%; background: #0f172a; border: 1px solid #334155; border-radius: 12px; flex-direction: column; box-shadow: 0 10px 50px rgba(0,0,0,0.5); }
            .gm-header { padding: 15px; background: #1e293b; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; cursor: move; border-radius: 12px 12px 0 0; }
            .gm-header h3 { margin: 0; color: #f8fafc; font-size: 14px; }
            .gm-close { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; }
            .gm-body { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; }
            .gm-input { width: 100%; background: #1e293b; border: 1px solid #334155; color: white; padding: 10px; border-radius: 6px; margin-bottom: 10px; box-sizing: border-box; font-family: inherit; }
            .gm-btn { width: 100%; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 10px; }
            .gm-btn:hover { background: #2563eb; }
            .gm-btn.secondary { background: #334155; }
            .gm-result { background: #1e293b; padding: 10px; border-radius: 6px; border-left: 3px solid #3b82f6; color: #e2e8f0; font-size: 13px; line-height: 1.5; margin-top: 10px; white-space: pre-wrap; display: none; }
            .gm-tabs { display: flex; border-bottom: 1px solid #334155; background: #1e293b; }
            .gm-tab { flex: 1; padding: 10px; text-align: center; color: #94a3b8; cursor: pointer; font-size: 12px; font-weight: 600; }
            .gm-tab.active { color: #3b82f6; border-bottom: 2px solid #3b82f6; }
            .gm-screen { display: none; flex-direction: column; flex: 1; }
            .gm-screen.active { display: flex; }
            .chat-msg { padding: 8px 12px; border-radius: 10px; margin-bottom: 8px; font-size: 13px; max-width: 85%; }
            .msg-user { background: #3b82f6; color: white; align-self: flex-end; }
            .msg-ai { background: #1e293b; color: #e2e8f0; align-self: flex-start; border: 1px solid #334155; }
            .login-container { text-align: center; padding-top: 40px; }
            .login-container h4 { color: white; margin-bottom: 10px; }
        `;
        const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

        // INTERFACE HTML
        const html = `
            <div id="gemini-wrapper">
                <button id="gemini-float-btn">🤖</button>
                <div id="gemini-modal">
                    <div class="gm-header" id="gm-drag">
                        <h3>Assistente IA (v15.8)</h3>
                        <button class="gm-close" id="gm-close">✖</button>
                    </div>
                    
                    <div class="gm-tabs" id="gm-tabs" style="display:none;">
                        <div class="gm-tab active" data-target="report">Relatório</div>
                        <div class="gm-tab" data-target="chat">Chat</div>
                    </div>

                    <div class="gm-body">
                        
                        <div id="view-login" class="gm-screen active">
                            <div class="login-container">
                                <h4>Autenticação</h4>
                                <p style="color:#94a3b8; font-size:12px; margin-bottom:15px;">Insira sua Chave API do Google Gemini.</p>
                                <input type="password" id="gm-key-input" class="gm-input" placeholder="Cole a chave aqui...">
                                <button id="gm-login-btn" class="gm-btn">Entrar</button>
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#3b82f6; font-size:11px;">Obter Chave Grátis</a>
                            </div>
                        </div>

                        <div id="view-report" class="gm-screen">
                            <textarea id="gm-report-input" class="gm-input" rows="5" placeholder="Cole o texto aqui..."></textarea>
                            <button id="gm-report-btn" class="gm-btn">⚡ Gerar Relatório</button>
                            <div id="gm-report-result" class="gm-result"></div>
                            <button id="gm-copy-btn" class="gm-btn secondary" style="display:none; margin-top:10px;">📋 Copiar</button>
                            <button id="gm-logout-btn" style="background:none; border:none; color:#ef4444; font-size:11px; margin-top:auto; cursor:pointer;">Sair</button>
                        </div>

                        <div id="view-chat" class="gm-screen">
                            <div id="gm-chat-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; padding-bottom:10px;">
                                <div class="chat-msg msg-ai">Olá! Como ajudo?</div>
                            </div>
                            <div style="display:flex; gap:5px;">
                                <input type="text" id="gm-chat-input" class="gm-input" style="margin:0;" placeholder="Escreva...">
                                <button id="gm-chat-send" class="gm-btn" style="width:auto; margin:0;">➤</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;
        const div = document.createElement('div'); div.innerHTML = html; document.body.appendChild(div);

        // --- REFERÊNCIAS ---
        const modal = document.getElementById('gemini-modal');
        const btnFloat = document.getElementById('gemini-float-btn');
        const btnClose = document.getElementById('gm-close');
        const viewLogin = document.getElementById('view-login');
        const viewReport = document.getElementById('view-report');
        const tabs = document.getElementById('gm-tabs');
        
        // --- LÓGICA DE INTERFACE ---
        function showApp() {
            viewLogin.classList.remove('active');
            viewReport.classList.add('active');
            tabs.style.display = 'flex';
        }

        // Se já tiver chave salva no navegador, entra direto
        if (userApiKey && userApiKey.length > 10) {
            showApp();
        }

        btnFloat.onclick = () => modal.style.display = (modal.style.display === 'flex' ? 'none' : 'flex');
        btnClose.onclick = () => modal.style.display = 'none';

        // Login
        document.getElementById('gm-login-btn').onclick = () => {
            const k = document.getElementById('gm-key-input').value.trim();
            if (k.length < 10) return alert("Chave inválida!");
            
            DB.save('geminiKey', k); // Salva
            userApiKey = k;
            showApp(); // Entra
        };

        document.getElementById('gm-logout-btn').onclick = () => {
            if(confirm("Sair?")) {
                DB.remove('geminiKey');
                location.reload();
            }
        };

        // Abas
        document.querySelectorAll('.gm-tab').forEach(t => {
            t.onclick = () => {
                document.querySelectorAll('.gm-tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                document.querySelectorAll('.gm-screen').forEach(s => s.classList.remove('active'));
                document.getElementById('view-' + t.dataset.target).classList.add('active');
            };
        });

        // Arrastar
        const handle = document.getElementById('gm-drag');
        let isDrag = false, startX, startY, initL, initT;
        handle.onmousedown = (e) => { isDrag=true; startX=e.clientX; startY=e.clientY; initL=modal.offsetLeft; initT=modal.offsetTop; };
        document.onmousemove = (e) => { if(isDrag) { modal.style.left=(initL + e.clientX - startX)+'px'; modal.style.top=(initT + e.clientY - startY)+'px'; }};
        document.onmouseup = () => isDrag=false;

        // --- LÓGICA DA API (ROBUSTA) ---
        async function callAPI(prompt) {
            // Lista de modelos para tentar (Fallback automático)
            // Se um falhar, o script tenta o próximo da lista
            const models = [
                "gemini-1.5-flash", 
                "gemini-1.5-pro", 
                "gemini-1.0-pro", 
                "gemini-pro"
            ];

            for (const model of models) {
                try {
                    // URL formatada corretamente
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`;
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                    });

                    const json = await response.json();

                    if (json.error) {
                        console.warn(`[IA] Falha com ${model}:`, json.error.message);
                        continue; // Tenta o próximo modelo
                    }

                    return json.candidates[0].content.parts[0].text;

                } catch (e) {
                    console.error(e);
                }
            }
            return "Erro: Não foi possível conectar. Verifique a Chave API ou sua internet.";
        }

        // --- AÇÕES ---
        document.getElementById('gm-report-btn').onclick = async function() {
            const txt = document.getElementById('gm-report-input').value;
            if(!txt) return;
            this.innerText = "Gerando..."; this.disabled = true;
            
            const agent = document.querySelector('.user-info-name')?.innerText || "Atendente";
            const prompt = `Aja como o suporte técnico ${agent}. Resuma este atendimento de forma narrativa:\n${txt}`;
            
            const res = await callAPI(prompt);
            const resDiv = document.getElementById('gm-report-result');
            resDiv.innerText = res;
            resDiv.style.display = 'block';
            document.getElementById('gm-copy-btn').style.display = 'block';
            
            this.innerText = "⚡ Gerar Relatório"; this.disabled = false;
        };

        document.getElementById('gm-copy-btn').onclick = function() {
            navigator.clipboard.writeText(document.getElementById('gm-report-result').innerText);
            this.innerText = "Copiado!";
            setTimeout(() => this.innerText = "📋 Copiar", 1000);
        };

        async function sendChat() {
            const inp = document.getElementById('gm-chat-input');
            const txt = inp.value.trim();
            if(!txt) return;
            
            const list = document.getElementById('gm-chat-list');
            list.innerHTML += `<div class="chat-msg msg-user">${txt}</div>`;
            inp.value = '';
            list.scrollTop = list.scrollHeight;

            const loading = document.createElement('div');
            loading.className = "chat-msg msg-ai";
            loading.innerText = "...";
            list.appendChild(loading);

            const context = chatHistory.slice(-6).map(m => `User: ${m.u}\nIA: ${m.a}`).join('\n');
            const prompt = `Histórico:\n${context}\nUsuário: ${txt}`;
            
            const reply = await callAPI(prompt);
            
            loading.innerText = reply;
            chatHistory.push({u: txt, a: reply});
            list.scrollTop = list.scrollHeight;
        }

        document.getElementById('gm-chat-send').onclick = sendChat;
        document.getElementById('gm-chat-input').onkeypress = (e) => { if(e.key==='Enter') sendChat(); };
    }

    // Inicia imediatamente
    initIA();

})();
