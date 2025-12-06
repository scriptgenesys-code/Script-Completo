// ==UserScript==
// @name         PureCloud - CAR (Automação Rápida)
// @description  Módulo de Automação de Texto e Atalhos (Backup & Importação).
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURAÇÕES ---
    const STORAGE_KEY = 'car_data_v6_backup';
    const THEME_KEY = 'car_theme_preference';

    // COMANDOS PADRÃO (Exemplos iniciais)
    const defaultScripts = {
        "teste1": "Olá! Este é um teste de backup do CAR.",
        "ajuda": "Digite o atalho e aperte ESPAÇO para expandir."
    };

    // --- GESTÃO DE DADOS ---
    let scripts = {};
    let isDark = false;

    // Inicialização de Dados (Compatível com Extensão e Bookmarklet)
    function loadData() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get([STORAGE_KEY, THEME_KEY], function(result) {
                    scripts = result[STORAGE_KEY] || defaultScripts;
                    if (!result[STORAGE_KEY]) saveData(defaultScripts);
                    isDark = (result[THEME_KEY] === 'dark');
                });
            } else {
                // Fallback para localStorage (Bookmarklet)
                const savedScripts = localStorage.getItem(STORAGE_KEY);
                scripts = savedScripts ? JSON.parse(savedScripts) : defaultScripts;
                isDark = localStorage.getItem(THEME_KEY) === 'dark';
            }
        } catch (e) {
            console.error("[CAR] Erro ao carregar dados:", e);
            scripts = defaultScripts;
        }
    }

    function saveData(newScripts) {
        scripts = newScripts;
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ [STORAGE_KEY]: newScripts });
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newScripts));
        }
    }

    function saveTheme(dark) {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ [THEME_KEY]: dark ? 'dark' : 'light' });
        } else {
            localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
        }
    }

    // --- CSS DO CAR ---
    const styles = `
        #car-panel {
            --bg-panel: rgba(255, 255, 255, 0.98); --text-main: #1f2937; --text-sec: #6b7280;
            --bg-input: #f3f4f6; --border-input: #e5e7eb; --bg-item: #ffffff;
            --accent: #3b82f6; --accent-grad: linear-gradient(135deg, #3b82f6, #8b5cf6);
            --box-bg: #eff6ff; --box-border: #bfdbfe; --box-text: #1e40af;
            
            font-family: 'Segoe UI', sans-serif; position: fixed; bottom: 100px; right: 30px;
            width: 360px; height: 650px; background: var(--bg-panel); border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: none; flex-direction: column;
            z-index: 2147483648; border: 1px solid rgba(0,0,0,0.1); transition: opacity 0.2s;
        }
        #car-panel.dark-mode {
            --bg-panel: rgba(30, 30, 30, 0.98); --text-main: #f9fafb; --text-sec: #9ca3af;
            --bg-input: #262626; --border-input: #404040; --bg-item: #2d2d2d;
            --box-bg: #1e293b; --box-border: #334155; --box-text: #93c5fd;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .car-header { background: var(--accent-grad); padding: 15px 20px; color: white; display: flex; justify-content: space-between; align-items: center; cursor: move; }
        .car-title { font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 8px; }
        .header-actions { display: flex; gap: 8px; }
        .btn-icon-header { background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .btn-icon-header:hover { background: rgba(255,255,255,0.4); transform: scale(1.1); }
        .car-body { flex: 1; display: flex; flex-direction: column; padding: 15px; gap: 10px; overflow: hidden; }
        .car-inputs { display: flex; gap: 10px; }
        .car-input { background: var(--bg-input); border: 1px solid var(--border-input); color: var(--text-main); padding: 10px; border-radius: 8px; font-size: 13px; outline: none; flex: 1; }
        .input-key { flex: 0 0 30%; font-weight: bold; }
        .btn-save { background: var(--accent-grad); border: none; color: white; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; margin-top: 5px; }
        .btn-save:hover { filter: brightness(1.1); }
        #car-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; }
        .car-item { background: var(--bg-item); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid transparent; }
        .car-item:hover { border-left-color: var(--accent); transform: translateX(2px); }
        .item-content { overflow: hidden; }
        .item-key { font-weight: 800; color: var(--accent); display: block; font-size: 13px; }
        .item-val { color: var(--text-sec); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .item-actions button { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.6; transition: 0.2s; }
        .item-actions button:hover { opacity: 1; transform: scale(1.2); }
        
        /* Importador e Ajuda */
        .info-box { display: none; background: var(--box-bg); border: 1px solid var(--box-border); color: var(--box-text); padding: 10px; border-radius: 8px; font-size: 12px; margin-bottom: 5px; }
        .btn-settings-action { width: 100%; padding: 6px; margin-top: 5px; border-radius: 6px; border: 1px solid var(--box-border); background: var(--bg-item); cursor: pointer; }
        .import-section { border-top: 1px solid var(--border-input); padding-top: 10px; }
        .toggle-import { font-size: 11px; color: var(--text-sec); text-align: center; cursor: pointer; }
        #import-area { display: none; flex-direction: column; gap: 5px; margin-top: 5px; }
        .area-bulk { width: 100%; height: 80px; background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-input); border-radius: 6px; padding: 5px; font-size: 11px; resize: none; }
        
        #car-panel ::-webkit-scrollbar { width: 5px; }
        #car-panel ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
    `;

    // --- UI ---
    function createUI() {
        if (document.getElementById('car-panel')) return;

        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const container = document.createElement('div');
        container.id = 'car-panel';
        container.innerHTML = `
            <div class="car-header">
                <div class="car-title"><span>💻 CAR Automação</span></div>
                <div class="header-actions">
                    <button id="car-theme-btn" class="btn-icon-header" title="Tema">🌓</button>
                    <button id="car-settings-btn" class="btn-icon-header" title="Backup">⚙️</button>
                    <button id="car-help-btn" class="btn-icon-header" title="Ajuda">?</button>
                    <button id="car-close-btn" class="btn-icon-header" title="Fechar">✖</button>
                </div>
            </div>
            <div class="car-body">
                <div id="car-settings-box" class="info-box">
                    <b>Backup:</b>
                    <button id="car-btn-export" class="btn-settings-action">⬇️ Exportar JSON</button>
                    <button id="car-btn-restore" class="btn-settings-action">⬆️ Importar JSON</button>
                    <input type="file" id="car-file-restore" style="display:none" accept=".json">
                </div>
                <div id="car-help-box" class="info-box">
                    <b>Uso:</b> Digite o atalho e aperte <b>ESPAÇO</b>.<br>Ex: "teste1" + Espaço.
                </div>

                <div class="car-inputs">
                    <input id="car-new-key" class="car-input input-key" type="text" placeholder="Atalho">
                    <input id="car-new-val" class="car-input" type="text" placeholder="Texto da mensagem...">
                </div>
                <button id="car-btn-add" class="btn-save">💾 Salvar</button>

                <div id="car-list"></div>

                <div class="import-section">
                    <div class="toggle-import" id="car-toggle-imp">📥 Importação em Massa ▼</div>
                    <div id="import-area">
                        <textarea id="car-bulk-text" class="area-bulk" placeholder="atalho texto... (uma por linha)"></textarea>
                        <button id="car-btn-bulk" class="btn-save" style="font-size:12px; padding:6px;">Processar</button>
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
            container.style.bottom = 'auto'; container.style.right = 'auto'; // Reset p/ absolute
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
        const applyTheme = () => {
            if (isDark) container.classList.add('dark-mode');
            else container.classList.remove('dark-mode');
        };
        container.querySelector('#car-theme-btn').onclick = () => { isDark = !isDark; saveTheme(isDark); applyTheme(); };

        // Toggle Boxes
        container.querySelector('#car-help-btn').onclick = () => { settingsBox.style.display = 'none'; helpBox.style.display = (helpBox.style.display === 'block') ? 'none' : 'block'; };
        container.querySelector('#car-settings-btn').onclick = () => { helpBox.style.display = 'none'; settingsBox.style.display = (settingsBox.style.display === 'block') ? 'none' : 'block'; };
        container.querySelector('#car-close-btn').onclick = () => container.style.display = 'none';
        container.querySelector('#car-toggle-imp').onclick = () => { importArea.style.display = (importArea.style.display === 'flex') ? 'none' : 'flex'; };

        // Adicionar
        container.querySelector('#car-btn-add').onclick = () => {
            const k = inpKey.value.trim(); const v = inpVal.value.trim();
            if (k && v) { scripts[k] = v; saveData(scripts); inpKey.value = ''; inpVal.value = ''; updateVisualList(); }
        };

        // Importar Massa
        container.querySelector('#car-btn-bulk').onclick = () => {
            const lines = container.querySelector('#car-bulk-text').value.split('\n');
            let c = 0;
            lines.forEach(l => {
                l = l.trim(); if (!l) return;
                let k = '', v = '';
                const s = l.indexOf(' ');
                if (s > 0) { k = l.substring(0, s).trim(); v = l.substring(s).trim(); }
                if (k && v) { scripts[k] = v; c++; }
            });
            saveData(scripts); updateVisualList(); alert(`${c} atalhos importados!`);
            container.querySelector('#car-bulk-text').value = '';
        };

        // Backup Export
        container.querySelector('#car-btn-export').onclick = () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scripts, null, 2));
            const a = document.createElement('a'); a.href = dataStr; a.download = "backup_car.json";
            document.body.appendChild(a); a.click(); a.remove();
        };

        // Backup Import
        const fileInput = container.querySelector('#car-file-restore');
        container.querySelector('#car-btn-restore').onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    scripts = { ...scripts, ...imported }; saveData(scripts); updateVisualList();
                    alert('Backup restaurado!'); settingsBox.style.display = 'none';
                } catch (err) { alert('Arquivo inválido.'); }
            };
            reader.readAsText(file); fileInput.value = '';
        };

        // Render Lista
        window.updateVisualList = () => {
            applyTheme();
            listContainer.innerHTML = '';
            Object.keys(scripts).sort().forEach(key => {
                const item = document.createElement('div'); item.className = 'car-item';
                item.innerHTML = `
                    <div class="item-content"><span class="item-key">${key}</span><span class="item-val">${scripts[key]}</span></div>
                    <div class="item-actions"><button class="btn-edit">✏️</button><button class="btn-del">🗑️</button></div>
                `;
                item.querySelector('.btn-edit').onclick = () => { inpKey.value = key; inpVal.value = scripts[key]; inpVal.focus(); };
                item.querySelector('.btn-del').onclick = () => { if (confirm('Apagar?')) { delete scripts[key]; saveData(scripts); updateVisualList(); } };
                listContainer.appendChild(item);
            });
        };
    }

    // --- MOTOR DE SUBSTITUIÇÃO ---
    function replaceText(element, trigger, fullText) {
        try {
            element.focus();
            // Simula Backspace para apagar o gatilho
            for (let i = 0; i <= trigger.length; i++) document.execCommand('delete', false, null);
            // Insere o texto
            document.execCommand('insertText', false, fullText);
        } catch (e) { console.error("[CAR] Erro ao substituir:", e); }
    }

    document.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) {
            const active = document.activeElement;
            if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) {
                let text = active.value || active.innerText || active.textContent;
                if (!text) return;
                text = text.replace(/[\u00a0\u200b]/g, ' '); // Limpa caracteres invisíveis
                const words = text.trimEnd().split(' ');
                const lastWord = words[words.length - 1];
                if (scripts[lastWord]) {
                    e.preventDefault(); e.stopPropagation();
                    replaceText(active, lastWord, scripts[lastWord]);
                }
            }
        }
    }, true);

    // --- FUNÇÃO EXPOSTA PARA O MENU ---
    window.toggleCAR = function() {
        createUI();
        const p = document.getElementById('car-panel');
        if (p) {
            p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'flex' : 'none';
            if (p.style.display === 'flex') window.updateVisualList();
        }
    };

    loadData();
    console.log("[CAR] Módulo carregado.");

})();
