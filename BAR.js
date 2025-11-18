// ==UserScript==
// @name         PureCloud - Baú de Acesso Remoto (BAR) V21.0 (Completo)
// @namespace    http://tampermonkey.net/bau-acesso-remoto
// @version      21.0
// @description  Ferramentas de Rede, Diagnóstico e Registro (Versão Completa + Fix Botão).
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- 0. BANCO DE DADOS COMPLETO (RESTAURADO) ---
    window.commandDatabase = [
        {
            "title": "Rede (Diagnóstico e Atalhos)",
            "commands": [
                { "id": "cmd-ncpa", "label": "Conexões de Rede (Painel)", "desc": "ncpa.cpl", "os": { "win": "ncpa.cpl" } },
                { "id": "cmd-firewall", "label": "Firewall Avançado", "desc": "wf.msc", "os": { "win": "wf.msc" } },
                { "id": "cmd-inetcpl", "label": "Propriedades de Internet", "desc": "inetcpl.cpl", "os": { "win": "inetcpl.cpl" } },
                { "id": "cmd-getmac", "label": "Ver Endereços MAC", "desc": "Lista endereços físicos", "os": { "win": "getmac /v", "mac": "ifconfig | grep ether", "linux": "ip link show | grep ether" } },
                { "id": "cmd-firewall-status", "label": "Status Firewall", "desc": "Verifica se está ativo", "os": { "win": "netsh advfirewall show allprofiles state", "mac": "sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate", "linux": "sudo ufw status" } }
            ]
        },
        {
            "title": "Rede (Admin e Reparo)",
            "commands": [
                { "id": "cmd-flushdns", "label": "Limpar Cache DNS", "desc": "Corrige erros de navegação", "os": { "win": "ipconfig /flushdns", "mac": "sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder", "linux": "sudo systemd-resolve --flush-caches" } },
                { "id": "cmd-releaseip", "label": "Libertar IP", "desc": "Solta o IP atual", "os": { "win": "ipconfig /release", "mac": "sudo ipconfig set en0 BOOTP", "linux": "sudo dhclient -r" } },
                { "id": "cmd-renewip", "label": "Renovar IP", "desc": "Pede novo IP ao DHCP", "os": { "win": "ipconfig /renew", "mac": "sudo ipconfig set en0 DHCP", "linux": "sudo dhclient" } },
                { "id": "cmd-netsh-reset", "label": "Resetar Winsock", "desc": "Repara bugs de socket", "os": { "win": "netsh winsock reset" } },
                { "id": "cmd-netsh-ip", "label": "Resetar TCP/IP", "desc": "Repara pilha de rede", "os": { "win": "netsh int ip reset" } },
                { "id": "cmd-wifi-show", "label": "Ver Perfis Wi-Fi", "desc": "Lista redes salvas", "os": { "win": "netsh wlan show profiles" } },
                { "id": "cmd-wifi-key", "label": "Ver Senha Wi-Fi", "desc": "Substitua NOME", "os": { "win": "netsh wlan show profile name=\"NOME\" key=clear" } }
            ]
        },
        {
            "title": "Sistema (Info e Desempenho)",
            "commands": [
                { "id": "cmd-taskmgr", "label": "Gestor de Tarefas", "desc": "Monitorar processos", "os": { "win": "taskmgr" } },
                { "id": "cmd-devmgmt", "label": "Gestor de Dispositivos", "desc": "Drivers", "os": { "win": "devmgmt.msc" } },
                { "id": "cmd-msinfo", "label": "Info do Sistema", "desc": "Hardware/Software", "os": { "win": "msinfo32" } },
                { "id": "cmd-dxdiag", "label": "DirectX (Vídeo/Áudio)", "desc": "Diagnóstico Multimídia", "os": { "win": "dxdiag" } },
                { "id": "cmd-uptime", "label": "Tempo de Atividade", "desc": "Tempo ligado", "os": { "win": "systeminfo | find \"Tempo de Arranque\"", "mac": "uptime", "linux": "uptime" } },
                { "id": "cmd-wmic-cpu", "label": "Info CPU", "desc": "Detalhes do processador", "os": { "win": "wmic cpu get name, MaxClockSpeed", "mac": "sysctl -n machdep.cpu.brand_string", "linux": "lscpu" } }
            ]
        },
        {
            "title": "Reparação e Disco",
            "commands": [
                { "id": "cmd-sfc", "label": "SFC Scannow", "desc": "Repara arquivos do Windows", "os": { "win": "sfc /scannow" } },
                { "id": "cmd-dism", "label": "DISM RestoreHealth", "desc": "Repara imagem do sistema", "os": { "win": "Dism /Online /Cleanup-Image /RestoreHealth" } },
                { "id": "cmd-chkdsk", "label": "Check Disk", "desc": "Verifica disco C:", "os": { "win": "chkdsk C: /f" } },
                { "id": "cmd-cleanmgr", "label": "Limpeza de Disco", "desc": "Libera espaço", "os": { "win": "cleanmgr" } },
                { "id": "cmd-shutdown", "label": "Reiniciar PC", "desc": "Força reinício", "os": { "win": "shutdown /r /t 0", "mac": "sudo shutdown -r now", "linux": "reboot" } }
            ]
        }
    ];

    // --- 1. CONFIGURAÇÃO E ESTILOS ---
    let currentOS = 'auto';
    const ICONS = {
        COMPUTER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="bau-svg-icon"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`,
        CLOSE: `<svg class="bau-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`
    };

    const styles = `
        :root { --cor-acento: #00BFFF; --cor-bg: #0D1117; --cor-bg-sec: #161B22; --cor-texto: #C9D1D9; --cor-borda: #30363D; }
        #bau-rede { position: fixed; z-index: 2147483646; background: var(--cor-bg); border: 1px solid var(--cor-borda); top: 10%; left: 10%; width: 800px; height: 600px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 8px; color: var(--cor-texto); display: none; flex-direction: column; overflow: hidden; }
        #bau-rede-header { padding: 10px 15px; cursor: move; background: var(--cor-bg-sec); border-bottom: 1px solid var(--cor-borda); display: flex; justify-content: space-between; align-items: center; height: 40px; flex-shrink: 0; user-select: none; }
        #bau-rede-header h1 { font-size: 16px; margin: 0; color: var(--cor-acento); font-weight: 600; }
        #bau-rede-body { display: flex; flex-grow: 1; overflow: hidden; }
        .bau-sidebar { width: 180px; background: var(--cor-bg-sec); border-right: 1px solid var(--cor-borda); overflow-y: auto; flex-shrink: 0; }
        .bau-sidebar-btn { width: 100%; background: transparent; border: none; color: #8b949e; padding: 12px 15px; text-align: left; cursor: pointer; font-size: 14px; border-left: 3px solid transparent; transition: 0.2s; }
        .bau-sidebar-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .bau-sidebar-btn.active { background: var(--cor-bg); color: var(--cor-acento); border-left-color: var(--cor-acento); font-weight: 600; }
        .bau-content-area { flex-grow: 1; padding: 20px; overflow-y: auto; background: var(--cor-bg); }
        .bau-tab-content { display: none; }
        .bau-tab-content h3 { margin-top: 0; border-bottom: 1px solid var(--cor-borda); padding-bottom: 10px; color: var(--cor-acento); }
        .command-block { background: var(--cor-bg-sec); padding: 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid var(--cor-borda); }
        .command-block label { font-size: 13px; font-weight: 600; display: block; margin-bottom: 5px; color: #fff; }
        .command-block input, .command-block textarea { width: 100%; background: #0d1117; border: 1px solid var(--cor-borda); color: #58a6ff; font-family: monospace; padding: 8px; border-radius: 4px; margin-bottom: 8px; box-sizing: border-box; }
        .bau-btn { background: var(--cor-acento); color: #000; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; transition: 0.2s; }
        .bau-btn:hover { filter: brightness(1.1); }
        .bau-svg-icon { width: 20px; height: 20px; }
        .os-switcher button { background: transparent; border: 1px solid var(--cor-borda); color: #8b949e; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-left: 2px; }
        .os-switcher button.active { background: var(--cor-acento); color: #000; border-color: var(--cor-acento); }
        
        /* Estilo do Botão Flutuante Próprio */
        #bau-trigger-button { position: fixed; width: 48px; height: 48px; bottom: 20px; right: 80px; background: #21262D; color: var(--cor-acento); border: 1px solid var(--cor-borda); border-radius: 50%; font-size: 24px; cursor: grab; z-index: 2147483645; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transition: transform 0.2s; }
        #bau-trigger-button:hover { border-color: #fff; transform: scale(1.1); }
        
        /* Utilitários */
        .input-group { display: flex; gap: 10px; margin-bottom: 10px; }
        .input-group input { flex: 1; }
    `;

    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);

    // --- 2. FUNÇÕES DE UTILIDADE ---
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
            btn.style.backgroundColor = "#3FB950";
            setTimeout(() => {
                btn.textContent = orig;
                btn.style.backgroundColor = "";
            }, 1500);
        });
    }

    // --- 3. CRIAÇÃO DA INTERFACE ---
    const bau = document.createElement('div');
    bau.id = 'bau-rede';
    bau.innerHTML = `
        <div id="bau-rede-header">
            <h1>Baú de Acesso (BAR)</h1>
            <div style="display:flex; align-items:center; gap:10px;">
                <div class="os-switcher">
                    <button id="os-auto" class="active">Auto</button>
                    <button id="os-win">Win</button>
                    <button id="os-mac">Mac</button>
                    <button id="os-lin">Lin</button>
                </div>
                <span id="bau-close" style="cursor:pointer;">${ICONS.CLOSE}</span>
            </div>
        </div>
        <div id="bau-rede-body">
            <div class="bau-sidebar"></div>
            <div class="bau-content-area"></div>
        </div>
    `;
    document.body.appendChild(bau);

    const sidebar = bau.querySelector('.bau-sidebar');
    const contentArea = bau.querySelector('.bau-content-area');

    function createTab(name, contentFn) {
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

    // --- 4. CONTEÚDO DAS ABAS (TODAS AS FUNÇÕES DE VOLTA) ---
    
    // Aba 1: Info
    const tabInfo = createTab("Info", () => {
        const d = document.createElement('div'); d.className = 'bau-tab-content'; d.style.display = 'block';
        d.innerHTML = `<h3>Bem-vindo ao BAR</h3><p>O Baú de Acesso Remoto reúne comandos essenciais de rede e sistema.</p><p>Selecione uma categoria à esquerda.</p>`;
        return d;
    });

    // Aba 2: IP Público
    createTab("IP Público", () => {
        const d = document.createElement('div'); d.className = 'bau-tab-content'; d.style.display = 'block';
        d.innerHTML = `<h3>Meu IP Público</h3><button class="bau-btn" id="btn-ip">Verificar IP</button><pre id="res-ip" style="margin-top:10px; background:#000; padding:10px; border-radius:4px;">Clique para verificar...</pre>`;
        setTimeout(() => {
            d.querySelector('#btn-ip').onclick = async () => {
                d.querySelector('#res-ip').textContent = "Verificando...";
                try {
                    const req = await fetch('https://api.ipify.org');
                    const ip = await req.text();
                    d.querySelector('#res-ip').textContent = `IP: ${ip}`;
                } catch(e) { d.querySelector('#res-ip').textContent = "Erro ao verificar."; }
            };
        }, 0);
        return d;
    });

    // Aba 3: Velocidade
    createTab("Velocidade", () => {
        const d = document.createElement('div'); d.className = 'bau-tab-content'; d.style.display = 'block';
        d.innerHTML = `<h3>Teste de Velocidade (Download)</h3><p>Baixa um arquivo temporário para estimar a velocidade.</p><button class="bau-btn" id="btn-speed">Iniciar Teste</button><pre id="res-speed" style="margin-top:10px; background:#000; padding:10px;">Aguardando...</pre><div class="command-block"><label>Comando Terminal (Speedtest CLI)</label><input type="text" value="speedtest-cli" readonly><button class="bau-btn copy-cmd">Copiar</button></div>`;
        setTimeout(() => {
            d.querySelector('.copy-cmd').onclick = (e) => copyToClipboard("speedtest-cli", e.target);
            d.querySelector('#btn-speed').onclick = async () => {
                const out = d.querySelector('#res-speed');
                out.textContent = "Baixando arquivo de teste (10MB)...";
                const start = Date.now();
                try {
                    await fetch('https://cachefly.cachefly.net/10mb.test?t='+start);
                    const duration = (Date.now() - start) / 1000;
                    const speedMbps = ((10 * 8) / duration).toFixed(2);
                    out.textContent = `Velocidade Estimada: ${speedMbps} Mbps\nTempo: ${duration.toFixed(2)}s`;
                } catch(e) { out.textContent = "Erro no teste."; }
            };
        }, 0);
        return d;
    });

    // Aba 4: Placa de Rede
    createTab("Placa de Rede", () => {
        const d = document.createElement('div'); d.className = 'bau-tab-content'; d.style.display = 'block';
        d.innerHTML = `<h3>Diagnóstico de Placa de Rede</h3><p>Verifique se a placa é Gigabit (1000/1000) ou Fast (100/100).</p>`;
        
        const cmds = {
            win: "powershell \"Get-NetAdapter | Select Name, InterfaceDescription, LinkSpeed\"",
            mac: "system_profiler SPNetworkDataType | grep 'Speed'",
            linux: "ethtool eth0 | grep Speed"
        };
        
        const os = getActiveOS();
        const block = document.createElement('div');
        block.className = 'command-block';
        block.innerHTML = `<label>Comando (${os})</label><input type="text" value="${cmds[os] || 'N/A'}" readonly><button class="bau-btn">Copiar</button>`;
        block.querySelector('button').onclick = (e) => copyToClipboard(cmds[os], e.target);
        d.appendChild(block);
        return d;
    });

    // Aba 5: Ping
    createTab("Ping", () => {
        const d = document.createElement('div'); d.className = 'bau-tab-content'; d.style.display = 'block';
        d.innerHTML = `<h3>Teste de Latência (Ping)</h3><div class="input-group"><input type="text" id="ping-host" value="8.8.8.8" placeholder="IP ou Host"></div><div class="command-block"><label>Comando Gerado</label><input type="text" id="ping-cmd" readonly><button class="bau-btn" id="btn-copy-ping">Copiar</button></div>`;
        
        const update = () => {
            const host = d.querySelector('#ping-host').value;
            const os = getActiveOS();
            const cmd = os === 'win' ? `ping -n 10 ${host}` : `ping -c 10 ${host}`;
            d.querySelector('#ping-cmd').value = cmd;
        };
        
        setTimeout(() => {
            d.querySelector('#ping-host').oninput = update;
            d.querySelector('#btn-copy-ping').onclick = (e) => copyToClipboard(d.querySelector('#ping-cmd').value, e.target);
            update();
        }, 0);
        return d;
    });

    // Aba 6: Traceroute
    createTab("Traceroute", () => {
        const d = document.createElement('div'); d.className = 'bau-tab-content'; d.style.display = 'block';
        d.innerHTML = `<h3>Rastrear Rota</h3><div class="input-group"><input type="text" id="tr-host" value="google.com"></div><div class="command-block"><label>Comando</label><input type="text" id="tr-cmd" readonly><button class="bau-btn" id="btn-copy-tr">Copiar</button></div>`;
        
        const update = () => {
            const host = d.querySelector('#tr-host').value;
            const os = getActiveOS();
            const cmd = os === 'win' ? `tracert ${host}` : `traceroute ${host}`;
            d.querySelector('#tr-cmd').value = cmd;
        };
        
        setTimeout(() => {
            d.querySelector('#tr-host').oninput = update;
            d.querySelector('#btn-copy-tr').onclick = (e) => copyToClipboard(d.querySelector('#tr-cmd').value, e.target);
            update();
        }, 0);
        return d;
    });

    // Abas Dinâmicas do Banco de Dados (Comandos Estáticos)
    window.commandDatabase.forEach(cat => {
        createTab(cat.title, () => {
            const d = document.createElement('div'); d.className = 'bau-tab-content'; d.style.display = 'block';
            d.innerHTML = `<h3>${cat.title}</h3>`;
            const os = getActiveOS();
            cat.commands.forEach(c => {
                if(!c.os[os]) return;
                const b = document.createElement('div'); b.className = 'command-block';
                b.innerHTML = `<label>${c.label}</label><p>${c.desc}</p><input type="text" value="${c.os[os]}" readonly><button class="bau-btn">Copiar Comando</button>`;
                b.querySelector('button').onclick = (e) => copyToClipboard(c.os[os], e.target);
                d.appendChild(b);
            });
            return d;
        });
    });

    // Aba Registro
    createTab("Registro", () => {
        const d = document.createElement('div'); d.className = 'bau-tab-content'; d.style.display = 'block';
        d.innerHTML = `<h3>Registro de Testes</h3><p>Cole aqui os resultados para gerar um relatório.</p><textarea id="reg-area" style="width:100%; height:300px; background:#000; color:#0f0; border:1px solid #333; padding:10px;" placeholder="Cole os resultados do terminal aqui..."></textarea><br><button class="bau-btn" id="btn-print">Gerar Relatório (Imprimir)</button>`;
        setTimeout(() => {
            d.querySelector('#btn-print').onclick = () => {
                const content = d.querySelector('#reg-area').value;
                const win = window.open('', '', 'width=800,height=600');
                win.document.write(`<pre>${content}</pre>`);
                win.print();
            };
        }, 0);
        return d;
    });

    tabInfo.click(); // Abre na info

    // --- 5. LÓGICA DE CONTROLE E ARRASTO ---
    
    // OS Switcher
    ['auto', 'win', 'mac', 'lin'].forEach(os => {
        document.getElementById(`os-${os}`).onclick = (e) => {
            currentOS = os === 'lin' ? 'linux' : os;
            document.querySelectorAll('.os-switcher button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            // Recarrega a aba ativa para atualizar comandos
            const activeTab = sidebar.querySelector('.active');
            if (activeTab) activeTab.click();
        };
    });

    // Fechar
    document.getElementById('bau-close').onclick = () => { bau.style.display = 'none'; };

    // Função Global Toggle
    window.toggleBau = () => {
        bau.style.display = (bau.style.display === 'none' || !bau.style.display) ? 'flex' : 'none';
    };

    // Header Drag (Simples)
    const header = document.getElementById('bau-rede-header');
    let isDragging = false, startX, startY, initialLeft, initialTop;

    header.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.id === 'bau-close') return;
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        const rect = bau.getBoundingClientRect();
        initialLeft = rect.left; initialTop = rect.top;
        document.onmousemove = (me) => {
            if (!isDragging) return;
            bau.style.left = (initialLeft + me.clientX - startX) + 'px';
            bau.style.top = (initialTop + me.clientY - startY) + 'px';
        };
        document.onmouseup = () => { isDragging = false; document.onmousemove = null; document.onmouseup = null; };
    };

    // --- 6. BOTÃO FLUTUANTE (COMPATÍVEL COM MENU UNIFICADO) ---
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'bau-trigger-button'; // ID Essencial para o Menu Unificado achar
    triggerBtn.innerHTML = ICONS.COMPUTER;
    triggerBtn.title = "Abrir BAR";
    document.body.appendChild(triggerBtn);

    // Lógica Inteligente: Arrasta OU Clica
    let btnDragging = false;
    let bStartX, bStartY, bInitLeft, bInitTop;

    triggerBtn.onmousedown = (e) => {
        if(e.button !== 0) return;
        btnDragging = false;
        bStartX = e.clientX; bStartY = e.clientY;
        const r = triggerBtn.getBoundingClientRect();
        bInitLeft = r.left; bInitTop = r.top;
        
        document.onmousemove = (me) => {
            const dx = me.clientX - bStartX;
            const dy = me.clientY - bStartY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                btnDragging = true; // Se moveu mais de 5px, é arrasto
                triggerBtn.style.left = (bInitLeft + dx) + 'px';
                triggerBtn.style.top = (bInitTop + dy) + 'px';
                triggerBtn.style.right = 'auto'; triggerBtn.style.bottom = 'auto';
            }
        };
        
        document.onmouseup = () => {
            document.onmousemove = null; document.onmouseup = null;
            if (btnDragging) { // Salva posição se arrastou
                 localStorage.setItem('bauTriggerPos', JSON.stringify({left: triggerBtn.style.left, top: triggerBtn.style.top}));
            }
            // Pequeno delay para evitar conflito de clique
            setTimeout(() => btnDragging = false, 50);
        };
    };

    // O clique só funciona se NÃO estiver arrastando
    triggerBtn.onclick = () => {
        if (!btnDragging) window.toggleBau();
    };

    // Restaurar posição do botão
    const savedPos = localStorage.getItem('bauTriggerPos');
    if(savedPos) {
        const p = JSON.parse(savedPos);
        triggerBtn.style.left = p.left; triggerBtn.style.top = p.top;
        triggerBtn.style.right = 'auto'; triggerBtn.style.bottom = 'auto';
    }

})();
