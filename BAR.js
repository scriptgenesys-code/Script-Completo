(function() {
    // --- 0. BANCO DE DADOS DE COMANDOS (V19.0) ---
    window.commandDatabase = [
        {
            "title": "Rede (Diagnóstico e Atalhos)",
            "commands": [
                {
                    "id": "cmd-ncpa",
                    "label": "Conexões de Rede (Painel de Controle)",
                    "desc": "Abre a pasta \"Conexões de Rede\" (Painel de Controle)",
                    "os": {
                        "win": "ncpa.cpl"
                    }
                },
                {
                    "id": "cmd-firewall",
                    "label": "Firewall do Windows",
                    "desc": "Abre o Firewall com Segurança Avançada",
                    "os": {
                        "win": "wf.msc"
                    }
                },
                {
                    "id": "cmd-inetcpl",
                    "label": "Propriedades de Internet",
                    "desc": "Abre as Propriedades de Internet (Cache, Segurança, etc)",
                    "os": {
                        "win": "inetcpl.cpl"
                    }
                },
                {
                    "id": "cmd-mac-net",
                    "label": "Definições de Rede (GUI)",
                    "desc": "Abre as Preferências de Rede do Sistema",
                    "os": {
                        "mac": "open /System/Library/PreferencePanes/Network.prefPane"
                    }
                },
                {
                    "id": "cmd-lin-nm",
                    "label": "Editor de Conexão (GUI)",
                    "desc": "Abre o editor de conexões do NetworkManager",
                    "os": {
                        "linux": "nm-connection-editor"
                    }
                },
                {
                    "id": "cmd-getmac",
                    "label": "Ver Endereços MAC",
                    "desc": "Mostra os endereços físicos (MAC) de todas as placas",
                    "os": {
                        "win": "getmac /v",
                        "mac": "ifconfig | grep ether",
                        "linux": "ip link show | grep ether"
                    }
                },
                {
                    "id": "cmd-firewall-status",
                    "label": "Verificar Status do Firewall (Terminal)",
                    "desc": "Verifica se o firewall está ativo",
                    "os": {
                        "win": "netsh advfirewall show allprofiles state",
                        "mac": "sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate",
                        "linux": "sudo ufw status"
                    }
                }
            ]
        },
        {
            "title": "Rede (Configuração e Admin)",
            "commands": [
                {
                    "id": "cmd-flushdns",
                    "label": "Limpar Cache DNS (Admin)",
                    "desc": "Força a limpeza do cache de resolução de DNS",
                    "os": {
                        "win": "ipconfig /flushdns",
                        "mac": "sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder",
                        "linux": "sudo systemd-resolve --flush-caches"
                    }
                },
                {
                    "id": "cmd-releaseip",
                    "label": "Libertar IP (Admin)",
                    "desc": "Liberta o endereço IP atual do DHCP",
                    "os": {
                        "win": "ipconfig /release",
                        "mac": "sudo ipconfig set en0 BOOTP && sudo ipconfig set en0 DHCP",
                        "linux": "sudo dhclient -r"
                    }
                },
                {
                    "id": "cmd-renewip",
                    "label": "Renovar IP (Admin)",
                    "desc": "Pede um novo endereço IP ao DHCP",
                    "os": {
                        "win": "ipconfig /renew",
                        "mac": "sudo ipconfig set en0 BOOTP && sudo ipconfig set en0 DHCP",
                        "linux": "sudo dhclient"
                    }
                },
                {
                    "id": "cmd-netsh-show-wifi",
                    "label": "Ver Perfis Wi-Fi Guardados (Admin)",
                    "desc": "Mostra todas as redes Wi-Fi que o Windows guardou",
                    "os": {
                        "win": "netsh wlan show profiles"
                    }
                },
                {
                    "id": "cmd-netsh-show-wifikey",
                    "label": "Ver Chave Wi-Fi Específica (Admin)",
                    "desc": "Substitua NOME_DA_REDE pelo nome do Wi-Fi",
                    "os": {
                        "win": "netsh wlan show profile name=\"NOME_DA_REDE\" key=clear"
                    }
                },
                {
                    "id": "cmd-netsh-reset",
                    "label": "Resetar Catálogo Winsock (Admin)",
                    "desc": "Repara problemas de conectividade de software",
                    "os": {
                        "win": "netsh winsock reset"
                    }
                },
                {
                    "id": "cmd-netsh-reset-ip",
                    "label": "Resetar Stack TCP/IP (Admin)",
                    "desc": "Repara problemas de conectividade de IP",
                    "os": {
                        "win": "netsh int ip reset"
                    }
                },
                {
                    "id": "cmd-wifi-off",
                    "label": "Desativar Wi-Fi (Admin)",
                    "desc": "Nome \"Wi-Fi\" (Win) ou \"wlan0\" (Lin) pode variar",
                    "os": {
                        "win": "powershell -Command \"Disable-NetAdapter -Name 'Wi-Fi' -Confirm:$false\"",
                        "mac": "sudo networksetup -setnetworkserviceenabled Wi-Fi off",
                        "linux": "sudo ip link set wlan0 down"
                    }
                },
                {
                    "id": "cmd-wifi-on",
                    "label": "Ativar Wi-Fi (Admin)",
                    "desc": "Nome \"Wi-Fi\" (Win) ou \"wlan0\" (Lin) pode variar",
                    "os": {
                        "win": "powershell -Command \"Enable-NetAdapter -Name 'Wi-Fi'\"",
                        "mac": "sudo networksetup -setnetworkserviceenabled Wi-Fi on",
                        "linux": "sudo ip link set wlan0 up"
                    }
                },
                {
                    "id": "cmd-mac-airport",
                    "label": "Scan Wi-Fi (Terminal)",
                    "desc": "Mostra todas as redes Wi-Fi visíveis e a sua força",
                    "os": {
                        "mac": "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s"
                    }
                },
                {
                    "id": "cmd-lin-iwlist",
                    "label": "Scan Wi-Fi (Terminal)",
                    "desc": "Mostra todas as redes Wi-Fi visíveis",
                    "os": {
                        "linux": "sudo iwlist wlan0 scan"
                    }
                }
            ]
        },
        {
            "title": "Sistema (Info e Desempenho)",
            "commands": [
                {
                    "id": "cmd-taskmgr",
                    "label": "Gestor de Tarefas",
                    "desc": null,
                    "os": {
                        "win": "taskmgr"
                    }
                },
                {
                    "id": "cmd-services",
                    "label": "Serviços do Windows",
                    "desc": null,
                    "os": {
                        "win": "services.msc"
                    }
                },
                {
                    "id": "cmd-msinfo",
                    "label": "Informação do Sistema",
                    "desc": null,
                    "os": {
                        "win": "msinfo32"
                    }
                },
                {
                    "id": "cmd-devmgmt",
                    "label": "Gestor de Dispositivos",
                    "desc": "Ver drivers e hardware",
                    "os": {
                        "win": "devmgmt.msc"
                    }
                },
                {
                    "id": "cmd-msconfig",
                    "label": "Configuração do Sistema",
                    "desc": "Ver programas de arranque e serviços",
                    "os": {
                        "win": "msconfig"
                    }
                },
                {
                    "id": "cmd-dxdiag",
                    "label": "Diagnóstico do DirectX",
                    "desc": "Verificar drivers de vídeo e áudio",
                    "os": {
                        "win": "dxdiag"
                    }
                },
                {
                    "id": "cmd-resmon",
                    "label": "Monitor de Recursos",
                    "desc": "Ver uso de CPU, disco, rede e memória em detalhe",
                    "os": {
                        "win": "resmon"
                    }
                },
                {
                    "id": "cmd-perfmon",
                    "label": "Monitor de Desempenho",
                    "desc": "Analisar performance e gerar relatórios",
                    "os": {
                        "win": "perfmon"
                    }
                },
                {
                    "id": "cmd-powercfg",
                    "label": "Opções de Energia (Avançado)",
                    "desc": "Gerar relatório de saúde da bateria",
                    "os": {
                        "win": "powercfg /batteryreport"
                    }
                },
                {
                    "id": "cmd-wmic-cpu",
                    "label": "Info CPU (Terminal)",
                    "desc": null,
                    "os": {
                        "win": "wmic cpu get name, MaxClockSpeed, L3CacheSize",
                        "mac": "sysctl -n machdep.cpu.brand_string",
                        "linux": "lscpu | grep 'Model name'"
                    }
                },
                {
                    "id": "cmd-wmic-mem",
                    "label": "Info Memória (Terminal)",
                    "desc": "Lista os módulos de RAM instalados",
                    "os": {
                        "win": "wmic memorychip get Capacity, Speed, Manufacturer",
                        "mac": "sysctl hw.memsize",
                        "linux": "free -h"
                    }
                },
                {
                    "id": "cmd-wmic-os",
                    "label": "Info Sistema Operacional (Terminal)",
                    "desc": null,
                    "os": {
                        "win": "wmic os get Caption, Version, OSArchitecture",
                        "mac": "sw_vers",
                        "linux": "lsb_release -a"
                    }
                },
                {
                    "id": "cmd-mac-activity",
                    "label": "Monitor de Atividade (GUI)",
                    "desc": "Equivalente ao Gestor de Tarefas",
                    "os": {
                        "mac": "open /System/Applications/Utilities/Activity\\ Monitor.app"
                    }
                },
                {
                    "id": "cmd-mac-sysinfo",
                    "label": "Informação do Sistema (GUI)",
                    "desc": null,
                    "os": {
                        "mac": "open /System/Applications/Utilities/System\\ Information.app"
                    }
                },
                {
                    "id": "cmd-mac-console",
                    "label": "Logs do Sistema (GUI)",
                    "desc": "Equivalente ao Visualizador de Eventos",
                    "os": {
                        "mac": "open /System/Applications/Utilities/Console.app"
                    }
                },
                {
                    "id": "cmd-lin-monitor",
                    "label": "Monitor de Sistema (Terminal)",
                    "desc": "(Requer htop: sudo apt install htop)",
                    "os": {
                        "linux": "htop"
                    }
                },
                {
                    "id": "cmd-lin-lshw",
                    "label": "Listar Hardware (Terminal)",
                    "desc": "Lista detalhada de todo o hardware",
                    "os": {
                        "linux": "sudo lshw -short"
                    }
                },
                {
                    "id": "cmd-lin-df",
                    "label": "Ver Uso de Disco (Terminal)",
                    "desc": "Mostra espaço livre em disco",
                    "os": {
                        "mac": "df -h",
                        "linux": "df -h"
                    }
                },
                {
                    "id": "cmd-lin-du",
                    "label": "Ver Tamanho de Pastas (Terminal)",
                    "desc": "Mostra o tamanho das pastas no diretório atual",
                    "os": {
                        "mac": "du -sh *",
                        "linux": "du -sh *"
                    }
                },
                {
                    "id": "cmd-lin-lspci",
                    "label": "Listar Dispositivos PCI (Terminal)",
                    "desc": "Ver placas (vídeo, rede, etc) ligadas",
                    "os": {
                        "linux": "lspci"
                    }
                },
                {
                    "id": "cmd-uname",
                    "label": "Ver Info do Sistema (Terminal)",
                    "desc": "Mostra a versão do Kernel e SO",
                    "os": {
                        "mac": "uname -a",
                        "linux": "uname -a"
                    }
                },
                {
                    "id": "cmd-whoami",
                    "label": "Ver Username (Terminal)",
                    "desc": "Mostra o utilizador atual",
                    "os": {
                        "win": "whoami",
                        "mac": "whoami",
                        "linux": "whoami"
                    }
                },
                {
                    "id": "cmd-uptime",
                    "label": "Tempo de Atividade (Terminal)",
                    "desc": "Há quanto tempo o sistema está ligado",
                    "os": {
                        "win": "systeminfo | find \"Tempo de Arranque\"",
                        "mac": "uptime",
                        "linux": "uptime"
                    }
                }
            ]
        },
        {
            "title": "Gestão de Processos e Serviços",
            "commands": [
                { "id": "cmd-tasklist", "label": "Listar Processos (Terminal)", "desc": "Mostra todos os processos a correr", "os": { "win": "tasklist", "mac": "ps aux", "linux": "ps aux" } },
                { "id": "cmd-taskkill", "label": "Matar Processo por PID (Admin)", "desc": "Substitua [PID] pelo número do processo", "os": { "win": "taskkill /PID [PID] /F", "mac": "sudo kill -9 [PID]", "linux": "sudo kill -9 [PID]" } },
                { "id": "cmd-taskkill-name", "label": "Matar Processo por Nome (Admin)", "desc": "Substitua [NOME]", "os": { "win": "taskkill /IM [NOME.EXE] /F", "mac": "sudo killall [NOME]", "linux": "sudo killall [NOME]" } },
                { "id": "cmd-net-start", "label": "Ver Serviços a Correr (Terminal)", "desc": null, "os": { "win": "net start", "mac": "sudo launchctl list", "linux": "sudo systemctl list-units --type=service --state=running" } },
                { "id": "cmd-net-stop", "label": "Parar Serviço (Admin)", "desc": "Substitua \"NOME_SERVICO\"", "os": { "win": "net stop \"NOME_SERVICO\"", "mac": "sudo launchctl stop [NOME_SERVICO]", "linux": "sudo systemctl stop [NOME_SERVICO]" } },
                { "id": "cmd-net-start-srv", "label": "Iniciar Serviço (Admin)", "desc": "Substitua \"NOME_SERVICO\"", "os": { "win": "net start \"NOME_SERVICO\"", "mac": "sudo launchctl start [NOME_SERVICO]", "linux": "sudo systemctl start [NOME_SERVICO]" } }
            ]
        },
        {
            "title": "Sistema (Reparação e Admin)",
            "commands": [
                { "id": "cmd-sfc", "label": "Verificar Ficheiros de Sistema (Admin)", "desc": "Repara ficheiros corrompidos do Windows", "os": { "win": "sfc /scannow" } },
                { "id": "cmd-dism", "label": "Verificar Imagem do Windows (Admin)", "desc": "Repara a imagem do Windows", "os": { "win": "Dism /Online /Cleanup-Image /RestoreHealth" } },
                { "id": "cmd-chkdsk", "label": "Verificar Disco (Admin)", "desc": "Verifica o disco C: (agenda para reiniciar)", "os": { "win": "chkdsk C: /f" } },
                { "id": "cmd-cleanmgr", "label": "Limpeza de Disco (GUI)", "desc": "Abre a ferramenta de limpeza de disco", "os": { "win": "cleanmgr" } },
                { "id": "cmd-control", "label": "Painel de Controle (GUI)", "desc": null, "os": { "win": "control" } },
                { "id": "cmd-eventvwr", "label": "Visualizador de Eventos (GUI)", "desc": "Ver logs de erro do Windows", "os": { "win": "eventvwr.msc" } },
                { "id": "cmd-gpedit", "label": "Editor de Política de Grupo (GUI)", "desc": "(Apenas Windows Pro/Enterprise)", "os": { "win": "gpedit.msc" } },
                { "id": "cmd-regedit", "label": "Editor de Registo (GUI)", "desc": null, "os": { "win": "regedit" } },
                { "id": "cmd-gpupdate", "label": "Forçar Atualização de Política (Admin)", "desc": "Aplica novas políticas de grupo imediatamente", "os": { "win": "gpupdate /force" } },
                { "id": "cmd-shutdown-r", "label": "Reiniciar o PC (Terminal)", "desc": "Força o reinício em 1 minuto", "os": { "win": "shutdown /r /t 60", "mac": "sudo shutdown -r now", "linux": "sudo shutdown -r now" } },
                { "id": "cmd-shutdown-s", "label": "Desligar o PC (Terminal)", "desc": "Força o desligamento em 1 minuto", "os": { "win": "shutdown /s /t 60", "mac": "sudo shutdown -h now", "linux": "sudo shutdown -h now" } },
                { "id": "cmd-mac-diskutil", "label": "Verificar Disco (Terminal)", "desc": "Verifica a integridade do disco principal", "os": { "mac": "diskutil verifyVolume /" } },
                { "id": "cmd-mac-repairperm", "label": "Reparar Permissões (Terminal)", "desc": "Repara permissões no disco de utilizador", "os": { "mac": "diskutil resetUserPermissions / `id -u`" } },
                { "id": "cmd-mac-firstaid", "label": "Primeiros Socorros no Disco (Terminal)", "desc": "Tenta reparar o volume principal", "os": { "mac": "diskutil repairVolume /" } },
                { "id": "cmd-lin-fsck", "label": "Verificar Disco (Terminal)", "desc": "Verifica /dev/sda1 (substituir)", "os": { "linux": "sudo fsck /dev/sda1" } },
                { "id": "cmd-lin-logs", "label": "Ver Logs do Sistema (Terminal)", "desc": "Mostra os logs em tempo real", "os": { "linux": "journalctl -f" } },
                { "id": "cmd-lin-dmesg", "label": "Ver Logs de Hardware (Terminal)", "desc": "Mostra mensagens do kernel (drivers, hardware)", "os": { "linux": "dmesg -H" } }
            ]
        },
        {
            "title": "Gestão de Pacotes e Software",
            "commands": [
              { "id": "cmd-appwiz", "label": "Adicionar/Remover Programas (GUI)", "desc": null, "os": { "win": "appwiz.cpl" } },
              { "id": "cmd-winget-list", "label": "Listar Programas (Winget)", "desc": "Mostra todos os pacotes instalados via Winget", "os": { "win": "winget list" } },
              { "id": "cmd-brew-list", "label": "Listar Programas (Brew)", "desc": "Mostra todos os pacotes instalados via Homebrew", "os": { "mac": "brew list" } },
              { "id": "cmd-apt-list", "label": "Listar Programas (Apt)", "desc": "Mostra todos os pacotes instalados via Apt", "os": { "linux": "apt list --installed" } },
              { "id": "cmd-snap-list", "label": "Listar Programas (Snap)", "desc": "Mostra todos os pacotes instalados via Snap", "os": { "linux": "snap list" } }
            ]
        },
        {
            "title": "Gestão de Ficheiros (Terminal)",
            "commands": [
              { "id": "cmd-dir", "label": "Listar Ficheiros", "desc": null, "os": { "win": "dir", "mac": "ls -la", "linux": "ls -la" } },
              { "id": "cmd-cd", "label": "Mudar de Pasta", "desc": "Substitua 'NOME_DA_PASTA'", "os": { "win": "cd NOME_DA_PASTA", "mac": "cd NOME_DA_PASTA", "linux": "cd NOME_DA_PASTA" } },
              { "id": "cmd-mkdir", "label": "Criar Pasta", "desc": "Substitua 'NOME_DA_PASTA'", "os": { "win": "mkdir NOME_DA_PASTA", "mac": "mkdir NOME_DA_PASTA", "linux": "mkdir NOME_DA_PASTA" } },
              { "id": "cmd-del", "label": "Apagar Ficheiro", "desc": "Substitua 'NOME_DO_FICHEIRO'", "os": { "win": "del NOME_DO_FICHEIRO", "mac": "rm NOME_DO_FICHEIRO", "linux": "rm NOME_DO_FICHEIRO" } },
              { "id": "cmd-rmdir", "label": "Apagar Pasta (Vazia)", "desc": "Substitua 'NOME_DA_PASTA'", "os": { "win": "rmdir NOME_DA_PASTA", "mac": "rmdir NOME_DA_PASTA", "linux": "rmdir NOME_DA_PASTA" } },
              { "id": "cmd-del-force", "label": "Forçar Apagar Pasta (Admin)", "desc": "Apaga a pasta e tudo o que está dentro. CUIDADO!", "os": { "win": "rmdir /s /q NOME_DA_PASTA", "mac": "sudo rm -rf NOME_DA_PASTA", "linux": "sudo rm -rf NOME_DA_PASTA" } },
              { "id": "cmd-find", "label": "Procurar Ficheiro (Terminal)", "desc": "Substitua [nome]", "os": { "win": "dir [nome] /s", "mac": "find . -name [nome]", "linux": "find . -name [nome]" } },
              { "id": "cmd-chmod", "label": "Alterar Permissões (Admin)", "desc": "Exemplo: dar permissão de execução a um script", "os": { "mac": "chmod +x [script.sh]", "linux": "chmod +x [script.sh]" } }
            ]
        }
    ];

    // --- 1. A LÓGICA DO "BAÚ" ---
    let currentOS = 'auto'; // 'auto', 'win', 'mac', 'linux'
    
    // VARIÁVEIS DE REDIMENSIONAMENTO (NOVAS)
    const MIN_WIDTH = 300;
    const MIN_HEIGHT = 200;
    let resizeHandle; // << DECLARADO AQUI
    
    const ICONS = {
        COMPUTER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="bau-svg-icon"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>`,
        CLOSE: `<svg class="bau-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`,
    };
    
    const DESIGN_COLORS = {
        '--cor-acento-primario': '#00BFFF', '--cor-acento-hover': '#40E0D0', '--cor-acento-texto': '#0D1117', '--cor-fundo-primario': '#0D1117', '--cor-fundo-secundario': '#161B22', '--cor-fundo-terciario': '#21262D', '--cor-fundo-hover': '#21262d55', '--cor-borda': '#30363D', '--cor-texto-primario': '#C9D1D9', '--cor-texto-secundario': '#8B949E', '--cor-texto-desabilitado': '#484F58', '--cor-perigo': '#F47067', '--cor-perigo-hover': '#FF8080', '--cor-sucesso': '#3FB950', '--cor-info': '#58A6FF', '--glow-color': 'rgba(0, 191, 255, 0.2)', '--glow-hover-color': 'rgba(64, 224, 208, 0.3)', '--sombra-popup': '0 0 15px rgba(0, 191, 255, 0.1), 0 4px 8px rgba(0,0,0,0.3)'
    };
    
    function applyThemeColors(colors) {
        const root = document.documentElement;
        if (!colors) return;
        for (const [key, value] of Object.entries(colors)) {
            if (key.startsWith('--')) {
                root.style.setProperty(key, value);
            }
        }
    }

    function getActiveOS() {
        if (currentOS !== 'auto') {
            return currentOS;
        }
        const platform = navigator.platform.toLowerCase();
        if (platform.includes('win')) return 'win';
        if (platform.includes('mac')) return 'mac';
        if (platform.includes('linux')) return 'linux';
        return 'unknown';
    }

    function openBauTab(evt, tabName) {
        let i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("bau-tab-content");
        for (i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";
        
        tablinks = document.getElementsByClassName("bau-sidebar-btn"); // Original
        
        for (i = 0; i < tablinks.length; i++) tablinks[i].className = tablinks[i].className.replace(" active", "");
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";
    }

    function copyCommand(inputId, buttonElement) {
        const inputElement = document.getElementById(inputId);
        const copyButton = buttonElement;
        
        inputElement.select();
        
        try {
            navigator.clipboard.writeText(inputElement.value).then(() => {
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copiado!';
                copyButton.style.backgroundColor = 'var(--cor-sucesso)';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    if (copyButton.id.includes('install')) copyButton.style.backgroundColor = 'var(--cor-sucesso)';
                    else if (copyButton.id.includes('force-auto')) copyButton.style.backgroundColor = 'var(--cor-sucesso)';
                    else if (copyButton.id.includes('force-1g')) copyButton.style.backgroundColor = 'var(--cor-perigo)';
                    else if (copyButton.classList.contains('run-test')) copyButton.style.backgroundColor = 'var(--cor-info)';
                    else copyButton.style.backgroundColor = 'var(--cor-acento-primario)';
                }, 2000);
            });
        } catch (e) {
            alert("Não foi possível copiar. Por favor, copie manualmente (Ctrl+C).");
        }
    }
    
    // ***
    // *** FUNÇÃO makeDraggable ATUALIZADA
    // ***
    function makeDraggable(element, header, onClickCallback) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let initialClickX = 0, initialClickY = 0;
        let wasDragged = false;
        const dragThreshold = 5;

        if (header) header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            
            if (e.target.classList.contains('os-btn')) return;

            // Previne a seleção de texto na área do header da janela principal
            if (element.id === 'bau-rede') {
                 e.preventDefault();
            }
            
            // Desativa a transição CSS TEMPORARIAMENTE para arrasto suave (CORREÇÃO DE LENTIDÃO)
            element.style.transition = 'none'; 
            
            // Redefine o estado de arrasto e regista a posição inicial
            wasDragged = false; 
            initialClickX = e.clientX;
            initialClickY = e.clientY;
            
            pos3 = e.clientX; pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event; 
            e.preventDefault(); // Impede a seleção de texto durante o arrasto
            
            // Deteta movimento para diferenciar de um clique
            if (Math.abs(e.clientX - initialClickX) > dragThreshold || Math.abs(e.clientY - initialClickY) > dragThreshold) {
                wasDragged = true;
            }
            
            // Calcula o novo movimento
            pos1 = pos3 - e.clientX; // delta X
            pos2 = pos4 - e.clientY; // delta Y
            pos3 = e.clientX; // nova posição X do rato
            pos4 = e.clientY; // nova posição Y do rato
            
            // Define a nova posição do elemento
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }
        
        function closeDragElement(e) {
            // Reativa a transição CSS
            element.style.transition = 'var(--transicao-padrao)'; 

            // Se NÃO foi um arrasto E foi fornecido um callback, executa a ação de clique/abertura
            if (!wasDragged && onClickCallback) {
                onClickCallback();
            }
            
            // Para de ouvir os eventos de movimento e soltar
            document.onmouseup = null; 
            document.onmousemove = null;
        }
    }
    
    // ***
    // *** FUNÇÃO makeResizable (NOVA)
    // ***
    function makeResizable(element, handle) {
        let startX, startY, startWidth, startHeight;

        handle.onmousedown = function(e) {
            e = e || window.event;
            e.preventDefault();

            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
            
            element.style.transition = 'none';

            document.onmousemove = resizeElement;
            document.onmouseup = stopResize;
        };

        function resizeElement(e) {
            e = e || window.event;
            e.preventDefault();
            
            let newWidth = startWidth + e.clientX - startX;
            let newHeight = startHeight + e.clientY - startY;

            // Aplicar limites mínimos
            if (newWidth > MIN_WIDTH) {
                element.style.width = newWidth + 'px';
            }
            if (newHeight > MIN_HEIGHT) {
                element.style.height = newHeight + 'px';
                
                // Ajustar a altura do body da janela para que o conteúdo preencha a nova altura
                const headerHeight = parseInt(document.defaultView.getComputedStyle(document.getElementById('bau-rede-header')).height, 10);
                const newBodyHeight = newHeight - headerHeight - 1; // 1px para a borda
                document.getElementById('bau-rede-body').style.height = newBodyHeight + 'px';
            }
        }

        function stopResize() {
            element.style.transition = 'var(--transicao-padrao)';
            document.onmousemove = null;
            document.onmouseup = null;
        }
    }
    // *** FIM DAS FUNÇÕES PRINCIPAIS ***
    
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return str.replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }

    // --- 2. O ESTILO (CSS) V20.1 ---
    const styles = `
        :root {
            --raio-borda: 4px;
            --transicao-padrao: all 0.2s ease-in-out;
        }
        
        /* *** BOTÃO FLUTUANTE AUMENTADO *** */
        #bau-trigger-button {
            position: fixed;
            width: 48px; /* Aumentado */
            height: 48px; /* Aumentado */
            bottom: 20px;
            right: 20px;
            background: linear-gradient(145deg, var(--cor-fundo-terciario), var(--cor-fundo-primario));
            color: var(--cor-acento-primario);
            border: 1px solid var(--cor-borda);
            border-radius: 50%;
            font-size: 24px; /* Aumentado */
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5), 0 0 5px var(--glow-color) inset;
            z-index: 2147483646;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transicao-padrao);
            user-select: none;
        }
        #bau-trigger-button:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 20px rgba(0,0,0,0.6), 0 0 15px var(--glow-color), 0 0 8px var(--glow-color) inset;
            border-color: var(--cor-acento-hover);
        }
        .bau-svg-icon { width: 1.2em; height: 1.2em; fill: currentColor; }
        
        #bau-rede { 
            position: fixed; 
            z-index: 2147483647; 
            background-color: var(--cor-fundo-primario); 
            border: 1px solid var(--cor-borda); 
            text-align: left; 
            top: 10%; 
            left: 10%; 
            width: 700px; /* Aumentado */
            height: 550px; /* Aumentado */
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            box-shadow: var(--sombra-popup); 
            border-radius: 8px; 
            color: var(--cor-texto-primario); 
            overflow: hidden; 
            display: none; 
        }
        
        /* CABEÇALHO V20.1 */
        #bau-rede-header { 
            padding: 12px 18px; /* Aumentado */ 
            cursor: move; 
            z-index: 10; 
            background-color: var(--cor-fundo-secundario); 
            border-bottom: 1px solid var(--cor-borda); 
            line-height: 28px; /* Aumentado */
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            flex-shrink: 0;
            height: 50px; /* Altura fixa para cálculo do redimensionamento */
        }
        #bau-rede-header h1 { 
            font-size: 18px; /* Aumentado */
            margin: 0; 
            padding: 0; 
            font-weight: 600;
            display: inline-block;
            vertical-align: middle;
        }
        /* Grupo de botões da direita */
        .header-controls-group {
            display: flex;
            align-items: center;
            gap: 15px; /* Aumentado */
        }
        .window-controls { }
        .window-controls span { cursor: pointer; font-weight: bold; font-size: 20px; /* Aumentado */ color: var(--cor-texto-secundario); margin-left: 10px; /* Aumentado */ transition: color 0.2s; font-family: monospace; vertical-align: middle; }
        .window-controls span:hover { color: var(--cor-perigo-hover); }
        
        /* *** CORREÇÃO DE LAYOUT: FORÇAR OS BOTÕES A FICAREM NA LINHA *** */
        .os-switcher { 
            display: flex; 
            align-items: center;
            vertical-align: middle;
        }
        .os-btn {
            background: var(--cor-fundo-primario);
            color: var(--cor-texto-secundario);
            border: 1px solid var(--cor-borda);
            padding: 4px 10px; /* Aumentado */
            font-size: 13px; /* Aumentado */
            border-radius: 5px; cursor: pointer; margin: 0 3px; transition: all 0.2s;
        }
        .os-btn:hover { background: var(--cor-fundo-hover); color: var(--cor-texto-primario); }
        .os-btn.active { background: var(--cor-acento-primario); color: var(--cor-acento-texto); border-color: var(--cor-acento-primario); font-weight: bold; }
        
        /* ALÇAS DE REDIMENSIONAMENTO */
        .bau-resizer-handle {
            position: absolute;
            z-index: 2147483649; 
            background: transparent;
        }
        .bau-resizer-se { 
            bottom: -5px; 
            right: -5px; 
            width: 15px; 
            height: 15px; 
            cursor: nwse-resize; 
        }

        /* Layout original (barra lateral) */
        #bau-rede-body { 
            display: flex; 
            height: calc(100% - 51px); /* 50px do header + 1px da borda */
            flex-grow: 1; 
        }
        
        .bau-sidebar { flex-basis: 160px; /* Aumentado */ flex-shrink: 0; background-color: var(--cor-fundo-secundario); padding: 10px 0; border-right: 1px solid var(--cor-borda); overflow-y: auto; }
        
        .bau-sidebar-btn { 
            background-color: transparent; 
            display: block; 
            width: 100%; 
            border: none; 
            outline: none; 
            cursor: pointer; 
            padding: 15px 20px; /* Aumentado */
            transition: 0.3s; 
            font-size: 15px; /* Aumentado */
            color: var(--cor-texto-secundario); 
            text-align: left; 
            border-left: 4px solid transparent; 
        }
        .bau-sidebar-btn:hover { color: var(--cor-texto-primario); background-color: var(--cor-fundo-hover); }
        .bau-sidebar-btn.active { 
            color: var(--cor-acento-primario); 
            background-color: var(--cor-fundo-primario); 
            border-left: 4px solid var(--cor-acento-primario); 
            font-weight: bold; 
        }
        .bau-sidebar-divider { height: 1px; background-color: var(--cor-borda); margin: 10px; /* Aumentado */ }
        .bau-sidebar-divider.testes-internos { border-top: 1px dashed var(--cor-borda); height: auto; margin: 10px 0; /* Aumentado */ }
        
        /* Wrapper de Conteúdo (Original) */
        .bau-content-wrapper { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; background: var(--cor-fundo-primario); }
        .bau-content-area { 
            flex-grow: 1; 
            padding: 20px; /* Aumentado */
            overflow-y: auto; 
        }

        .bau-tab-content { display: none; }
        .bau-tab-content p, .bau-tab-content label { font-size: 14px; /* Aumentado */ color: var(--cor-texto-secundario); margin-top: 0; margin-bottom: 8px; /* Aumentado */ display: block; }
        .bau-tab-content input[type="text"] { width: 95%; padding: 10px; /* Aumentado */ margin-bottom: 15px; /* Aumentado */ font-family: "Courier New", monospace; border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); background-color: var(--cor-fundo-secundario); color: var(--cor-texto-primario); font-size: 16px; /* Aumentado */ }
        .input-group { display: flex; justify-content: space-between; }
        .input-half { width: 45% !important; }
        .bau-tab-content h3 { color: var(--cor-texto-primario); font-size: 18px; /* Aumentado */ margin-top: 20px; margin-bottom: 15px; /* Aumentado */ }
        .bau-tab-content h4 { color: var(--cor-texto-primario); border-bottom: 1px solid var(--cor-borda); padding-bottom: 5px; /* Aumentado */ margin-top: 25px; /* Aumentado */ font-size: 16px; /* Aumentado */ }
        .bau-tab-content ul { color: var(--cor-texto-secundario); padding-left: 20px; /* Aumentado */ font-size: 14px; /* Aumentado */ }
        .bau-tab-content li { margin-bottom: 5px; /* Aumentado */ }
        .bau-tab-content code { background: var(--cor-fundo-secundario); padding: 2px 5px; border-radius: 3px; font-family: "Courier New", monospace; }

        .bau-tab-content button { background-color: var(--cor-acento-primario); color: var(--cor-acento-texto); padding: 12px 15px; /* Aumentado */ border: none; border-radius: var(--raio-borda); cursor: pointer; font-size: 16px; /* Aumentado */ font-weight: bold; width: auto; transition: var(--transicao-padrao); }
        .bau-tab-content button:hover { background-color: var(--cor-acento-hover); box-shadow: 0 0 10px var(--glow-hover-color); }
        
        .command-block { margin-bottom: 15px; /* Aumentado */ }
        .command-block label { font-size: 14px; /* Aumentado */ color: var(--cor-texto-primario); }
        .command-block p { font-size: 12px; /* Aumentado */ color: var(--cor-texto-secundario); margin-bottom: 5px; /* Aumentado */ }
        .command-block input { margin-bottom: 8px; /* Aumentado */ }
        .command-block button { width: 95%; }

        .bau-installer-box { background-color: var(--cor-fundo-terciario); border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); padding: 15px; /* Aumentado */ margin-top: 20px; /* Aumentado */ }
        .bau-installer-box label { font-size: 16px; /* Aumentado */ color: var(--cor-texto-primario); font-weight: bold; }
        .bau-installer-box p { font-size: 12px; /* Aumentado */ color: var(--cor-texto-secundario); margin-bottom: 10px; /* Aumentado */ }

        .bau-warning-box { background-color: var(--cor-fundo-terciario); border-left: 4px solid var(--cor-perigo); border-radius: var(--raio-borda); padding: 15px; /* Aumentado */ margin-top: 20px; /* Aumentado */ }
        .bau-warning-box h4 { font-size: 16px; /* Aumentado */ color: var(--cor-perigo); margin: 0 0 10px 0; /* Aumentado */ }
        .bau-warning-box p { font-size: 12px; /* Aumentado */ color: var(--cor-texto-secundario); margin-bottom: 10px; /* Aumentado */ }
        .bau-warning-box label { font-size: 14px; /* Aumentado */ color: var(--cor-texto-primario); font-weight: bold; }

        .registro-box { width: 95%; height: 60px; /* Aumentado */ background: var(--cor-fundo-secundario); color: var(--cor-texto-primario); border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); font-family: "Courier New", monospace; margin-bottom: 10px; /* Aumentado */ padding: 8px; /* Aumentado */ font-size: 14px; /* Aumentado */ }
        .teste-interno-output { width: 95%; height: 100px; /* Aumentado */ background: var(--cor-fundo-secundario); color: var(--cor-texto-primario); border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); font-family: "Courier New", monospace; padding: 10px; /* Aumentado */ white-space: pre-wrap; word-wrap: break-word; font-size: 16px; /* Aumentado */ }

        .bau-radio-group { margin-bottom: 15px; /* Aumentado */ }
        .bau-radio-group label { display: inline-block; margin-right: 20px; /* Aumentado */ color: var(--cor-texto-primario); cursor: pointer; font-size: 12px; /* Aumentado */ }
        .bau-radio-group input[type="radio"] { margin-right: 5px; /* Aumentado */ vertical-align: middle; accent-color: var(--cor-acento-primario); }
        .bau-divider-horizontal { height: 1px; background-color: var(--cor-borda); margin: 30px 0 20px 0; /* Aumentado */ }
        
        .os-commands-block { display: block !important; } /* CORREÇÃO FINAL DE VISIBILIDADE */
        
        #import-export-box { padding: 15px; margin-top: 20px; }
        #import-export-box button { margin-right: 10px; padding: 8px 12px; font-size: 13px; }
        #import-json-area { display: none; width: 95%; height: 150px; margin-top: 10px; background: var(--cor-fundo-secundario); color: var(--cor-texto-primario); font-size: 13px; padding: 8px; }
    `;

    // --- 3. O CONTEÚDO (HTML) V20.1 (Criado via DOM) ---
    
    const bauElement = document.createElement('div');
    bauElement.id = 'bau-rede';
    bauElement.style.display = 'none'; // Começa escondido

    // -- Header --
    const header = document.createElement('div');
    header.id = 'bau-rede-header';
    const title = document.createElement('h1');
    title.textContent = 'Baú de Acesso Remoto - BAR';
    header.appendChild(title);

    const headerControlsGroup = document.createElement('div');
    headerControlsGroup.className = 'header-controls-group';

    const osSwitcher = document.createElement('div');
    osSwitcher.className = 'os-switcher';
    const btnAuto = document.createElement('button');
    btnAuto.className = 'os-btn active';
    btnAuto.id = 'os-auto';
    btnAuto.textContent = 'Auto';
    osSwitcher.appendChild(btnAuto);
    const btnWin = document.createElement('button');
    btnWin.className = 'os-btn';
    btnWin.id = 'os-win';
    btnWin.textContent = 'Win';
    osSwitcher.appendChild(btnWin);
    const btnMac = document.createElement('button');
    btnMac.className = 'os-btn';
    btnMac.id = 'os-mac';
    btnMac.textContent = 'Mac';
    osSwitcher.appendChild(btnMac);
    const btnLin = document.createElement('button');
    btnLin.className = 'os-btn';
    btnLin.id = 'os-lin';
    btnLin.textContent = 'Lin';
    osSwitcher.appendChild(btnLin);
    headerControlsGroup.appendChild(osSwitcher);

    const controls = document.createElement('div');
    controls.className = 'window-controls';
    const closeBtn = document.createElement('span');
    closeBtn.id = 'bau-close-btn';
    closeBtn.title = 'Fechar Baú';
    closeBtn.innerHTML = ICONS.CLOSE;
    controls.appendChild(closeBtn);
    headerControlsGroup.appendChild(controls);

    header.appendChild(headerControlsGroup);
    bauElement.appendChild(header);

    // -- Body --
    const body = document.createElement('div');
    body.id = 'bau-rede-body';

    // -- Sidebar --
    const sidebar = document.createElement('div');
    sidebar.className = 'bau-sidebar';
    
    // Lista de abas
    const tabs = [
        { id: 'btn-tab-info', text: 'Info' }, 
        { id: 'btn-tab-ip-publico', text: 'IP Público' },
        { id: 'btn-tab-velocidade', text: 'Velocidade' },
        { id: 'divider-1', text: '' },
        { id: 'btn-tab-placa-rede', text: 'Placa de Rede' },
        { id: 'btn-tab-ping', text: 'Ping' },
        { id: 'btn-tab-traceroute', text: 'Traceroute' },
        { id: 'btn-tab-pathping', text: 'PathPing/MTR' },
        { id: 'btn-tab-dns', text: 'DNS' },
        { id: 'btn-tab-nmap', text: 'Nmap' },
        { id: 'btn-tab-test-port', text: 'Testar Porta' }, 
        { id: 'btn-tab-arp', text: 'ARP' },
        { id: 'btn-tab-route', text: 'Route' },
        { id: 'btn-tab-netstat', text: 'Netstat' },
        { id: 'btn-tab-atualizacoes', text: 'Atualizações' }, 
        { id: 'btn-tab-comandos', text: 'Comandos' },
        { id: 'divider-2', text: '' },
        { id: 'btn-tab-registro', text: 'Registro' }
    ];

    tabs.forEach(tab => {
        if (tab.id.startsWith('divider')) {
            const divider = document.createElement('div');
            divider.className = (tab.id === 'divider-1') ? 'bau-sidebar-divider testes-internos' : 'bau-sidebar-divider';
            sidebar.appendChild(divider);
        } else {
            const btn = document.createElement('button');
            btn.className = 'bau-sidebar-btn';
            btn.id = tab.id;
            btn.textContent = tab.text;
            sidebar.appendChild(btn);
        }
    });
    body.appendChild(sidebar); // Adicionado ao 'body'

    // -- Content Wrapper --
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'bau-content-wrapper';

    // -- Content Area --
    const contentArea = document.createElement('div');
    contentArea.className = 'bau-content-area';
    
    // *** ALÇA DE REDIMENSIONAMENTO (Handle) ***
    resizeHandle = document.createElement('div'); 
    resizeHandle.className = 'bau-resizer-handle bau-resizer-se';
    bauElement.appendChild(resizeHandle);
    // *** FIM DA ALÇA DE REDIMENSIONAMENTO ***

    // (Funções Helper de criação de elementos)
    function createTabContent(id, titleText) { const d = document.createElement('div'); d.id = id; d.className = 'bau-tab-content'; const h = document.createElement('h3'); h.textContent = titleText; d.appendChild(h); return d; }
    function createP(text) { const p = document.createElement('p'); p.textContent = text; return p; }
    function createH4(text) { const h = document.createElement('h4'); h.textContent = text; return h; }
    function createUL() { return document.createElement('ul'); }
    function createLI(text) { const l = document.createElement('li'); l.textContent = text; return l; }
    function createLabel(text) { const l = document.createElement('label'); l.textContent = text; return l; }
    function createInput(id, value, isReadOnly = false, className) { const i = document.createElement('input'); i.type = 'text'; i.id = id; if (value) i.value = value; if (isReadOnly) i.readOnly = true; if(className) i.className = className; return i; }
    function createButton(id, text, className) { const b = document.createElement('button'); b.id = id; b.textContent = text; if(className) b.className = className; return b; }
    function createTextarea(id, placeholder, className = 'registro-box') { const t = document.createElement('textarea'); t.id = id; t.className = className; t.placeholder = placeholder; return t; }
    function createPre(id, text) { const p = document.createElement('pre'); p.id = id; p.className = 'teste-interno-output'; if (text) p.textContent = text; return p; }
    function createCommandEntry(os, label, desc, cmd, id) {
        const div = document.createElement('div');
        div.className = 'command-block os-commands-block os-' + os;
        div.appendChild(createLabel(label));
        if (desc) div.appendChild(createP(desc));
        const inputId = `${os}-${id}`;
        div.appendChild(createInput(inputId, cmd, true));
        const btn = createButton('copy-' + id, 'Copiar Comando', 'bau-copy-btn');
        btn.setAttribute('data-input-id', inputId);
        div.appendChild(btn);
        return div;
    }
    function createInstallerBox(idPrefix, descId, inputId, btnId) {
        const box = document.createElement('div'); box.id = idPrefix + '-installer-box'; box.className = 'bau-installer-box';
        box.appendChild(createLabel('Instalação (Se necessário)'));
        const descP = document.createElement('p'); descP.id = descId; box.appendChild(descP);
        box.appendChild(createInput(inputId, '', true));
        const btn = createButton(btnId, 'Copiar Comando de Instalação', 'bau-copy-btn');
        btn.setAttribute('data-input-id', inputId);
        box.appendChild(btn);
        return box;
    }
    function createWarningBox(content) {
        const box = document.createElement('div'); box.className = 'bau-warning-box';
        const h4 = document.createElement('h4'); h4.textContent = 'Avançado: Forçar Velocidade (Risco)'; box.appendChild(h4);
        box.appendChild(createP('AVISO: Só use isto se souber o que está a fazer. Se forçar 1.0 Gbps e o seu cabo/router não suportar, a sua rede VAI FALHAR. Use o comando "Voltar ao Automático" para reverter.'));
        box.appendChild(createP('No Mac, o "Nome da Placa" é o "Service Name" (ex: "Ethernet"). Encontre-o com: networksetup -listallnetworkservices'));
        box.appendChild(createLabel('1. Nome da Placa (visto no teste acima):'));
        box.appendChild(createInput('placa-nome-input', '', false));
        box.appendChild(createLabel('2. Comando (Admin) para Forçar 1 Gbps Full:'));
        box.appendChild(createInput('placa-force-1g-cmd', '', true));
        const btn1g = createButton('copy-placa-force-1g-btn', 'Copiar Comando (Admin)', 'bau-copy-btn');
        btn1g.setAttribute('data-input-id', 'placa-force-1g-cmd');
        box.appendChild(btn1g);
        box.appendChild(createLabel('3. Comando (Admin) para Voltar ao Automático:'));
        box.appendChild(createInput('placa-force-auto-cmd', '', true));
        const btnAuto = createButton('copy-placa-force-auto-btn', 'Copiar Comando (Admin)', 'bau-copy-btn auto-btn');
        btnAuto.setAttribute('data-input-id', 'placa-force-auto-cmd');
        box.appendChild(btnAuto);
        return box;
    }
    
    // --- Aba de Informação ---
    const tabInfo = createTabContent('tab-info', 'Informações');
    tabInfo.appendChild(createP('Bem-vindo ao Baú de Acesso Remoto (BAR). Esta ferramenta ajuda-o a diagnosticar problemas de rede.'));
    tabInfo.appendChild(createH4('Como Usar'));
    const ulUse = createUL();
    ulUse.appendChild(createLI('Testes Internos (IP Público, Velocidade): São executados aqui no navegador. Clique no botão para iniciar.'));
    ulUse.appendChild(createLI('Testes Externos (Ping, Nmap, etc.): O "Baú" gera o comando. Você deve copiá-lo e colá-lo no seu terminal (CMD, PowerShell, etc.).'));
    ulUse.appendChild(createLI('Seletor de SO (Win/Mac/Lin): No topo, pode trocar o sistema para ver os comandos de outra pessoa.'));
    ulUse.appendChild(createLI('Registro: Cole os resultados dos seus testes do terminal nas caixas corretas e gere um relatório para imprimir/salvar.'));
    tabInfo.appendChild(ulUse);
    tabInfo.appendChild(createH4('Como Abrir o Terminal'));
    const ulTerm = createUL();
    ulTerm.appendChild(createLI('Windows: Pressione a tecla Windows + R, digite "cmd" (para Prompt) ou "powershell" (recomendado) e pressione Enter.'));
    ulTerm.appendChild(createLI('Mac: Pressione Cmd + Espaço, digite "Terminal" e pressione Enter.'));
    ulTerm.appendChild(createLI('Linux (Ubuntu): Pressione Ctrl + Alt + T.'));
    tabInfo.appendChild(ulTerm);
    
    // Caixa de Import/Export
    const ieBox = document.createElement('div');
    ieBox.id = 'import-export-box';
    ieBox.appendChild(createH4('Importar/Exportar Comandos'));
    ieBox.appendChild(createP('Guarde ou carregue o seu banco de dados de comandos em formato JSON.'));
    ieBox.appendChild(createButton('btn-export-json', 'Exportar JSON', 'run-test'));
    ieBox.appendChild(createButton('btn-import-json', 'Importar JSON', 'auto-btn'));
    const importArea = createTextarea('import-json-area', 'Cole o conteúdo do seu comandos.json aqui...');
    importArea.style.display = 'none'; // Começa escondido
    ieBox.appendChild(importArea);
    tabInfo.appendChild(ieBox);
    
    contentArea.appendChild(tabInfo);


    // --- Abas Internas ---
    const tabIpPublico = createTabContent('tab-ip-publico', 'Descobrir Meu IP Público');
    tabIpPublico.appendChild(createP('Este teste usa uma API (api.ipify.org) para descobrir o seu IP público.'));
    tabIpPublico.appendChild(createButton('btn-descobrir-ip-publico', 'Descobrir IP Público', 'run-test'));
    tabIpPublico.appendChild(createPre('meu-ip-publico-output', 'Clique no botão para iniciar...'));
    contentArea.appendChild(tabIpPublico);

    const tabVelocidade = createTabContent('tab-velocidade', 'Teste de Velocidade');
    tabVelocidade.appendChild(createLabel('Teste Interno (Navegador)'));
    tabVelocidade.appendChild(createP('Este teste baixa um ficheiro para estimar a sua velocidade de download.'));
    const radioGroup = document.createElement('div');
    radioGroup.className = 'bau-radio-group';
    radioGroup.appendChild(createLabel('Tamanho do Ficheiro de Teste:'));
    const sizes = ['10', '50', '100'];
    sizes.forEach(size => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'speedtest-size'; radio.value = size;
        if (size === '50') radio.checked = true;
        label.appendChild(radio); label.appendChild(document.createTextNode(` ${size} MB`));
        radioGroup.appendChild(label);
    });
    tabVelocidade.appendChild(radioGroup);
    tabVelocidade.appendChild(createButton('btn-teste-velocidade', 'Iniciar Teste de Velocidade', 'run-test'));
    tabVelocidade.appendChild(createPre('velocidade-output', 'Clique no botão para iniciar...'));
    const divider = document.createElement('div');
    divider.className = 'bau-divider-horizontal';
    tabVelocidade.appendChild(divider);
    tabVelocidade.appendChild(createLabel('Teste Externo (Terminal)'));
    tabVelocidade.appendChild(createP('Este comando usa o "speedtest-cli" no seu terminal para um teste mais preciso. Requer instalação.'));
    tabVelocidade.appendChild(createLabel('Comando de Teste:'));
    tabVelocidade.appendChild(createInput('speedtest-command-output', '', true));
    const btnSpdCmd = createButton('copy-speedtest-cmd-btn', 'Copiar Comando', 'bau-copy-btn');
    btnSpdCmd.setAttribute('data-input-id', 'speedtest-command-output');
    tabVelocidade.appendChild(btnSpdCmd);
    tabVelocidade.appendChild(createInstallerBox('speedtest', 'speedtest-installer-desc', 'speedtest-install-command', 'copy-speedtest-install-btn'));
    contentArea.appendChild(tabVelocidade);

    // --- Abas de Comando ---
    
    const tabPlacaRede = createTabContent('tab-placa-rede', 'Info da Placa de Rede');
    tabPlacaRede.appendChild(createP('Este comando verifica as suas placas de rede ativas, o tipo (Cabo/Wi-Fi) e a velocidade negociada (100/1000 Mbps).'));
    tabPlacaRede.appendChild(createP('NOTA: O comando do Windows deve ser colado no "Prompt de Comando" (CMD).'));
    tabPlacaRede.appendChild(createLabel('1. Comando de Diagnóstico:'));
    tabPlacaRede.appendChild(createInput('placa-rede-command-output', '', true));
    const btnPlaca = createButton('copy-placa-rede-btn', 'Copiar Comando', 'bau-copy-btn');
    btnPlaca.setAttribute('data-input-id', 'placa-rede-command-output');
    tabPlacaRede.appendChild(btnPlaca);
    tabPlacaRede.appendChild(createWarningBox());
    contentArea.appendChild(tabPlacaRede);

    const tabPing = createTabContent('tab-ping', 'Teste de Ping');
    tabPing.appendChild(createP('Este comando testa a latência para um host.'));
    tabPing.appendChild(createLabel('IP ou Host Alvo:'));
    tabPing.appendChild(createInput('ping-host-input', '8.8.8.8'));
    tabPing.appendChild(createLabel('Comando de Teste:'));
    tabPing.appendChild(createInput('ping-command-output', '', true));
    const btnPing = createButton('copy-ping-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
    btnPing.setAttribute('data-input-id', 'ping-command-output');
    tabPing.appendChild(btnPing);
    contentArea.appendChild(tabPing);

    const tabTr = createTabContent('tab-traceroute', 'Teste de Traceroute');
    tabTr.appendChild(createP('Este comando mapeia a rota da sua rede até o host.'));
    tabTr.appendChild(createLabel('IP ou Host Alvo:'));
    tabTr.appendChild(createInput('tr-host-input', 'google.com'));
    tabTr.appendChild(createLabel('Comando de Teste:'));
    tabTr.appendChild(createInput('tr-command-output', '', true));
    const btnTr = createButton('copy-tr-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
    btnTr.setAttribute('data-input-id', 'tr-command-output');
    tabTr.appendChild(btnTr);
    contentArea.appendChild(tabTr);

    const tabPp = createTabContent('tab-pathping', 'Teste de PathPing / MTR');
    tabPp.appendChild(createP('Combina Ping e Traceroute.'));
    tabPp.appendChild(createLabel('IP ou Host Alvo:'));
    tabPp.appendChild(createInput('pp-host-input', 'google.com'));
    tabPp.appendChild(createLabel('Comando de Teste:'));
    tabPp.appendChild(createInput('pp-command-output', '', true));
    const btnPp = createButton('copy-pp-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
    btnPp.setAttribute('data-input-id', 'pp-command-output');
    tabPp.appendChild(btnPp);
    tabPp.appendChild(createInstallerBox('pp', 'pp-installer-desc', 'pp-install-command', 'copy-pp-install-btn'));
    contentArea.appendChild(tabPp);

    const tabNmap = createTabContent('tab-nmap', 'Scan de Portas (Nmap)');
    tabNmap.appendChild(createP('Escaneia portas abertas. Requer instalação prévia.'));
    tabNmap.appendChild(createLabel('IP Alvo (ex: 192.168.1.1):'));
    tabNmap.appendChild(createInput('nmap-host-input', '127.0.0.1'));
    tabNmap.appendChild(createLabel('Comando de Teste:'));
    tabNmap.appendChild(createInput('nmap-command-output', '', true));
    const btnNmap = createButton('copy-nmap-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
    btnNmap.setAttribute('data-input-id', 'nmap-command-output');
    tabNmap.appendChild(btnNmap);
    tabNmap.appendChild(createInstallerBox('nmap', 'nmap-installer-desc', 'nmap-install-command', 'copy-nmap-install-btn'));
    contentArea.appendChild(tabNmap);

    const tabTestPort = createTabContent('tab-test-port', 'Testar Porta Única');
    tabTestPort.appendChild(createP('Verifica rapidamente se uma porta específica está aberta num host.'));
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    const hostGroup = document.createElement('div');
    hostGroup.className = 'input-half';
    hostGroup.appendChild(createLabel('IP ou Host Alvo:'));
    hostGroup.appendChild(createInput('port-host-input', 'google.com', false));
    inputGroup.appendChild(hostGroup);
    const portGroup = document.createElement('div');
    portGroup.className = 'input-half';
    portGroup.appendChild(createLabel('Porta (ex: 80, 443):'));
    portGroup.appendChild(createInput('port-num-input', '443', false));
    inputGroup.appendChild(portGroup);
    tabTestPort.appendChild(inputGroup);
    tabTestPort.appendChild(createLabel('Comando de Teste:'));
    tabTestPort.appendChild(createInput('port-command-output', '', true));
    const btnPort = createButton('copy-port-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
    btnPort.setAttribute('data-input-id', 'port-command-output');
    tabTestPort.appendChild(btnPort);
    contentArea.appendChild(tabTestPort);

    const tabNetstat = createTabContent('tab-netstat', 'Conexões Ativas (Netstat)');
    tabNetstat.appendChild(createP('Mostra as conexões de rede ativas na sua máquina.'));
    tabNetstat.appendChild(createLabel('Comando de Teste:'));
    tabNetstat.appendChild(createInput('netstat-command-output', 'netstat -an', true));
    const btnNetstat = createButton('copy-netstat-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
    btnNetstat.setAttribute('data-input-id', 'netstat-command-output');
    tabNetstat.appendChild(btnNetstat);
    contentArea.appendChild(tabNetstat);

    const tabDns = createTabContent('tab-dns', 'Teste de DNS (nslookup)');
    tabDns.appendChild(createP('Verifica a resolução de nomes de domínio para IP.'));
    tabDns.appendChild(createLabel('Domínio para consultar (ex: google.com):'));
    tabDns.appendChild(createInput('dns-host-input', 'google.com', false));
    tabDns.appendChild(createLabel('Comando de Teste:'));
    tabDns.appendChild(createInput('dns-command-output', '', true));
    const btnDns = createButton('copy-dns-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
    btnDns.setAttribute('data-input-id', 'dns-command-output');
    tabDns.appendChild(btnDns);
    contentArea.appendChild(tabDns);

    const tabArp = createTabContent('tab-arp', 'Tabela ARP');
    tabArp.appendChild(createP('Mostra a cache ARP (mapeamento de IP para MAC) da rede local.'));
    tabArp.appendChild(createLabel('Comando de Teste:'));
    tabArp.appendChild(createInput('arp-command-output', 'arp -a', true));
    const btnArp = createButton('copy-arp-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
    btnArp.setAttribute('data-input-id', 'arp-command-output');
    tabArp.appendChild(btnArp);
    contentArea.appendChild(tabArp);

    const tabRoute = createTabContent('tab-route', 'Tabela de Roteamento');
    tabRoute.appendChild(createP('Mostra as rotas de rede do seu sistema.'));
    tabRoute.appendChild(createLabel('Comando de Teste:'));
    tabRoute.appendChild(createInput('route-command-output', '', true));
    const btnRoute = createButton('copy-route-btn', 'Copiar Comando de Teste', 'bau-copy-btn');
    btnRoute.setAttribute('data-input-id', 'route-command-output');
    tabRoute.appendChild(btnRoute);
    contentArea.appendChild(tabRoute);

    const tabAtualizacoes = createTabContent('tab-atualizacoes', 'Atualização de Sistema e Pacotes');
    tabAtualizacoes.appendChild(createP('Manter o sistema e os pacotes atualizados é crucial para a segurança e performance.'));
    const winUpdates1 = document.createElement('div');
    winUpdates1.id = 'win-updates1-cmd';
    winUpdates1.className = 'os-commands-block os-win';
    winUpdates1.appendChild(createLabel('Comando 1 (Windows Update + Drivers):'));
    winUpdates1.appendChild(createInput('win-update-cmd', '', true));
    const btnWinUp = createButton('copy-win-update-cmd', 'Copiar Comando', 'bau-copy-btn');
    btnWinUp.setAttribute('data-input-id', 'win-update-cmd');
    winUpdates1.appendChild(btnWinUp);
    tabAtualizacoes.appendChild(winUpdates1);
    const winUpdates2 = document.createElement('div');
    winUpdates2.id = 'win-updates2-cmd';
    winUpdates2.className = 'os-commands-block os-win';
    winUpdates2.appendChild(createLabel('Comando 2 (Pacotes Winget):'));
    winUpdates2.appendChild(createInput('win-pkg-cmd', '', true));
    const btnWinPkg = createButton('copy-win-pkg-cmd', 'Copiar Comando', 'bau-copy-btn');
    btnWinPkg.setAttribute('data-input-id', 'win-pkg-cmd');
    winUpdates2.appendChild(btnWinPkg);
    tabAtualizacoes.appendChild(winUpdates2);
    const nixUpdates = document.createElement('div');
    nixUpdates.id = 'nix-updates-cmd';
    nixUpdates.className = 'os-commands-block os-mac os-linux';
    nixUpdates.appendChild(createLabel('Comando de Atualização (Mac/Linux):'));
    nixUpdates.appendChild(createInput('nix-update-cmd', '', true));
    const btnNixUp = createButton('copy-nix-update-cmd', 'Copiar Comando', 'bau-copy-btn');
    btnNixUp.setAttribute('data-input-id', 'nix-update-cmd');
    nixUpdates.appendChild(btnNixUp);
    tabAtualizacoes.appendChild(nixUpdates);
    contentArea.appendChild(tabAtualizacoes);
    
    // Aba Comandos (Container Vazio)
    const tabComandos = createTabContent('tab-comandos', 'Comandos de Acesso Rápido');
    tabComandos.appendChild(createP('Atalhos úteis para ferramentas de sistema (a maioria é para o "Executar" do Windows - Win+R).'));
    contentArea.appendChild(tabComandos);


    // Aba Registro (Atualizada)
    const tabRegistro = createTabContent('tab-registro', 'Registro de Testes');
    tabRegistro.appendChild(createP('Cole o resultado de cada teste na sua caixa correspondente.'));
    tabRegistro.appendChild(createLabel('Resultado do IP Público:'));
    tabRegistro.appendChild(createTextarea('registro-ip-publico-input', 'Cole o resultado do teste "IP Público" aqui...'));
    tabRegistro.appendChild(createLabel('Resultado da Velocidade (Navegador):'));
    tabRegistro.appendChild(createTextarea('registro-velocidade-input', 'Cole o resultado do "Teste de Velocidade" aqui...'));
    tabRegistro.appendChild(createLabel('Resultado da Placa de Rede:'));
    tabRegistro.appendChild(createTextarea('registro-placa-rede-input', 'Cole o resultado do teste da Placa de Rede aqui...'));
    tabRegistro.appendChild(createLabel('Resultado do Ping:'));
    tabRegistro.appendChild(createTextarea('registro-ping-input', 'Cole o resultado do Ping aqui...'));
    tabRegistro.appendChild(createLabel('Resultado do Traceroute:'));
    tabRegistro.appendChild(createTextarea('registro-tr-input', 'Cole o resultado do Traceroute aqui...'));
    tabRegistro.appendChild(createLabel('Resultado do PathPing/MTR:'));
    tabRegistro.appendChild(createTextarea('registro-pp-input', 'Cole o resultado do PathPing/MTR aqui...'));
    tabRegistro.appendChild(createLabel('Resultado do Nmap:'));
    tabRegistro.appendChild(createTextarea('registro-nmap-input', 'Cole o resultado do Nmap aqui...'));
    tabRegistro.appendChild(createLabel('Resultado do Teste de Porta:'));
    tabRegistro.appendChild(createTextarea('registro-test-port-input', 'Cole o resultado do "Teste de Porta" aqui...'));
    tabRegistro.appendChild(createLabel('Resultado do Netstat:'));
    tabRegistro.appendChild(createTextarea('registro-netstat-input', 'Cole o resultado do Netstat aqui...'));
    tabRegistro.appendChild(createLabel('Resultado do DNS (nslookup):'));
    tabRegistro.appendChild(createTextarea('registro-dns-input', 'Cole o resultado do "DNS" aqui...'));
    tabRegistro.appendChild(createLabel('Resultado da Tabela ARP:'));
    tabRegistro.appendChild(createTextarea('registro-arp-input', 'Cole o resultado do "ARP" aqui...'));
    tabRegistro.appendChild(createLabel('Resultado da Tabela de Roteamento:'));
    tabRegistro.appendChild(createTextarea('registro-route-input', 'Cole o resultado do "Route" aqui...'));
    tabRegistro.appendChild(createLabel('Resultado do Speedtest-CLI (Terminal):'));
    tabRegistro.appendChild(createTextarea('registro-speedtest-cli-input', 'Cole o resultado do "speedtest-cli" aqui...'));
    tabRegistro.appendChild(createLabel('Resultado das Atualizações:'));
    tabRegistro.appendChild(createTextarea('registro-updates-input', 'Cole o resultado das atualizações aqui...'));
    tabRegistro.appendChild(createLabel('Resultados dos Comandos:'));
    tabRegistro.appendChild(createTextarea('registro-comandos-input', 'Cole o resultado dos "Comandos" aqui...'));
    
    tabRegistro.appendChild(document.createElement('br'));
    tabRegistro.appendChild(document.createElement('br'));
    tabRegistro.appendChild(createButton('print-registro-btn', 'Gerar Relatório para Print'));
    contentArea.appendChild(tabRegistro);
    
    contentWrapper.appendChild(contentArea); // Adiciona a área de conteúdo ao wrapper
    body.appendChild(contentWrapper); // Adiciona o wrapper ao body
    bauElement.appendChild(body); // Adiciona o body ao elemento principal
    
    // *** ALÇA DE REDIMENSIONAMENTO (Handle) ***
    resizeHandle = document.createElement('div'); // <<< USADO A VARIÁVEL DECLARADA NO INÍCIO
    resizeHandle.className = 'bau-resizer-handle bau-resizer-se';
    bauElement.appendChild(resizeHandle);
    // *** FIM DA ALÇA DE REDIMENSIONAMENTO ***
    
    // --- 4. INJETAR O BAÚ E O BOTÃO ---
    const styleSheet = document.createElement("style");
    styleSheet.id = "bau-rede-styles";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    document.body.appendChild(bauElement);

    const triggerButton = document.createElement('button');
    triggerButton.id = 'bau-trigger-button';
    triggerButton.innerHTML = ICONS.COMPUTER;
    triggerButton.title = 'Abrir Baú de Acesso Remoto';
    document.body.appendChild(triggerButton);
    
    // --- 5. ATIVAR A LÓGICA V20.1 ---
    
    applyThemeColors(DESIGN_COLORS);
    
    // 1. Define a lógica de abertura/fecho para o callback
    const toggleBau = function() {
        if (bauElement.style.display === 'none' || !bauElement.style.display) {
            bauElement.style.display = 'flex';
            bauElement.style.flexDirection = 'column';
            triggerButton.style.display = 'none';
        } else {
            bauElement.style.display = 'none';
            triggerButton.style.display = 'flex';
        }
    };

    // 2. Torna a janela principal arrastável
    makeDraggable(bauElement, header); 
    
    // 3. Torna o botão flutuante arrastável E clicável (passando o callback)
    makeDraggable(triggerButton, triggerButton, toggleBau); 
    
    // 4. Torna a janela redimensionável (usando a nova alça)
    makeResizable(bauElement, resizeHandle);
    
    // O closeBtn ainda precisa da sua própria função para fechar diretamente.
    closeBtn.onclick = function() {
        bauElement.style.display = 'none';
        triggerButton.style.display = 'flex';
    };
    
    // Event Listener Único para todos os botões "Copiar"
    bauElement.addEventListener('click', function(e) {
        if (e.target.classList.contains('bau-copy-btn')) {
            const inputId = e.target.getAttribute('data-input-id');
            if (inputId) {
                copyCommand(inputId, e.target);
            }
        }
    });
    
    // --- Lógica dos Testes Internos ---
    document.getElementById('btn-descobrir-ip-publico').onclick = async function() {
        const btn = document.getElementById('btn-descobrir-ip-publico');
        const output = document.getElementById('meu-ip-publico-output');
        btn.disabled = true; btn.textContent = 'Aguarde...';
        output.textContent = 'A contactar api.ipify.org...';
        try {
            const response = await fetch('https://api.ipify.org');
            if (!response.ok) throw new Error(`Status da resposta: ${response.status}`);
            const ip = await response.text();
            output.textContent = `Seu IP Público é: ${ip}`;
        } catch (e) {
            output.textContent = `Erro ao encontrar IP: ${e.message}`;
        } finally {
            btn.disabled = false; btn.textContent = 'Descobrir IP Público';
        }
    };

    document.getElementById('btn-teste-velocidade').onclick = async function() {
        const btn = document.getElementById('btn-teste-velocidade');
        const output = document.getElementById('velocidade-output');
        btn.disabled = true; btn.textContent = 'A testar...';
        const sizeValue = document.querySelector('input[name="speedtest-size"]:checked').value;
        let testUrl, fileSizeInBytes;
        switch(sizeValue) {
            case '10': testUrl = 'https://cachefly.cachefly.net/10mb.test'; fileSizeInBytes = 10 * 1024 * 1024; break;
            case '100': testUrl = 'https://cachefly.cachefly.net/100mb.test'; fileSizeInBytes = 100 * 1024 * 1024; break;
            case '50': default: testUrl = 'https://cachefly.cachefly.net/50mb.test'; fileSizeInBytes = 50 * 1024 * 1024;
        }
        output.textContent = `A iniciar download de ${fileSizeInBytes / 1024 / 1024}MB...`;
        try {
            const startTime = performance.now();
            const response = await fetch(testUrl + '?t=' + new Date().getTime());
            if (!response.ok) throw new Error(`Erro no servidor: ${response.status}`);
            await response.blob();
            const endTime = performance.now();
            const durationInSeconds = (endTime - startTime) / 1000;
            const bitsPerSecond = (fileSizeInBytes * 8) / durationInSeconds;
            const mbps = (bitsPerSecond / 1000000).toFixed(2);
            output.textContent = `Velocidade de Download: ${mbps} Mbps\n(Tamanho: ${sizeValue}MB / Tempo: ${durationInSeconds.toFixed(2)}s)`;
        } catch (e) {
            output.textContent = `Erro no teste: ${e.message}. Tente novamente.`;
        } finally {
            btn.disabled = false; btn.textContent = 'Iniciar Teste de Velocidade';
        }
    };

    // --- Lógica dos Comandos (Funções de Atualização) ---
    const placaRedeCmdOutput = document.getElementById('placa-rede-command-output');
    const placaNomeInput = document.getElementById('placa-nome-input');
    const placaForce1gCmd = document.getElementById('placa-force-1g-cmd');
    const placaForceAutoCmd = document.getElementById('placa-force-auto-cmd');
    function updatePlacaRedeCmd() {
        const os = getActiveOS();
        if (os === 'win') {
            placaRedeCmdOutput.value = "powershell -Command \"Get-NetAdapter -Physical | Where-Object Status -eq 'Up' | Format-Table Name, LinkSpeed, MediaType -AutoSize\"";
        } else if (os === 'mac') {
            placaRedeCmdOutput.value = "system_profiler SPNetworkDataType | grep -E 'Interfaces:|Ethernet:|Type:|Speed:|Media Subtype:'";
        } else { // linux
            placaRedeCmdOutput.value = "ip a | grep 'state UP' -A 2 && echo \"--- Velocidade Ethernet (1000=1Gbs) ---\" && cat /sys/class/net/e*/speed 2>/dev/null && echo \"--- Info Wi-Fi ---\" && iwconfig 2>/dev/null";
        }
    }
    function updatePlacaForceCmds() {
        const os = getActiveOS();
        const adapterName = placaNomeInput.value || 'NOME_DA_PLACA';
        if (os === 'win') {
            placaForce1gCmd.value = `powershell -ExecutionPolicy Bypass -Command "Set-NetAdapter -Name '${adapterName}' -SpeedDuplex '1.0 Gbps Full Duplex'"`;
            placaForceAutoCmd.value = `powershell -ExecutionPolicy Bypass -Command "Set-NetAdapter -Name '${adapterName}' -SpeedDuplex 'AutoNegotiation'"`;
        } else if (os === 'mac') {
            placaForce1gCmd.value = `sudo networksetup -setmedia '${adapterName}' 1000baseT`;
            placaForceAutoCmd.value = `sudo networksetup -setmedia '${adapterName}' autoselect`;
        } else { // linux
            placaForce1gCmd.value = `sudo ethtool -s ${adapterName} speed 1000 duplex full autoneg off`;
            placaForceAutoCmd.value = `sudo ethtool -s ${adapterName} autoneg on`;
        }
    }
    placaNomeInput.onkeyup = updatePlacaForceCmds;

    const pingHostInput = document.getElementById('ping-host-input');
    const pingCmdOutput = document.getElementById('ping-command-output');
    function updatePingCmd() { const os = getActiveOS(); pingCmdOutput.value = (os === 'win') ? `ping -n 4 ${pingHostInput.value}` : `ping -c 4 ${pingHostInput.value}`; }
    pingHostInput.onkeyup = updatePingCmd;
    
    const trHostInput = document.getElementById('tr-host-input');
    const trCmdOutput = document.getElementById('tr-command-output');
    function updateTrCmd() { const os = getActiveOS(); trCmdOutput.value = (os === 'win') ? `tracert ${trHostInput.value}` : `traceroute ${trHostInput.value}`; }
    trHostInput.onkeyup = updateTrCmd;
    
    const ppHostInput = document.getElementById('pp-host-input');
    const ppCmdOutput = document.getElementById('pp-command-output');
    const ppInstallerBox = document.getElementById('pp-installer-box');
    const ppInstallerDesc = document.getElementById('pp-installer-desc');
    const ppInstallCommand = document.getElementById('pp-install-command');
    function updatePpCmd() {
        const os = getActiveOS();
        const host = ppHostInput.value;
        if (os === 'win') {
            ppCmdOutput.value = `pathping ${host}`;
            ppInstallerBox.style.display = 'block';
            ppInstallerDesc.textContent = "O 'pathping' já vem instalado por padrão no Windows.";
            document.getElementById('copy-pp-install-btn').style.display = 'none';
        } else {
            ppCmdOutput.value = `mtr -r -c 10 ${host}`;
            ppInstallerBox.style.display = 'block';
            document.getElementById('copy-pp-install-btn').style.display = 'block';
            if (os === 'mac') {
                ppInstallerDesc.textContent = "Se o 'mtr' não for encontrado, instale-o com Homebrew:";
                ppInstallCommand.value = "brew install mtr";
            } else { // linux
                ppInstallerDesc.textContent = "Se o 'mtr' não for encontrado (Ubuntu/Debian):";
                ppInstallCommand.value = "sudo apt update && sudo apt install mtr";
            }
        }
    }
    ppHostInput.onkeyup = updatePpCmd;
    
    const nmapHostInput = document.getElementById('nmap-host-input');
    const nmapCmdOutput = document.getElementById('nmap-command-output');
    const nmapInstallerDesc = document.getElementById('nmap-installer-desc');
    const nmapInstallCommand = document.getElementById('nmap-install-command');
    function updateNmapCmd() {
        const os = getActiveOS();
        nmapCmdOutput.value = `nmap -sT ${nmapHostInput.value}`;
        if (os === 'win') {
            nmapInstallerDesc.textContent = "O Nmap precisa de ser instalado. Use o Winget (Windows 10/11):";
            nmapInstallCommand.value = "winget install Insecure.Nmap";
        } else if (os === 'mac') {
            nmapInstallerDesc.textContent = "Instale o Nmap com Homebrew:";
            nmapInstallCommand.value = "brew install nmap";
        } else { // linux
            nmapInstallerDesc.textContent = "Instale o Nmap (Ubuntu/Debian):";
            nmapInstallCommand.value = "sudo apt update && sudo apt install nmap";
        }
    }
    nmapHostInput.onkeyup = updateNmapCmd;
    
    const portHostInput = document.getElementById('port-host-input');
    const portNumInput = document.getElementById('port-num-input');
    const portCmdOutput = document.getElementById('port-command-output');
    function updatePortCmd() {
        const os = getActiveOS();
        const host = portHostInput.value || 'HOST';
        const port = portNumInput.value || 'PORTA';
        if (os === 'win') {
            portCmdOutput.value = `powershell -Command "Test-NetConnection -ComputerName ${host} -Port ${port}"`;
        } else { // mac/linux
            portCmdOutput.value = `nc -vz ${host} ${port}`;
        }
    }
    portHostInput.onkeyup = updatePortCmd;
    portNumInput.onkeyup = updatePortCmd;

    const dnsHostInput = document.getElementById('dns-host-input');
    const dnsCmdOutput = document.getElementById('dns-command-output');
    function updateDnsCmd() { dnsCmdOutput.value = `nslookup ${dnsHostInput.value}`; }
    dnsHostInput.onkeyup = updateDnsCmd;
    
    const arpCmdOutput = document.getElementById('arp-command-output');
    function updateArpCmd() { arpCmdOutput.value = "arp -a"; }
    
    const routeCmdOutput = document.getElementById('route-command-output');
    function updateRouteCmd() {
        const os = getActiveOS();
        routeCmdOutput.value = (os === 'win') ? "route print" : "netstat -r";
    }

    const speedtestCmdOutput = document.getElementById('speedtest-command-output');
    const speedtestInstallerDesc = document.getElementById('speedtest-installer-desc');
    const speedtestInstallCommand = document.getElementById('speedtest-install-command');
    function updateSpeedtestCmd() {
        const os = getActiveOS();
        speedtestCmdOutput.value = "speedtest.exe"; // Comando para Ookla
        if (os === 'win') {
            speedtestInstallerDesc.textContent = "Instale com Winget (Windows 10/11):";
            speedtestInstallCommand.value = "winget install Ookla.Speedtest.CLI"; 
        } else if (os === 'mac') {
            speedtestInstallerDesc.textContent = "Instale com Homebrew:";
            speedtestInstallCommand.value = "brew install speedtest"; 
            speedtestCmdOutput.value = "speedtest";
        } else { // linux
            speedtestInstallerDesc.textContent = "Instale com apt (Ubuntu/Debian):";
            speedtestInstallCommand.value = "sudo apt update && sudo apt install speedtest-cli";
            speedtestCmdOutput.value = "speedtest-cli";
        }
    }
    
    const winUp1 = document.getElementById('win-updates1-cmd');
    const winUp2 = document.getElementById('win-updates2-cmd');
    const nixUp = document.getElementById('nix-updates-cmd');
    const nixUpCmd = document.getElementById('nix-update-cmd');
    function updateAtualizacoesCmd() {
        const os = getActiveOS();
        if (os === 'win') {
            winUp1.style.display = 'block';
            winUp2.style.display = 'block';
            nixUp.style.display = 'none';
            document.getElementById('win-update-cmd').value = "UsoClient.exe StartScan";
            document.getElementById('win-pkg-cmd').value = "winget upgrade --all";
        } else {
            winUp1.style.display = 'none';
            winUp2.style.display = 'none';
            nixUp.style.display = 'block';
            if (os === 'mac') {
                nixUpCmd.value = "brew update && brew upgrade";
            } else { // linux
                nixUpCmd.value = "sudo apt update && sudo apt upgrade -y";
            }
        }
    }

    // Lógica para a aba Comandos
    const tabComandosContainer = document.getElementById('tab-comandos');
    function populateCommandsTab() {
        const os = getActiveOS();
        while (tabComandosContainer.children.length > 2) { // Limpa mantendo o Título e P
            tabComandosContainer.removeChild(tabComandosContainer.lastChild);
        }

        window.commandDatabase.forEach(category => {
            const commandsForOS = category.commands.filter(cmd => cmd.os[os]);
            if (commandsForOS.length > 0) {
                tabComandosContainer.appendChild(createH4(category.title));
                commandsForOS.forEach(cmd => {
                    tabComandosContainer.appendChild(
                        createCommandEntry(os, cmd.label, cmd.desc, cmd.os[os], cmd.id)
                    );
                });
            }
        });
    }
    
    // Lógica da Aba de Registro
    document.getElementById('print-registro-btn').onclick = function() {
        // Coletar dados
        const ipResult = document.getElementById('registro-ip-publico-input').value;
        const velResult = document.getElementById('registro-velocidade-input').value;
        const placaResult = document.getElementById('registro-placa-rede-input').value;
        const pingResult = document.getElementById('registro-ping-input').value;
        const trResult = document.getElementById('registro-tr-input').value;
        const ppResult = document.getElementById('registro-pp-input').value;
        const nmapResult = document.getElementById('registro-nmap-input').value;
        const portResult = document.getElementById('registro-test-port-input').value;
        const netstatResult = document.getElementById('registro-netstat-input').value;
        const dnsResult = document.getElementById('registro-dns-input').value;
        const arpResult = document.getElementById('registro-arp-input').value;
        const routeResult = document.getElementById('registro-route-input').value;
        const speedCliResult = document.getElementById('registro-speedtest-cli-input').value;
        const updatesResult = document.getElementById('registro-updates-input').value;
        const comandosResult = document.getElementById('registro-comandos-input').value;
        
        const reportWindow = window.open('', 'PrintWindow', 'width=800,height=600');
        reportWindow.document.write('<html><head><title>Relatório de Testes de Rede</title>');
        reportWindow.document.write(`
            <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 20px; background: #fff; color: #000; }
                pre { font-family: "Courier New", monospace; background: #f4f4f4; padding: 15px; border: 1px solid #ccc; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
                h1 { border-bottom: 2px solid #666; padding-bottom: 5px; color: #333; }
                h2 { background-color: #e0e0e0; padding: 5px 10px; border-radius: 5px; color: #000; margin-top: 10px; }
                button { background: #007bff; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
                #report-container { display: flex; flex-wrap: wrap; justify-content: space-between; }
                .test-block { width: 48%; margin-bottom: 20px; vertical-align: top; display: inline-block; page-break-inside: avoid; }
                @media print { .no-print { display: none; } h1, h2 { page-break-after: avoid; } pre { page-break-inside: avoid; } }
            </style>
        `);
        reportWindow.document.write('</head><body>');
        reportWindow.document.write('<h1>Relatório de Testes de Rede</h1>');
        reportWindow.document.write('<p class="no-print">Resultados colados do terminal. Use Ctrl+P para imprimir ou salvar como PDF.</p>');
        reportWindow.document.write('<button class="no-print" onclick="window.print()">Imprimir Relatório / Salvar como PDF</button>');
        reportWindow.document.write('<div id="report-container">');

        if (ipResult) { reportWindow.document.write('<div class="test-block"><h2>Resultado do IP Público</h2><pre>' + escapeHTML(ipResult) + '</pre></div>'); }
        if (velResult) { reportWindow.document.write('<div class="test-block"><h2>Velocidade (Navegador)</h2><pre>' + escapeHTML(velResult) + '</pre></div>'); }
        if (placaResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados da Placa de Rede</h2><pre>' + escapeHTML(placaResult) + '</pre></div>'); }
        if (pingResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Ping</h2><pre>' + escapeHTML(pingResult) + '</pre></div>'); }
        if (trResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Traceroute</h2><pre>' + escapeHTML(trResult) + '</pre></div>'); }
        if (ppResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do PathPing / MTR</h2><pre>' + escapeHTML(ppResult) + '</pre></div>'); }
        if (nmapResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Nmap</h2><pre>' + escapeHTML(nmapResult) + '</pre></div>'); }
        if (portResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Teste de Porta</h2><pre>' + escapeHTML(portResult) + '</pre></div>'); }
        if (netstatResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do Netstat</h2><pre>' + escapeHTML(netstatResult) + '</pre></div>'); }
        if (dnsResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados do DNS (nslookup)</h2><pre>' + escapeHTML(dnsResult) + '</pre></div>'); }
        if (arpResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados da Tabela ARP</h2><pre>' + escapeHTML(arpResult) + '</pre></div>'); }
        if (routeResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados da Tabela de Roteamento</h2><pre>' + escapeHTML(routeResult) + '</pre></div>'); }
        if (speedCliResult) { reportWindow.document.write('<div class="test-block"><h2>Speedtest-CLI (Terminal)</h2><pre>' + escapeHTML(speedCliResult) + '</pre></div>'); }
        if (updatesResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados das Atualizações</h2><pre>' + escapeHTML(updatesResult) + '</pre></div>'); }
        if (comandosResult) { reportWindow.document.write('<div class="test-block"><h2>Resultados dos Comandos</h2><pre>' + escapeHTML(comandosResult) + '</pre></div>'); }
        
        reportWindow.document.write('</div>'); // Fecha o container principal
        reportWindow.document.write('</body></html>');
        reportWindow.document.close();
    };
    
    // --- Lógica de Import/Export ---
    document.getElementById('btn-export-json').onclick = function() {
        try {
            const jsonString = JSON.stringify(window.commandDatabase, null, 2);
            const reportWindow = window.open('', 'PrintWindow', 'width=800,height=600');
            reportWindow.document.write('<html><head><title>Banco de Dados de Comandos JSON</title></head><body>');
            reportWindow.document.write('<p>Copie este conteúdo ou use Ctrl+S para salvar como comandos.json</p>');
            reportWindow.document.write('<pre>' + escapeHTML(jsonString) + '</pre>');
            reportWindow.document.write('</body></html>');
            reportWindow.document.close();
        } catch (e) {
            alert('Erro ao exportar: ' + e.message);
        }
    };
    
    document.getElementById('btn-import-json').onclick = function() {
        const btn = document.getElementById('btn-import-json');
        const area = document.getElementById('import-json-area');
        
        if (area.style.display === 'none') {
            area.style.display = 'block';
            btn.textContent = 'Salvar Importação';
            btn.style.backgroundColor = 'var(--cor-sucesso)';
        } else {
            try {
                const newDB = JSON.parse(area.value);
                if (Array.isArray(newDB)) {
                    window.commandDatabase = newDB;
                    alert('Sucesso! Banco de dados de comandos importado.');
                    area.value = '';
                    area.style.display = 'none';
                    btn.textContent = 'Importar JSON';
                    btn.style.backgroundColor = 'var(--cor-sucesso)';
                    updateAllCommands();
                    document.getElementById('btn-tab-comandos').click();
                } else {
                    throw new Error('O JSON não é um array.');
                }
            } catch (e) {
                alert('Erro na importação: O JSON é inválido. ' + e.message);
            }
        }
    };


    // --- Lógica das Abas (Inicialização) ---
    function updateAllCommands() {
        updatePlacaRedeCmd();
        updatePlacaForceCmds();
        updatePingCmd();
        updateTrCmd();
        updatePpCmd();
        updateNmapCmd();
        updatePortCmd();
        updateDnsCmd();
        updateArpCmd();
        updateRouteCmd();
        updateSpeedtestCmd();
        updateAtualizacoesCmd();
        populateCommandsTab();
    }
    
    function setOS(os) {
        currentOS = os;
        document.getElementById('os-auto').classList.toggle('active', os === 'auto');
        document.getElementById('os-win').classList.toggle('active', os === 'win');
        document.getElementById('os-mac').classList.toggle('active', os === 'mac');
        document.getElementById('os-lin').classList.toggle('active', os === 'linux');
        updateAllCommands();
    }

    document.getElementById('os-auto').onclick = () => setOS('auto');
    document.getElementById('os-win').onclick = () => setOS('win');
    document.getElementById('os-mac').onclick = () => setOS('mac');
    document.getElementById('os-lin').onclick = () => setOS('linux');

    document.getElementById('btn-tab-info').onclick = (e) => openBauTab(e, 'tab-info');
    document.getElementById('btn-tab-ip-publico').onclick = (e) => openBauTab(e, 'tab-ip-publico');
    document.getElementById('btn-tab-velocidade').onclick = (e) => openBauTab(e, 'tab-velocidade');
    document.getElementById('btn-tab-placa-rede').onclick = (e) => openBauTab(e, 'tab-placa-rede');
    document.getElementById('btn-tab-ping').onclick = (e) => openBauTab(e, 'tab-ping');
    document.getElementById('btn-tab-traceroute').onclick = (e) => openBauTab(e, 'tab-traceroute');
    document.getElementById('btn-tab-pathping').onclick = (e) => openBauTab(e, 'tab-pathping');
    document.getElementById('btn-tab-nmap').onclick = (e) => openBauTab(e, 'tab-nmap');
    document.getElementById('btn-tab-test-port').onclick = (e) => openBauTab(e, 'tab-test-port');
    document.getElementById('btn-tab-netstat').onclick = (e) => openBauTab(e, 'tab-netstat');
    document.getElementById('btn-tab-dns').onclick = (e) => openBauTab(e, 'tab-dns');
    document.getElementById('btn-tab-arp').onclick = (e) => openBauTab(e, 'tab-arp');
    document.getElementById('btn-tab-route').onclick = (e) => openBauTab(e, 'tab-route');
    document.getElementById('btn-tab-atualizacoes').onclick = (e) => openBauTab(e, 'tab-atualizacoes');
    document.getElementById('btn-tab-comandos').onclick = (e) => openBauTab(e, 'tab-comandos');
    document.getElementById('btn-tab-registro').onclick = (e) => openBauTab(e, 'tab-registro');
    
    // Abre a primeira aba (Info) e preenche todos os comandos
    document.getElementById('btn-tab-info').click();
    updateAllCommands(); // Função unificada

    console.log("Baú de Acesso Remoto (V20.1) carregado!");

})();
