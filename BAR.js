// ==UserScript==
// @name         PureCloud - Baú de Acesso Remoto (BAR) V20.2
// @namespace    http://tampermonkey.net/bau-acesso-remoto
// @version      20.2
// @description  Ferramenta de Diagnóstico e Comandos de Rede (Correção de Clique).
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- 0. BANCO DE DADOS DE COMANDOS ---
    window.commandDatabase = [
        {
            "title": "Rede (Diagnóstico e Atalhos)",
            "commands": [
                { "id": "cmd-ncpa", "label": "Conexões de Rede", "desc": "Abre o adaptador de rede (ncpa.cpl)", "os": { "win": "ncpa.cpl" } },
                { "id": "cmd-firewall", "label": "Firewall", "desc": "Abre o Firewall Avançado (wf.msc)", "os": { "win": "wf.msc" } },
                { "id": "cmd-inetcpl", "label": "Propriedades de Internet", "desc": "Opções de Internet (inetcpl.cpl)", "os": { "win": "inetcpl.cpl" } },
                { "id": "cmd-getmac", "label": "Ver MAC Address", "desc": "Lista endereços físicos", "os": { "win": "getmac /v", "mac": "ifconfig | grep ether", "linux": "ip link show" } },
                { "id": "cmd-flushdns", "label": "Limpar Cache DNS", "desc": "Resolve erros de navegação", "os": { "win": "ipconfig /flushdns", "mac": "sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder", "linux": "sudo systemd-resolve --flush-caches" } },
                { "id": "cmd-renewip", "label": "Renovar IP", "desc": "Solicita novo IP ao DHCP", "os": { "win": "ipconfig /renew", "mac": "sudo ipconfig set en0 DHCP", "linux": "sudo dhclient -r && sudo dhclient" } },
                { "id": "cmd-netsh-reset", "label": "Resetar Winsock", "desc": "Repara bugs de conexão", "os": { "win": "netsh winsock reset" } },
                { "id": "cmd-netsh-int-ip", "label": "Resetar TCP/IP", "desc": "Repara pilha TCP/IP", "os": { "win": "netsh int ip reset" } }
            ]
        },
        {
            "title": "Sistema e Hardware",
            "commands": [
                { "id": "cmd-taskmgr", "label": "Gestor de Tarefas", "desc": "Monitorar processos", "os": { "win": "taskmgr" } },
                { "id": "cmd-devmgmt", "label": "Gestor de Dispositivos", "desc": "Verificar drivers", "os": { "win": "devmgmt.msc" } },
                { "id": "cmd-control", "label": "Painel de Controle", "desc": "Configurações gerais", "os": { "win": "control" } },
                { "id": "cmd-msinfo", "label": "Info do Sistema", "desc": "Detalhes de hardware/software", "os": { "win": "msinfo32" } },
                { "id": "cmd-uptime", "label": "Tempo Ligado", "desc": "Verifica uptime do sistema", "os": { "win": "systeminfo | find \"Tempo de Arranque\"", "mac": "uptime", "linux": "uptime" } },
                { "id": "cmd-wmic-cpu", "label": "Info CPU", "desc": "Detalhes do Processador", "os": { "win": "wmic cpu get name, MaxClockSpeed", "mac": "sysctl -n machdep.cpu.brand_string", "linux": "lscpu" } }
            ]
        },
        {
            "title": "Reparação",
            "commands": [
                { "id": "cmd-sfc", "label": "SFC Scannow", "desc": "Repara arquivos do Windows", "os": { "win": "sfc /scannow" } },
                { "id": "cmd-dism", "label": "DISM RestoreHealth", "desc": "Repara imagem do sistema", "os": { "win": "Dism /Online /Cleanup-Image /RestoreHealth" } },
                { "id": "cmd-chkdsk", "label": "Check Disk", "desc": "Verifica erros no HD", "os": { "win": "chkdsk C: /f" } },
                { "id": "cmd-shutdown", "label": "Reiniciar PC", "desc": "Força reinício", "os": { "win": "shutdown /r /t 0", "mac": "sudo shutdown -r now", "linux": "reboot" } }
            ]
        }
    ];

    // --- CONFIGURAÇÃO ---
    const MIN_WIDTH = 300;
    const MIN_HEIGHT = 200;
    let currentOS = 'auto';
    
    // Ícones SVG
    const ICONS = {
        COMPUTER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="bau-svg-icon"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`,
        CLOSE: `<svg class="bau-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`
    };

    const DESIGN_COLORS = {
        '--cor-acento-primario': '#00BFFF', '--cor-acento-hover': '#40E0D0', 
        '--cor-fundo-primario': '#0D1117', '--cor-fundo-secundario': '#161B22', 
        '--cor-borda': '#30363D', '--cor-texto-primario': '#C9D1D9', 
        '--cor-texto-secundario': '#8B949E', '--cor-sucesso': '#3FB950', 
        '--cor-perigo': '#F47067', '--sombra-popup': '0 8px 24px rgba(0,0,0,0.5)'
    };

    // --- CSS INJETADO ---
    const styles = `
        :root { --raio-borda: 6px; --transicao: all 0.2s; }
        #bau-rede { position: fixed; z-index: 2147483646; background: var(--cor-fundo-primario); border: 1px solid var(--cor-borda); top: 10%; left: 10%; width: 750px; height: 550px; font-family: 'Segoe UI', sans-serif; box-shadow: var(--sombra-popup); border-radius: 8px; color: var(--cor-texto-primario); display: none; flex-direction: column; overflow: hidden; }
        #bau-rede-header { padding: 10px 15px; cursor: move; background: var(--cor-fundo-secundario); border-bottom: 1px solid var(--cor-borda); display: flex; justify-content: space-between; align-items: center; height: 40px; flex-shrink: 0; user-select: none; }
        #bau-rede-header h1 { font-size: 16px; margin: 0; font-weight: 600; color: var(--cor-acento-primario); }
        #bau-rede-body { display: flex; flex-grow: 1; overflow: hidden; }
        .bau-sidebar { width: 160px; background: var(--cor-fundo-secundario); border-right: 1px solid var(--cor-borda); overflow-y: auto; flex-shrink: 0; }
        .bau-sidebar-btn { width: 100%; background: transparent; border: none; color: var(--cor-texto-secundario); padding: 12px 15px; text-align: left; cursor: pointer; font-size: 14px; border-left: 3px solid transparent; transition: var(--transicao); }
        .bau-sidebar-btn:hover { background: rgba(255,255,255,0.05); color: var(--cor-texto-primario); }
        .bau-sidebar-btn.active { background: var(--cor-fundo-primario); color: var(--cor-acento-primario); border-left-color: var(--cor-acento-primario); font-weight: 600; }
        .bau-content-area { flex-grow: 1; padding: 20px; overflow-y: auto; background: var(--cor-fundo-primario); }
        .bau-tab-content { display: none; animation: fadeIn 0.2s; }
        .bau-tab-content h3 { margin-top: 0; border-bottom: 1px solid var(--cor-borda); padding-bottom: 10px; color: var(--cor-acento-primario); }
        .command-block { background: var(--cor-fundo-secundario); padding: 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid var(--cor-borda); }
        .command-block label { font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px; color: var(--cor-texto-primario); }
        .command-block p { font-size: 12px; color: var(--cor-texto-secundario); margin: 0 0 8px 0; }
        .command-block input { width: 100%; background: #000; border: 1px solid var(--cor-borda); color: #0f0; font-family: monospace; padding: 8px; border-radius: 4px; margin-bottom: 8px; box-sizing: border-box; }
        .bau-copy-btn { background: var(--cor-acento-primario); color: #000; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; width: 100%; transition: var(--transicao); }
        .bau-copy-btn:hover { filter: brightness(1.1); }
        .bau-copy-btn:active { transform: scale(0.98); }
        
        /* Botão Flutuante Próprio (Caso não use o Menu Unificado) */
        #bau-trigger-button { position: fixed; width: 48px; height: 48px; bottom: 80px; right: 20px; background: #21262D; color: var(--cor-acento-primario); border: 1px solid var(--cor-borda); border-radius: 50%; font-size: 24px; cursor: grab; z-index: 2147483645; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transition: transform 0.2s; }
        #bau-trigger-button:hover { border-color: var(--cor-acento-hover); transform: scale(1.1); }

        /* Header Controls */
        .header-controls { display: flex; align-items: center; gap: 10px; }
        .os-switcher button { background: transparent; border: 1px solid var(--cor-borda); color: var(--cor-texto-secundario); padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; }
        .os-switcher button.active { background: var(--cor-acento-primario); color: #000; border-color: var(--cor-acento-primario); }
        .close-btn { cursor: pointer; color: var(--cor-texto-secundario); display: flex; }
        .close-btn:hover { color: var(--cor-perigo); }
        
        /* Resizer */
        .bau-resizer { position: absolute; bottom: 0; right: 0; width: 15px; height: 15px; cursor: nwse-resize; z-index: 10; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;

    function applyTheme() {
        const style = document.createElement('style');
        style.textContent = styles;
        for (const [k, v] of Object.entries(DESIGN_COLORS)) document.documentElement.style.setProperty(k, v);
        document.head.appendChild(style);
    }

    // --- FUNÇÕES DE UTILIDADE ---
    function getActiveOS() {
        if (currentOS !== 'auto') return currentOS;
        if (navigator.platform.toLowerCase().includes('win')) return 'win';
        if (navigator.platform.toLowerCase().includes('mac')) return 'mac';
        return 'linux';
    }

    function copyToClipboard(text, btn) {
        navigator.clipboard.writeText(text).then(() => {
            const orig = btn.textContent;
            btn.textContent = "Copiado!";
            btn.style.backgroundColor = "var(--cor-sucesso)";
            setTimeout(() => {
                btn.textContent = orig;
                btn.style.backgroundColor = "var(--cor-acento-primario)";
            }, 1500);
        });
    }

    // --- CRIAÇÃO DA INTERFACE ---
    function createBauInterface() {
        const bau = document.createElement('div');
        bau.id = 'bau-rede';
        
        // Header
        bau.innerHTML = `
            <div id="bau-rede-header">
                <h1>Baú de Acesso (BAR)</h1>
                <div class="header-controls">
                    <div class="os-switcher">
                        <button id="os-auto" class="active">Auto</button>
                        <button id="os-win">Win</button>
                        <button id="os-mac">Mac</button>
                        <button id="os-lin">Lin</button>
                    </div>
                    <span class="close-btn">${ICONS.CLOSE}</span>
                </div>
            </div>
            <div id="bau-rede-body">
                <div class="bau-sidebar"></div>
                <div class="bau-content-area"></div>
            </div>
            <div class="bau-resizer"></div>
        `;
        document.body.appendChild(bau);

        // Sidebar & Content Logic
        const sidebar = bau.querySelector('.bau-sidebar');
        const contentArea = bau.querySelector('.bau-content-area');
        
        // Criar botão de aba
        function createTab(id, name, contentFn) {
            const btn = document.createElement('button');
            btn.className = 'bau-sidebar-btn';
            btn.textContent = name;
            btn.onclick = () => {
                sidebar.querySelectorAll('.bau-sidebar-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                contentArea.innerHTML = '';
                contentArea.appendChild(contentFn());
            };
            sidebar.appendChild(btn);
            return btn;
        }

        // Gerar conteúdo das abas baseado no JSON
        window.commandDatabase.forEach((category, idx) => {
            const tab = createTab(`tab-${idx}`, category.title, () => {
                const div = document.createElement('div');
                div.className = 'bau-tab-content';
                div.style.display = 'block';
                div.innerHTML = `<h3>${category.title}</h3>`;
                
                const os = getActiveOS();
                
                category.commands.forEach(cmd => {
                    if (!cmd.os[os]) return;
                    const block = document.createElement('div');
                    block.className = 'command-block';
                    block.innerHTML = `
                        <label>${cmd.label}</label>
                        ${cmd.desc ? `<p>${cmd.desc}</p>` : ''}
                        <input type="text" readonly value="${cmd.os[os]}">
                    `;
                    const btn = document.createElement('button');
                    btn.className = 'bau-copy-btn';
                    btn.textContent = "Copiar Comando";
                    btn.onclick = () => copyToClipboard(cmd.os[os], btn);
                    block.appendChild(btn);
                    div.appendChild(block);
                });
                return div;
            });
            if (idx === 0) tab.click(); // Abrir primeira aba
        });

        // Fechar
        bau.querySelector('.close-btn').onclick = () => {
            bau.style.display = 'none';
        };
        
        // OS Switcher
        ['auto', 'win', 'mac', 'lin'].forEach(os => {
            document.getElementById(`os-${os}`).onclick = (e) => {
                currentOS = os === 'lin' ? 'linux' : os;
                document.querySelectorAll('.os-switcher button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                // Recarregar aba atual
                const activeTab = sidebar.querySelector('.active');
                if (activeTab) activeTab.click();
            };
        });

        // --- LÓGICA DE ARRASTAR JANELA (HEADER) ---
        const header = document.getElementById('bau-rede-header');
        let isDragging = false, startX, startY, initialLeft, initialTop;

        header.onmousedown = (e) => {
            if (e.target.closest('button') || e.target.closest('.close-btn')) return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = bau.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            bau.style.transition = 'none'; // Remove transição para arrastar suave
            
            document.onmousemove = (me) => {
                if (!isDragging) return;
                const dx = me.clientX - startX;
                const dy = me.clientY - startY;
                bau.style.left = `${initialLeft + dx}px`;
                bau.style.top = `${initialTop + dy}px`;
            };
            
            document.onmouseup = () => {
                isDragging = false;
                document.onmousemove = null;
                document.onmouseup = null;
                bau.style.transition = '';
            };
        };
        
        // --- LÓGICA DE REDIMENSIONAR ---
        const resizer = bau.querySelector('.bau-resizer');
        resizer.onmousedown = (e) => {
            e.preventDefault();
            const startW = parseInt(document.defaultView.getComputedStyle(bau).width, 10);
            const startH = parseInt(document.defaultView.getComputedStyle(bau).height, 10);
            const startX = e.clientX;
            const startY = e.clientY;
            bau.style.transition = 'none';

            document.onmousemove = (me) => {
                const newW = startW + me.clientX - startX;
                const newH = startH + me.clientY - startY;
                if (newW > MIN_WIDTH) bau.style.width = newW + 'px';
                if (newH > MIN_HEIGHT) bau.style.height = newH + 'px';
            };

            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
                bau.style.transition = '';
            };
        };

        return bau;
    }

    // --- INICIALIZAÇÃO ---
    applyTheme();
    const bauWindow = createBauInterface();

    // Função Global para Abrir/Fechar
    window.toggleBau = function() {
        if (bauWindow.style.display === 'none' || !bauWindow.style.display) {
            bauWindow.style.display = 'flex';
        } else {
            bauWindow.style.display = 'none';
        }
    };

    // --- CRIAÇÃO DO BOTÃO FLUTUANTE (COMPATÍVEL COM MENU UNIFICADO) ---
    // O ID 'bau-trigger-button' é crucial para o Menu Unificado encontrar este botão.
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'bau-trigger-button';
    triggerBtn.innerHTML = ICONS.COMPUTER;
    triggerBtn.title = "Abrir BAR";
    document.body.appendChild(triggerBtn);

    // Lógica de Arrasto do Botão
    let btnDragging = false;
    let btnStartX, btnStartY, btnInitLeft, btnInitTop;

    triggerBtn.onmousedown = (e) => {
        if (e.button !== 0) return;
        btnDragging = false;
        btnStartX = e.clientX; btnStartY = e.clientY;
        const rect = triggerBtn.getBoundingClientRect();
        btnInitLeft = rect.left; btnInitTop = rect.top;
        
        document.onmousemove = (me) => {
            const dx = me.clientX - btnStartX;
            const dy = me.clientY - btnStartY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                btnDragging = true;
                triggerBtn.style.left = (btnInitLeft + dx) + 'px';
                triggerBtn.style.top = (btnInitTop + dy) + 'px';
                triggerBtn.style.right = 'auto'; triggerBtn.style.bottom = 'auto';
            }
        };
        
        document.onmouseup = () => {
            document.onmousemove = null; document.onmouseup = null;
            if (btnDragging) {
                localStorage.setItem('bauTriggerPos', JSON.stringify({left: triggerBtn.style.left, top: triggerBtn.style.top}));
            }
            setTimeout(() => btnDragging = false, 50);
        };
    };

    // *** CORREÇÃO DO CLIQUE ***
    // Se não estiver arrastando, abre o menu.
    // Isso funciona tanto para clique físico quanto para .click() do Menu Unificado.
    triggerBtn.onclick = () => {
        if (!btnDragging) window.toggleBau();
    };

    // Restaurar posição salva do botão
    const savedBtnPos = localStorage.getItem('bauTriggerPos');
    if (savedBtnPos) {
        const p = JSON.parse(savedBtnPos);
        triggerBtn.style.left = p.left;
        triggerBtn.style.top = p.top;
        triggerBtn.style.right = 'auto'; triggerBtn.style.bottom = 'auto';
    }

})();
