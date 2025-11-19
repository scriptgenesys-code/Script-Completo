// ==UserScript==
// @name         PureCloud - Protocolos Rápidos (v1.5.19 - Movimentação Corrigida)
// @namespace    http://tampermonkey.net/protocolos-rapidos
// @version      1.5.19
// @description  Popup de protocolos com lógica de movimentação (drag) corrigida e Auto-Fetch.
// @author       (Adaptado por Parceiro de Programacao)
// @match        https://apps.mypurecloud.com/*
// @match        https://apps.mypurecloud.de/*
// @match        https://apps.mypurecloud.jp/*
// @match        https://apps.mypurecloud.ie/*
// @match        https://apps.mypurecloud.com.au/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

// --- INÍCIO DO ISOLAMENTO ---
(function() {
    'use strict';

    const SCRIPT_VERSION = '1.5.19_DragFix';
    const DEBUG_MODE = true;

    // --- Log Helper ---
    const log = (...args) => { if (DEBUG_MODE) console.log(`[Protocolos Script v${SCRIPT_VERSION}]`, ...args); };
    
    // --- URL do JSON no GitHub Pages ---
    // Certifique-se de que o arquivo 'protocolos_brisanet_v1_9.json' está no seu repositório
    const PROTOCOLOS_JSON_URL = 'https://scriptgenesys-code.github.io/Script-Completo/protocolos_brisanet_v1_9.json';

    // --- Lista Padrão (Fallback caso o JSON falhe) ---
    const initialProtocolos = [];

    // --- Configurações e Variáveis Globais ---
    const requiredTagsMap = {};
    
    // Mapeamento de Categorias para exibição (Nome Bonito)
    const categoryDisplayMap = { 
        'recent': '⏱️ Recentes', 'favorites': '⭐ Favoritos', 'all': 'Todos', 
        'AGENDAMENTO': 'Agendamento', 'ATIVO': 'Ativo', 'BRISATV': 'BrisaTV', 
        'CABO': 'Cabo', 'CANCELAMENTO': 'Cancelamento', 'DIALOGO': 'Diálogo', 
        'EQUIPAMENTO': 'Equipamento', 'FINANCEIRO': 'Financeiro', 'FWA': 'FWA', 
        'ID': 'ID (Dados)', 'INFO': 'Info', 'INSTABILIDADE': 'Instabilidade', 
        'INSTALACAO': 'Instalação', 'JOGOS': 'Jogos', 'LENTIDAO': 'Lentidão', 
        'LIGACAO': 'Ligação', 'PARTICULAR': 'Particular', 'QUEDAS': 'Quedas', 
        'ROTEADOR': 'Roteador', 'SEM_ACESSO': 'Sem Acesso', 'SEM_GERENCIA': 'Sem Gerência', 
        'SINAL': 'Sinal', 'SVA': 'SVA', 'TELEFONIA': 'Telefonia', 'VELOCIDADE': 'Velocidade', 
        'VISITA': 'Visita (Custo)', 'WIFI': 'Wi-Fi'
    };
    
    // Ordem das categorias na barra lateral
    const sidebarCategoryOrder = [ 
        'recent', 'favorites', 'all', 'SEM_ACESSO', 'LENTIDAO', 'QUEDAS', 
        'INSTABILIDADE', 'SINAL', 'SEM_GERENCIA', 'CABO', 'WIFI', 'EQUIPAMENTO', 
        'ROTEADOR', 'FWA', 'BRISATV', 'TELEFONIA', 'JOGOS', 'PARTICULAR', 
        'FINANCEIRO', 'ID', 'VISITA', 'AGENDAMENTO', 'INSTALACAO', 'CANCELAMENTO', 
        'SVA', 'ATIVO', 'LIGACAO', 'DIALOGO', 'INFO' 
    ];
    
    let CONFIG = { 
        PROTOCOLOS: [], 
        LAST_COPIED_PROTOCOLO: '', 
        RECENT_PROTOCOLOS: [], 
        POPUP_POSITIONS: {}, 
        PR_DARK_MODE: false 
    };

    // --- Funções Utilitárias ---

    const findEl = (selectors, parent = document) => { 
        if (!Array.isArray(selectors)) selectors = [selectors]; 
        for (const selector of selectors) { 
            try { 
                if (!parent?.querySelector) continue; 
                const el = parent.querySelector(selector); 
                if (el) return el; 
            } catch (e) { log("Erro sel:", selector, e); } 
        } 
        return null; 
    };

    const copyTextToClipboard = async (text) => { 
        try { await navigator.clipboard.writeText(text); return true; } 
        catch (err) { log('Falha copiar:', err); return false; } 
    };

    // Função de substituição de variáveis (se houver no futuro)
    const formatReplyText = (text, name = 'cliente', id = 'protocolo') => { return text; };

    // --- Lógica de Movimentação (Drag) Genérica ---
    const makeDraggable = (popup, header, popupName) => { 
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0; 
        const enforceBounds = (top, left) => { 
            const vh = window.innerHeight, vw = window.innerWidth; 
            const ph = popup.offsetHeight, pw = popup.offsetWidth; 
            const m = 5; 
            let st = Math.max(m, Math.min(vh - ph - m, top)); 
            let sl = Math.max(m, Math.min(vw - pw - m, left)); 
            if (pw > vw - 2 * m) sl = m; 
            if (ph > vh - 2 * m) st = m; 
            return { top: st, left: sl }; 
        }; 

        // Carregar posição salva
        try { CONFIG.POPUP_POSITIONS = JSON.parse(sessionStorage.getItem('pr_popupPositions') || '{}'); } 
        catch(e) { log("Erro pos:", e); CONFIG.POPUP_POSITIONS = {}; } 

        if (CONFIG.POPUP_POSITIONS[popupName]?.top && CONFIG.POPUP_POSITIONS[popupName]?.left) { 
            try { 
                let ct = parseFloat(CONFIG.POPUP_POSITIONS[popupName].top); 
                let cl = parseFloat(CONFIG.POPUP_POSITIONS[popupName].left); 
                const ir = popup.getBoundingClientRect(); 
                const th = parseFloat(CONFIG.POPUP_POSITIONS[popupName].height) || ir.height || 500; 
                const tw = parseFloat(CONFIG.POPUP_POSITIONS[popupName].width) || ir.width || 850; 
                let st = Math.max(5, Math.min(window.innerHeight - th - 5, ct)); 
                let sl = Math.max(5, Math.min(window.innerWidth - tw - 5, cl)); 
                popup.style.top = st + 'px'; 
                popup.style.left = sl + 'px'; 
                popup.style.width = CONFIG.POPUP_POSITIONS[popupName].width || '850px'; 
                popup.style.height = CONFIG.POPUP_POSITIONS[popupName].height || '75vh'; 
                popup.style.transform = 'none'; 
                popup.style.margin = '0'; 
            } catch(e) { 
                popup.style.top = '10%'; popup.style.left = '10%'; 
                popup.style.width = '850px'; popup.style.height = '75vh'; 
                popup.style.transform = 'none';
            } 
        } else { 
            popup.style.top = '10%'; popup.style.left = '10%'; 
            popup.style.width = '850px'; popup.style.height = '75vh'; 
            popup.style.margin = '0'; 
        } 

        const saveCurrentPositionAndSize = () => { 
            clearTimeout(popup._savePosTimeout); 
            popup._savePosTimeout = setTimeout(() => { 
                let cut = popup.style.top, cul = popup.style.left; 
                if (popup.style.transform && popup.style.transform !== 'none') { 
                    const rect = popup.getBoundingClientRect(); 
                    cut = rect.top + 'px'; cul = rect.left + 'px'; 
                    popup.style.transform = 'none'; 
                } 
                const sp = enforceBounds(parseFloat(cut), parseFloat(cul)); 
                CONFIG.POPUP_POSITIONS[popupName] = { 
                    top: sp.top + 'px', left: sp.left + 'px', 
                    width: popup.style.width, height: popup.style.height 
                }; 
                try { sessionStorage.setItem('pr_popupPositions', JSON.stringify(CONFIG.POPUP_POSITIONS)); } 
                catch (e) { log("Erro save pos:", e); } 
            }, 300); 
        }; 

        if (header) { 
            header.onmousedown = e => { 
                if (e.target.closest('button') || e.button !== 0) return; 
                e.preventDefault(); 
                const rect = popup.getBoundingClientRect(); 
                popup.style.top = rect.top + 'px'; 
                popup.style.left = rect.left + 'px'; 
                popup.style.transform = 'none'; 
                pos3 = e.clientX; pos4 = e.clientY; 
                document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; saveCurrentPositionAndSize(); }; 
                document.onmousemove = ev => { 
                    ev.preventDefault(); 
                    pos1 = pos3 - ev.clientX; pos2 = pos4 - ev.clientY; 
                    pos3 = ev.clientX; pos4 = ev.clientY; 
                    const nt = popup.offsetTop - pos2, nl = popup.offsetLeft - pos1; 
                    const sp = enforceBounds(nt, nl); 
                    popup.style.top = sp.top + "px"; popup.style.left = sp.left + "px"; 
                }; 
            }; 
        } 
        const ro = new ResizeObserver(saveCurrentPositionAndSize); 
        ro.observe(popup); 
    };

    // --- Lógica de Dados (loadData) ---
    const loadData = async () => {
        let protocolsLoaded = false;
        
        // 1. Tentar carregar Protocolos do LocalStorage
        try {
            const localProtocols = localStorage.getItem('pr_protocolos');
            if (localProtocols) {
                const parsed = JSON.parse(localProtocols);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    CONFIG.PROTOCOLOS = parsed;
                    protocolsLoaded = true;
                    log("Protocolos carregados do LocalStorage.");
                } else {
                    localStorage.removeItem('pr_protocolos');
                }
            }
        } catch (e) {
            log("Erro ao ler protocols do LocalStorage:", e);
            localStorage.removeItem('pr_protocolos');
        }

        // 2. Se o LocalStorage estiver vazio, buscar do GitHub
        if (!protocolsLoaded) {
            log(`LocalStorage vazio. Puxando protocolos de: ${PROTOCOLOS_JSON_URL}`);
            try {
                const response = await fetch(PROTOCOLOS_JSON_URL + '?v=' + Date.now()); 
                if (!response.ok) throw new Error(`Falha ao buscar: ${response.statusText}`);
                
                const data = await response.json();
                let newProtocolos;

                if (Array.isArray(data)) {
                    newProtocolos = data; 
                } else if (data && Array.isArray(data.protocols)) {
                    newProtocolos = data.protocols;
                } else {
                    throw new Error("Formato do JSON inválido.");
                }

                CONFIG.PROTOCOLOS = newProtocolos;
                log(`Protocolos (${newProtocolos.length}) puxados do GitHub.`);
                
                try {
                    localStorage.setItem('pr_protocolos', JSON.stringify(newProtocolos));
                } catch (saveErr) {
                    log("Erro ao salvar protocolos no LocalStorage:", saveErr);
                }

            } catch (fetchErr) {
                log("ERRO CRÍTICO ao puxar protocolos:", fetchErr);
                CONFIG.PROTOCOLOS = initialProtocolos; 
                try { UI.createNotification("Falha ao carregar protocolos do GitHub.", 'error', 5000); } catch(e){}
            }
        }

        // 3. Carregar outras configurações
        try {
            CONFIG.LAST_COPIED_PROTOCOLO = localStorage.getItem('pr_lastCopiedProtocol') || '';
            CONFIG.RECENT_PROTOCOLOS = JSON.parse(localStorage.getItem('pr_recentProtocols_v1')) || [];
            CONFIG.POPUP_POSITIONS = JSON.parse(sessionStorage.getItem('pr_popupPositions') || '{}');
            CONFIG.PR_DARK_MODE = localStorage.getItem('pr_darkMode') === 'true';
        } catch (e) {
            CONFIG.RECENT_PROTOCOLOS = [];
            CONFIG.POPUP_POSITIONS = {};
            CONFIG.PR_DARK_MODE = false;
        }

        // 4. Processar dados
        CONFIG.PROTOCOLOS = CONFIG.PROTOCOLOS.map(r => ({ ...r, isFavorite: r.isFavorite || false, requiredData: r.requiredData || [] }));
        Object.keys(requiredTagsMap).forEach(key => delete requiredTagsMap[key]);
        CONFIG.PROTOCOLOS.forEach(reply => {
            reply.requiredData = (Array.isArray(reply.requiredData) ? reply.requiredData : []).map(tag => typeof tag === 'string' ? tag.replace(/[{}]/g, '').replace(/ /g, '_').toUpperCase() : '');
            requiredTagsMap[reply.title] = reply.requiredData;
        });
     };
     
    const saveData = () => {
        try { 
            localStorage.setItem('pr_protocolos', JSON.stringify(CONFIG.PROTOCOLOS)); 
            localStorage.setItem('pr_lastCopiedProtocol', CONFIG.LAST_COPIED_PROTOCOLO); 
            localStorage.setItem('pr_recentProtocols_v1', JSON.stringify(CONFIG.RECENT_PROTOCOLOS)); 
            localStorage.setItem('pr_darkMode', CONFIG.PR_DARK_MODE); 
        } catch (e) { log("Erro save:", e); UI.createNotification("Erro config.", 'error'); }
     };
     
    const logUsedProtocolo = (title, text) => {
        const MAX = 5; const entry = { title, text }; 
        CONFIG.RECENT_PROTOCOLOS = CONFIG.RECENT_PROTOCOLOS.filter(r => r.title !== title || r.text !== text); 
        CONFIG.RECENT_PROTOCOLOS.unshift(entry); 
        if (CONFIG.RECENT_PROTOCOLOS.length > MAX) CONFIG.RECENT_PROTOCOLOS.length = MAX;
    };

    // --- Extração de Dados da Página ---
    const documentExtractor = {
        getParticipantName: () => { 
            const sels = ['h3.participant-name', 'div.interaction-name-wrapper div.participant-name > span', 'p.participant-name', 'span[data-qa-id="participant-name"]', 'h2.participant-name', '.top-section-block .title-wrapper .title-text', '.conversation-header .participant-info .name']; 
            const el = findEl(sels); 
            if (!el) return 'cliente'; 
            const raw = el.textContent.trim(); 
            const match = raw.match(/^([a-zA-Z\sáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ.-]+)(?:\s*[|•-]?\s*(?:\(?\d{2}\)?\s*\d{4,5}[-.\s]*\d{4,5}|\d{8,14}|\w+@\w+\.\w+))?$/); 
            return (match?.[1]?.trim() || raw) || 'cliente'; 
        }, 
        getInteractionId: () => { 
            const sels = ['span[data-qa-id="interaction-id"]', '[data-qa-id="detail-value-interactionId"]', '.interaction-id-value', '#interactionIdDisplay']; 
            const el = findEl(sels); 
            return el?.textContent.trim().replace(/#/g, '') || 'protocolo'; 
        }
     };

    // --- Throttle & Escape Regex ---
    const throttle = (func, limit) => {
        let inThrottle; return function(...args) { if (!inThrottle) { func.apply(this, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } };
     };
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // --- Ouvinte de Teclado ---
    const keyboardEventHandler = (e) => {
        const target = e.target.tagName.toUpperCase(); 
        const isPopupInput = e.target.closest('.pr-script-base-popup') && (target === 'INPUT' || target === 'TEXTAREA' || target === 'SELECT'); 
        if (e.key !== 'Escape' && isPopupInput) return; 
        
        if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'U') { 
            e.preventDefault(); 
            UI.createProtocoloPopup(); 
        } 
        if (e.key === 'Escape') { 
            const p1 = document.querySelector('.pr-script-popup'); 
            const p2 = document.querySelector('.pr-script-settings-panel'); 
            if (p1) { p1.remove(); e.preventDefault(); } 
            else if (p2) { p2.remove(); e.preventDefault(); } 
        }
    };

    // --- Interface do Usuário (UI) ---
    const UI = {
        createNotification(message, type = 'info', duration = 3000) {
            let cont = document.getElementById('pr-script-notification-container'); 
            if (!cont) { cont = document.createElement('div'); cont.id = 'pr-script-notification-container'; document.body.appendChild(cont); } 
            const n = document.createElement("div"); n.textContent = message; n.className = `pr-script-notification pr-script-notification-${type}`; 
            cont.prepend(n); 
            const vis = cont.querySelectorAll('.pr-script-notification'); 
            if (vis.length > 5) vis[vis.length - 1].remove(); 
            setTimeout(() => { n.style.opacity='0'; n.style.transform='translateX(100%)'; setTimeout(() => n.remove(), 300); }, duration);
        },

        createProtocoloPopup() {
            document.querySelector('.pr-script-popup')?.remove(); document.querySelector('.pr-script-settings-panel')?.remove();
            const popup = document.createElement("div"); popup.className = 'pr-script-popup pr-script-base-popup';
            popup.innerHTML = `
                <div class="panel-header"><h4>Protocolos Rápidos (Ctrl+Shift+U)</h4><div class="panel-header-buttons"><button class="panel-header-btn settings-btn" title="Gerenciar Protocolos">⚙️</button><button class="panel-header-btn pr-script-popup-close-btn" title="Fechar (Esc)">X</button></div></div>
                <div class="pr-popup-body">
                    <div id="pr-sidebar"><ul id="pr-category-list"></ul></div>
                    <div id="pr-main-content">
                        <input type="text" id="pr-script-search" placeholder="Buscar por protocolo ou palavra-chave...">
                        <div id="pr-reply-tags" class="pr-tags-container-filter"></div>
                        <div id="pr-suggestion-filters" class="pr-suggestion-filters-container"></div>
                        <div id="pr-quick-filters" class="pr-quick-filters"></div>
                        <div id="pr-reply-results" class="pr-items-container"></div>
                    </div>
                </div>`;
            document.body.appendChild(popup); popup.style.width = '850px';
            
            makeDraggable(popup, popup.querySelector('.panel-header'), 'protocoloPopup'); 
            popup.querySelector('.pr-script-popup-close-btn').onclick = () => popup.remove(); 
            popup.querySelector('.settings-btn').onclick = () => UI.createSettingsPanel();
            
            const searchInput = popup.querySelector('#pr-script-search');
            const categoryListContainer = popup.querySelector('#pr-category-list');
            const resultsContainer = popup.querySelector('#pr-reply-results');
            const tagsContainer = popup.querySelector('#pr-reply-tags');
            const suggestionsContainer = popup.querySelector('#pr-suggestion-filters');
            const quickFiltersContainer = popup.querySelector('#pr-quick-filters');
            
            let currentCategory = 'favorites'; let currentSearchTerm = ''; let activeTagFilter = null;
            let activeQuickFilters = [];
            
            const getReplyDataTags = (title) => { const r = CONFIG.PROTOCOLOS.find(p => p.title === title); return r?.requiredData || []; };
            const highlightText = (text, keywords) => { if (!keywords || keywords.length === 0 || !text) { return text; } const regexKeywords = keywords.map(kw => escapeRegExp(kw)).join('|'); const regex = new RegExp(`(${regexKeywords})`, 'gi'); return text.replace(regex, '<span class="pr-highlight">$1</span>'); };
            
            const populateReplies = (category, searchTerm, tagFilter) => {
                const name = documentExtractor.getParticipantName(); const id = documentExtractor.getInteractionId(); resultsContainer.innerHTML = ''; let filteredReplies = []; let headerText = ''; const lowerSearch = searchTerm ? searchTerm.toLowerCase() : ''; const searchKeywords = lowerSearch ? lowerSearch.split(/\s+/).filter(k => k) : []; if (searchTerm) { const scored = []; CONFIG.PROTOCOLOS.forEach(reply => { const lt = reply.title.toLowerCase(); const ltxt = reply.text.toLowerCase(); let score = 0; if (lt.startsWith(lowerSearch)) { score += 1000; } else if (lt.includes(lowerSearch)) { score += 100; } let keywordsFoundCount = 0; searchKeywords.forEach(kw => { if (lt.includes(kw)) { score += 20; keywordsFoundCount++; } else if (ltxt.includes(kw)) { score += 5; keywordsFoundCount++; } }); if (searchKeywords.length > 1 && keywordsFoundCount === searchKeywords.length) { score += 50; } if (score > 0) scored.push({ ...reply, score }); }); scored.sort((a, b) => b.score - a.title.localeCompare(b.title)); filteredReplies = scored; headerText = `Busca por "${searchTerm}"`; } else if (tagFilter) { let base = CONFIG.PROTOCOLOS; if (category && !['all', 'favorites', 'recent', 'search'].includes(category)) { base = base.filter(r => r.title.startsWith(category + ' - ')); } filteredReplies = base.filter(r => getReplyDataTags(r.title).includes(tagFilter)); const catLabel = categoryDisplayMap[category] || category; headerText = `Filtro Tag: "${tagFilter.replace(/_/g, ' ')}"` + (category && !['all', 'search'].includes(category) ? ` em ${catLabel}` : ''); filteredReplies.sort((a, b) => a.title.localeCompare(b.title)); } else if (category === 'favorites') { filteredReplies = CONFIG.PROTOCOLOS.filter(r => r.isFavorite); headerText = categoryDisplayMap['favorites']; filteredReplies.sort((a, b) => a.title.localeCompare(b.title)); } else if (category === 'recent') { const titles = CONFIG.RECENT_PROTOCOLOS.map(r => r.title); filteredReplies = CONFIG.PROTOCOLOS.filter(r => titles.includes(r.title)).sort((a, b) => titles.indexOf(a.title) - titles.indexOf(b.title)); headerText = categoryDisplayMap['recent']; } else if (category && category !== 'all') { filteredReplies = CONFIG.PROTOCOLOS.filter(r => r.title.startsWith(category + ' - ')); headerText = categoryDisplayMap[category] || `Categoria: ${category}`; filteredReplies.sort((a, b) => a.title.localeCompare(b.title)); } else { filteredReplies = [...CONFIG.PROTOCOLOS]; headerText = categoryDisplayMap['all']; filteredReplies.sort((a, b) => a.title.localeCompare(b.title)); } if (activeQuickFilters.length > 0) { headerText += ` (Filtros: ${activeQuickFilters.join(', ')})`; filteredReplies = filteredReplies.filter(reply => { const lowerTextAndTitle = (reply.title + ' ' + reply.text).toLowerCase(); return activeQuickFilters.every(filterKeyword => lowerTextAndTitle.includes(filterKeyword)); }); } 
                if (filteredReplies.length === 0) { resultsContainer.innerHTML = `<p class="pr-no-results">Nenhum protocolo encontrado.</p>`; return; } 
                resultsContainer.innerHTML = `<h4 class="pr-results-header">${headerText} (${filteredReplies.length})</h4>`; filteredReplies.forEach(reply => { const code = reply.title.split(' - ')[0].trim(); let sub = reply.title.substring(code.length).replace(/^ - /, '').trim() || reply.title; let textSnippet = reply.text.substring(0, 150) + (reply.text.length > 150 ? '...' : ''); if (searchKeywords.length > 0) { sub = highlightText(sub, searchKeywords); textSnippet = highlightText(textSnippet, searchKeywords); } const tags = getReplyDataTags(reply.title); const tagsHTML = tags.map(t => `<span class="pr-data-tag pr-tag-${t.replace(/[^a-zA-Z0-9]/g, '_')}" title="${t.replace(/_/g, ' ')}">${t.substring(0, Math.min(t.length, 4))}${t.length > 4 ? '.' : ''}</span>`).join(''); const reqClass = tags.length > 0 ? 'pr-requires-tags-highlight' : ''; const item = document.createElement('div'); item.className = `item pr-reply-item ${reqClass}`; item.dataset.originalText = reply.text; item.innerHTML = `<div class="pr-reply-header"><strong>${sub} ${reply.isFavorite ? '⭐' : ''}</strong><div class="pr-data-tags">${tagsHTML}</div></div><small>${textSnippet}</small>`; item.title = reply.text; item.onclick = async () => { const origTxt = item.dataset.originalText; logUsedProtocolo(reply.title, reply.text); const fmtOrig = formatReplyText(origTxt, name, id); if (await copyTextToClipboard(fmtOrig)) UI.createNotification("Copiado!", 'info', 1500); else UI.createNotification("Erro copiar orig.", 'error'); }; resultsContainer.appendChild(item); }); resultsContainer.scrollTop = 0;
            };
            
            const buildTagFilters = () => {
                 tagsContainer.innerHTML = ''; const tags = new Set(); CONFIG.PROTOCOLOS.forEach(r => getReplyDataTags(r.title).forEach(t => { if(t) tags.add(t); })); if (tags.size > 0) { tagsContainer.style.display = 'flex'; const arr = Array.from(tags).sort(); const clr = document.createElement('button'); clr.className = 'pr-tag-filter-btn pr-tag-clear-btn'; clr.textContent = 'Limpar'; clr.title = 'Limpar Tag'; if (!activeTagFilter) clr.classList.add('active-clear'); clr.onclick = () => { activeTagFilter = null; currentSearchTerm = ''; searchInput.value = ''; buildTagFilters(); populateReplies(currentCategory, '', null); const cur = categoryListContainer.querySelector(`[data-category="${currentCategory}"]`); if (cur) cur.classList.add('active'); }; tagsContainer.appendChild(clr); arr.forEach(t => { const btn = document.createElement('button'); const cls = t.replace(/[^a-zA-Z0-9]/g, '_'); btn.className = `pr-tag-filter-btn pr-tag-${cls}`; btn.textContent = t.replace(/_/g, ' '); btn.title = `Filtro Tag: ${t.replace(/_/g, ' ')}`; if (activeTagFilter === t) btn.classList.add('active'); btn.onclick = () => { activeTagFilter = (activeTagFilter === t) ? null : t; currentSearchTerm = ''; searchInput.value = ''; activeQuickFilters = []; buildQuickFilters(); buildTagFilters(); populateReplies(currentCategory === 'search' ? 'all' : currentCategory, '', activeTagFilter); categoryListContainer.querySelectorAll('.pr-category-item').forEach(i => i.classList.remove('active')); if (!activeTagFilter) { const cur = categoryListContainer.querySelector(`[data-category="${currentCategory}"]`); if (cur) cur.classList.add('active'); } else if (currentCategory === 'search' || !categoryListContainer.querySelector('.active')) { categoryListContainer.querySelector(`[data-category="all"]`)?.classList.add('active'); } }; tagsContainer.appendChild(btn); }); } else { tagsContainer.style.display = 'none'; }
            };
            
            const buildSuggestionFilters = () => {
                 suggestionsContainer.innerHTML = ''; const suggs = ['LOS', 'Rota', 'Lentidão', 'Sem Acesso', 'Quedas', 'Cabo', 'Wi-Fi', 'Senha', 'OS', 'FWA', 'Financeiro']; suggs.forEach(s => { const btn = document.createElement('button'); btn.className = 'pr-suggestion-btn'; btn.textContent = s; btn.title = `Buscar: "${s}"`; btn.onclick = () => { searchInput.value = s; searchInput.dispatchEvent(new Event('input', { bubbles: true })); }; suggestionsContainer.appendChild(btn); });
            };
            
            const buildQuickFilters = () => {
                 quickFiltersContainer.innerHTML = ''; const commonKeywords = ['OS', 'Normalizado', 'Abertura', 'Ciente', 'Transferência', 'URA']; commonKeywords.forEach(keyword => { const lowerKeyword = keyword.toLowerCase(); const label = document.createElement('label'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = lowerKeyword; checkbox.checked = activeQuickFilters.includes(lowerKeyword); checkbox.onchange = () => { if (checkbox.checked) { activeQuickFilters.push(lowerKeyword); } else { activeQuickFilters = activeQuickFilters.filter(f => f !== lowerKeyword); } populateReplies(currentCategory, currentSearchTerm, activeTagFilter); }; label.appendChild(checkbox); label.appendChild(document.createTextNode(keyword)); quickFiltersContainer.appendChild(label); });
            };
            
            const buildCategoriesSidebar = () => {
                 categoryListContainer.innerHTML = ''; sidebarCategoryOrder.forEach(code => { const exists = ['recent', 'favorites', 'all'].includes(code) || CONFIG.PROTOCOLOS.some(r => r.title.startsWith(code + ' - ')); if (exists && categoryDisplayMap[code]) { const li = document.createElement('li'); li.className = 'pr-category-item'; li.dataset.category = code; li.textContent = categoryDisplayMap[code]; li.title = categoryDisplayMap[code]; if (code === currentCategory && !currentSearchTerm && !activeTagFilter) li.classList.add('active'); li.onclick = () => { currentCategory = code; currentSearchTerm = ''; activeTagFilter = null; searchInput.value = ''; activeQuickFilters = []; categoryListContainer.querySelectorAll('.pr-category-item').forEach(i => i.classList.remove('active')); li.classList.add('active'); buildTagFilters(); buildQuickFilters(); populateReplies(currentCategory, '', null); }; categoryListContainer.appendChild(li); } });
            };
            
            searchInput.oninput = throttle(() => {
                 currentSearchTerm = searchInput.value.trim(); activeTagFilter = null; categoryListContainer.querySelectorAll('.pr-category-item').forEach(i => i.classList.remove('active')); buildTagFilters(); if(!currentSearchTerm) { const prev = categoryListContainer.querySelector(`[data-category="${currentCategory}"]`); if (!prev || currentCategory === 'search') { currentCategory = 'favorites'; categoryListContainer.querySelector(`[data-category="favorites"]`)?.classList.add('active'); } else { prev.classList.add('active'); } populateReplies(currentCategory, '', null); } else { currentCategory = 'search'; populateReplies(null, currentSearchTerm, null); }
            }, 300);
            
            buildCategoriesSidebar();
            buildTagFilters();
            buildSuggestionFilters();
            buildQuickFilters();
            populateReplies(currentCategory, '', null);
            searchInput.focus();
        },

        createSettingsPanel() {
             document.querySelector('.pr-script-popup')?.remove(); document.querySelector('.pr-script-settings-panel')?.remove(); const panel = document.createElement('div'); panel.className = 'pr-script-settings-panel pr-script-base-popup'; panel.innerHTML = ` <div class="panel-header"><h2>Gerenciar Protocolos Rápidos</h2><div class="panel-header-buttons"><button class="panel-header-btn pr-script-popup-close-btn" title="Fechar (Esc)">X</button></div></div> <div class="panel-content"> <div class="pr-reply-controls"> <div class="pr-settings-group-inline"> <label for="pr-dark-mode-toggle">Modo Escuro (Interno):</label> <label class="pr-switch"><input type="checkbox" id="pr-dark-mode-toggle" ${CONFIG.PR_DARK_MODE ? 'checked' : ''}><span class="pr-slider round"></span></label> </div> </div> <div id="pr-settings-replies-list" class="pr-settings-reply-list"></div> </div> <div class="panel-footer"> <button id="pr-save-settings-btn" class="pr-script-button">Salvar e Fechar</button> </div> `; document.body.appendChild(panel); makeDraggable(panel, panel.querySelector('.panel-header'), 'settingsPanel'); panel.querySelector('.pr-script-popup-close-btn').onclick = () => panel.remove(); const renderSettings = () => { const list = panel.querySelector('#pr-settings-replies-list'); list.innerHTML = ''; const sorted = [...CONFIG.PROTOCOLOS].sort((a,b)=>a.title.localeCompare(b.title)); sorted.forEach(r => { const idx = CONFIG.PROTOCOLOS.findIndex(p => p.title === r.title && p.text === r.text); const item = document.createElement('div'); item.className = 'pr-reply-item'; item.dataset.originalIndex = idx; const tags = r.requiredData || []; const tagsHTML = tags.map(t => `<span class="pr-data-tag pr-tag-${t.replace(/[^a-zA-Z0-9]/g, '_')}">${t.replace(/_/g, ' ')}</span>`).join(' '); item.innerHTML = `<input type="checkbox" class="pr-favorite-toggle" title="Favorito" ${r.isFavorite ? 'checked' : ''}><input type="text" value="${r.title}" class="pr-reply-title" placeholder="CATEGORIA - Título"><div class="pr-data-tags">${tagsHTML}</div><textarea class="pr-reply-text" rows="3" placeholder="Texto Protocolo">${r.text}</textarea>`; list.appendChild(item); }); }; 
             panel.querySelector('#pr-save-settings-btn').onclick = () => { const newPs = []; let err = false; const seen = new Set(); panel.querySelectorAll('#pr-settings-replies-list .pr-reply-item').forEach(item => { const ti = item.querySelector('.pr-reply-title'); const te = item.querySelector('.pr-reply-text'); const t = ti.value.trim(); const txt = te.value.trim(); const fav = item.querySelector('.pr-favorite-toggle').checked; const idx = item.dataset.originalIndex; if (!err) { let reqData = requiredTagsMap[t] || []; newPs.push({ title: t, text: txt, isFavorite: fav, requiredData: reqData }); } }); if (err) { UI.createNotification("Corrija campos inválidos.", 'error'); return; } CONFIG.PROTOCOLOS = newPs; CONFIG.PR_DARK_MODE = panel.querySelector('#pr-dark-mode-toggle').checked; saveData(); UI.createNotification("Configurações salvas!", "success"); panel.remove(); }; renderSettings();
        },

        createTriggerButton() {
             let triggerBtn = document.getElementById('pr-trigger-button'); if (triggerBtn) return;
             triggerBtn = document.createElement('button');
             triggerBtn.id = 'pr-trigger-button'; 
             triggerBtn.innerHTML = '📋'; 
             triggerBtn.title = 'Protocolos (Ctrl+Shift+U)'; 
             if (!document.body) { log("document.body não encontrado."); return; }
             document.body.appendChild(triggerBtn);
             
             let isDragging = false, dragStartX, dragStartY, btnInitialLeft, btnInitialTop;
             const savedPos = localStorage.getItem('prTriggerButtonPos'); 
             let posLoaded = false;
             
             if (savedPos) {
                 try {
                     const p = JSON.parse(savedPos); const sl = parseFloat(p.left), st = parseFloat(p.top);
                     const btnWidth = 50; const btnHeight = 50;
                     if (!isNaN(sl) && !isNaN(st) && sl >= 0 && sl <= window.innerWidth - btnWidth && st >= 0 && st <= window.innerHeight - btnHeight) {
                         triggerBtn.style.left = p.left; triggerBtn.style.top = p.top;
                         triggerBtn.style.right = 'auto'; triggerBtn.style.bottom = 'auto';
                         posLoaded = true;
                     } else {
                         log("Posição salva inválida, resetando."); localStorage.removeItem('prTriggerButtonPos');
                     }
                 } catch (e) { log("Erro ao carregar posição salva, resetando."); localStorage.removeItem('prTriggerButtonPos'); }
             }
             
             if (!posLoaded) {
                 triggerBtn.style.right = '25px'; triggerBtn.style.bottom = '30px';
                 triggerBtn.style.left = 'auto'; triggerBtn.style.top = 'auto';
             }
             
             const btn = triggerBtn;
             
             // --- LÓGICA DE DRAG CORRIGIDA ---
             btn.onmousedown = (e) => {
                 if (e.button !== 0) return;
                 isDragging = false; 
                 dragStartX = e.clientX;
                 dragStartY = e.clientY;
                 const rect = btn.getBoundingClientRect();
                 btnInitialLeft = rect.left;
                 btnInitialTop = rect.top;
                 btn.style.cursor = 'grabbing';
                 e.preventDefault();
                 
                 const threshold = 5; 
                 let moved = false; 

                 document.onmousemove = (me) => {
                     const dX = me.clientX - dragStartX;
                     const dY = me.clientY - dragStartY;
                     
                     if (!moved && (Math.abs(dX) > threshold || Math.abs(dY) > threshold)) {
                         moved = true;
                         isDragging = true; 
                     }
                     
                     if (moved) { 
                         let nX = btnInitialLeft + dX;
                         let nY = btnInitialTop + dY;
                         const bW = btn.offsetWidth, bH = btn.offsetHeight;
                         nX = Math.max(5, Math.min(nX, window.innerWidth - bW - 5));
                         nY = Math.max(5, Math.min(nY, window.innerHeight - bH - 5));
                         btn.style.left = `${nX}px`;
                         btn.style.top = `${nY}px`;
                         btn.style.right = 'auto';
                         btn.style.bottom = 'auto';
                     }
                 };

                 document.onmouseup = () => {
                     btn.style.cursor = 'pointer';
                     if (moved) { 
                         localStorage.setItem('prTriggerButtonPos', JSON.stringify({left: btn.style.left, top: btn.style.top}));
                     }
                     document.onmousemove = null;
                     document.onmouseup = null;
                     setTimeout(() => { isDragging = false; }, 0); 
                 };
             };
             
             btn.onclick = () => {
                 if (!isDragging) { 
                     UI.createProtocoloPopup(); 
                 }
             };
        }
    };

    // --- Injeção de CSS ---
    const injectCss = () => {
        const css = `
            /* === TEMA MODERNO/DIGITAL === */
            :root { --bg-dark: #1a1c23; --bg-medium: #2a2d38; --bg-light: #3a3f50; --text-primary: #e0e0e0; --text-secondary: #a0a4b8; --accent-primary: #00f0ff; --accent-secondary: #00aaff; --border-color: #4a5068; --glow-color: rgba(0, 240, 255, 0.5); --danger-color: #ff4d6a; --highlight-bg: #ffe066; --highlight-text: #332700; }
            /* --- Estilos Gerais --- */
            .pr-script-base-popup { position: fixed; background-color: var(--bg-medium); border-radius: 8px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 0 0 10px var(--glow-color); z-index: 10001; display: flex; flex-direction: column; border: 1px solid var(--border-color); min-width: 300px; min-height: 200px; resize: both; overflow: hidden; color: var(--text-primary); font-family: 'Segoe UI', 'Roboto', Arial, sans-serif; font-size: 14px; }
            .pr-script-base-popup .panel-header { cursor: move; background-color: var(--bg-dark); padding: 8px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0; height: 35px; box-sizing: border-box; flex-shrink: 0; }
            .pr-script-base-popup .panel-header h2, .pr-script-base-popup .panel-header h3, .pr-script-base-popup .panel-header h4 { margin: 0; color: var(--accent-primary); font-size: 1em; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; text-shadow: 0 0 5px var(--glow-color); }
            .pr-script-base-popup .panel-header-buttons { display: flex; gap: 5px; }
            .pr-script-base-popup .panel-header-btn { background: none; border: none; font-size: 1.1em; cursor: pointer; color: var(--text-secondary); padding: 0 4px; line-height: 1; transition: color 0.2s, text-shadow 0.2s; }
            .pr-script-base-popup .panel-header-btn:hover { color: var(--accent-primary); text-shadow: 0 0 8px var(--glow-color); }
            .pr-script-base-popup .panel-content { padding: 10px; overflow-y: auto; flex-grow: 1; background-color: var(--bg-medium); display: flex; flex-direction: column; }
            .pr-script-base-popup .panel-footer { padding: 8px 12px; background-color: var(--bg-dark); border-top: 1px solid var(--border-color); text-align: right; border-radius: 0 0 8px 8px; flex-shrink: 0; }
            /* --- Botões --- */
            .pr-script-button { background-color: var(--accent-secondary); color: var(--bg-dark); border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: 600; transition: background-color 0.2s, box-shadow 0.2s, transform 0.1s; margin-left: 5px; line-height: 1.2; }
            .pr-script-button:hover { background-color: var(--accent-primary); box-shadow: 0 0 10px var(--glow-color); transform: translateY(-1px); }
            .pr-script-button:active { transform: translateY(0px); }
            .pr-script-button.button-danger { background-color: var(--danger-color); color: white; }
            .pr-script-button.button-danger:hover { background-color: #ff7f99; box-shadow: 0 0 10px rgba(255, 77, 106, 0.7); }
            #pr-export-json-btn { background-color: #4d8aff; color: white; }
            #pr-export-json-btn:hover { background-color: #70a1ff; box-shadow: 0 0 10px rgba(77, 138, 255, 0.7); }
            #pr-import-json-btn { background-color: #3bafda; color: white; }
            #pr-import-json-btn:hover { background-color: #63c0e8; box-shadow: 0 0 10px rgba(59, 175, 218, 0.7); }
            /* --- Notificações --- */
            #pr-script-notification-container { position: fixed; top: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 10003; max-width: 300px; }
            .pr-script-notification { position: relative; opacity: 1; transform: translateX(0); transition: opacity 0.3s ease-out, transform 0.3s ease-out; box-shadow: 0 0 15px rgba(0,0,0,.5); padding: 12px 18px; border-radius: 6px; font-family: 'Segoe UI', 'Roboto', Arial, sans-serif; font-size: 0.9em; color: var(--bg-dark); border-left: 4px solid; }
            .pr-script-notification-info { background-color: #63c0e8; border-color: #3bafda; }
            .pr-script-notification-success { background-color: #5ddc9a; border-color: #28a745; }
            .pr-script-notification-warn { background-color: #ffe066; border-color: #ffc107; color: #332700 !important; }
            .pr-script-notification-error { background-color: #ff7f99; border-color: var(--danger-color); color: white !important; }
            /* --- Layout Popup Principal --- */
            .pr-popup-body { display: flex; flex-grow: 1; overflow: hidden; height: calc(100% - 35px); }
            #pr-sidebar { width: 160px; flex-shrink: 0; background-color: var(--bg-dark); border-right: 1px solid var(--border-color); overflow-y: auto; padding: 8px 0; }
            #pr-main-content { flex-grow: 1; display: flex; flex-direction: column; padding: 15px; overflow: hidden; background-color: var(--bg-medium); }
            #pr-editor-sidebar { width: 280px; flex-shrink: 0; background-color: var(--bg-dark); padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; font-size: 0.9em; border-left: 1px solid var(--border-color); }
            /* --- Sidebar Categorias --- */
            #pr-category-list { list-style: none; padding: 0; margin: 0; }
            .pr-category-item { padding: 10px 15px; cursor: pointer; font-size: 0.9em; color: var(--text-secondary); border-left: 3px solid transparent; transition: background-color 0.2s, color 0.2s, border-left-color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .pr-category-item:hover { background-color: var(--bg-light); color: var(--text-primary); }
            .pr-category-item.active { background-color: var(--bg-medium); color: var(--accent-primary); font-weight: 600; border-left-color: var(--accent-primary); }
            /* --- Área Principal --- */
            #pr-script-search { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 10px; box-sizing: border-box; font-size: 0.95em; flex-shrink: 0; background-color: var(--bg-light); color: var(--text-primary); }
            #pr-script-search:focus { border-color: var(--accent-secondary); box-shadow: 0 0 8px rgba(0, 170, 255, 0.5); outline: none; }
            .pr-tags-container-filter { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; max-height: 70px; overflow-y: auto; }
            .pr-tag-filter-btn { background: var(--bg-light); border: 1px solid var(--border-color); border-radius: 15px; padding: 4px 10px; cursor: pointer; font-size: 0.78em; color: var(--text-secondary); transition: all .2s; white-space: nowrap; }
            .pr-tag-filter-btn:hover { background-color: #4a5068; color: var(--text-primary); }
            .pr-tag-filter-btn.active { background: var(--accent-secondary); color: var(--bg-dark); border-color: var(--accent-primary); font-weight: bold; }
            .pr-tag-filter-btn.pr-tag-clear-btn { background-color: #6c757d; color: white; }
            .pr-tag-filter-btn.pr-tag-clear-btn:hover { background-color: #8a9197; }
            .pr-tag-filter-btn.active-clear { background: var(--bg-light); color: var(--text-secondary); border-color: var(--border-color); }
            .pr-tag-filter-btn.active-clear:hover { background-color: #4a5068; }
            .pr-suggestion-filters-container { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; flex-shrink: 0; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); }
            .pr-suggestion-btn { background: transparent; border: 1px dashed var(--border-color); color: var(--accent-secondary); padding: 3px 9px; font-size: 0.78em; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
            .pr-suggestion-btn:hover { background: var(--bg-light); border-color: var(--accent-primary); color: var(--accent-primary); }
            /* --- Filtros Rápidos (Checkboxes) --- */
            .pr-quick-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; flex-shrink: 0; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); }
            .pr-quick-filters label { display: flex; align-items: center; gap: 4px; font-size: 0.8em; color: var(--text-secondary); cursor: pointer; }
            .pr-quick-filters input[type="checkbox"] { cursor: pointer; accent-color: var(--accent-primary); }
            /* --- Lista de Resultados --- */
            .pr-items-container { flex-grow: 1; overflow-y: auto; padding-right: 8px; }
            .pr-items-container .item { padding: 12px 15px; margin-bottom: 8px; background-color: var(--bg-dark); border-radius: 6px; cursor: pointer; border-left: 4px solid transparent; transition: background-color .2s, border-color .2s; text-align: left; }
            .pr-items-container .item:hover { border-left-color: var(--accent-primary); background-color: var(--bg-light); }
            .pr-items-container .item strong { color: var(--accent-primary); display: inline; font-size: 0.95em; font-weight: 600; margin-right: 8px; }
            .pr-items-container .item small { color: var(--text-secondary); font-size: 0.88em; display: block; margin-top: 5px; line-height: 1.45; overflow: hidden; max-height: 4.35em; /* 3 linhas */ }
            .pr-results-header { margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.8em; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
            .pr-no-results { padding: 30px; color: var(--text-secondary); text-align: center; font-style: italic; font-size: 0.9em;}
            .pr-reply-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
            .pr-data-tags { display: inline-flex; gap: 5px; flex-wrap: wrap; margin-left: auto; }
            .pr-data-tag { font-size: 0.68em; padding: 2px 5px; border-radius: 3px; font-weight: 500; color: var(--bg-dark); background-color: var(--text-secondary); text-transform: uppercase; white-space: nowrap; }
            .pr-tag-NOME, .pr-tag-NOME_DO_CLIENTE, .pr-tag-NOME_COMPLETO { background-color: #a37acc;}
            .pr-tag-CPF { background-color: #fd9b4b;}
            .pr-tag-ENDERECO { background-color: #5bc0de; }
            .pr-tag-PROTOCOLO, .pr-tag-NUMERO { background-color: #5ddc9a; }
            .pr-tag-DATA_NASC { background-color: #f06eaa;}
            .pr-reply-item.pr-requires-tags-highlight { border-left-color: #fd9b4b; background-color: rgba(253, 155, 75, 0.1);}
            /* --- Destaque de Busca --- */
            .pr-highlight { background-color: var(--highlight-bg); color: var(--highlight-text); padding: 0 2px; border-radius: 2px; font-weight: bold; }

            /* --- Painel Configurações --- */
            .pr-script-settings-panel { width: 90%; max-width: 800px; height: 85vh; max-height: 800px; min-width: 500px; min-height: 400px;}
            .pr-settings-reply-list { flex-grow: 1; overflow-y: auto; padding-right: 10px; }
            .pr-reply-item { display: grid; grid-template-columns: auto 1fr auto; gap: 6px 12px; align-items: start; border-bottom: 1px solid var(--border-color); padding: 12px 5px; }
            .pr-reply-item:last-child { border-bottom: none; }
            .pr-reply-item .pr-reply-title { grid-column: 2 / 3; grid-row: 1 / 2; font-size: 0.95em; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; width: 100%; box-sizing: border-box; background-color: var(--bg-light); color: var(--text-primary); }
            .pr-reply-item .pr-data-tags { grid-column: 2 / 3; grid-row: 2 / 3; margin-top: 4px; min-height: 1.2em; }
            .pr-reply-item .pr-reply-text { grid-column: 1 / 4; margin-top: 8px; width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.9em; line-height: 1.45; resize: vertical; min-height: 60px; background-color: var(--bg-light); color: var(--text-primary); }
            .pr-reply-item .pr-remove-reply-btn { background: none; border: none; color: var(--danger-color); cursor: pointer; font-size: 1.3em; padding: 0; grid-column: 3 / 4; grid-row: 1 / 2; justify-self: end; line-height: 1; margin-top: 6px; transition: color 0.2s, transform 0.1s; }
            .pr-reply-item .pr-remove-reply-btn:hover { color: #ff7f99; transform: scale(1.1); }
            .pr-reply-item .pr-favorite-toggle { grid-column: 1 / 2; grid-row: 1 / 2; margin-right: 8px; margin-top: 10px; cursor: pointer; transform: scale(1.2); accent-color: var(--accent-primary); }
            .pr-reply-controls { margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;}
            input.invalid-input, textarea.invalid-input { border-color: var(--danger-color) !important; box-shadow: 0 0 8px rgba(255, 77, 106, 0.7) !important; }
            .pr-reply-item .pr-reply-title:focus, .pr-reply-item .pr-reply-text:focus { border-color: var(--accent-secondary); box-shadow: 0 0 8px rgba(0, 170, 255, 0.5); outline: none; }

             /* --- Botão Trigger Flutuante (Estilo Moderno) --- */
            #pr-trigger-button { position: fixed !important; width: 50px !important; height: 50px !important; border-radius: 50% !important; background: linear-gradient(145deg, var(--bg-light), var(--bg-dark)) !important; color: var(--accent-primary) !important; border: 2px solid var(--border-color) !important; font-size: 24px !important; cursor: pointer !important; box-shadow: 0 5px 15px rgba(0,0,0,0.5), 0 0 5px var(--glow-color) inset !important; z-index: 2147483647 !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s ease !important; user-select: none !important; visibility: visible !important; opacity: 0.9 !important; /* Posição inicial será definida pelo JS */ }
            #pr-trigger-button:hover { opacity: 1 !important; transform: scale(1.1) translateY(-2px) !important; box-shadow: 0 8px 20px rgba(0,0,0,0.6), 0 0 15px var(--glow-color), 0 0 8px var(--glow-color) inset !important; border-color: var(--accent-secondary) !important; }
            #pr-trigger-button:active { cursor: grabbing !important; transform: scale(1.05) !important; box-shadow: 0 3px 10px rgba(0,0,0,0.4), 0 0 3px var(--glow-color) inset !important; }

            /* --- Toggle Switch (Aparência no tema escuro) --- */
            .pr-settings-group-inline { display: flex; align-items: center; gap: 8px; margin-left: auto; }
            .pr-settings-group-inline label { margin-bottom: 0; font-size: 0.9em; color: var(--text-secondary); }
            .pr-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
            .pr-switch input { opacity: 0; width: 0; height: 0; }
            .pr-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-light); transition: .4s; }
            .pr-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: var(--text-secondary); transition: .4s; }
            input:checked + .slider { background-color: var(--accent-secondary); }
            input:focus + .slider { box-shadow: 0 0 1px var(--accent-secondary); }
            input:checked + .slider:before { transform: translateX(20px); background-color: var(--bg-dark); }
            .pr-slider.round { border-radius: 24px; }
            .pr-slider.round:before { border-radius: 50%; }
        `;
        if (typeof GM_addStyle !== "undefined") GM_addStyle(css); else { let style = document.getElementById('pr-script-injected-style'); if (!style) { style = document.createElement('style'); style.id = 'pr-script-injected-style'; document.head.appendChild(style); } style.textContent = css; }
    };

    // --- Inicialização (MODIFICADA V1.5.18) ---
    const initialize = async () => { 
        try {
            log(`Init Protocolos V${SCRIPT_VERSION}`);
            await loadData(); 
        } catch (error) {
            log("ERRO load:", error);
            try { UI.createNotification("Erro load script Protocolos.", "error", 5000); } catch(e){}
            return;
        }
        
        try { injectCss(); log("CSS OK."); } catch (error) { log("ERRO CSS:", error); }
        
        log("Aguardando 2 segundos para criar botão e registrar teclado...");
        setTimeout(() => {
            try { log("Tentando criar botão..."); UI.createTriggerButton(); log("Botão OK."); } catch (error) { log("ERRO Botão:", error); UI.createNotification("Erro criar botão Protocolos.", "error", 5000); }
            try { document.addEventListener('keydown', keyboardEventHandler); log("Teclado OK."); } catch (error) { log("ERRO Teclado:", error); }
        }, 2000); 
        log("Protocolos pronto (inicialização base).");
    };

    const tryInitialize = async () => { 
        if (findEl('body')) {
            log("Body OK. Init.");
            await initialize(); 
        } else {
            log("Wait body...");
            setTimeout(tryInitialize, 1500);
        }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryInitialize); else tryInitialize();

})(); // --- FIM DO ISOLAMENTO ---
