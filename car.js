// ==UserScript==
// @name         PureCloud - CAR (Automação Rápida v3.1)
// @description  Módulo de Automação Híbrido com Importador de Texto Restaurado.
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'car_data_v8_master';
    const THEME_KEY = 'car_theme_v8';

    // DETECTOR DE AMBIENTE
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

    // COMANDOS PADRÃO
    const defaultScripts = {
        "ex1": "Exemplo de texto expandido automaticamente.",
        "ajuda": "Digite o atalho e aperte ESPAÇO para expandir."
    };

    let scripts = {};
    let isDark = true;

    // --- ARMAZENAMENTO HÍBRIDO ---
    const Storage = {
        get: (callback) => {
            if (isExtension) {
                chrome.storage.local.get([STORAGE_KEY, THEME_KEY], (res) => {
                    callback({ scripts: res[STORAGE_KEY] || defaultScripts, theme: res[THEME_KEY] || 'dark' });
                });
            } else {
                const s = localStorage.getItem(STORAGE_KEY);
                const t = localStorage.getItem(THEME_KEY);
                callback({ scripts: s ? JSON.parse(s) : defaultScripts, theme: t || 'dark' });
            }
        },
        set: (data) => {
            if (isExtension) {
                let saveObj = {};
                if (data.scripts) saveObj[STORAGE_KEY] = data.scripts;
                if (data.theme) saveObj[THEME_KEY] = data.theme;
                chrome.storage.local.set(saveObj);
            } else {
                if (data.scripts) localStorage.setItem(STORAGE_KEY, JSON.stringify(data.scripts));
                if (data.theme) localStorage.setItem(THEME_KEY, data.theme);
            }
            if (data.scripts) scripts = data.scripts;
            if (data.theme) isDark = (data.theme === 'dark');
        }
    };

    function loadData() {
        Storage.get((data) => {
            scripts = data.scripts;
            isDark = (data.theme === 'dark');
            if (isExtension && !data.scripts) Storage.set({ scripts: defaultScripts });
        });
    }

    // --- CSS CORRIGIDO (Importador Fixo) ---
    const styles = `
        #car-panel {
            --bg-panel: #ffffff; --text-main: #1f2937; --text-sec: #6b7280;
            --bg-input: #f3f4f6; --border-input: #e5e7eb; --bg-item: #ffffff;
            --accent: #10b981; --accent-grad: linear-gradient(135deg, #10b981, #3b82f6);
            --box-bg: #eff6ff; --box-border: #bfdbfe; --box-text: #1e40af;
            
            font-family: 'Segoe UI', sans-serif; position: fixed; bottom: 100px; right: 90px;
            width: 360px; height: 650px; background: var(--bg-panel); border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); display: none; flex-direction: column;
            z-index: 2147483648; border: 1px solid rgba(0,0,0,0.1); transition: opacity 0.2s;
        }
        #car-panel.dark-mode {
            --bg-panel: #1f2937; --text-main: #f9fafb; --text-sec: #9ca3af;
            --bg-input: #374151; --border-input: #4b5563; --bg-item: #111827;
            --box-bg: #1e293b; --box-border: #334155; --box-text: #93c5fd;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .car-header { background: var(--accent-grad); padding: 15px; color: white; display: flex; justify-content: space-between; align-items: center; cursor: move; border-radius: 15px 15px 0 0; flex-shrink: 0; }
        .car-title { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px; }
        .header-actions { display: flex; gap: 8px; }
        .btn-icon-header { background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; font-size: 14px; }
        .btn-icon-header:hover { background: rgba(255,255,255,0.4); transform: scale(1.1); }
        
        .car-body { flex: 1; display: flex; flex-direction: column; padding: 15px; gap: 10px; overflow: hidden; background: var(--bg-panel); border-radius: 0 0 15px 15px; }
        
        .info-box { display: none; background: var(--box-bg); border: 1px solid var(--box-border); color: var(--box-text); padding: 12px; border-radius: 8px; font-size: 12px; margin-bottom: 5px; animation: fadeIn 0.3s; flex-shrink: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

        .car-inputs { display: flex; gap: 8px; flex-shrink: 0; }
        .car-input { background: var(--bg-input); border: 1px solid var(--border-input); color: var(--text-main); padding: 10px; border-radius: 8px; font-size: 13px; outline: none; flex: 1; transition: 0.2s; }
        .car-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        .input-key { flex: 0 0 30%; font-weight: bold; }
        
        .btn-save { background: var(--accent-grad); border: none; color: white; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; transition: 0.2s; flex-shrink: 0; }
        .btn-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
        
        #car-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; margin-top: 5px; min-height: 100px; }
        .car-item { background: var(--bg-item); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 3px solid transparent; border: 1px solid var(--border-input); transition: 0.2s; }
        .car-item:hover { border-left-color: #10b981; transform: translateX(2px); }
        
        .item-content { overflow: hidden; display:flex; gap:10px; align-items:center; }
        .item-key { font-weight: 800; color: #10b981; display: block; font-size: 13px; min-width: 50px;}
        .item-val { color: var(--text-sec); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; max-width: 170px; }
        .item-actions button { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.6; transition: 0.2s; padding: 4px; }
        .item-actions button:hover { opacity: 1; transform: scale(1.2); background: rgba(0,0,0,0.05); border-radius: 4px; }

        /* IMPORTADOR (Restaurado e Fixo) */
        .import-section { 
            border-top: 1px solid var(--border-input); 
            padding-top: 10px; 
            margin-top: auto; /* Empurra para o fundo */
            flex-shrink: 0; 
        }
        .toggle-import { 
            font-size: 12px; color: var(--text-sec); text-align: center; cursor: pointer; 
            padding: 8px; border-radius: 6px; transition: 0.2s; background: var(--bg-input); 
            font-weight: 600; 
        }
        .toggle-import:hover { color: #10b981; background: var(--bg-item); border: 1px solid var(--border-input); }
        
        #import-area { display: none; flex-direction: column; gap: 8px; margin-top: 8px; }
        .area-bulk { 
            width: 100%; height: 100px; background: var(--bg-input); color: var(--text-main); 
            border: 1px solid var(--border-input); border-radius: 6px; padding: 8px; 
            font-size: 11px; resize: none; font-family: monospace;
        }
        .btn-settings-action { width: 100%; padding: 8px; margin-top: 5px; border-radius: 6px; border: 1px solid var(--box-border); background: var(--bg-item); cursor: pointer; color: var(--text-main); display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
        .btn-settings-action:hover { background: var(--box-bg); }

        #car-panel ::-webkit-scrollbar { width: 5px; }
        #car-panel ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
    `;

    function createUI() {
        if (window.self !== window.top || document.getElementById('car-panel')) return;

        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const container = document.createElement('div');
        container.id = 'car-panel';
        if(isDark) container.classList.add('dark-mode');

        container.innerHTML = `
            <div class="car-header">
                <div class="car-title"><span style="font-size:18px">💻</span> CAR Automação</div>
                <div class="header-actions">
                    <button id="car-theme-btn" class="btn-icon-header" title="Alternar Tema">🌓</button>
                    <button id="car-settings-btn" class="btn-icon-header" title="Backup e Restaurar">⚙️</button>
                    <button id="car-help-btn" class="btn-icon-header" title="Ajuda">?</button>
                    <button id="car-close-btn" class="btn-icon-header" title="Fechar">✖</button>
                </div>
            </div>
            <div class="car-body">
                
                <div id="car-settings-box" class="info-box">
                    <strong style="display:block; margin-bottom:5px; border-bottom:1px solid var(--box-border); padding-bottom:3px;">Gerenciar Backup</strong>
                    <button id="car-btn-export" class="btn-settings-action">⬇️ Exportar JSON</button>
                    <button id="car-btn-restore" class="btn-settings-action">⬆️ Importar JSON</button>
                    <input type="file" id="car-file-restore" style="display:none" accept=".json">
                </div>

                <div id="car-help-box" class="info-box">
                    <strong style="display:block; margin-bottom:5px; border-bottom:1px solid var(--box-border); padding-bottom:3px;">Como usar:</strong>
                    1. Digite o atalho no chat (ex: <b>ex1</b>)<br>
                    2. Aperte a tecla <b>ESPAÇO</b>.<br>
                    3. O texto será substituído magicamente! ✨
                </div>

                <div class="car-inputs">
                    <input id="car-new-key" class="car-input input-key" type="text" placeholder="Atalho">
                    <input id="car-new-val" class="car-input" type="text" placeholder="Texto da mensagem...">
                </div>
                <button id="car-btn-add" class="btn-save">💾 Salvar Comando</button>

                <div id="car-list"></div>

                <div class="import-section">
                    <div class="toggle-import" id="car-toggle-imp">📥 Importar Lista em Massa (Texto) ▼</div>
                    <div id="import-area">
                        <textarea id="car-bulk-text" class="area-bulk" placeholder="atalho texto da mensagem... (uma por linha)&#10;ex1 Olá Cliente&#10;ex2 Tudo bem?"></textarea>
                        <button id="car-btn-bulk" class="btn-save" style="font-size:12px; padding:6px;">Processar Lista</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Drag Logic
        const header = container.querySelector('.car-header');
        let isDragging = false, startX, startY, initialLeft, initialTop;
        header.onmousedown = (e) => {
            if (e.target.tagName === 'BUTTON') return;
            e.preventDefault(); isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = container.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            container.style.bottom = 'auto'; container.style.right = 'auto';
            container.style.left = initialLeft + 'px'; container.style.top = initialTop + 'px';
            document.onmousemove = (ev) => {
                if (!isDragging) return;
                container.style.left = (initialLeft + ev.clientX - startX) + 'px';
                container.style.top = (initialTop + ev.clientY - startY) + 'px';
            };
            document.onmouseup = () => { isDragging = false; document.onmousemove = null; };
        };

        setupEvents(container);
        updateVisualList();
    }

    function setupEvents(container) {
        const listContainer = container.querySelector('#car-list');
        const inpKey = container.querySelector('#car-new-key');
        const inpVal = container.querySelector('#car-new-val');
        const settingsBox = container.querySelector('#car-settings-box');
        const helpBox = container.querySelector('#car-help-box');
        const importArea = container.querySelector('#import-area');

        // Tema
        container.querySelector('#car-theme-btn').onclick = () => { 
            isDark = !isDark; 
            if(isDark) container.classList.add('dark-mode'); else container.classList.remove('dark-mode');
            Storage.set({ theme: isDark ? 'dark' : 'light' }); 
        };

        // Toggles
        container.querySelector('#car-help-btn').onclick = () => { 
            settingsBox.style.display = 'none'; 
            helpBox.style.display = (helpBox.style.display === 'block') ? 'none' : 'block'; 
        };
        container.querySelector('#car-settings-btn').onclick = () => { 
            helpBox.style.display = 'none'; 
            settingsBox.style.display = (settingsBox.style.display === 'block') ? 'none' : 'block'; 
        };
        container.querySelector('#car-close-btn').onclick = () => container.style.display = 'none';
        
        // --- LÓGICA DO IMPORTADOR EM MASSA ---
        container.querySelector('#car-toggle-imp').onclick = () => { 
            const isHidden = (importArea.style.display === 'none' || importArea.style.display === '');
            importArea.style.display = isHidden ? 'flex' : 'none';
            // Rola para baixo se abrir
            if(isHidden) {
                setTimeout(() => {
                    const body = container.querySelector('.car-body');
                    body.scrollTop = body.scrollHeight;
                }, 100);
            }
        };

        container.querySelector('#car-btn-bulk').onclick = () => {
            const text = container.querySelector('#car-bulk-text').value;
            if(!text.trim()) return alert("Cole a lista primeiro!");
            
            const lines = text.split('\n');
            let count = 0;
            
            lines.forEach(l => {
                l = l.trim(); 
                if (!l) return;
                
                // Tenta separar pelo separador '➡' ou pelo primeiro espaço
                let k = '', v = '';
                if(l.includes('➡')) {
                    const parts = l.split('➡');
                    k = parts[0].trim();
                    v = parts.slice(1).join('➡').trim();
                } else {
                    const firstSpace = l.indexOf(' ');
                    if (firstSpace > 0) { 
                        k = l.substring(0, firstSpace).trim(); 
                        v = l.substring(firstSpace).trim(); 
                    }
                }
                
                if (k && v) { 
                    scripts[k] = v; 
                    count++; 
                }
            });
            
            Storage.set({ scripts: scripts }); 
            updateVisualList(); 
            alert(`✅ ${count} comandos importados com sucesso!`);
            container.querySelector('#car-bulk-text').value = '';
            importArea.style.display = 'none'; // Fecha após importar
        };

        // Salvar Novo
        container.querySelector('#car-btn-add').onclick = () => {
            const k = inpKey.value.trim(); const v = inpVal.value.trim();
            if (k && v) { 
                scripts[k] = v; 
                Storage.set({ scripts: scripts }); 
                inpKey.value = ''; inpVal.value = ''; 
                updateVisualList(); 
            }
        };

        // Exportar JSON
        container.querySelector('#car-btn-export').onclick = () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scripts, null, 2));
            const a = document.createElement('a'); a.href = dataStr; a.download = "car_backup.json";
            document.body.appendChild(a); a.click(); a.remove();
        };

        // Importar JSON
        const fileInput = container.querySelector('#car-file-restore');
        container.querySelector('#car-btn-restore').onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    scripts = { ...scripts, ...imported }; 
                    Storage.set({ scripts: scripts }); 
                    updateVisualList();
                    alert('✅ Backup restaurado e mesclado!'); settingsBox.style.display = 'none';
                } catch (err) { alert('❌ Arquivo inválido.'); }
            };
            reader.readAsText(file); fileInput.value = '';
        };

        // Atualizar Lista Visual
        window.updateVisualList = () => {
            listContainer.innerHTML = '';
            const keys = Object.keys(scripts).sort();
            if (keys.length === 0) listContainer.innerHTML = '<div style="text-align:center; color:var(--text-sec); padding:20px;">Nenhum comando salvo.</div>';
            
            keys.forEach(key => {
                const item = document.createElement('div'); item.className = 'car-item';
                item.innerHTML = `
                    <div class="item-content"><span class="item-key">${key}</span><span class="item-val" title="${scripts[key]}">${scripts[key]}</span></div>
                    <div class="item-actions"><button class="btn-edit" title="Editar">✏️</button><button class="btn-del" title="Excluir">🗑️</button></div>
                `;
                item.querySelector('.btn-edit').onclick = () => { inpKey.value = key; inpVal.value = scripts[key]; inpVal.focus(); };
                item.querySelector('.btn-del').onclick = () => { 
                    if (confirm(`Apagar atalho "${key}"?`)) { 
                        delete scripts[key]; 
                        Storage.set({ scripts: scripts }); 
                        updateVisualList(); 
                    } 
                };
                listContainer.appendChild(item);
            });
        };
    }

    // --- MOTOR DE SUBSTITUIÇÃO ---
    function replaceText(element, trigger, fullText) {
        try {
            element.focus();
            for (let i = 0; i <= trigger.length; i++) document.execCommand('delete', false, null);
            document.execCommand('insertText', false, fullText);
        } catch (e) { console.error("[CAR] Erro ao substituir:", e); }
    }

    document.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) {
            const active = document.activeElement;
            if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) {
                Storage.get((data) => {
                    scripts = data.scripts;
                    let text = active.value || active.innerText || active.textContent;
                    if (!text) return;
                    text = text.replace(/[\u00a0\u200b]/g, ' '); 
                    const words = text.trimEnd().split(' ');
                    const lastWord = words[words.length - 1];
                    if (scripts[lastWord]) {
                        e.preventDefault(); e.stopPropagation();
                        replaceText(active, lastWord, scripts[lastWord]);
                    }
                });
            }
        }
    }, true);

    window.toggleCAR = function() {
        createUI();
        const p = document.getElementById('car-panel');
        if (p) {
            p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'flex' : 'none';
            if (p.style.display === 'flex') window.updateVisualList();
        }
    };

    loadData();
    console.log("[CAR v3.1] Módulo Híbrido Carregado.");
})();
