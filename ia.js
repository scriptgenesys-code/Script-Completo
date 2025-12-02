// ==UserScript==
// @name         PureCloud - Assistente IA (v15.7 - Hybrid Force)
// @description  Salva em todos os storages possíveis simultaneamente.
// @author       Parceiro de Programacao
// ==/UserScript==

(function() {
    'use strict';

    // --- INICIALIZAÇÃO FORÇADA ---
    // Não esperamos permissão. Iniciamos e pronto.
    setTimeout(initIA, 500);

    // --- STORAGE HÍBRIDO (DUPLA GRAVAÇÃO) ---
    const HybridStorage = {
        save: (key, value) => {
            // 1. Salva no LocalStorage (Síncrono e Garantido)
            try { localStorage.setItem(key, value); } catch(e) { console.error("LS Error", e); }
            
            // 2. Salva no Chrome Storage (Se disponível)
            try { 
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({ [key]: value }, () => {
                        if (chrome.runtime.lastError) console.warn("Chrome Storage Error:", chrome.runtime.lastError);
                    });
                }
            } catch(e) {}
        },

        load: (key, callback) => {
            // 1. Tenta LocalStorage Primeiro (Mais rápido)
            let val = localStorage.getItem(key);
            if (val) {
                callback(val);
                return;
            }

            // 2. Se não tiver, tenta Chrome Storage
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get([key], (result) => {
                        callback(result[key] || null);
                    });
                } else {
                    callback(null);
                }
            } catch(e) {
                callback(null);
            }
        },

        clear: (key) => {
            localStorage.removeItem(key);
            try { chrome.storage.local.remove([key]); } catch(e){}
        }
    };

    function initIA() {
        if (document.getElementById('gemini-wrapper')) return; // Evita duplicatas
        console.log("[IA] Iniciando v15.7...");
        
        let currentModel = "gemini-1.5-flash"; 
        let userApiKey = '';
        let chatHistoryContext = []; 

        const css = `#gemini-wrapper{--ia-bg:#0f172a;--ia-card:#1e293b;--ia-text:#f8fafc;--ia-primary:#3b82f6;--ia-border:#334155;font-family:'Segoe UI',sans-serif;box-sizing:border-box;color-scheme:dark}#gemini-wrapper.light-mode{--ia-bg:#ffffff;--ia-card:#f8fafc;--ia-text:#334155;--ia-primary:#2563eb;--ia-border:#e2e8f0;color-scheme:light}#gemini-float-btn{position:fixed;bottom:85px;right:25px;width:50px;height:50px;background:linear-gradient(135deg,var(--ia-primary),#2563eb);color:#fff;border-radius:50%;border:none;box-shadow:0 4px 15px rgba(0,0,0,0.3);cursor:pointer;font-size:24px;z-index:2147483646;display:flex;align-items:center;justify-content:center;transition:transform .2s}#gemini-float-btn:hover{transform:scale(1.1)}#gemini-modal{display:none;position:fixed;z-index:2147483647;width:400px;height:600px;left:20%;top:20%;background:var(--ia-bg);color:var(--ia-text);border-radius:12px;border:1px solid var(--ia-border);flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,0.5);resize:both;overflow:hidden}.gemini-header{padding:12px;background:var(--ia-card);border-bottom:1px solid var(--ia-border);display:flex;justify-content:space-between;align-items:center;cursor:move}.gemini-header h3{margin:0;font-size:14px;font-weight:700}.screen{padding:15px;display:none;flex-direction:column;flex:1;overflow-y:auto}.screen.active{display:flex}.gemini-input{width:100%;padding:10px;border-radius:6px;border:1px solid var(--ia-border);background:var(--ia-bg);color:var(--ia-text);margin-bottom:10px;font-family:inherit;resize:none}.gemini-btn{padding:10px;border-radius:6px;border:none;cursor:pointer;font-weight:600;width:100%;margin-top:5px;display:flex;justify-content:center;gap:5px}.btn-primary{background:var(--ia-primary);color:#fff}.btn-danger{background:#ef4444;color:#fff}#gemini-result{margin-top:15px;padding:10px;background:var(--ia-card);border-radius:6px;border-left:3px solid var(--ia-primary);font-size:13px;line-height:1.5;white-space:pre-wrap;display:none}.chat-bubble{max-width:85%;padding:8px 12px;border-radius:12px;font-size:13px;margin-bottom:8px}.chat-user{align-self:flex-end;background:var(--ia-primary);color:#fff}.chat-ai{align-self:flex-start;background:var(--ia-card);border:1px solid var(--ia-border)}.nav-tabs{display:flex;background:var(--ia-card);border-bottom:1px solid var(--ia-border)}.nav-tab{flex:1;padding:10px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;opacity:.7}.nav-tab.active{opacity:1;border-bottom:2px solid var(--ia-primary);color:var(--ia-primary)}.icon-btn{background:0 0;border:none;cursor:pointer;font-size:16px;color:var(--ia-text);opacity:.6}.icon-btn:hover{opacity:1}`;
        const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

        const widgetHTML = `
          <div id="gemini-wrapper">
            <button id="gemini-float-btn">🧑‍💻</button>
            <div id="gemini-modal">
              <div class="gemini-header" id="gemini-drag-handle">
                <h3>Assistente IA</h3>
                <div>
                   <button id="btn-theme-toggle" class="icon-btn">🌗</button>
                   <button id="btn-close-modal" class="icon-btn">✖</button>
                </div>
              </div>
              <div id="ia-nav-tabs" class="nav-tabs" style="display:none;">
                  <div class="nav-tab active" data-target="report">Relatório</div>
                  <div class="nav-tab" data-target="chat">Chat</div>
              </div>

              <div id="screen-login" class="screen active">
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:center;">
                    <h4 style="margin:0 0 10px 0;">Autenticação</h4>
                    <p style="font-size:12px; opacity:0.7; margin-bottom:15px;">Insira a SUA chave API do Google Gemini.</p>
                    <input type="password" id="input-api-key" class="gemini-input" placeholder="Cole a chave aqui...">
                    <button id="btn-save-key" class="gemini-btn btn-primary">Entrar</button>
                    <p id="login-error-msg" style="color:#ef4444; font-size:12px; margin-top:10px; display:none;"></p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" style="margin-top:15px; font-size:11px; color:var(--ia-primary);">Gerar Chave Gratuita</a>
                </div>
              </div>

              <div id="screen-report" class="screen">
                <textarea id="report-input" class="gemini-input" style="min-height:100px;" placeholder="Cole o protocolo ou conversa..."></textarea>
                <div style="display:flex; gap:5px;">
                    <button id="btn-summarize" class="gemini-btn btn-primary">⚡ Gerar Relatório</button>
                    <button id="btn-reset-report" class="gemini-btn" style="width:auto; background:var(--ia-card);">🔄</button>
                </div>
                <div id="gemini-result"></div>
                <button id="btn-copy" class="gemini-btn" style="background:#10b981; color:#fff; display:none; margin-top:10px;">📋 Copiar</button>
                <div style="margin-top:auto; padding-top:10px; text-align:right;">
                   <button id="btn-logout" class="icon-btn" style="font-size:12px; color:#ef4444;">Sair / Trocar Chave</button>
                </div>
              </div>

              <div id="screen-chat" class="screen">
                 <div id="simple-chat-container" style="flex:1; overflow-y:auto; display:flex; flex-direction:column;">
                    <div class="chat-bubble chat-ai">Olá! Como posso ajudar?</div>
                 </div>
                 <div style="display:flex; gap:5px; margin-top:10px;">
                    <input type="text" id="simple-input" class="gemini-input" style="margin-bottom:0;" placeholder="Escreva...">
                    <button id="btn-send-simple" class="gemini-btn btn-primary" style="width:auto;">➤</button>
                 </div>
              </div>
            </div>
          </div>
        `;
        const container = document.createElement('div'); container.innerHTML = widgetHTML; document.body.appendChild(container);

        // --- REFERÊNCIAS ---
        const wrapper = document.getElementById('gemini-wrapper');
        const modal = document.getElementById('gemini-modal');
        const floatBtn = document.getElementById('gemini-float-btn');
        const closeBtn = document.getElementById('btn-close-modal');
        const inputKey = document.getElementById('input-api-key');
        const resultDiv = document.getElementById('gemini-result');
        const chatContainer = document.getElementById('simple-chat-container');
        
        // --- FUNÇÕES DE LOGIN ---
        
        function forceShowApp(key) {
            userApiKey = key;
            document.getElementById('screen-login').classList.remove('active');
            document.getElementById('screen-report').classList.add('active');
            document.getElementById('ia-nav-tabs').style.display = 'flex';
        }

        function checkLogin() {
            HybridStorage.load('geminiKey', (val) => {
                if (val && val.length > 10) {
                    forceShowApp(val);
                }
            });
        }
        
        document.getElementById('btn-save-key').onclick = () => {
            const k = inputKey.value.trim();
            const btn = document.getElementById('btn-save-key');
            
            if(k.length < 10) {
                alert("Chave inválida."); return;
            }

            btn.innerText = "Salvando...";
            btn.disabled = true;

            // Salva nos DOIS lugares e força entrada
            HybridStorage.save('geminiKey', k);
            
            setTimeout(() => {
                console.log("[IA] Entrada Forçada.");
                forceShowApp(k);
                btn.innerText = "Entrar";
                btn.disabled = false;
            }, 100); // Apenas 100ms de delay visual
        };

        document.getElementById('btn-logout').onclick = () => {
            if(confirm("Sair?")) {
                HybridStorage.clear('geminiKey');
                userApiKey = '';
                location.reload();
            }
        };

        // --- API GEMINI (MODELO CORRIGIDO) ---
        async function callGemini(prompt) {
            // Tenta múltiplos modelos se um falhar
            const models = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
            
            for (let model of models) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                    });
                    const json = await response.json();
                    
                    if (json.error) {
                        console.warn(`[IA] Modelo ${model} falhou:`, json.error.message);
                        continue; // Tenta o próximo modelo
                    }
                    
                    return json.candidates[0].content.parts[0].text;
                } catch(e) { console.error(e); }
            }
            return "Erro: Chave inválida ou nenhum modelo disponível.";
        }

        // --- RELATÓRIO ---
        document.getElementById('btn-summarize').onclick = async () => {
            const text = document.getElementById('report-input').value;
            if(!text) return;
            const btn = document.getElementById('btn-summarize');
            btn.disabled = true; btn.innerText = "Gerando...";
            
            const agentName = document.querySelector('.user-info-name')?.innerText || "Atendente";
            const prompt = `Aja como o suporte técnico ${agentName}. Crie um resumo narrativo em primeira pessoa:\n1. Problema\n2. Ação\n3. Conclusão.\nTexto: ${text}`;
            
            const reply = await callGemini(prompt);
            resultDiv.innerText = reply;
            resultDiv.style.display = 'block';
            document.getElementById('btn-copy').style.display = 'block';
            btn.disabled = false; btn.innerText = "⚡ Gerar Relatório";
        };

        document.getElementById('btn-copy').onclick = () => {
            navigator.clipboard.writeText(resultDiv.innerText);
            const b = document.getElementById('btn-copy');
            const old = b.innerText; b.innerText = "Copiado!";
            setTimeout(()=>b.innerText=old, 1000);
        };

        document.getElementById('btn-reset-report').onclick = () => {
            document.getElementById('report-input').value = '';
            resultDiv.style.display = 'none';
            resultDiv.innerText = '';
            document.getElementById('btn-copy').style.display = 'none';
        };

        // --- CHAT ---
        async function sendChat() {
            const inp = document.getElementById('simple-input');
            const txt = inp.value.trim();
            if(!txt) return;
            chatContainer.innerHTML += `<div class="chat-bubble chat-user">${txt}</div>`;
            inp.value = '';
            const loading = document.createElement('div'); loading.className = 'chat-bubble chat-ai'; loading.innerText = '...';
            chatContainer.appendChild(loading);
            
            const context = chatHistoryContext.slice(-4).map(m => `U: ${m.u}\nA: ${m.a}`).join('\n');
            const reply = await callGemini(`Histórico:\n${context}\nUsuário: ${txt}`);
            loading.innerText = reply;
            chatHistoryContext.push({u: txt, a: reply});
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        document.getElementById('btn-send-simple').onclick = sendChat;
        document.getElementById('simple-input').onkeypress = (e) => { if(e.key==='Enter') sendChat(); };

        floatBtn.onclick = () => { modal.style.display = modal.style.display === 'none' ? 'flex' : 'none'; if(modal.style.display==='flex') checkLogin(); };
        closeBtn.onclick = () => modal.style.display = 'none';
        document.querySelectorAll('.nav-tab').forEach(t => t.onclick = () => {
            document.querySelectorAll('.nav-tab').forEach(x => x.classList.remove('active')); t.classList.add('active');
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            if(t.dataset.target === 'report') document.getElementById('screen-report').classList.add('active'); else document.getElementById('screen-chat').classList.add('active');
        });
        
        const handle = document.getElementById('gemini-drag-handle');
        let isDrag = false, dx, dy;
        handle.onmousedown = (e) => { if(!e.target.closest('button')) { isDrag = true; dx = e.clientX - modal.offsetLeft; dy = e.clientY - modal.offsetTop; } };
        document.onmousemove = (e) => { if(isDrag) { modal.style.left = (e.clientX - dx) + 'px'; modal.style.top = (e.clientY - dy) + 'px'; } };
        document.onmouseup = () => isDrag = false;

        checkLogin();
    }
})();
