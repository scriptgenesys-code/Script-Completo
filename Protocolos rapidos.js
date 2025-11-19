// ==UserScript==
// @name         PureCloud - Protocolos Rápidos (v1.5.21 - Visual Glass Fix)
// @namespace    http://tampermonkey.net/protocolos-rapidos
// @version      1.5.21
// @description  Visual Glassmorphism unificado + Correção de JSON.
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_VERSION = '1.5.21_Glass_Fix';
    const PROTOCOLOS_JSON_URL = 'https://scriptgenesys-code.github.io/Script-Completo/protocolos_brisanet_v1_9.json';

    // --- TEMA UNIFICADO (IGUAL MENU / CRONOM) ---
    const THEME = {
        bg: 'rgba(20, 30, 45, 0.95)',        // Fundo Vidro Escuro
        bgSec: 'rgba(30, 40, 60, 0.6)',      // Fundo Secundário (Sidebar)
        border: '1px solid rgba(0, 191, 255, 0.3)', // Borda Ciano
        text: '#E0E0E0',                     // Texto Claro
        textSec: '#A0A4B8',                  // Texto Secundário
        accent: '#00BFFF',                   // Azul Principal
        gradient: 'linear-gradient(135deg, #00BFFF, #007FFF)', // Gradiente Botões
        shadow: '0 8px 30px rgba(0,0,0,0.5)',
        itemHover: 'rgba(0, 191, 255, 0.1)'
    };

    let CONFIG = { 
        PROTOCOLOS: [], 
        RECENT_PROTOCOLOS: JSON.parse(localStorage.getItem('pr_recentProtocols_v1')) || [], 
        POPUP_POSITIONS: JSON.parse(sessionStorage.getItem('pr_popupPositions') || '{}') 
    };

    const initialProtocolos = [];
    const categoryDisplayMap = { 'recent': '⏱️ Recentes', 'favorites': '⭐ Favoritos', 'all': 'Todos', 'AGENDAMENTO': 'Agendamento', 'ATIVO': 'Ativo', 'BRISATV': 'BrisaTV', 'CABO': 'Cabo', 'CANCELAMENTO': 'Cancelamento', 'DIALOGO': 'Diálogo', 'EQUIPAMENTO': 'Equipamento', 'FINANCEIRO': 'Financeiro', 'FWA': 'FWA', 'ID': 'ID (Dados)', 'INFO': 'Info', 'INSTABILIDADE': 'Instabilidade', 'INSTALACAO': 'Instalação', 'JOGOS': 'Jogos', 'LENTIDAO': 'Lentidão', 'LIGACAO': 'Ligação', 'PARTICULAR': 'Particular', 'QUEDAS': 'Quedas', 'ROTEADOR': 'Roteador', 'SEM_ACESSO': 'Sem Acesso', 'SEM_GERENCIA': 'Sem Gerência', 'SINAL': 'Sinal', 'SVA': 'SVA', 'TELEFONIA': 'Telefonia', 'VELOCIDADE': 'Velocidade', 'VISITA': 'Visita (Custo)', 'WIFI': 'Wi-Fi', 'INICIO_ENCERRAMENTO': 'Início/Fim', 'DADOS_ID': 'Dados/ID', 'SINAL_ROTA': 'Sinal/Rota', 'LOS_PON': 'LOS/PON', 'MANUTENCAO_SINAL': 'Manut. Sinal', 'ROTA_INOP': 'Rota Inop.', 'EQUIPAMENTOS': 'Equipamentos', 'WIFI_SENHA': 'Wi-Fi/Senha', 'COBRANCA': 'Cobrança', 'EQUIP_PART': 'Equip. Part.', 'APPS_IPTV': 'Apps/IPTV', 'SITES_VPN': 'Sites/VPN', 'FWA_5G': 'FWA 5G', 'FWA_5G_INFO': 'FWA Info', 'INTERNOS': 'Internos', 'AVANCADOS': 'Avançados', 'CORDIAIS': 'Cordiais', 'SV_AVULSOS': 'Serv. Avulsos', 'INFO_TEC': 'Info Tec.', 'INATIVIDADE_ENC': 'Inatividade', 'CONFIG_TEC': 'Config. Téc.', 'IP_PORTAS': 'IP/Portas', 'TRANSFERENCIA': 'Transf.' };
    const sidebarCategoryOrder = [ 'recent', 'favorites', 'all', 'INICIO_ENCERRAMENTO', 'DADOS_ID', 'ATIVO', 'INSTABILIDADE', 'DIAG_RAPIDO', 'VELOCIDADE', 'SINAL_ROTA', 'LOS_PON', 'MANUTENCAO_SINAL', 'ROTA_INOP', 'INSTALACAO', 'EQUIPAMENTOS', 'WIFI_SENHA', 'AGENDAMENTO', 'COBRANCA', 'EQUIP_PART', 'APPS_IPTV', 'SVA', 'JOGOS', 'SITES_VPN', 'TELEFONIA', 'BRISATV', 'FWA_5G', 'FWA_5G_INFO', 'INTERNOS', 'AVANCADOS', 'CORDIAIS', 'SV_AVULSOS', 'INFO_TEC', 'INATIVIDADE_ENC', 'CONFIG_TEC', 'IP_PORTAS', 'FINANCEIRO', 'DIALOGO', 'TRANSFERENCIA', 'I', 'CL', 'P', 'TP', 'RTC', 'RTA', 'PIS', 'T' ];

    // --- Helpers ---
    const copyTextToClipboard = async (text) => { try { await navigator.clipboard.writeText(text); return true; } catch (err) { return false; } };
    const makeDraggable = (popup, header, popupName) => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const enforceBounds = (t, l) => { const vh = window.innerHeight, vw = window.innerWidth, ph = popup.offsetHeight, pw = popup.offsetWidth; return { top: Math.max(5, Math.min(vh - ph - 5, t)), left: Math.max(5, Math.min(vw - pw - 5, l)) }; };
        
        if (CONFIG.POPUP_POSITIONS[popupName]) { 
            popup.style.top = CONFIG.POPUP_POSITIONS[popupName].top; 
            popup.style.left = CONFIG.POPUP_POSITIONS[popupName].left; 
        } else {
            // Centralizado por padrão
            popup.style.top = '10%'; 
            popup.style.left = '15%';
        }
        
        if (header) {
            header.onmousedown = e => {
                if (e.target.closest('button') || e.button !== 0) return; e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
                document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; CONFIG.POPUP_POSITIONS[popupName] = { top: popup.style.top, left: popup.style.left }; sessionStorage.setItem('pr_popupPositions', JSON.stringify(CONFIG.POPUP_POSITIONS)); };
                document.onmousemove = ev => { ev.preventDefault(); pos1 = pos3 - ev.clientX; pos2 = pos4 - ev.clientY; pos3 = ev.clientX; pos4 = ev.clientY; const sp = enforceBounds(popup.offsetTop - pos2, popup.offsetLeft - pos1); popup.style.top = sp.top + "px"; popup.style.left = sp.left + "px"; };
            };
        }
    };

    // --- Carregamento de Dados ---
    const loadData = async () => {
        try {
            // Tenta LocalStorage primeiro
            const local = localStorage.getItem('pr_protocolos');
            if (local) { 
                const parsed = JSON.parse(local);
                if (Array.isArray(parsed) && parsed.length > 0) CONFIG.PROTOCOLOS = parsed; 
            }

            // Se vazio, busca do GitHub
            if (!CONFIG.PROTOCOLOS.length) {
                const res = await fetch(PROTOCOLOS_JSON_URL + '?v=' + Date.now());
                const data = await res.json();
                // Correção para estrutura { protocols: [...] } ou [...]
                CONFIG.PROTOCOLOS = Array.isArray(data) ? data : (data.protocols || []);
                
                if (CONFIG.PROTOCOLOS.length > 0) {
                    localStorage.setItem('pr_protocolos', JSON.stringify(CONFIG.PROTOCOLOS));
                    console.log(`[Protocolos] ${CONFIG.PROTOCOLOS.length} carregados.`);
                } else {
                    console.warn("[Protocolos] JSON vazio ou formato inválido.");
                }
            }
        } catch (e) { 
            console.error("[Protocolos] Erro loadData:", e);
            CONFIG.PROTOCOLOS = initialProtocolos; 
        }
        
        // Normaliza dados
        CONFIG.PROTOCOLOS = CONFIG.PROTOCOLOS.map(r => ({ 
            ...r, 
            isFavorite: r.isFavorite || false, 
            requiredData: (r.requiredData || []).map(t => typeof t === 'string' ? t.replace(/[{}]/g, '').replace(/ /g, '_').toUpperCase().replace(/[^A-Z0-9_]/g, '') : '') 
        }));
    };
    
    const logUsedProtocolo = (title, text) => {
        CONFIG.RECENT_PROTOCOLOS = CONFIG.RECENT_PROTOCOLOS.filter(r => r.title !== title);
        CONFIG.RECENT_PROTOCOLOS.unshift({ title, text });
        if (CONFIG.RECENT_PROTOCOLOS.length > 5) CONFIG.RECENT_PROTOCOLOS.length = 5;
        localStorage.setItem('pr_recentProtocols_v1', JSON.stringify(CONFIG.RECENT_PROTOCOLOS));
    };

    // --- CSS NOVO ---
    const injectCss = () => {
        const css = `
            /* Glass Panel Principal */
            .pr-script-popup {
                position: fixed; z-index: 10001;
                background: ${THEME.bg}; backdrop-filter: blur(12px);
                border: ${THEME.border}; box-shadow: ${THEME.shadow}; border-radius: 10px;
                color: ${THEME.text}; font-family: 'Segoe UI', sans-serif;
                display: flex; flex-direction: column;
                width: 850px; height: 600px; resize: both; overflow: hidden;
            }
            
            /* Header */
            .panel-header {
                padding: 12px 15px; background: rgba(0,0,0,0.2); border-bottom: ${THEME.border};
                display: flex; justify-content: space-between; align-items: center; cursor: move;
            }
            .panel-header h4 { margin: 0; font-size: 14px; font-weight: bold; color: ${THEME.accent}; text-transform: uppercase; letter-spacing: 1px; }
            .pr-close { background: none; border: none; color: ${THEME.textSec}; font-size: 16px; cursor: pointer; }
            .pr-close:hover { color: #ff5555; }

            /* Corpo */
            .pr-popup-body { display: flex; flex-grow: 1; overflow: hidden; }
            
            /* Sidebar */
            #pr-sidebar { 
                width: 180px; flex-shrink: 0; background: ${THEME.bgSec}; 
                border-right: ${THEME.border}; overflow-y: auto; padding: 10px 0; 
            }
            .sidebar-item {
                padding: 8px 15px; cursor: pointer; color: ${THEME.textSec}; font-size: 13px; 
                border-left: 3px solid transparent; transition: all 0.2s;
            }
            .sidebar-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
            .sidebar-item.active { 
                background: rgba(0, 191, 255, 0.1); color: ${THEME.accent}; 
                border-left-color: ${THEME.accent}; font-weight: bold; 
            }

            /* Main Content */
            #pr-main { flex-grow: 1; padding: 15px; display: flex; flex-direction: column; }
            
            /* Search */
            #pr-search {
                width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: ${THEME.border};
                color: #fff; border-radius: 6px; margin-bottom: 10px; box-sizing: border-box; font-size: 14px;
            }
            #pr-search:focus { outline: none; border-color: ${THEME.accent}; }

            /* Results List */
            #pr-results { flex-grow: 1; overflow-y: auto; padding-right: 5px; }
            .pr-item {
                background: rgba(255,255,255,0.03); border: 1px solid transparent;
                border-radius: 6px; padding: 10px; margin-bottom: 8px; cursor: pointer;
                transition: all 0.2s;
            }
            .pr-item:hover { background: ${THEME.itemHover}; border-color: ${THEME.accent}; transform: translateX(2px); }
            .pr-item strong { color: ${THEME.accent}; display: block; margin-bottom: 4px; font-size: 13px; }
            .pr-item small { color: ${THEME.textSec}; font-size: 12px; line-height: 1.4; display: block; }

            /* Scrollbar */
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: ${THEME.accent}; }

            /* Notification */
            #pr-notif { position: fixed; top: 20px; right: 20px; z-index: 10005; display: flex; flex-direction: column; gap: 10px; }
        `;
        const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    };

    const UI = {
        createNotification(msg, type = 'info') {
            let c = document.getElementById('pr-notif'); if (!c) { c = document.createElement('div'); c.id = 'pr-notif'; document.body.appendChild(c); }
            const n = document.createElement("div"); n.innerText = msg; 
            n.style.cssText = `padding:12px 20px; background:${THEME.bg}; border-left:4px solid ${type==='error'?'#ff4d4d':THEME.success}; color:#fff; border-radius:4px; box-shadow:0 5px 15px rgba(0,0,0,0.5); backdrop-filter:blur(5px); font-size:13px; font-family:'Segoe UI';`; 
            c.prepend(n); setTimeout(() => n.remove(), 3000);
        },
        createProtocoloPopup() {
            document.querySelector('.pr-script-popup')?.remove();
            const popup = document.createElement("div"); popup.className = 'pr-script-popup';
            popup.innerHTML = `
                <div class="panel-header"><h4>Protocolos Rápidos</h4><button class="pr-close">✕</button></div>
                <div class="pr-popup-body">
                    <div id="pr-sidebar"></div>
                    <div id="pr-main">
                        <input type="text" id="pr-search" placeholder="Pesquisar protocolo...">
                        <div id="pr-results"></div>
                    </div>
                </div>`;
            document.body.appendChild(popup);
            
            makeDraggable(popup, popup.querySelector('.panel-header'), 'protocoloPopup');
            popup.querySelector('.pr-close').onclick = () => popup.remove();
            
            const renderList = (cat, term) => {
                const res = popup.querySelector('#pr-results'); res.innerHTML = '';
                let items = CONFIG.PROTOCOLOS;

                if (term) {
                    const lower = term.toLowerCase();
                    items = items.filter(r => r.title.toLowerCase().includes(lower) || r.text.toLowerCase().includes(lower));
                } else if (cat === 'favorites') {
                    items = items.filter(r => r.isFavorite);
                } else if (cat === 'recent') { 
                    const titles = CONFIG.RECENT_PROTOCOLOS.map(r => r.title); 
                    items = items.filter(r => titles.includes(r.title)); 
                } else if (cat !== 'all') {
                    items = items.filter(r => r.title.startsWith(cat + ' - '));
                }
                
                if(!items.length) { res.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">Nenhum protocolo encontrado.</div>'; return; }

                items.forEach(p => {
                    const el = document.createElement('div'); el.className = 'pr-item';
                    let displayTitle = p.title.includes(' - ') ? p.title.split(' - ')[1] : p.title;
                    el.innerHTML = `<strong>${displayTitle} ${p.isFavorite ? '⭐' : ''}</strong><small>${p.text.substring(0,120)}...</small>`;
                    el.onclick = () => { 
                        logUsedProtocolo(p.title, p.text); 
                        copyTextToClipboard(p.text); 
                        UI.createNotification("Protocolo Copiado!", "success"); 
                        // Opcional: Fechar ao clicar
                        // popup.remove(); 
                    };
                    res.appendChild(el);
                });
            };

            const sidebar = popup.querySelector('#pr-sidebar');
            sidebarCategoryOrder.forEach(c => {
                if (categoryDisplayMap[c]) {
                    const btn = document.createElement('div'); btn.className = 'sidebar-item';
                    btn.textContent = categoryDisplayMap[c];
                    btn.onclick = () => { 
                        sidebar.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active')); 
                        btn.classList.add('active'); 
                        popup.querySelector('#pr-search').value = '';
                        renderList(c, ''); 
                    };
                    sidebar.appendChild(btn);
                    if(c === 'favorites') btn.classList.add('active');
                }
            });
            
            popup.querySelector('#pr-search').oninput = (e) => {
                sidebar.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
                renderList(null, e.target.value);
            };
            
            // Render inicial
            renderList('favorites', '');
        }
    };

    // --- EXPOR A FUNÇÃO GLOBALMENTE ---
    window.toggleProtocolos = UI.createProtocoloPopup;

    // --- INICIALIZAÇÃO ---
    const init = async () => {
        await loadData();
        injectCss();
        
        document.addEventListener('keydown', (e) => { 
            if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'U') UI.createProtocoloPopup(); 
        });
        
        console.log("[Protocolos V1.5.21] Carregado (Modo Invisível & Glass).");
        
        // Remove botões fantasmas antigos
        const ghost = document.getElementById('pr-trigger-button');
        if (ghost) ghost.remove();
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
