// ==UserScript==
// @name         PureCloud - Protocolos Rápidos (v1.5.20 - Invisible)
// @namespace    http://tampermonkey.net/protocolos-rapidos
// @version      1.5.20
// @description  Versão sem botão flutuante (controlada pelo Menu Unificado).
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_VERSION = '1.5.20_Invisible';
    const PROTOCOLOS_JSON_URL = 'https://scriptgenesys-code.github.io/Script-Completo/protocolos_brisanet_v1_9.json';
    const initialProtocolos = [];
    const requiredTagsMap = {};
    const categoryDisplayMap = { 'recent': '⏱️ Recentes', 'favorites': '⭐ Favoritos', 'all': 'Todos', 'AGENDAMENTO': 'Agendamento', 'ATIVO': 'Ativo', 'BRISATV': 'BrisaTV', 'CABO': 'Cabo', 'CANCELAMENTO': 'Cancelamento', 'DIALOGO': 'Diálogo', 'EQUIPAMENTO': 'Equipamento', 'FINANCEIRO': 'Financeiro', 'FWA': 'FWA', 'ID': 'ID (Dados)', 'INFO': 'Info', 'INSTABILIDADE': 'Instabilidade', 'INSTALACAO': 'Instalação', 'JOGOS': 'Jogos', 'LENTIDAO': 'Lentidão', 'LIGACAO': 'Ligação', 'PARTICULAR': 'Particular', 'QUEDAS': 'Quedas', 'ROTEADOR': 'Roteador', 'SEM_ACESSO': 'Sem Acesso', 'SEM_GERENCIA': 'Sem Gerência', 'SINAL': 'Sinal', 'SVA': 'SVA', 'TELEFONIA': 'Telefonia', 'VELOCIDADE': 'Velocidade', 'VISITA': 'Visita (Custo)', 'WIFI': 'Wi-Fi', 'INICIO_ENCERRAMENTO': 'Início/Fim', 'DADOS_ID': 'Dados/ID', 'SINAL_ROTA': 'Sinal/Rota', 'LOS_PON': 'LOS/PON', 'MANUTENCAO_SINAL': 'Manut. Sinal', 'ROTA_INOP': 'Rota Inop.', 'EQUIPAMENTOS': 'Equipamentos', 'WIFI_SENHA': 'Wi-Fi/Senha', 'COBRANCA': 'Cobrança', 'EQUIP_PART': 'Equip. Part.', 'APPS_IPTV': 'Apps/IPTV', 'SITES_VPN': 'Sites/VPN', 'FWA_5G': 'FWA 5G', 'FWA_5G_INFO': 'FWA Info', 'INTERNOS': 'Internos', 'AVANCADOS': 'Avançados', 'CORDIAIS': 'Cordiais', 'SV_AVULSOS': 'Serv. Avulsos', 'INFO_TEC': 'Info Tec.', 'INATIVIDADE_ENC': 'Inatividade', 'CONFIG_TEC': 'Config. Téc.', 'IP_PORTAS': 'IP/Portas', 'TRANSFERENCIA': 'Transf.' };
    const sidebarCategoryOrder = [ 'recent', 'favorites', 'all', 'INICIO_ENCERRAMENTO', 'DADOS_ID', 'ATIVO', 'INSTABILIDADE', 'DIAG_RAPIDO', 'VELOCIDADE', 'SINAL_ROTA', 'LOS_PON', 'MANUTENCAO_SINAL', 'ROTA_INOP', 'INSTALACAO', 'EQUIPAMENTOS', 'WIFI_SENHA', 'AGENDAMENTO', 'COBRANCA', 'EQUIP_PART', 'APPS_IPTV', 'SVA', 'JOGOS', 'SITES_VPN', 'TELEFONIA', 'BRISATV', 'FWA_5G', 'FWA_5G_INFO', 'INTERNOS', 'AVANCADOS', 'CORDIAIS', 'SV_AVULSOS', 'INFO_TEC', 'INATIVIDADE_ENC', 'CONFIG_TEC', 'IP_PORTAS', 'FINANCEIRO', 'DIALOGO', 'TRANSFERENCIA', 'I', 'CL', 'P', 'TP', 'RTC', 'RTA', 'PIS', 'T' ];
    let CONFIG = { PROTOCOLOS: [], LAST_COPIED_PROTOCOLO: '', RECENT_PROTOCOLOS: [], POPUP_POSITIONS: {}, PR_DARK_MODE: false };

    const findEl = (s, p = document) => { if (!Array.isArray(s)) s = [s]; for (const x of s) { try { const e = p.querySelector(x); if (e) return e; } catch (e) {} } return null; };
    const copyTextToClipboard = async (text) => { try { await navigator.clipboard.writeText(text); return true; } catch (err) { return false; } };
    const formatReplyText = (text, name = 'cliente', id = 'protocolo') => { return text; };
    const makeDraggable = (popup, header, popupName) => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const enforceBounds = (t, l) => { const vh = window.innerHeight, vw = window.innerWidth, ph = popup.offsetHeight, pw = popup.offsetWidth; return { top: Math.max(5, Math.min(vh - ph - 5, t)), left: Math.max(5, Math.min(vw - pw - 5, l)) }; };
        if (CONFIG.POPUP_POSITIONS[popupName]) { popup.style.top = CONFIG.POPUP_POSITIONS[popupName].top; popup.style.left = CONFIG.POPUP_POSITIONS[popupName].left; }
        if (header) {
            header.onmousedown = e => {
                if (e.target.closest('button') || e.button !== 0) return; e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
                document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; CONFIG.POPUP_POSITIONS[popupName] = { top: popup.style.top, left: popup.style.left }; sessionStorage.setItem('pr_popupPositions', JSON.stringify(CONFIG.POPUP_POSITIONS)); };
                document.onmousemove = ev => { ev.preventDefault(); pos1 = pos3 - ev.clientX; pos2 = pos4 - ev.clientY; pos3 = ev.clientX; pos4 = ev.clientY; const sp = enforceBounds(popup.offsetTop - pos2, popup.offsetLeft - pos1); popup.style.top = sp.top + "px"; popup.style.left = sp.left + "px"; };
            };
        }
    };

    const loadData = async () => {
        try {
            const local = localStorage.getItem('pr_protocolos');
            if (local) { CONFIG.PROTOCOLOS = JSON.parse(local); }
            if (!CONFIG.PROTOCOLOS.length) {
                const res = await fetch(PROTOCOLOS_JSON_URL + '?v=' + Date.now());
                const data = await res.json();
                CONFIG.PROTOCOLOS = Array.isArray(data) ? data : (data.protocols || []);
                localStorage.setItem('pr_protocolos', JSON.stringify(CONFIG.PROTOCOLOS));
            }
            CONFIG.RECENT_PROTOCOLOS = JSON.parse(localStorage.getItem('pr_recentProtocols_v1')) || [];
            CONFIG.POPUP_POSITIONS = JSON.parse(sessionStorage.getItem('pr_popupPositions') || '{}');
        } catch (e) { CONFIG.PROTOCOLOS = initialProtocolos; }
        
        CONFIG.PROTOCOLOS = CONFIG.PROTOCOLOS.map(r => ({ ...r, isFavorite: r.isFavorite || false, requiredData: (r.requiredData || []).map(t => typeof t === 'string' ? t.replace(/[{}]/g, '').replace(/ /g, '_').toUpperCase().replace(/[^A-Z0-9_]/g, '') : '') }));
        CONFIG.PROTOCOLOS.forEach(r => requiredTagsMap[r.title] = r.requiredData);
    };
    
    const logUsedProtocolo = (title, text) => {
        CONFIG.RECENT_PROTOCOLOS = CONFIG.RECENT_PROTOCOLOS.filter(r => r.title !== title);
        CONFIG.RECENT_PROTOCOLOS.unshift({ title, text });
        if (CONFIG.RECENT_PROTOCOLOS.length > 5) CONFIG.RECENT_PROTOCOLOS.length = 5;
        localStorage.setItem('pr_recentProtocols_v1', JSON.stringify(CONFIG.RECENT_PROTOCOLOS));
    };

    const documentExtractor = { getParticipantName: () => 'cliente', getInteractionId: () => 'protocolo' };
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const UI = {
        createNotification(msg, type = 'info') {
            let c = document.getElementById('pr-notif'); if (!c) { c = document.createElement('div'); c.id = 'pr-notif'; c.style.cssText='position:fixed;top:20px;right:20px;z-index:10005;display:flex;flex-direction:column;gap:10px;'; document.body.appendChild(c); }
            const n = document.createElement("div"); n.innerText = msg; n.style.cssText = `padding:12px;background:${type==='error'?'#ff4d4d':'#28a745'};color:white;border-radius:5px;box-shadow:0 2px 10px rgba(0,0,0,0.3);font-family:sans-serif;font-size:13px;`; c.prepend(n); setTimeout(() => n.remove(), 3000);
        },
        createProtocoloPopup() {
            document.querySelector('.pr-script-popup')?.remove();
            const popup = document.createElement("div"); popup.className = 'pr-script-popup pr-script-base-popup';
            popup.innerHTML = `<div class="panel-header"><h4>Protocolos Rápidos</h4><button class="pr-close">X</button></div><div class="pr-popup-body"><div id="pr-sidebar"></div><div id="pr-main"><input type="text" id="pr-search" placeholder="Buscar..."><div id="pr-results"></div></div></div>`;
            document.body.appendChild(popup);
            popup.style.cssText = `position:fixed;top:10%;left:10%;width:850px;height:600px;background:#2a2d38;color:#e0e0e0;border:1px solid #4a5068;border-radius:8px;z-index:10001;display:flex;flex-direction:column;box-shadow:0 0 20px rgba(0,0,0,0.5);font-family:'Segoe UI',sans-serif;`;
            popup.querySelector('.panel-header').style.cssText = `background:#1a1c23;padding:10px;border-bottom:1px solid #4a5068;display:flex;justify-content:space-between;cursor:move;`;
            popup.querySelector('.pr-popup-body').style.cssText = `display:flex;flex-grow:1;overflow:hidden;`;
            popup.querySelector('#pr-sidebar').style.cssText = `width:180px;background:#1a1c23;border-right:1px solid #4a5068;overflow-y:auto;padding:5px;`;
            popup.querySelector('#pr-main').style.cssText = `flex-grow:1;padding:15px;display:flex;flex-direction:column;background:#2a2d38;`;
            popup.querySelector('#pr-search').style.cssText = `width:100%;padding:10px;background:#3a3f50;border:1px solid #4a5068;color:white;margin-bottom:10px;border-radius:4px;box-sizing:border-box;`;
            popup.querySelector('#pr-results').style.cssText = `flex-grow:1;overflow-y:auto;`;
            
            makeDraggable(popup, popup.querySelector('.panel-header'), 'protocoloPopup');
            popup.querySelector('.pr-close').onclick = () => popup.remove();
            
            const renderList = (cat, term) => {
                const res = popup.querySelector('#pr-results'); res.innerHTML = '';
                let items = CONFIG.PROTOCOLOS;
                if (term) items = items.filter(r => r.title.toLowerCase().includes(term.toLowerCase()) || r.text.toLowerCase().includes(term.toLowerCase()));
                else if (cat === 'favorites') items = items.filter(r => r.isFavorite);
                else if (cat === 'recent') { const titles = CONFIG.RECENT_PROTOCOLOS.map(r => r.title); items = items.filter(r => titles.includes(r.title)); }
                else if (cat !== 'all') items = items.filter(r => r.title.startsWith(cat + ' - '));
                
                if(!items.length) { res.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">Nada encontrado.</div>'; return; }

                items.forEach(p => {
                    const el = document.createElement('div');
                    el.style.cssText = `padding:10px;margin-bottom:5px;background:#1a1c23;border-radius:5px;cursor:pointer;border-left:3px solid transparent;`;
                    el.onmouseover = () => { el.style.background = '#3a3f50'; el.style.borderLeftColor = '#00f0ff'; };
                    el.onmouseout = () => { el.style.background = '#1a1c23'; el.style.borderLeftColor = 'transparent'; };
                    el.innerHTML = `<strong style="color:#00f0ff;">${p.title.split(' - ')[1] || p.title}</strong><br><small style="color:#aaa;">${p.text.substring(0,100)}...</small>`;
                    el.onclick = () => { logUsedProtocolo(p.title, p.text); copyTextToClipboard(p.text); UI.createNotification("Copiado!", "success"); };
                    res.appendChild(el);
                });
            };

            const sidebar = popup.querySelector('#pr-sidebar');
            sidebarCategoryOrder.forEach(c => {
                if (categoryDisplayMap[c]) {
                    const btn = document.createElement('div');
                    btn.textContent = categoryDisplayMap[c];
                    btn.style.cssText = `padding:8px;cursor:pointer;color:#aaa;font-size:13px;`;
                    btn.onmouseover = () => btn.style.color = 'white';
                    btn.onmouseout = () => { if(btn.dataset.active!=='true') btn.style.color = '#aaa'; };
                    btn.onclick = () => { 
                        sidebar.querySelectorAll('div').forEach(b => {b.style.color='#aaa'; b.dataset.active='false';}); 
                        btn.style.color='#00f0ff'; btn.dataset.active='true'; 
                        popup.querySelector('#pr-search').value = '';
                        renderList(c, ''); 
                    };
                    sidebar.appendChild(btn);
                }
            });
            
            popup.querySelector('#pr-search').oninput = (e) => renderList(null, e.target.value);
            renderList('favorites', '');
        }
    };

    // --- EXPOR A FUNÇÃO GLOBALMENTE ---
    window.toggleProtocolos = UI.createProtocoloPopup;

    // --- INICIALIZAÇÃO SEM BOTÃO ---
    const init = async () => {
        await loadData();
        document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'U') UI.createProtocoloPopup(); });
        console.log("[Protocolos V1.5.20] Carregado (Modo Invisível).");
        
        // Remove qualquer botão antigo que possa ter sobrado
        const ghost = document.getElementById('pr-trigger-button');
        if (ghost) ghost.remove();
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
